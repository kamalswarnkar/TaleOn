Write-Host "🚀 Starting TaleOn Backend Server..." -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Checking if port 5000 is in use..." -ForegroundColor Yellow

# Check if port 5000 is in use
$portCheck = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($portCheck) {
    Write-Host "⚠️  Port 5000 is in use by PID $($portCheck.OwningProcess)" -ForegroundColor Red
    Write-Host "🗑️  Killing process $($portCheck.OwningProcess)..." -ForegroundColor Yellow
    
    try {
        Stop-Process -Id $portCheck.OwningProcess -Force
        Write-Host "✅ Process killed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to kill process: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Wait a moment for port to be released
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Port 5000 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting server with nodemon..." -ForegroundColor Cyan
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to script directory and start server
Set-Location $PSScriptRoot
npm run dev
