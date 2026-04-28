import { getVideoMetadata } from "@remotion/media-utils";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import storyboardData from "../data/storyboard.json";
import { MainComposition } from "./compositions/MainComposition";

const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = async () => {
  const metadata = await getVideoMetadata(staticFile("video.mp4"));
  const storyboardFps = Number(storyboardData.fps);
  const fps = Number.isFinite(storyboardFps) && storyboardFps > 0 ? storyboardFps : 30;
  const durationInFrames = Math.ceil(metadata.durationInSeconds * fps);

  return {
    fps,
    durationInFrames,
    width: metadata.width,
    height: metadata.height,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
