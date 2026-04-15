import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { copyFile, mkdtemp, rm, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import https from "https";
import { spawnSync } from "child_process";

type OverlayType =
  | "opening_title"
  | "chapter_title"
  | "year_stamp"
  | "location_label"
  | "key_fact"
  | "quote_card"
  | "person_label"
  | "outro";

type StoryboardOverlay = {
  id: string;
  type: OverlayType;
  startTime: number;
  duration: number;
  content: Record<string, unknown>;
};

type Storyboard = {
  overlays: StoryboardOverlay[];
};

type SearchResponse = {
  status?: string;
  data?: unknown;
  error?: { message?: string };
};

type FaceLibraryEntry = {
  name: string;
  aliases?: string[];
  role?: string;
  imageSrc?: string;
  imageSourceUrl?: string;
  updatedAt?: string;
};

type FaceLibrary = {
  version: number;
  people: FaceLibraryEntry[];
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const STORYBOARD_PATH = path.join(PROJECT_ROOT, "data", "storyboard.json");
const FACE_LIBRARY_PATH = path.join(PROJECT_ROOT, "data", "face-library.json");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const PEOPLE_DIR = path.join(PROJECT_ROOT, "public", "assets", "people");
const RAPID_API_HOST = "real-time-image-search.p.rapidapi.com";
const NETWORK_TIMEOUT_MS = 20000;

const parseArgs = (): { names: string[]; force: boolean } => {
  const args = process.argv.slice(2);
  const names: string[] = [];
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--name") {
      const val = args[i + 1];
      if (!val) {
        throw new Error("--name requires a value");
      }
      names.push(val.trim().toLowerCase());
      i += 1;
      continue;
    }

    if (arg === "--help") {
      console.log("Usage: npx tsx scripts/enrich-person-overlays.ts [--name \"Donald Trump\"] [--force]");
      process.exit(0);
    }
  }

  return { names, force };
};

const slugify = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const loadFaceLibrary = (): FaceLibrary => {
  if (!existsSync(FACE_LIBRARY_PATH)) {
    return { version: 1, people: [] };
  }

  try {
    const parsed = JSON.parse(readFileSync(FACE_LIBRARY_PATH, "utf8")) as FaceLibrary;
    if (!Array.isArray(parsed.people)) {
      return { version: 1, people: [] };
    }

    return {
      version: Number(parsed.version || 1),
      people: parsed.people
        .filter((person) => !!person && typeof person.name === "string" && person.name.trim().length > 0)
        .map((person) => ({
          name: person.name.trim(),
          aliases: Array.isArray(person.aliases)
            ? person.aliases
                .filter((alias): alias is string => typeof alias === "string" && alias.trim().length > 0)
                .map((alias) => alias.trim())
            : [],
          role: typeof person.role === "string" ? person.role.trim() : undefined,
          imageSrc: typeof person.imageSrc === "string" ? person.imageSrc.trim() : undefined,
          imageSourceUrl:
            typeof person.imageSourceUrl === "string" ? person.imageSourceUrl.trim() : undefined,
          updatedAt: typeof person.updatedAt === "string" ? person.updatedAt.trim() : undefined,
        })),
    };
  } catch {
    return { version: 1, people: [] };
  }
};

const saveFaceLibrary = (library: FaceLibrary): void => {
  const normalized = {
    version: 1,
    people: [...library.people].sort((a, b) => a.name.localeCompare(b.name)),
  };
  writeFileSync(FACE_LIBRARY_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
};

const findLibraryEntry = (library: FaceLibrary, name: string): FaceLibraryEntry | null => {
  const target = normalizeName(name);
  if (!target) {
    return null;
  }

  for (const person of library.people) {
    if (normalizeName(person.name) === target) {
      return person;
    }

    for (const alias of person.aliases ?? []) {
      if (normalizeName(alias) === target) {
        return person;
      }
    }
  }

  return null;
};

const toAbsolutePublicAssetPath = (assetSrc: string): string => {
  const normalized = assetSrc.replace(/^\/+/, "");
  return path.join(PUBLIC_DIR, normalized);
};

const upsertLibraryEntry = (
  library: FaceLibrary,
  payload: {
    name: string;
    role?: string;
    imageSrc?: string;
    imageSourceUrl?: string;
  }
): boolean => {
  const cleanedName = payload.name.trim();
  if (!cleanedName) {
    return false;
  }

  const existing = findLibraryEntry(library, cleanedName);
  const now = new Date().toISOString();

  if (!existing) {
    library.people.push({
      name: cleanedName,
      aliases: [],
      role: payload.role?.trim() || undefined,
      imageSrc: payload.imageSrc?.trim() || undefined,
      imageSourceUrl: payload.imageSourceUrl?.trim() || undefined,
      updatedAt: now,
    });
    return true;
  }

  let changed = false;

  if (existing.name !== cleanedName) {
    const aliases = new Set((existing.aliases ?? []).map((x) => x.trim()).filter(Boolean));
    aliases.add(cleanedName);
    existing.aliases = [...aliases];
    changed = true;
  }

  if (payload.role?.trim() && existing.role !== payload.role.trim()) {
    existing.role = payload.role.trim();
    changed = true;
  }

  if (payload.imageSrc?.trim() && existing.imageSrc !== payload.imageSrc.trim()) {
    existing.imageSrc = payload.imageSrc.trim();
    changed = true;
  }

  if (payload.imageSourceUrl?.trim() && existing.imageSourceUrl !== payload.imageSourceUrl.trim()) {
    existing.imageSourceUrl = payload.imageSourceUrl.trim();
    changed = true;
  }

  if (changed) {
    existing.updatedAt = now;
  }

  return changed;
};

const isGoogleThumb = (url: string): boolean => {
  return url.includes("gstatic.com/images?q=tbn:");
};

const extractImageUrls = (item: unknown): string[] => {
  if (!item || typeof item !== "object") {
    return [];
  }

  const record = item as Record<string, unknown>;
  const candidates = [
    "thumbnail_url",
    "thumbnailUrl",
    "image",
    "image_url",
    "imageUrl",
    "original",
    "original_url",
    "url",
    "thumbnail",
  ];

  const urls: string[] = [];
  for (const key of candidates) {
    const val = record[key];
    if (typeof val === "string" && val.startsWith("http")) {
      if (!isGoogleThumb(val)) {
        urls.push(val);
      }
    }
  }

  return [...new Set(urls)];
};

const flattenSearchItems = (payload: unknown): Record<string, unknown>[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload.filter((x): x is Record<string, unknown> => {
      return !!x && typeof x === "object" && !Array.isArray(x);
    });
  }

  if (typeof payload !== "object") {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const listKeys = ["data", "items", "results", "image_results", "images"];

  for (const key of listKeys) {
    const list = root[key];
    if (Array.isArray(list)) {
      return list.filter((x): x is Record<string, unknown> => {
        return !!x && typeof x === "object" && !Array.isArray(x);
      });
    }
  }

  return [];
};

const requestJson = (apiPath: string, apiKey: string): Promise<SearchResponse> => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "GET",
        hostname: RAPID_API_HOST,
        path: apiPath,
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPID_API_HOST,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`RapidAPI request failed (${res.statusCode}): ${body.slice(0, 500)}`));
            return;
          }

          try {
            resolve(JSON.parse(body) as SearchResponse);
          } catch (error) {
            reject(new Error(`Invalid JSON from RapidAPI: ${(error as Error).message}`));
          }
        });
      }
    );

    req.setTimeout(NETWORK_TIMEOUT_MS, () => {
      req.destroy(new Error(`RapidAPI request timed out after ${NETWORK_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    req.end();
  });
};

const chooseImageUrls = async (name: string, apiKey: string): Promise<string[]> => {
  const fallbackKnownUrls: Record<string, string[]> = {
    "harold camping": [
      "https://upload.wikimedia.org/wikipedia/en/4/4a/Harold_Camping_new.jpg",
    ],
    "edgar whisenant": [
      "https://www.christianpost.com/files/original/thumbnail/03/31/33119.jpg",
    ],
    "amihai eliyahu": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Amichai_Eliyahu.jpg/250px-Amichai_Eliyahu.jpg",
    ],
    ezekiel: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Ezekiel%27s_Vision.jpg/640px-Ezekiel%27s_Vision.jpg",
    ],
  };

  const queryVariants = [
    `${name} official portrait`,
    `${name}`,
    `${name} photo`,
    `${name} portrait`,
    `President ${name}`,
  ];

  for (const query of queryVariants) {
    const queryParams = new URLSearchParams({
      query,
      limit: "10",
      size: "any",
      color: "any",
      type: "any",
      time: "any",
      usage_rights: "any",
      file_type: "any",
      aspect_ratio: "any",
      safe_search: "off",
      region: "us",
    }).toString();

    const pathValue = `/search?${queryParams}`;

    try {
      const json = await withTimeout(
        requestJson(pathValue, apiKey),
        NETWORK_TIMEOUT_MS + 2000,
        `Image search for "${query}"`
      );

      if (json.status === "ERROR") {
        continue;
      }

      const items = flattenSearchItems(json.data ?? json);
      const urls = items.flatMap((item) => extractImageUrls(item));
      const uniqueUrls = [...new Set(urls)];

      if (uniqueUrls.length > 0) {
        return uniqueUrls;
      }
    } catch (error) {
      console.warn(`Search query "${query}" failed: ${(error as Error).message}`);
    }
  }

  return fallbackKnownUrls[name.toLowerCase()] ?? [];
};

const fileExtFromResponse = (contentType: string | undefined, fallbackUrl: string): string => {
  const fromUrl = path.extname(new URL(fallbackUrl).pathname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(fromUrl)) {
    return fromUrl;
  }

  if (!contentType) {
    return ".jpg";
  }

  if (contentType.includes("png")) {
    return ".png";
  }

  if (contentType.includes("webp")) {
    return ".webp";
  }

  return ".jpg";
};

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const downloadFile = async (url: string, targetDir: string, basename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fetch = (currentUrl: string, depth = 0) => {
      if (depth > 5) {
        reject(new Error("Too many redirects while downloading image"));
        return;
      }

      const req = https.get(
        currentUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        },
        async (res) => {
            const status = res.statusCode ?? 0;

            if ([301, 302, 303, 307, 308].includes(status)) {
              const location = res.headers.location;
              if (!location) {
                reject(new Error("Redirect without location header"));
                return;
              }
              const redirected = new URL(location, currentUrl).toString();
              fetch(redirected, depth + 1);
              return;
            }

          if (status < 200 || status >= 300) {
              reject(new Error(`Image download failed (${status})`));
              return;
            }

            const contentType = String(res.headers["content-type"] ?? "").toLowerCase();
            if (!contentType.includes("image/")) {
              reject(new Error(`Unexpected content-type: ${contentType || "unknown"}`));
              return;
            }

            const ext = fileExtFromResponse(res.headers["content-type"], currentUrl);
            const outputPath = path.join(targetDir, `${basename}${ext}`);
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            res.on("end", async () => {
              try {
                await writeFile(outputPath, Buffer.concat(chunks));
                resolve(outputPath);
              } catch (error) {
                reject(error);
              }
            });
          }
      );

      req.setTimeout(NETWORK_TIMEOUT_MS, () => {
        req.destroy(new Error(`Image download timed out after ${NETWORK_TIMEOUT_MS}ms`));
      });
      req.on("error", reject);
    };

    fetch(url);
  });
};

const hasRembgPython = (): boolean => {
  const result = spawnSync(
    "python3",
    ["-c", "from rembg import remove; print('ok')"],
    { encoding: "utf8" }
  );

  return result.status === 0;
};

const removeBackground = (inputPath: string, outputPath: string): void => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from rembg import remove",
        "from PIL import Image",
        "import sys",
        "inp = Image.open(sys.argv[1])",
        "out = remove(inp)",
        "out.save(sys.argv[2])",
      ].join("; "),
      inputPath,
      outputPath,
    ],
    {
    encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || "rembg failed");
  }
};

const isValidImageFile = (inputPath: string): boolean => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from PIL import Image",
        "import sys",
        "img = Image.open(sys.argv[1])",
        "img.verify()",
        "print('ok')",
      ].join("; "),
      inputPath,
    ],
    { encoding: "utf8" }
  );

  return result.status === 0;
};

async function main() {
  const { names: selectedNames, force } = parseArgs();

  if (!existsSync(STORYBOARD_PATH)) {
    throw new Error("Missing data/storyboard.json. Generate a storyboard first.");
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const faceLibrary = loadFaceLibrary();
  let libraryChanged = false;

  if (!existsSync(PEOPLE_DIR)) {
    mkdirSync(PEOPLE_DIR, { recursive: true });
  }

  const storyboard = JSON.parse(readFileSync(STORYBOARD_PATH, "utf8")) as Storyboard;
  const personOverlays = storyboard.overlays.filter((overlay) => overlay.type === "person_label");

  if (personOverlays.length === 0) {
    console.log("No person_label overlays found. Nothing to do.");
    return;
  }

  const wantedNames = new Set(selectedNames);
  const rembgEnabled = process.env.REMOVE_BG !== "off";
  const rembgInstalled = rembgEnabled && hasRembgPython();

  if (rembgEnabled && !rembgInstalled) {
    console.warn("Python rembg not available. Images will be used without background removal.");
    console.warn("Install with: pip install --user rembg");
  }

  const tempDir = await mkdtemp(path.join(tmpdir(), "person-images-"));

  try {
    for (const overlay of personOverlays) {
      const name = String(overlay.content.name ?? "").trim();
      const role = String(overlay.content.role ?? "").trim();
      if (!name) {
        continue;
      }

      if (wantedNames.size > 0 && !wantedNames.has(name.toLowerCase())) {
        continue;
      }

      const libraryEntry = findLibraryEntry(faceLibrary, name);
      if (libraryEntry?.imageSrc && !force) {
        const absoluteLibraryImagePath = toAbsolutePublicAssetPath(libraryEntry.imageSrc);
        if (existsSync(absoluteLibraryImagePath)) {
          overlay.content.imageSrc = libraryEntry.imageSrc;
          if (libraryEntry.imageSourceUrl) {
            overlay.content.imageSourceUrl = libraryEntry.imageSourceUrl;
          }
          if (!overlay.content.role && libraryEntry.role) {
            overlay.content.role = libraryEntry.role;
          }
          console.log(`Using face library for ${name}: ${libraryEntry.imageSrc}`);
          continue;
        }
      }

      const slug = slugify(name);
      const cutoutTarget = path.join(PEOPLE_DIR, `${slug}.png`);
      const fallbackTarget = path.join(PEOPLE_DIR, `${slug}.jpg`);

      const existingTarget = existsSync(cutoutTarget)
        ? cutoutTarget
        : existsSync(fallbackTarget)
          ? fallbackTarget
          : null;

      if (existingTarget && !force) {
        const assetSrc = `assets/people/${path.basename(existingTarget)}`;
        overlay.content.imageSrc = assetSrc;
        libraryChanged =
          upsertLibraryEntry(faceLibrary, {
            name,
            role,
            imageSrc: assetSrc,
          }) || libraryChanged;
        console.log(`Reusing existing image for ${name}: ${path.basename(existingTarget)}`);
        continue;
      }

      if (!rapidApiKey) {
        console.warn(`Missing RAPIDAPI_KEY; cannot search image for ${name}. Skipping.`);
        continue;
      }

      console.log(`Searching image for ${name}...`);
      const imageUrls = await chooseImageUrls(name, rapidApiKey);
      if (imageUrls.length === 0) {
        console.warn(`No image results returned for ${name}. Skipping image overlay.`);
        continue;
      }

      let downloadedPath: string | null = null;
      let chosenSourceUrl: string | null = null;
      for (const candidateUrl of imageUrls) {
        try {
          const maybePath = await withTimeout(
            downloadFile(candidateUrl, tempDir, slug),
            NETWORK_TIMEOUT_MS + 5000,
            `Image download for ${name}`
          );
          if (!isValidImageFile(maybePath)) {
            throw new Error("Downloaded file is not a valid image");
          }
          downloadedPath = maybePath;
          chosenSourceUrl = candidateUrl;
          break;
        } catch (error) {
          console.warn(`Download failed for ${name} (${candidateUrl}): ${(error as Error).message}`);
        }
      }

      if (!downloadedPath || !chosenSourceUrl) {
        console.warn(`Unable to download a usable image for ${name}. Skipping image overlay.`);
        continue;
      }

      let finalPath = path.join(PEOPLE_DIR, path.basename(downloadedPath));
      if (rembgInstalled) {
        try {
          removeBackground(downloadedPath, cutoutTarget);
          finalPath = cutoutTarget;
        } catch (error) {
          console.warn(`rembg failed for ${name}, using original image: ${(error as Error).message}`);
          await copyFile(downloadedPath, finalPath);
        }
      } else {
        await copyFile(downloadedPath, finalPath);
      }

      const fileStats = await stat(finalPath);
      if (fileStats.size < 10_000) {
        throw new Error(`Downloaded image for ${name} looks too small (${fileStats.size} bytes)`);
      }

      const assetSrc = `assets/people/${path.basename(finalPath)}`;
      overlay.content.imageSrc = assetSrc;
      overlay.content.imageSourceUrl = chosenSourceUrl;
      libraryChanged =
        upsertLibraryEntry(faceLibrary, {
          name,
          role,
          imageSrc: assetSrc,
          imageSourceUrl: chosenSourceUrl,
        }) || libraryChanged;
      console.log(`Saved ${name} -> ${overlay.content.imageSrc}`);
    }

    writeFileSync(STORYBOARD_PATH, `${JSON.stringify(storyboard, null, 2)}\n`);
    console.log("Updated data/storyboard.json with imageSrc fields.");
    if (libraryChanged) {
      saveFaceLibrary(faceLibrary);
      console.log("Updated data/face-library.json with reusable person assets.");
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
