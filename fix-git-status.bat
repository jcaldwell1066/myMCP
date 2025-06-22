@echo off
echo Fixing git status issues...

echo.
echo 1. Checking git status before fixes:
git status --porcelain

echo.
echo 2. Fixing line ending issues by adding the file (this normalizes line endings):
git add packages/cli/src/simple-cli.js

echo.
echo 3. Checking if this resolved the issue:
git status --porcelain

echo.
echo 4. If the file shows as staged with no real changes, we'll reset it:
git reset HEAD packages/cli/src/simple-cli.js

echo.
echo 5. Pulling latest changes from origin:
git pull origin main

echo.
echo 6. Final git status:
git status

echo.
echo Done! The line ending issue should be resolved.
