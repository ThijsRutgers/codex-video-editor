#!/bin/bash
# ============================================
# Video Editor Studio - Setup Script
# Run this once to set up everything.
# ============================================

set -e

echo "🎬 Video Editor Studio - Setup"
echo "================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v 2>/dev/null || echo 'not installed')"
  echo "   Install: https://nodejs.org or use nvm: nvm install 20"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
  echo "❌ ffmpeg not found."
  echo "   Install: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"
  exit 1
fi
echo "✓ ffmpeg installed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install Remotion Skills
echo ""
echo "🎯 Installing Remotion Agent Skills..."
npx skills add remotion-dev/skills 2>/dev/null || echo "   (skills may already be installed)"

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p public/assets
mkdir -p data
mkdir -p review-frames
mkdir -p out

# Create placeholder files
if [ ! -f public/video.mp4 ]; then
  echo ""
  echo "⚠️  No video found at public/video.mp4"
  echo "   Copy your source video there before running Codex:"
  echo "   cp /path/to/your/video.mp4 public/video.mp4"
fi

if [ ! -f public/assets/logo.png ]; then
  echo ""
  echo "💡 Optional: place your logo at public/assets/logo.png"
  echo "   It will be used in the outro if present."
fi

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. cp /path/to/your/video.mp4 public/video.mp4"
echo "  2. npm run dev           (start Remotion Studio)"
echo "  3. codex                 (open Codex in another terminal)"
echo "  4. Paste your edit prompt (see README.md for examples)"
echo "============================================"
