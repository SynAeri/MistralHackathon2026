import os
from datetime import datetime, timedelta, date
from typing import Optional
import secrets
from mistralai import Mistral
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext

load_dotenv()
api_key = os.environ["MISTRAL_API_KEY"]
model = "mistral-medium-latest"

client = Mistral(api_key=api_key)

# Database setup - PostgreSQL for Railway, SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./users.db")

# Railway provides DATABASE_URL starting with postgres://, but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with appropriate settings
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Session storage (in-memory for simplicity, use Redis for production)
sessions = {}

# ========================================
# DATABASE MODELS
# ========================================

# User model for authentication
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Patient model for clinical records
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String, unique=True, index=True, nullable=False)  # Medical Record Number
    name = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)  # "M" or "F"
    last_visit = Column(String, nullable=True)  # Date string (e.g., "2026-02-25")
    next_appointment = Column(String, nullable=True)  # Date string or "-"
    status = Column(String, nullable=False)  # "Active", "Follow-up", "Pending" (treatment status)
    risk = Column(String, nullable=False)  # "High", "Medium", "Low", "Undetermined" (risk level)
    phone = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    engagement = relationship("Engagement", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    voice_biometrics = relationship("VoiceBiometrics", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    voice_recordings = relationship("VoiceRecording", back_populates="patient", cascade="all, delete-orphan")

# Diagnosis model for patient diagnoses
class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis = Column(String, nullable=False)
    risk = Column(String, nullable=False)  # "high", "medium", "lower", "undetermined"
    triggered_alerts = Column(String, nullable=True)  # Alert messages
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")

# Engagement model for patient call engagement metrics
class Engagement(Base):
    __tablename__ = "engagement"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    total_calls = Column(Integer, nullable=False, default=0)
    calls_unpicked = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="engagement")

# Voice Biometrics model for patient voice data
class VoiceBiometrics(Base):
    __tablename__ = "voice_biometrics"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    voice_file_path = Column(String, nullable=True)  # Path to stored voice file
    voice_signature = Column(String, nullable=True)  # Voice signature/hash for identification
    last_analysis = Column(DateTime, nullable=True)  # Last time voice was analyzed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="voice_biometrics")


# Voice Recording model - Multiple recordings per patient
class VoiceRecording(Base):
    __tablename__ = "voice_recordings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Audio file
    audio_file_path = Column(String, nullable=False)  # Path to .wav file
    audio_file_name = Column(String, nullable=False)  # Filename for display

    # Analysis JSON
    analysis_json_path = Column(String, nullable=False)  # Path to analysis JSON

    # Kintsugi scores
    depression_score = Column(Integer, nullable=True)  # 0-2
    depression_severity = Column(String, nullable=True)  # e.g., "Mild-moderate depression"
    depression_raw = Column(Float, nullable=True)

    anxiety_score = Column(Integer, nullable=True)  # 0-3
    anxiety_severity = Column(String, nullable=True)  # e.g., "Mild anxiety"
    anxiety_raw = Column(Float, nullable=True)

    # Acoustic features summary (store as JSON string)
    acoustic_summary = Column(String, nullable=True)  # JSON string

    # Metadata
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    duration_seconds = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="voice_recordings")


# ========================================
# PYDANTIC SCHEMAS
# ========================================

###
# User Schema practicioner thingy
###

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


###
# Patient Schemas
###

class PatientCreate(BaseModel):
    mrn: str
    name: str
    age: int
    gender: str  # "M" or "F"
    last_visit: Optional[str] = None
    next_appointment: Optional[str] = None
    status: str = "Active"  # "Active", "Follow-up", "Pending" (treatment status)
    risk: str = "Undetermined"  # "High", "Medium", "Low", "Undetermined" (risk level)
    phone: str

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    last_visit: Optional[str] = None
    next_appointment: Optional[str] = None
    status: Optional[str] = None
    risk: Optional[str] = None
    phone: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    mrn: str
    name: str
    age: int
    gender: str
    last_visit: Optional[str]
    next_appointment: Optional[str]
    status: str
    risk: str
    phone: str

    class Config:
        from_attributes = True

# ========================================
# END SCHEMA
# ========================================

# Create tables
Base.metadata.create_all(bind=engine)

# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_session(user_id: int) -> str:
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = {
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7)
    }
    return session_id

def get_current_user(session_id: Optional[str] = Cookie(None), db: Session = Depends(get_db)) -> User:
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    session_data = sessions[session_id]
    if datetime.utcnow() > session_data["expires_at"]:
        del sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )

    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

app = FastAPI()

origins = [
    "http://localhost:3000",  # Next.js frontend (local dev)
    "http://localhost:8080",  # Alternative frontend port
    "http://localhost:8000",  # Backend docs
    "https://mistral-hackathon2026.vercel.app",  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/data")
def read_data():
    return {"message": "Data from FastAPI"}

@app.post("/api/auth/login")
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.username == user_data.username).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Create session
    session_id = create_session(user.id)

    # Set cookie
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        max_age=7 * 24 * 60 * 60, 
        samesite="lax"
    )

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }

@app.post("/api/auth/logout")
def logout(response: Response, session_id: Optional[str] = Cookie(None)):
    if session_id and session_id in sessions:
        del sessions[session_id]

    response.delete_cookie(key="session_id")
    return {"message": "Logout successful"}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ========================================
# PATIENT ENDPOINTS
# ========================================
# 

@app.get("/api/patients", response_model=list[PatientResponse])
def get_patients(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all patients with optional real-time search filter

    Args:
        search: Optional search term to filter by name, MRN, or phone
    """
    query = db.query(Patient)

    # Apply real-time search filter if provided
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (Patient.name.ilike(search_term)) |
            (Patient.mrn.ilike(search_term)) |
            (Patient.phone.ilike(search_term))
        )

    patients = query.order_by(Patient.id).all()
    return patients

@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get a specific patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} n cot found"
        )

    return patient


###
# Create Patients
###

@app.post("/api/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient record"""

    # Check if MRN already exists
    existing_patient = db.query(Patient).filter(Patient.mrn == patient_data.mrn).first()
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient with MRN {patient_data.mrn} already exists"
        )

    # Create new patient
    new_patient = Patient(
        mrn=patient_data.mrn,
        name=patient_data.name,
        age=patient_data.age,
        gender=patient_data.gender,
        last_visit=patient_data.last_visit,
        next_appointment=patient_data.next_appointment,
        status=patient_data.status,
        risk=patient_data.risk,
        phone=patient_data.phone
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient

@app.put("/api/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing patient record"""

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Update only provided fields
    update_data = patient_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)

    return patient

###
# Delete patient
###
@app.delete("/api/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete a patient record"""

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    db.delete(patient)
    db.commit()

    return None

###
# Diagnoses endpoint
###
@app.get("/api/patients/{patient_id}/diagnoses")
def get_patient_diagnoses(patient_id: int, db: Session = Depends(get_db)):
    """Get diagnoses for a specific patient with status and triggered alerts"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Query diagnoses from database
    diagnoses = db.query(Diagnosis).filter(Diagnosis.patient_id == patient_id).all()

    # Format response
    diagnoses_list = [
        {
            "id": d.id,
            "diagnosis": d.diagnosis,
            "risk": d.risk,
            "triggered_alerts": d.triggered_alerts or "No alerts"
        }
        for d in diagnoses
    ]

    return {"patient_id": patient_id, "diagnoses": diagnoses_list}

###
# Engagement endpoint
###
@app.get("/api/patients/{patient_id}/engag")
def get_patient_engagement(patient_id: int, db: Session = Depends(get_db)):
    """Get call engagement metrics for a specific patient"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Query engagement data from database
    engagement = db.query(Engagement).filter(Engagement.patient_id == patient_id).first()

    # If no engagement record exists, return defaults
    if not engagement:
        return {
            "patient_id": patient_id,
            "total_calls": 0,
            "calls_unpicked": 0,
            "call_percentage": 0.0
        }

    # Calculate call percentage: [(total_calls - calls_unpicked) / total_calls] * 100
    call_percentage = 0.0
    if engagement.total_calls > 0:
        call_percentage = ((engagement.total_calls - engagement.calls_unpicked) / engagement.total_calls) * 100

    return {
        "patient_id": patient_id,
        "total_calls": engagement.total_calls,
        "calls_unpicked": engagement.calls_unpicked,
        "call_percentage": round(call_percentage, 2)
    }


###
# Voice Recording Endpoints
###

@app.get("/api/patients/{patient_id}/VLatest")
def get_latest_voice_recording(patient_id: int, db: Session = Depends(get_db)):
    """Get the latest voice recording (audio file path) for a patient"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Get latest recording
    latest_recording = db.query(VoiceRecording)\
        .filter(VoiceRecording.patient_id == patient_id)\
        .order_by(VoiceRecording.recorded_at.desc())\
        .first()

    if not latest_recording:
        return {
            "patient_id": patient_id,
            "recording": None,
            "message": "No voice recordings found for this patient"
        }

    return {
        "patient_id": patient_id,
        "recording": {
            "id": latest_recording.id,
            "audio_file_name": latest_recording.audio_file_name,
            "audio_file_path": latest_recording.audio_file_path,
            "recorded_at": latest_recording.recorded_at.isoformat(),
            "duration_seconds": latest_recording.duration_seconds,
            "depression_score": latest_recording.depression_score,
            "anxiety_score": latest_recording.anxiety_score
        }
    }


@app.get("/api/patients/{patient_id}/VAll")
def get_all_voice_recordings(patient_id: int, db: Session = Depends(get_db)):
    """Get all voice recordings (audio file paths) for a patient - list format"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Get all recordings
    recordings = db.query(VoiceRecording)\
        .filter(VoiceRecording.patient_id == patient_id)\
        .order_by(VoiceRecording.recorded_at.desc())\
        .all()

    if not recordings:
        return {
            "patient_id": patient_id,
            "count": 0,
            "recordings": [],
            "message": "No voice recordings found for this patient"
        }

    # Return as list
    recordings_list = [
        {
            "id": rec.id,
            "audio_file_name": rec.audio_file_name,
            "audio_file_path": rec.audio_file_path,
            "recorded_at": rec.recorded_at.isoformat(),
            "duration_seconds": rec.duration_seconds,
            "depression_score": rec.depression_score,
            "anxiety_score": rec.anxiety_score
        }
        for rec in recordings
    ]

    return {
        "patient_id": patient_id,
        "count": len(recordings_list),
        "recordings": recordings_list
    }


@app.get("/api/patients/{patient_id}/vb")
def get_patient_voice_biometrics(patient_id: int, db: Session = Depends(get_db)):
    """Get voice biometrics analysis JSON files for a patient"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Get all recordings with analysis
    recordings = db.query(VoiceRecording)\
        .filter(VoiceRecording.patient_id == patient_id)\
        .order_by(VoiceRecording.recorded_at.desc())\
        .all()

    if not recordings:
        return {
            "patient_id": patient_id,
            "count": 0,
            "analyses": [],
            "message": "No voice analysis found for this patient"
        }

    # Return analysis data for each recording
    analyses = []
    for rec in recordings:
        analysis_data = {
            "recording_id": rec.id,
            "audio_file_name": rec.audio_file_name,
            "recorded_at": rec.recorded_at.isoformat(),
            "analysis_json_path": rec.analysis_json_path,

            # Kintsugi scores
            "kintsugi_scores": {
                "depression": {
                    "score": rec.depression_score,
                    "severity": rec.depression_severity,
                    "raw_score": rec.depression_raw
                },
                "anxiety": {
                    "score": rec.anxiety_score,
                    "severity": rec.anxiety_severity,
                    "raw_score": rec.anxiety_raw
                }
            },

            # Acoustic features (if stored)
            "acoustic_summary": json.loads(rec.acoustic_summary) if rec.acoustic_summary else None,

            "duration_seconds": rec.duration_seconds
        }

        analyses.append(analysis_data)

    return {
        "patient_id": patient_id,
        "patient_name": patient.name,
        "count": len(analyses),
        "analyses": analyses
    }


###
# Voice Biometrics endpoint (Legacy - kept for compatibility)
###
@app.get("/api/patients/{patient_id}/vb/legacy")
def get_patient_voice_biometrics(patient_id: int, db: Session = Depends(get_db)):
    """Get voice biometrics data for a specific patient"""

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )

    # Query voice biometrics from database
    vb = db.query(VoiceBiometrics).filter(VoiceBiometrics.patient_id == patient_id).first()

    # If no voice biometrics record exists, return defaults
    if not vb:
        return {
            "patient_id": patient_id,
            "voice_file_path": None,
            "voice_signature": None,
            "last_analysis": None,
            "status": "not_enrolled"
        }

    return {
        "patient_id": patient_id,
        "voice_file_path": vb.voice_file_path,
        "voice_signature": vb.voice_signature,
        "last_analysis": vb.last_analysis.isoformat() if vb.last_analysis else None,
        "status": "active" if vb.voice_file_path else "pending"
    }
