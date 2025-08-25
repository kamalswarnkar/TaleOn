@echo off
echo 🚀 Starting TaleOn Backend Server...
echo.

echo 🔍 Checking if port 5000 is in use...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo ⚠️  Port 5000 is in use by PID %%a
    echo 🗑️  Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Process killed successfully
    ) else (
        echo ❌ Failed to kill process
    )
)

echo.
echo 🚀 Starting server with nodemon...
echo 📝 Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npm run dev
