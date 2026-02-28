"use client";

import { useState } from "react";

export default function SendConfirmationButton() {
  const [isSent, setIsSent] = useState(false);

  function handleClick() {
    setIsSent(true);
    window.alert("Confirmation sent to the patient for the requested appointment time.");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`mt-14 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(59,130,246,0.28)] transition ${
        isSent ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"
      }`}
    >
      {isSent ? "Confirmation Sent" : "Send Confirmation"}
    </button>
  );
}
