#!/usr/bin/env python3
"""
Seed the database with sample patients for testing
Run: python seed_patients.py
"""
import random
from main import SessionLocal, Patient, Diagnosis, Engagement, VoiceBiometrics, Base, engine
from datetime import datetime

def seed_patients():
    """Add sample patients to the database."""

    db = SessionLocal()

    try:
        # Check if patients already exist
        try:
            existing_count = db.query(Patient).count()
        except Exception as schema_e:
            # If this fails, the schema is likely out of sync.
            # WE MUST ROLLBACK THE FAILED TRANSACTION HERE!
            db.rollback() 
            print(f"⚠️  Database schema mismatch detected: {schema_e}")
            existing_count = 0

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
            
        # ... the rest of your seeding loop ...

        # Sample patients with realistic data (MRNs removed, generated dynamically below)
        patients_data = [
            {
                "name": "Sarah Johnson",
                "age": 34,
                "gender": "F",
                "phone": "+61412345678",
                "last_visit": "2026-02-25",
                "next_appointment": "2026-03-10",
                "status": "Active",
                "risk": "High",
                "diagnoses": [
                    {"diagnosis": "Depression", "risk": "medium"},
                    {"diagnosis": "Depression (Mild)", "risk": "lower"}
                ]
            },
            {
                "name": "Elijah Tan",
                "age": 45,
                "gender": "M",
                "phone": "+61407123456",
                "last_visit": "2026-02-20",
                "next_appointment": "2026-03-05",
                "status": "Active",
                "risk": "Medium",
                "diagnoses": [
                    {"diagnosis": "Depression", "risk": "high"},
                    {"diagnosis": "Insomnia", "risk": "medium"}
                ]
            },
            {
                "name": "Emily Rodriguez",
                "age": 28,
                "gender": "F",
                "phone": "+61411987654",
                "last_visit": "2026-02-28",
                "next_appointment": "-",
                "status": "Follow-up",
                "risk": "Low",
                "diagnoses": [
                    {"diagnosis": "Depression", "risk": "medium"}
                ]
            },
            {
                "name": "David Park",
                "age": 52,
                "gender": "M",
                "phone": "+61408765432",
                "last_visit": "2026-01-15",
                "next_appointment": "2026-03-20",
                "status": "Pending",
                "risk": "Undetermined",
                "diagnoses": [
                    {"diagnosis": "Depression", "risk": "high"},
                    {"diagnosis": "Depression", "risk": "medium"}
                ]
            },
            {
                "name": "Jennifer Martinez",
                "age": 41,
                "gender": "F",
                "phone": "+61419876543",
                "last_visit": "2026-02-26",
                "next_appointment": "2026-03-12",
                "status": "Active",
                "risk": "Low",
                "diagnoses": [
                    {"diagnosis": "Depression", "risk": "high"}
                ]
            },
            {
                "name": "Robert Taylor",
                "age": 37,
                "gender": "M",
                "phone": "+61402654321",
                "last_visit": "2026-02-15",
                "next_appointment": "-",
                "status": "Follow-up",
                "risk": "Low",
                "diagnoses": [
                    {"diagnosis": "Depression", "risk": "medium"}
                ]
            }
        ]

        print(f"\nAdding {len(patients_data)} patients...")

        for patient_data in patients_data:
            # Extract diagnoses
            diagnoses_data = patient_data.pop("diagnoses", [])
            
            # Generate a realistic random MRN (e.g., MRN-1234567)
            random_mrn = f"MRN-{random.randint(1000000, 9999999)}"
            patient_data["mrn"] = random_mrn

            # Create patient
            patient = Patient(**patient_data)
            db.add(patient)
            db.flush()  # Get patient.id

            # Add diagnoses
            for diag_data in diagnoses_data:
                diagnosis = Diagnosis(
                    patient_id=patient.id,
                    diagnosis=diag_data["diagnosis"],
                    risk=diag_data["risk"]
                )
                db.add(diagnosis)

            # Generate random engagement metrics
            # Total calls between 1 and 20 to ensure unpicked can always be strictly less
            random_total_calls = random.randint(1, 20)
            random_unpicked_calls = random.randint(0, random_total_calls - 1)

            # Add engagement metrics
            engagement = Engagement(
                patient_id=patient.id,
                total_calls=random_total_calls,
                calls_unpicked=random_unpicked_calls
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

            print(f"  ✓ {patient.name} ({patient.mrn})")

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
