"use client";

import { useState } from "react";

export default function AddPatientPage() {
  const [mrn, setMrn] = useState("");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf7fb_0%,#eef7f4_100%)] px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-[0_18px_42px_rgba(44,62,80,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">
          Add Patient
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Enter MRN Number</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Start a new patient record by entering the medical record number.
        </p>

        <div className="mt-8">
          <label
            htmlFor="mrn"
            className="mb-3 block text-sm font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            MRN Number
          </label>
          <input
            id="mrn"
            type="text"
            placeholder="Enter MRN"
            value={mrn}
            onChange={(event) => setMrn(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.18)] transition hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}
