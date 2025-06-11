@echo off
REM myMCP Pre-Release Testing Script (Windows)
REM Starts engine and runs comprehensive tests

echo 🚀 myMCP Pre-Release Testing
echo ============================

echo 📦 Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo 🚀 Starting engine for testing...
start /b npm run dev:engine

echo ⏳ Waiting for engine to initialize...
timeout /t 8 /nobreak > nul

echo 🧪 Running automated test suite...
node tests/pre-release-test.js

if %ERRORLEVEL% EQU 0 (
    echo ✅ All tests passed - ready for packaging!
) else (
    echo ❌ Tests failed - fix issues before packaging
)

echo 🛑 Stopping engine...
taskkill /f /im node.exe 2>nul

pause