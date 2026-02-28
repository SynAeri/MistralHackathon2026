"""
Voice Call API Integration with VAPI
Handles outbound calls, recording, and voice analysis
"""
import os
import requests
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()

# VAPI Configuration
VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_BASE_URL = "https://api.vapi.ai"

# ========================================
# SCHEMAS
# ========================================

class CallRequest(BaseModel):
    phone: str  # Phone number to call (e.g., "+1234567890")

class CallResponse(BaseModel):
    success: bool
    call_id: str
    message: str
    patient_id: int | None = None

# ========================================
# VAPI HELPER FUNCTIONS
# ========================================

def initiate_vapi_call(phone_number: str, patient_name: str = "patient") -> dict:
    """
    Initiate an outbound call using VAPI
    
    Returns:
        dict: VAPI response with call_id
    """
    
    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # VAPI call configuration
    payload = {
        "phoneNumberId": os.getenv("VAPI_PHONE_NUMBER_ID"),  # Your VAPI phone number
        "customer": {
            "number": phone_number,
        },
        "assistant": {
            "firstMessage": f"Hello {patient_name}, this is your mental health check-in call. How are you feeling today?",
            "model": {
                "provider": "openai",
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a compassionate mental health assistant conducting a wellness check-in call. 
                        
Your goal:
1. Ask how the patient is feeling today
2. Listen actively and show empathy
3. Ask about sleep, mood, and daily activities
4. Keep the conversation natural and supportive
5. The call should last 2-5 minutes
6. End by thanking them and confirming their next appointment

Be warm, professional, and attentive. Don't diagnose - just listen and gather information."""
                    }
                ]
            },
            "voice": "jennifer-playht",  # Natural voice
            "recordingEnabled": True,  # IMPORTANT: Enable recording
            "endCallFunctionEnabled": True,
            "maxDurationSeconds": 300,  # 5 minute max
        },
        "serverUrl": f"{os.getenv('BACKEND_URL')}/api/webhooks/vapi",  # Webhook for recording
    }
    
    response = requests.post(
        f"{VAPI_BASE_URL}/call/phone",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 201:
        return response.json()
    else:
        raise Exception(f"VAPI call failed: {response.status_code} - {response.text}")

def download_recording(recording_url: str, save_path: Path) -> Path:
    """Download the call recording from VAPI"""
    
    response = requests.get(recording_url, stream=True)
    response.raise_for_status()
    
    save_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(save_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    return save_path

# ========================================
# ENDPOINTS
# ========================================

@router.post("/api/call", response_model=CallResponse)
async def initiate_call(
    call_request: CallRequest,
    db: Session,
    background_tasks: BackgroundTasks
):
    """
    Initiate outbound call to patient
    
    Workflow:
    1. Find patient by phone number
    2. Initiate VAPI call
    3. VAPI will send webhook when recording is ready
    4. Webhook will process voice analysis
    """
    from main import Patient, Engagement
    
    # Find patient by phone number
    patient = db.query(Patient).filter(Patient.phone == call_request.phone).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"No patient found with phone number: {call_request.phone}"
        )
    
    # Update engagement metrics
    engagement = db.query(Engagement).filter(Engagement.patient_id == patient.id).first()
    if engagement:
        engagement.total_calls += 1
        db.commit()
    
    try:
        # Initiate VAPI call
        vapi_response = initiate_vapi_call(
            phone_number=patient.phone,
            patient_name=patient.name.split()[0]  # First name only
        )
        
        call_id = vapi_response.get("id")
        
        return CallResponse(
            success=True,
            call_id=call_id,
            message=f"Call initiated to {patient.name} ({patient.phone})",
            patient_id=patient.id
        )
        
    except Exception as e:
        # Update unpicked calls if call fails
        if engagement:
            engagement.calls_unpicked += 1
            db.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate call: {str(e)}"
        )

@router.post("/api/webhooks/vapi")
async def vapi_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook endpoint for VAPI to send call recordings and events
    
    VAPI sends:
    - call.ended: When call finishes
    - recording.ready: When recording is available
    """
    
    payload = await request.json()
    event_type = payload.get("message", {}).get("type")
    
    print(f"📞 VAPI Webhook: {event_type}")
    
    if event_type == "end-of-call-report":
        # Call ended, recording should be available
        call_data = payload.get("message", {})
        recording_url = call_data.get("recordingUrl")
        call_id = call_data.get("call", {}).get("id")
        phone_number = call_data.get("call", {}).get("customer", {}).get("number")
        
        if recording_url and phone_number:
            # Process recording in background
            background_tasks.add_task(
                process_call_recording,
                recording_url=recording_url,
                phone_number=phone_number,
                call_id=call_id
            )
            
            return {"status": "processing"}
    
    return {"status": "received"}

# ========================================
# BACKGROUND TASKS
# ========================================

async def process_call_recording(recording_url: str, phone_number: str, call_id: str):
    """
    Background task to:
    1. Download recording
    2. Run voice analysis (Kintsugi + acoustic features)
    3. Save to database
    """
    from main import SessionLocal, Patient, VoiceBiometrics
    from voice_analysis_kin.src.unified_pipeline import UnifiedVoiceAnalysisPipeline
    
    db = SessionLocal()
    
    try:
        # Find patient
        patient = db.query(Patient).filter(Patient.phone == phone_number).first()
        if not patient:
            print(f"⚠️  Patient not found for phone: {phone_number}")
            return
        
        # Download recording
        recordings_dir = Path("voice_recordings")
        recording_path = recordings_dir / f"{patient.mrn}_{call_id}.wav"
        
        print(f"📥 Downloading recording for {patient.name}...")
        download_recording(recording_url, recording_path)
        
        # Run voice analysis
        print(f"🔬 Analyzing voice for {patient.name}...")
        pipeline = UnifiedVoiceAnalysisPipeline(
            use_ministral_api=True,
            enable_llm=True
        )
        
        results = pipeline.analyze(
            audio_path=str(recording_path),
            clinical_context="depression and anxiety screening",
            patient_id=patient.mrn,
            generate_spectrogram=False  # Skip for phone calls
        )
        
        # Update VoiceBiometrics in database
        voice_bio = db.query(VoiceBiometrics).filter(
            VoiceBiometrics.patient_id == patient.id
        ).first()
        
        if voice_bio:
            voice_bio.voice_file_path = str(recording_path)
            voice_bio.last_analysis = datetime.utcnow()
            # You can add more fields for Kintsugi scores here
        
        db.commit()
        
        print(f"✅ Voice analysis complete for {patient.name}")
        print(f"   Depression: {results['kintsugi_scores']['depression']['severity_label']}")
        print(f"   Anxiety: {results['kintsugi_scores']['anxiety']['severity_label']}")
        
    except Exception as e:
        print(f"✗ Error processing recording: {e}")
        db.rollback()
    finally:
        db.close()

