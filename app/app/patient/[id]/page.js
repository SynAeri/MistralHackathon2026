import Link from "next/link";

function normalizePatient(patient) {
  return {
    id: patient.id,
    mrn: patient.mrn,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    lastVisit: patient.last_visit ?? "-",
    nextAppointment: patient.next_appointment ?? "-",
    status: patient.status,
    phone: patient.phone,
  };
}

export default async function PatientDetailPage({ params }) {
  const { id } = params;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const response = await fetch(`${apiBaseUrl}/api/patients/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-800">Patient not found</h1>
          <p className="mt-3 text-slate-600">No patient matches ID {id}.</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Back to patient list
          </Link>
        </div>
      </main>
    );
  }

  const patient = normalizePatient(await response.json());

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              Patient Detail
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">{patient.name}</h1>
            <p className="mt-2 text-slate-500">MRN: {patient.mrn}</p>
          </div>
          <Link
            href="/"
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Back to list
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DetailCard label="Age" value={`${patient.age}`} />
          <DetailCard label="Gender" value={patient.gender} />
          <DetailCard label="Phone" value={patient.phone} />
          <DetailCard label="Status" value={patient.status} />
          <DetailCard label="Last Visit" value={patient.lastVisit} />
          <DetailCard label="Next Appointment" value={patient.nextAppointment} />
        </div>
      </div>
    </main>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}
