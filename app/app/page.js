// app/page.js or any other component in your Next.js app
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          {isLoading ? "Syncing records" : `${patients.length} patients loaded`}
        </div>
      </div>
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
              <th className="px-6 py-3">Next Appointment</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={9}>
                  Loading patients...
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td className="px-6 py-8 text-center text-red-500" colSpan={9}>
                  {error}
                </td>
              </tr>
            )}
            {!isLoading && !error && filteredPatients.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={9}>
                  No patients found.
                </td>
              </tr>
            )}
            {!isLoading && !error && filteredPatients.map((patient) => (
              <tr key={patient.id} className="border-b transition hover:bg-slate-50">
                <td className="px-6 py-3 text-gray-600">{patient.mrn}</td>
                <td className="px-6 py-3 text-gray-600">{patient.name}</td>
                <td className="px-6 py-3 text-gray-600">{patient.age}</td>
                <td className="px-6 py-3 text-gray-600">{patient.gender}</td>
                <td className="px-6 py-3 text-gray-600">{patient.lastVisit}</td>
                <td className="px-6 py-3 text-gray-600">{patient.nextAppointment}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                      patient.status === "Active"
                        ? "bg-green-200 text-green-800"
                        : patient.status === "Follow-up"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">{patient.phone}</td>
                <td className="px-6 py-3 text-center">
                  <Link
                    href={`/patients/${patient.id}`}
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
