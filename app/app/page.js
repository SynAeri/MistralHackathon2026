// app/page.js or any other component in your Next.js app
"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function normalizePatient(patient) {
  const fallbackRiskByStatus = {
    Active: "Low",
    "Follow-up": "Medium",
    Pending: "High",
  };

  return {
    id: patient.id,
    mrn: patient.mrn,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    lastVisit: patient.last_visit ?? "-",
    nextAppointment: patient.next_appointment ?? "-",
    risk: patient.risk ?? fallbackRiskByStatus[patient.status] ?? "Undetermined",
    status: patient.status,
    phone: patient.phone,
  };
}

function getRiskBadgeClasses(risk) {
  if (risk === "High") {
    return "border border-rose-200 bg-rose-100 text-rose-700";
  }

  if (risk === "Medium") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }

  if (risk === "Low") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  return "border border-violet-200 bg-violet-100 text-violet-700";
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const addedMrn = searchParams.get("added");

  useEffect(() => {
    let isCancelled = false;

    async function loadPatients() {
      try {
        setIsLoading(true);
        setError("");

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${apiBaseUrl}/api/patients`);

        if (!response.ok) {
          throw new Error("Unable to load patients from backend.");
        }

        const data = await response.json();

        if (!isCancelled) {
          setPatients(data.map(normalizePatient));
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message || "Unable to load patients from backend.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPatients();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!addedMrn) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace("/");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [addedMrn, router]);

  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-white">
    <div className="p-6 bg-white">
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">
            Care Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold text-left text-gray-700">Patient List</h1>
          <p className="mt-2 text-sm text-gray-500">
            Review recent visits, upcoming appointments, and open each record for more detail.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Link
            href="/add-patient"
            className="inline-flex items-center rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            Add Patient
          </Link>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            {isLoading ? "Syncing records" : `${patients.length} patients loaded`}
          </div>
        </div>
      </div>
      {addedMrn && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Patient added successfully with MRN {addedMrn}.
        </div>
      )}
      <div className="mb-6 flex justify-center rounded-md bg-white p-3">
        <input
          type="text"
          placeholder="Search by name, MRN, or phone..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
        <table className="min-w-full table-auto rounded-2xl bg-white">
          <thead>
            <tr className="bg-blue-400 text-left">
              <th className="px-6 py-3">MRN</th>
              <th className="px-6 py-3">Patient Name</th>
              <th className="px-6 py-3">Age</th>
              <th className="px-6 py-3">Gender</th>
              <th className="px-6 py-3">Last Visit</th>
              <th className="px-6 py-3">Last Engagement</th>
              <th className="px-6 py-3">Next Appointment</th>
              <th className="px-6 py-3">Risk</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={10}>
                  Loading patients...
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td className="px-6 py-8 text-center text-red-500" colSpan={10}>
                  {error}
                </td>
              </tr>
            )}
            {!isLoading && !error && filteredPatients.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={10}>
                  No patients found.
                </td>
              </tr>
            )}
            {!isLoading && !error && filteredPatients.map((patient) => (
              <tr
                key={patient.id}
                className="cursor-pointer border-b transition hover:bg-slate-50"
                onClick={() => router.push(`/patients/${patient.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/patients/${patient.id}`);
                  }
                }}
                tabIndex={0}
              >
                <td className="px-6 py-3 text-gray-600">{patient.mrn}</td>
                <td className="px-6 py-3 text-gray-600">{patient.name}</td>
                <td className="px-6 py-3 text-gray-600">{patient.age}</td>
                <td className="px-6 py-3 text-gray-600">{patient.gender}</td>
                <td className="px-6 py-3 text-gray-600">{patient.lastVisit}</td>
                <td className="px-6 py-3 text-gray-600">{patient.lastVisit}</td>
                <td className="px-6 py-3 text-gray-600">{patient.nextAppointment}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block min-w-28 rounded-full px-3 py-1 text-center text-sm font-semibold ${getRiskBadgeClasses(
                      patient.risk
                    )}`}
                  >
                    {patient.risk}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">{patient.phone}</td>
                <td className="px-6 py-3 text-center">
                  <Link
                    href={`/patients/${patient.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-lg font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                    aria-label={`View details for ${patient.name}`}
                  >
                    &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
