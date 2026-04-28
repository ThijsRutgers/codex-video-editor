#!/bin/bash

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if ! command -v codex >/dev/null 2>&1; then
  echo "Codex is not installed or the codex command is not available."
  echo ""
  echo "Install Codex first, then open this file again."
  echo "After installing, you can also open this folder in Codex and type:"
  echo "  Install Fantasie Editor and help me until it works."
  echo ""
  read -r -p "Press Enter to close..."
  exit 1
fi

codex -C "$DIR" "Start Fantasie Editor onboarding. This is the user's first-run experience. Greet them briefly, explain that Fantasie Editor is a Codex-powered open-source video editor, then run npm run doctor to check whether this computer is ready. If anything is missing, help the user fix one issue at a time until npm run doctor passes. When ready, ask the user to drag a video into the chat or paste the file path. Keep the tone simple and non-technical."
