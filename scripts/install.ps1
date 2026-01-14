# Lorapok AI Agent - Installer for Windows (PowerShell)

Write-Host "🐛 Lorapok: Starting automated setup..." -ForegroundColor Cyan

# 1. Install local dependencies
Write-Host "📦 Installing local dependencies..." -ForegroundColor Gray
npm install

# 2. Build Docker container
Write-Host "🐳 Building Docker container..." -ForegroundColor Gray
docker compose build

# 3. Link CLI command
Write-Host "🔗 Linking 'lorapok' command..." -ForegroundColor Gray
npm link --force

Write-Host "✅ Setup complete! You can now run 'lorapok' from anywhere." -ForegroundColor Green
