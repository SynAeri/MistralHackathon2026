// app/page.js or any other component in your Next.js app
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PATIENT_CACHE_TTL_MS = 60 * 1000;
let patientCache = {
  data: null,
  timestamp: 0,
};

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

function getStatusBadgeClasses(status) {
  if (status === "Review") {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return "text-slate-700";
}

function HomeContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedMrn, setAddedMrn] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "mrn",
    direction: "asc",
  });
  const router = useRouter();

  useEffect(() => {
    let isCancelled = false;
    const currentAddedMrn =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("added")
        : null;

    if (currentAddedMrn) {
      setAddedMrn(currentAddedMrn);
    }

    async function loadPatients() {
      const isCacheFresh =
        patientCache.data &&
        Date.now() - patientCache.timestamp < PATIENT_CACHE_TTL_MS;

      if (!currentAddedMrn && isCacheFresh) {
        setPatients(patientCache.data);
        setIsLoading(false);
        setError("");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${apiBaseUrl}/api/patients`);

        if (!response.ok) {
          throw new Error("Unable to load patients from backend.");
        }

        const data = await response.json();
        const normalizedPatients = data.map(normalizePatient);

        if (!isCancelled) {
          patientCache = {
            data: normalizedPatients,
            timestamp: Date.now(),
          };
          setPatients(normalizedPatients);
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
      window.history.replaceState({}, "", "/");
      setAddedMrn("");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [addedMrn]);

  // Filter patients based on search term
  const filteredPatients = patients
    .filter((patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((left, right) => {
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortConfig.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      const normalizedLeft = String(leftValue ?? "").toLowerCase();
      const normalizedRight = String(rightValue ?? "").toLowerCase();
      const comparison = normalizedLeft.localeCompare(normalizedRight, undefined, {
        numeric: true,
      });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

  function handleSort(sortKey) {
    setSortConfig((current) => ({
      key: sortKey,
      direction:
        current.key === sortKey && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }

  function renderSortableHeader(label, sortKey, align = "text-left") {
    const isActive = sortConfig.key === sortKey;
    const arrow = isActive ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕";

    return (
      <th className={`px-6 py-3 ${align}`}>
        <button
          type="button"
          onClick={() => handleSort(sortKey)}
          className="inline-flex items-center gap-2 font-semibold text-white transition hover:text-white"
        >
          <span>{label}</span>
          <span className="text-xs">{arrow}</span>
        </button>
      </th>
    );
  }

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
              {renderSortableHeader("Last Visit", "lastVisit")}
              {renderSortableHeader("Last Engagement", "lastVisit")}
              {renderSortableHeader("Next Appointment", "nextAppointment")}
              {renderSortableHeader("Status", "status")}
              {renderSortableHeader("Risk", "risk")}
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={11}>
                  Loading patients...
                </td>
              </tr>
            )}
            {!isLoading && error && (
              <tr>
                <td className="px-6 py-8 text-center text-red-500" colSpan={11}>
                  {error}
                </td>
              </tr>
            )}
            {!isLoading && !error && filteredPatients.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={11}>
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
                    className={`inline-block min-w-24 px-3 py-1 text-center text-sm font-semibold ${getStatusBadgeClasses(
                      patient.status
                    )}`}
                  >
                    {patient.status}
                  </span>
                </td>
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
                    className="inline-flex items-center justify-center text-base font-semibold text-blue-600 transition hover:text-blue-700"
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

export default function Home() {
  return <HomeContent />;
}
