#!/usr/bin/env python3
"""
Seed the database with sample patients for testing
Run: python seed_patients.py
"""
from main import SessionLocal, Patient, Diagnosis, Engagement, VoiceBiometrics, Base, engine
from datetime import datetime

def seed_patients():
    """Add sample patients to the database."""

    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if patients already exist
        existing_count = db.query(Patient).count()
        if existing_count > 0:
            print(f"⚠️  Database already has {existing_count} patients")
            response = input("Clear and reseed? (y/N): ")
            if response.lower() != 'y':
                print("Cancelled.")
                return

            # Clear existing data
            db.query(VoiceBiometrics).delete()
            db.query(Engagement).delete()
            db.query(Diagnosis).delete()
            db.query(Patient).delete()
            db.commit()
            print("✓ Cleared existing patients")

        # Sample patients with realistic data
        patients_data = [
            {
                "mrn": "MRN001",
                "name": "Sarah Johnson",
                "age": 34,
                "gender": "F",
                "phone": "+1234567890",
                "last_visit": "2026-02-25",
                "next_appointment": "2026-03-10",
                "status": "Active",
                "diagnoses": [
                    {"diagnosis": "Generalized Anxiety Disorder", "status": "medium"},
                    {"diagnosis": "Depression (Mild)", "status": "lower"}
                ]
            },
            {
                "mrn": "MRN002",
                "name": "Michael Chen",
                "age": 45,
                "gender": "M",
                "phone": "+1234567891",
                "last_visit": "2026-02-20",
                "next_appointment": "2026-03-05",
                "status": "Follow-up",
                "diagnoses": [
                    {"diagnosis": "PTSD", "status": "high"},
                    {"diagnosis": "Insomnia", "status": "medium"}
                ]
            },
            {
                "mrn": "MRN003",
                "name": "Emily Rodriguez",
                "age": 28,
                "gender": "F",
                "phone": "+1234567892",
                "last_visit": "2026-02-28",
                "next_appointment": "-",
                "status": "Active",
                "diagnoses": [
                    {"diagnosis": "Social Anxiety", "status": "medium"}
                ]
            },
            {
                "mrn": "MRN004",
                "name": "David Park",
                "age": 52,
                "gender": "M",
                "phone": "+1234567893",
                "last_visit": "2026-01-15",
                "next_appointment": "2026-03-20",
                "status": "Pending",
                "diagnoses": [
                    {"diagnosis": "Bipolar Disorder", "status": "high"},
                    {"diagnosis": "Anxiety", "status": "medium"}
                ]
            },
            {
                "mrn": "MRN005",
                "name": "Jennifer Martinez",
                "age": 41,
                "gender": "F",
                "phone": "+1234567894",
                "last_visit": "2026-02-26",
                "next_appointment": "2026-03-12",
                "status": "Active",
                "diagnoses": [
                    {"diagnosis": "Depression (Moderate)", "status": "high"}
                ]
            },
            {
                "mrn": "MRN006",
                "name": "Robert Taylor",
                "age": 37,
                "gender": "M",
                "phone": "+1234567895",
                "last_visit": "2026-02-15",
                "next_appointment": "-",
                "status": "Active",
                "diagnoses": [
                    {"diagnosis": "Panic Disorder", "status": "medium"}
                ]
            }
        ]

        print(f"\nAdding {len(patients_data)} patients...")

        for patient_data in patients_data:
            # Extract diagnoses
            diagnoses_data = patient_data.pop("diagnoses", [])

            # Create patient
            patient = Patient(**patient_data)
            db.add(patient)
            db.flush()  # Get patient.id

            # Add diagnoses
            for diag_data in diagnoses_data:
                diagnosis = Diagnosis(
                    patient_id=patient.id,
                    diagnosis=diag_data["diagnosis"],
                    status=diag_data["status"]
                )
                db.add(diagnosis)

            # Add engagement metrics
            engagement = Engagement(
                patient_id=patient.id,
                total_calls=0,
                calls_unpicked=0
            )
            db.add(engagement)

            # Add voice biometrics placeholder
            voice_biometrics = VoiceBiometrics(
                patient_id=patient.id,
                voice_file_path=None,
                voice_signature=None,
                last_analysis=None
            )
            db.add(voice_biometrics)

            print(f"  ✓ {patient.name} ({patient.phone})")

        db.commit()

        print("\n" + "="*60)
        print("✅ Database seeded successfully!")
        print("="*60)
        print(f"\nTotal patients: {db.query(Patient).count()}")
        print("\nYou can now:")
        print("  • Start FastAPI: uvicorn main:app --reload")
        print("  • Test GET /api/patients")
        print("  • Connect your frontend")

    except Exception as e:
        db.rollback()
        print(f"\n✗ Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_patients()
