#!/bin/bash

# Lorapok AI Agent - Uninstaller for Linux and macOS
# Built with 🐛 by Lorapok Labs (https://lorapok.tech)

set -e

echo ""
echo "🐛 Lorapok AI Agent — Uninstaller"
echo "══════════════════════════════════"
echo ""

# 1. Unlink global CLI command
echo "🔗 Removing global 'lorapok' command..."
if npm ls -g lorapok-ai > /dev/null 2>&1; then
    sudo npm unlink lorapok-ai -g 2>/dev/null || npm unlink -g 2>/dev/null || true
    echo "   ✅ Global CLI command removed."
else
    echo "   ⏭  Not globally linked, skipping."
fi

# 2. Stop and remove Docker containers/images
echo "🐳 Removing Docker resources..."
if command -v docker &> /dev/null; then
    docker compose down --rmi local 2>/dev/null || true
    echo "   ✅ Docker containers and images removed."
else
    echo "   ⏭  Docker not found, skipping."
fi

# 3. Remove config directory
CONFIG_DIR="$HOME/.lorapok"
if [ -d "$CONFIG_DIR" ]; then
    read -p "🗑  Delete config directory ($CONFIG_DIR)? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$CONFIG_DIR"
        echo "   ✅ Config directory removed."
    else
        echo "   ⏭  Config directory kept."
    fi
else
    echo "   ⏭  No config directory found."
fi

# 4. Remove node_modules
if [ -d "node_modules" ]; then
    read -p "📦 Delete node_modules? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules
        echo "   ✅ node_modules removed."
    else
        echo "   ⏭  node_modules kept."
    fi
fi

echo ""
echo "✅ Lorapok AI Agent has been uninstalled."
echo "   To also remove the source code, delete this directory:"
echo "   rm -rf $(pwd)"
echo ""
echo "   Built with 🐛 by Lorapok Labs (https://lorapok.tech)"
echo ""
