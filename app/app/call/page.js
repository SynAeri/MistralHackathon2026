"use client";

import { useState } from "react";

export default function CallPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleCallRequest() {
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedPhone) {
      setFeedback("Enter a phone number before starting the call.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback("");

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiBaseUrl}/api/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: trimmedPhone,
        }),
      });

      if (!response.ok) {
        throw new Error("Call request failed.");
      }
      print(trimmedPhone);

      setFeedback(`Call request sent for ${trimmedPhone}.`);
    } catch {
      setFeedback("Unable to send the call request right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f6fbff_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">
            Call Page
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Start a Call</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter a phone number below, then use the call button at the bottom.
          </p>
        </div>

        <div className="mt-10">
          <label
            htmlFor="phone-number"
            className="mb-3 block text-sm font-medium uppercase tracking-[0.12em] text-slate-500"
          >
            Phone Number
          </label>
          <input
            id="phone-number"
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="mt-auto flex flex-col items-center justify-center pt-12">
          <button
            type="button"
            onClick={handleCallRequest}
            disabled={isSubmitting}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 text-3xl text-white shadow-[0_16px_30px_rgba(59,130,246,0.3)] transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
            aria-label={phoneNumber ? `Call ${phoneNumber}` : "Call"}
          >
            &#128222;
          </button>
          <p className="mt-4 text-sm font-medium text-slate-500">
            {isSubmitting
              ? "Sending call request..."
              : phoneNumber
              ? `Ready to call ${phoneNumber}`
              : "Enter a phone number to begin"}
          </p>
          {feedback && (
            <p className="mt-3 text-center text-sm font-medium text-slate-600">{feedback}</p>
          )}
        </div>
      </div>
    </main>
  );
}
