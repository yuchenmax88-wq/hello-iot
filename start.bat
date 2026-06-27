@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================
echo   Hello IoT — Drag & Wire, No Coding
echo ======================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node -v
echo.

:: Install dependencies if needed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
)

echo Starting Hello IoT...
echo Open http://localhost:5173 in your browser
echo.
echo Press Ctrl+C to stop
echo ======================================
echo.

call npx vite --host
pause
