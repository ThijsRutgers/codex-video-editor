@echo off
setlocal

cd /d "%~dp0"

where codex >nul 2>nul
if errorlevel 1 (
  echo Codex is not installed or the codex command is not available.
  echo.
  echo Install Codex first, then open this file again.
  echo After installing, you can also open this folder in Codex and type:
  echo   Install Fantasie Editor and help me until it works.
  echo.
  pause
  exit /b 1
)

codex -C "%CD%" "Start Fantasie Editor onboarding. This is the user's first-run experience. Greet them briefly, explain that Fantasie Editor is a Codex-powered open-source video editor, then run npm run doctor to check whether this computer is ready. If anything is missing, help the user fix one issue at a time until npm run doctor passes. When ready, ask the user to drag a video into the chat or paste the file path. Keep the tone simple and non-technical."
