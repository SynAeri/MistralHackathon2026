#!/usr/bin/env bash
# Railway startup script - downloads model then starts FastAPI

set -e

echo "════════════════════════════════════════════════════════"
echo "  Starting Mistral Hackathon Backend on Railway"
echo "════════════════════════════════════════════════════════"

# Download Kintsugi model if not present
echo ""
echo "Step 1: Checking Kintsugi model..."
python download_model.py

# Start FastAPI server
echo ""
echo "Step 2: Starting FastAPI server..."
echo "   Port: $PORT"
echo ""

exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
