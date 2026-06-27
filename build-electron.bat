@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================
echo   Hello IoT - Package Builder
echo ======================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    pause
    exit /b 1
)

:: Set mirrors for China
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/3] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Packaging Electron app...
echo This may take 5-10 minutes on first run (downloading Electron binary)...
echo.

call npx electron-builder --win portable --x64
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Done!
echo.
echo Output: release\Terminal Lab.exe  (portable, no install needed)
echo         release\Terminal Lab Setup.exe  (installer)
echo.
pause
