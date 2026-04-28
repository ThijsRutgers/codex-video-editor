#!/bin/bash
# Fantasie Editor setup shortcut for macOS/Linux.
# This is a convenience path. If it fails, open this folder in Codex and ask:
# "Help me install Fantasie Editor until npm run doctor passes."

set -e

echo "Fantasie Editor setup"
echo "====================="
echo ""

NODE_MAJOR=$(node -v 2>/dev/null | cut -d "v" -f2 | cut -d "." -f1 || true)
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18+ is required."
  echo "Install Node.js from https://nodejs.org, then run setup again."
  echo ""
  echo "If you are not sure what to do, open this folder in Codex and ask:"
  echo "  Help me install Fantasie Editor until npm run doctor passes."
  exit 1
fi

echo "[OK] Node.js $(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Reinstall Node.js from https://nodejs.org."
  exit 1
fi

echo "[OK] npm $(npm --version)"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg was not found."
  echo ""
  echo "macOS with Homebrew:"
  echo "  brew install ffmpeg"
  echo ""
  echo "Linux:"
  echo "  sudo apt install ffmpeg"
  echo ""
  echo "After installing ffmpeg, run setup again or ask Codex for help."
  exit 1
fi

echo "[OK] ffmpeg found"
echo ""
echo "Installing project dependencies..."
npm install

echo ""
echo "Creating project folders..."
mkdir -p public/assets data review-frames out

echo ""
echo "Running final doctor check..."
npm run doctor

echo ""
echo "Setup complete."
echo ""
echo "Next:"
echo "  1. Open Fantasie Editor with Codex."
echo "  2. Drag a video into the chat or paste its file path."
echo "  3. Ask: Edit this video with Fantasie Editor."
