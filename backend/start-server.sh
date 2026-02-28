#!/usr/bin/env bash
# Mistral Hackathon 2026 - FastAPI Server Startup Script

set -e

echo "🚀 Starting Mistral Hackathon Backend Server"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Creating .env from .env.example..."

    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   ✅ Created .env file. Please edit it and add your MISTRAL_API_KEY"
        echo ""
    else
        echo "   ❌ .env.example not found. Please create .env manually with:"
        echo "      MISTRAL_API_KEY=your_api_key_here"
        echo ""
    fi
fi

# Start server in nix-shell for library support
echo "📦 Loading nix-shell environment with matplotlib support..."
echo ""

nix-shell shell.nix --run "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
