#!/usr/bin/env bash
# Railway startup script - inits volume, downloads model, then starts FastAPI

set -e

echo "════════════════════════════════════════════════════════"
echo "  Starting Mistral Hackathon Backend on Railway"
echo "════════════════════════════════════════════════════════"

# Initialize Persistent Volume Data FIRST
echo ""
echo "Step 1: Initializing Persistent Volume..."
BASE_DIR=$(pwd)
STORAGE_DIR="$BASE_DIR/storage"
SEED_DIR="$BASE_DIR/seed_data"

mkdir -p "$STORAGE_DIR/voice_data"
mkdir -p "$STORAGE_DIR/voice_data_json"
echo "  ✓ Volume directories ensured."

if [ -d "$SEED_DIR/voice_data" ]; then
    echo "  ✓ Syncing audio seed files to volume..."
    cp -n "$SEED_DIR/voice_data"/* "$STORAGE_DIR/voice_data/" 2>/dev/null || true
fi

if [ -d "$SEED_DIR/voice_data_json" ]; then
    echo "  ✓ Syncing JSON seed files to volume..."
    cp -n "$SEED_DIR/voice_data_json"/* "$STORAGE_DIR/voice_data_json/" 2>/dev/null || true
fi

# Download Kintsugi model SECOND
echo ""
echo "Step 2: Checking Kintsugi model..."
python download_model.py

# Start FastAPI server
echo ""
echo "Step 3: Starting FastAPI server..."
echo "   Port: ${PORT:-8000}"
echo ""

exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
