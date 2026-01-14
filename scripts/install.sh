#!/bin/bash

# Lorapok AI Agent - Installer for Linux and macOS

echo "🐛 Lorapok: Starting automated setup..."

# 1. Install local dependencies
echo "📦 Installing local dependencies..."
npm install

# 2. Build Docker container
echo "🐳 Building Docker container..."
docker compose build

# 3. Link CLI command
echo "🔗 Linking 'lorapok' command..."
sudo npm link --force

echo "✅ Setup complete! You can now run 'lorapok' from anywhere."
