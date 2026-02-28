"""
Seed patient data into the database
Run this script to populate initial patient records from the frontend data
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from main import Patient, Diagnosis, Engagement, VoiceBiometrics, SessionLocal, engine, Base
import secrets
from datetime import datetime, timedelta
import random

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Sample patient data (matches frontend data)
SAMPLE_PATIENTS = [
    {
        "mrn": "MRN-1001",
        "name": "Sarah Johnson",
        "age": 45,
        "gender": "F",
        "last_visit": "2026-02-25",
        "next_appointment": "2026-03-15",
        "status": "Active",
        "phone": "555-0101",
    },
    {
        "mrn": "MRN-1002",
        "name": "Michael Chen",
        "age": 62,
        "gender": "M",
        "last_visit": "2026-02-27",
        "next_appointment": "2026-03-01",
        "status": "Follow-up",
        "phone": "555-0102",
    },
    {
        "mrn": "MRN-1003",
        "name": "Emily Rodriguez",
        "age": 34,
        "gender": "F",
        "last_visit": "2026-02-20",
        "next_appointment": "2026-03-20",
        "status": "Active",
        "phone": "555-0103",
    },
    {
        "mrn": "MRN-1004",
        "name": "James Williams",
        "age": 55,
        "gender": "M",
        "last_visit": "2026-02-28",
        "next_appointment": "-",
        "status": "Pending",
        "phone": "555-0104",
    },
    {
        "mrn": "MRN-1005",
        "name": "Patricia Brown",
        "age": 71,
        "gender": "F",
        "last_visit": "2026-02-26",
        "next_appointment": "2026-03-05",
        "status": "Follow-up",
        "phone": "555-0105",
    },
    {
        "mrn": "MRN-1006",
        "name": "David Martinez",
        "age": 28,
        "gender": "M",
        "last_visit": "2026-02-15",
        "next_appointment": "2026-04-15",
        "status": "Active",
        "phone": "555-0106",
    },
]

# Sample diagnoses data (per patient)
SAMPLE_DIAGNOSES = {
    "MRN-1001": [
        {"diagnosis": "Depression", "status": "high", "triggered_alerts": "Blood pressure reading exceeded 140/90 on last visit"},
        {"diagnosis": "Depression", "status": "medium", "triggered_alerts": "HbA1c levels slightly elevated at 7.2%"},
    ],
    "MRN-1002": [
        {"diagnosis": "Depression", "status": "high", "triggered_alerts": "Requires close monitoring, scheduled stress test"},
        {"diagnosis": "Depression", "status": "medium", "triggered_alerts": "LDL cholesterol at 145 mg/dL"},
        {"diagnosis": "Depression", "status": "lower", "triggered_alerts": "No recent alerts"},
    ],
    "MRN-1003": [
        {"diagnosis": "Depression", "status": "medium", "triggered_alerts": "Recent rescue inhaler usage increased"},
        {"diagnosis": "Depression", "status": "lower", "triggered_alerts": "No recent alerts"},
    ],
    "MRN-1004": [
        {"diagnosis": "Depression", "status": "medium", "triggered_alerts": "Pain level reported at 6/10"},
        {"diagnosis": "Depression", "status": "high", "triggered_alerts": "BMI 34.2 - weight management plan initiated"},
    ],
    "MRN-1005": [
        {"diagnosis": "Depression", "status": "high", "triggered_alerts": "Joint inflammation worsening, considering medication adjustment"},
        {"diagnosis": "Depression", "status": "medium", "triggered_alerts": "Bone density scan scheduled"},
        {"diagnosis": "Depression", "status": "lower", "triggered_alerts": "TSH levels stable"},
    ],
    "MRN-1006": [
        {"diagnosis": "Depression", "status": "medium", "triggered_alerts": "Follow-up therapy session recommended"},
    ],
}

# Sample engagement data (per patient MRN)
SAMPLE_ENGAGEMENT = {
    "MRN-1001": {"total_calls": 15, "calls_unpicked": 2},
    "MRN-1002": {"total_calls": 22, "calls_unpicked": 5},
    "MRN-1003": {"total_calls": 18, "calls_unpicked": 1},
    "MRN-1004": {"total_calls": 10, "calls_unpicked": 6},
    "MRN-1005": {"total_calls": 25, "calls_unpicked": 3},
    "MRN-1006": {"total_calls": 12, "calls_unpicked": 0},
}

def seed_patients():
    """Seed patient data into the database"""
    db = SessionLocal()

    try:
        # Check if patients already exist
        existing_count = db.query(Patient).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} patients")
            response = input("Do you want to clear and reseed? (yes/no): ")
            if response.lower() != "yes":
                print("Seeding cancelled")
                return

            # Clear existing data (cascades will handle related records)
            db.query(Patient).delete()
            db.commit()
            print("Cleared existing patients and related data")

        # Add sample patients
        for patient_data in SAMPLE_PATIENTS:
            patient = Patient(**patient_data)
            db.add(patient)

        db.commit()
        print(f"✅ Successfully seeded {len(SAMPLE_PATIENTS)} patients!")

        # Seed diagnoses for each patient
        print("\n🩺 Seeding diagnoses...")
        for patient in db.query(Patient).all():
            if patient.mrn in SAMPLE_DIAGNOSES:
                for diag_data in SAMPLE_DIAGNOSES[patient.mrn]:
                    diagnosis = Diagnosis(
                        patient_id=patient.id,
                        diagnosis=diag_data["diagnosis"],
                        status=diag_data["status"],
                        triggered_alerts=diag_data["triggered_alerts"]
                    )
                    db.add(diagnosis)
        db.commit()
        print(f"Seeded diagnoses for patients!")

        # Seed engagement data for each patient
        print("\nSeeding engagement data...")
        for patient in db.query(Patient).all():
            if patient.mrn in SAMPLE_ENGAGEMENT:
                engagement_data = SAMPLE_ENGAGEMENT[patient.mrn]
                engagement = Engagement(
                    patient_id=patient.id,
                    total_calls=engagement_data["total_calls"],
                    calls_unpicked=engagement_data["calls_unpicked"]
                )
                db.add(engagement)
        db.commit()
        print(f"Seeded engagement data for patients!")

        # Seed voice biometrics for each patient
        print("\nSeeding voice biometrics...")
        for patient in db.query(Patient).all():
            # Generate mock voice data
            voice_file_path = f"voice_data/patient_{patient.id}_{patient.mrn}_sample.wav"
            voice_signature = f"vb_sig_{patient.id}_" + secrets.token_hex(8)
            last_analysis = datetime.utcnow() - timedelta(days=random.randint(1, 30))

            vb = VoiceBiometrics(
                patient_id=patient.id,
                voice_file_path=voice_file_path,
                voice_signature=voice_signature,
                last_analysis=last_analysis
            )
            db.add(vb)
        db.commit()
        print(f"Seeded voice biometrics for patients!")

        # Display seeded patients with summary
        print("\nSeeded Patients Summary:")
        print("-" * 100)
        for patient in db.query(Patient).all():
            diag_count = db.query(Diagnosis).filter(Diagnosis.patient_id == patient.id).count()
            engagement = db.query(Engagement).filter(Engagement.patient_id == patient.id).first()
            call_pct = 0.0
            if engagement and engagement.total_calls > 0:
                call_pct = ((engagement.total_calls - engagement.calls_unpicked) / engagement.total_calls) * 100

            print(f"  {patient.id}. {patient.mrn} - {patient.name} ({patient.gender}, {patient.age}y)")
            print(f"      Status: {patient.status} | Diagnoses: {diag_count} | Call Rate: {call_pct:.1f}%")
        print("-" * 100)

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Seeding patient data...\n")
    seed_patients()
