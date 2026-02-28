# Mistral Hackathon 2026 - Backend

Voice analysis system with **Kintsugi Depression and Anxiety Model** + **Mistral LLM** clinical interpretation.

## 🎯 Primary System: voice-analysis-kin

The main voice analysis system combining:
- **Kintsugi DAM**: Industry-grade depression/anxiety detection (PHQ-9/GAD-7)
- **40+ Acoustic Features**: Comprehensive voice biomarkers
- **Mistral LLM**: Clinical interpretation and insights

**Full documentation**: See `voice-analysis-kin/README.md`

## 🚀 Quick Start

### 1. Enter Development Environment

```bash
cd /home/jordanm/Documents/Github/MistralHackathon2026/backend
nix-shell
```

This sets up:
- Python 3.11
- System libraries (FFmpeg, libsndfile, etc.)
- Proper library paths for PyTorch

### 2. Install Dependencies (First Time)

```bash
# Create and activate virtual environment (if not already created)
python -m venv venv
source venv/bin/activate

# Install all requirements from single consolidated file
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
```

**Note**: All dependencies for FastAPI, voice-analysis-kin, and voice-analysis-system are in the single `backend/requirements.txt` file.

### 3. Run Voice Analysis

```bash
cd voice-analysis-kin
python example_usage.py
```

Or test your setup:
```bash
cd voice-analysis-kin
python test_setup.py
```

### 4. Run FastAPI Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📂 Directory Structure

```
backend/
├── shell.nix                    # Nix development environment
├── requirements.txt             # Consolidated Python dependencies
├── .env                         # API keys and configuration
├── main.py                      # FastAPI application
├── users.db                     # SQLite database
│
├── voice-analysis-kin/          ⭐ PRIMARY VOICE ANALYSIS SYSTEM
│   ├── README.md               # Full documentation
│   ├── START_HERE.md           # Setup guide
│   ├── example_usage.py        # Interactive examples
│   ├── test_setup.py           # Verify setup
│   ├── kintsugi_model/         # Depression/Anxiety model
│   ├── src/                    # Analysis pipeline
│   └── outputs/                # Results
│
└── voice-analysis-system/       # Legacy system (archived)
```

## 🔧 Configuration

Edit `.env` in backend root:

```bash
# Mistral LLM API
MINISTRAL_API_KEY=your_api_key_here
MINISTRAL_MODEL=ministral-8b-latest

# Audio settings
SAMPLE_RATE=16000
MAX_AUDIO_LENGTH=30
```

## 📊 Features

### Voice Analysis (voice-analysis-kin)
- **Depression Detection**: 3-level severity (PHQ-9: ≤9, 10-14, ≥15)
- **Anxiety Detection**: 4-level severity (GAD-7: ≤4, 5-9, 10-14, ≥15)
- **Acoustic Analysis**: 40+ features (temporal, prosodic, spectral, etc.)
- **Clinical Insights**: Mistral LLM interpretation

### FastAPI Backend
- User authentication (JWT)
- Patient management (CRUD)
- SQLite database
- CORS enabled for frontend

## 🎮 Usage Examples

### Command Line Analysis
```bash
cd voice-analysis-kin

# Full analysis with LLM
python -m src.unified_pipeline audio.wav --patient-id "PT-001"

# Features + Kintsugi only (no LLM)
python -m src.unified_pipeline audio.wav --no-llm

# CPU mode
python -m src.unified_pipeline audio.wav --cpu
```

### Python API
```python
from voice_analysis_kin.src.unified_pipeline import UnifiedVoiceAnalysisPipeline

pipeline = UnifiedVoiceAnalysisPipeline()
results = pipeline.analyze("audio.wav", patient_id="PT-001")

print(results['kintsugi_scores'])  # Depression/anxiety
print(results['acoustic_parameters'])  # Voice features
print(results['clinical_analysis'])  # LLM insights
```

## 🆘 Troubleshooting

### "libstdc++.so.6: cannot open shared object file"
**Solution**: You're not in nix-shell. Exit and run `nix-shell` from backend/.

### "No module named 'torch'"
**Solution**: Virtual environment not activated. Run `source venv/bin/activate`.

### SSL certificate errors during pip install
**Solution**: Use trusted host flags (already in instructions above).

### Import errors
**Solution**: Make sure you're in nix-shell AND venv is activated:
```bash
cd /home/jordanm/Documents/Github/MistralHackathon2026/backend
nix-shell  # Sets LD_LIBRARY_PATH
source venv/bin/activate
```

## 📝 Daily Workflow

```bash
# 1. Start development environment
cd /home/jordanm/Documents/Github/MistralHackathon2026/backend
nix-shell

# 2. Venv is auto-activated (or manually: source venv/bin/activate)

# 3. Run voice analysis
cd voice-analysis-kin
python example_usage.py

# OR run FastAPI backend
uvicorn main:app --reload
```

## 🔗 Integration

To integrate voice analysis into the FastAPI backend:

1. Import the pipeline in `main.py`:
```python
from voice_analysis_kin.src.unified_pipeline import UnifiedVoiceAnalysisPipeline

pipeline = UnifiedVoiceAnalysisPipeline()
```

2. Create an endpoint:
```python
@app.post("/api/analyze-voice")
async def analyze_voice(file: UploadFile, patient_id: str):
    results = pipeline.analyze(file.file, patient_id=patient_id)
    return results
```

3. See `voice-analysis-kin/README.md` for full API details.

## 📦 Dependencies

All dependencies are in `requirements.txt`:
- **Web**: FastAPI, Uvicorn
- **Auth**: Passlib, Python-JOSE
- **Database**: SQLAlchemy
- **Voice**: Librosa, Matplotlib, Soundfile
- **AI**: PyTorch, Transformers, PEFT, Mistral AI
- **Kintsugi**: Whisper encoder with LoRA fine-tuning

## 🎯 Model Details

**Kintsugi Depression and Anxiety Model (DAM)**
- **Backbone**: OpenAI Whisper-small.en encoder
- **Training**: 35,000 individuals, ~863 hours of speech
- **Output**: Depression (0-2) and Anxiety (0-3) severity scores
- **Validation**: Peer-reviewed in Annals of Family Medicine
- **License**: Apache 2.0

## 📚 Documentation

- **Voice Analysis**: `voice-analysis-kin/README.md`
- **Quick Start**: `voice-analysis-kin/START_HERE.md`
- **Integration**: `voice-analysis-kin/INTEGRATION_SUMMARY.md`

## ✅ System Status

- ✅ Kintsugi model: Working
- ✅ Acoustic analysis: Working
- ✅ Mistral LLM: Working
- ✅ FastAPI backend: Working
- ✅ Patient CRUD: Working
- ⏳ Frontend integration: Pending

---

**Built with**: Python, FastAPI, PyTorch, Transformers, Mistral AI, Kintsugi DAM
