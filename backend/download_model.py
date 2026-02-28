#!/usr/bin/env python3
"""
Download Kintsugi model checkpoint if it doesn't exist
Run this before starting the FastAPI server
"""
import os
from pathlib import Path
import urllib.request
import sys

CHECKPOINT_URL = "https://huggingface.co/KintsugiHealth/dam/resolve/main/dam3.1.ckpt"
CHECKPOINT_PATH = Path(__file__).parent / "voice-analysis-kin" / "kintsugi_model" / "dam3.1.ckpt"

def download_model():
    """Download the Kintsugi model checkpoint if it doesn't exist."""

    # Check if model already exists
    if CHECKPOINT_PATH.exists():
        file_size = CHECKPOINT_PATH.stat().st_size
        # Check if it's the actual model (not a Git LFS pointer)
        if file_size > 1_000_000:  # > 1MB means it's the real model
            print(f"✓ Kintsugi model already exists ({file_size / 1_000_000:.1f} MB)")
            return True
        else:
            print(f"⚠ Found Git LFS pointer ({file_size} bytes), downloading actual model...")
            CHECKPOINT_PATH.unlink()  # Delete the pointer

    # Create directory if it doesn't exist
    CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"📥 Downloading Kintsugi model from HuggingFace...")
    print(f"   URL: {CHECKPOINT_URL}")
    print(f"   Destination: {CHECKPOINT_PATH}")
    print(f"   Size: ~703 MB (this may take a few minutes)")

    try:
        # Download with progress
        def progress_hook(count, block_size, total_size):
            percent = int(count * block_size * 100 / total_size)
            sys.stdout.write(f"\r   Progress: {percent}%")
            sys.stdout.flush()

        urllib.request.urlretrieve(CHECKPOINT_URL, CHECKPOINT_PATH, progress_hook)
        print("\n✓ Model downloaded successfully!")

        # Verify download
        file_size = CHECKPOINT_PATH.stat().st_size
        print(f"✓ Verified: {file_size / 1_000_000:.1f} MB")

        if file_size < 700_000_000:  # Should be ~703 MB
            print("⚠ Warning: File size seems smaller than expected")
            return False

        return True

    except Exception as e:
        print(f"\n✗ Download failed: {e}")
        if CHECKPOINT_PATH.exists():
            CHECKPOINT_PATH.unlink()  # Clean up partial download
        return False

if __name__ == "__main__":
    success = download_model()
    sys.exit(0 if success else 1)
