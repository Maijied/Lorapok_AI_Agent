# Lorapok AI Agent - Uninstaller for Windows (PowerShell)
# Built with 🐛 by Lorapok Labs (https://lorapok.tech)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "🐛 Lorapok AI Agent — Uninstaller" -ForegroundColor Cyan
Write-Host "══════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Unlink global CLI command
Write-Host "🔗 Removing global 'lorapok' command..." -ForegroundColor Yellow
$linked = npm ls -g lorapok-ai 2>$null
if ($LASTEXITCODE -eq 0) {
    npm unlink lorapok-ai -g 2>$null
    Write-Host "   ✅ Global CLI command removed." -ForegroundColor Green
} else {
    Write-Host "   ⏭  Not globally linked, skipping." -ForegroundColor Gray
}

# 2. Stop and remove Docker containers/images
Write-Host "🐳 Removing Docker resources..." -ForegroundColor Yellow
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerExists) {
    docker compose down --rmi local 2>$null
    Write-Host "   ✅ Docker containers and images removed." -ForegroundColor Green
} else {
    Write-Host "   ⏭  Docker not found, skipping." -ForegroundColor Gray
}

# 3. Remove config directory
$configDir = Join-Path $env:USERPROFILE ".lorapok"
if (Test-Path $configDir) {
    $response = Read-Host "🗑  Delete config directory ($configDir)? [y/N]"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item -Recurse -Force $configDir
        Write-Host "   ✅ Config directory removed." -ForegroundColor Green
    } else {
        Write-Host "   ⏭  Config directory kept." -ForegroundColor Gray
    }
} else {
    Write-Host "   ⏭  No config directory found." -ForegroundColor Gray
}

# 4. Remove node_modules
if (Test-Path "node_modules") {
    $response = Read-Host "📦 Delete node_modules? [y/N]"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item -Recurse -Force node_modules
        Write-Host "   ✅ node_modules removed." -ForegroundColor Green
    } else {
        Write-Host "   ⏭  node_modules kept." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Lorapok AI Agent has been uninstalled." -ForegroundColor Green
Write-Host "   To also remove source code, delete this directory:" -ForegroundColor Gray
Write-Host "   Remove-Item -Recurse -Force '$PWD'" -ForegroundColor Gray
Write-Host ""
Write-Host "   Built with 🐛 by Lorapok Labs (https://lorapok.tech)" -ForegroundColor Cyan
Write-Host ""
