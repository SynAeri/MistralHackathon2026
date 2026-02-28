{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "mistral-hackathon-voice-analysis";

  buildInputs = with pkgs; [
    # Python environment
    python311
    python311Packages.pip
    python311Packages.virtualenv

    # System libraries for compilation
    gcc
    gfortran
    stdenv.cc.cc.lib
    zlib

    # Audio processing libraries
    ffmpeg
    libsndfile

    # Matplotlib dependencies
    cairo
    freetype
    libpng
    pkg-config

    # Math libraries
    openblas
    lapack

    # Database
    sqlite
  ];

  shellHook = ''
    # Set up library paths for PyTorch and audio processing
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.zlib}/lib:${pkgs.libsndfile}/lib:${pkgs.cairo}/lib:${pkgs.freetype}/lib:${pkgs.libpng}/lib:$LD_LIBRARY_PATH

    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
      echo "Activating virtual environment..."
      source venv/bin/activate
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Mistral Hackathon 2026 - Voice Analysis Backend"
    echo "  Primary System: voice-analysis-kin (Kintsugi DAM)"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Virtual environment: $(which python)"
    echo ""
    echo "Available commands:"
    echo "  • FastAPI backend:"
    echo "    uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "  • Voice Analysis (Kintsugi + LLM):"
    echo "    cd voice-analysis-kin"
    echo "    python example_usage.py"
    echo ""
    echo "  • Test setup:"
    echo "    cd voice-analysis-kin"
    echo "    python test_setup.py"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
  '';
}
