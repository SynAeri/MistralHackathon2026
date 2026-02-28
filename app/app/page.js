// app/page.js or any other component in your Next.js app
"use client";
import Link from "next/link";
import { useState } from "react";
import { patients } from "./data/patients";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-white">
    <div className="p-6 bg-white">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-600">Patient List</h1>
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
            {filteredPatients.map((patient) => (
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
                    href={`/patient/${patient.id}`}
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
