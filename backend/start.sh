#!/usr/bin/env bash
# Railway startup script - downloads model, inits volume, then starts FastAPI

set -e

echo "════════════════════════════════════════════════════════"
echo "  Starting Mistral Hackathon Backend on Railway"
echo "════════════════════════════════════════════════════════"

# Download Kintsugi model if not present
echo ""
echo "Step 1: Checking Kintsugi model..."
python download_model.py

# Initialize Persistent Volume Data
echo ""
echo "Step 2: Initializing Persistent Volume..."
BASE_DIR=$(pwd)
STORAGE_DIR="$BASE_DIR/storage"
SEED_DIR="$BASE_DIR/seed_data"

# Create the volume directories
mkdir -p "$STORAGE_DIR/voice_data"
mkdir -p "$STORAGE_DIR/voice_data_json"
echo "  ✓ Volume directories ensured."

# Copy audio files into the volume (without overwriting)
if [ -d "$SEED_DIR/voice_data" ]; then
    echo "  ✓ Syncing audio seed files to volume..."
    cp -n "$SEED_DIR/voice_data"/* "$STORAGE_DIR/voice_data/" 2>/dev/null || true
else
    echo "  ! No audio seed directory found at $SEED_DIR/voice_data"
fi

# Copy JSON files into the volume (without overwriting)
if [ -d "$SEED_DIR/voice_data_json" ]; then
    echo "  ✓ Syncing JSON seed files to volume..."
    cp -n "$SEED_DIR/voice_data_json"/* "$STORAGE_DIR/voice_data_json/" 2>/dev/null || true
else
    echo "  ! No JSON seed directory found at $SEED_DIR/voice_data_json"
fi

# Start FastAPI server
echo ""
echo "Step 3: Starting FastAPI server..."
echo "   Port: ${PORT:-8000}"
echo ""

exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
