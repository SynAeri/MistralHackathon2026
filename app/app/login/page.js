"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      router.push("/");
    }, 250);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf7fb_0%,#eef7f4_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_42px_rgba(44,62,80,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f4fbff_0%,#eef8f4_100%)] p-8 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Doctor Access
            </div>

            <div className="mt-10">
              <h1 className="max-w-md text-3xl font-bold tracking-[-0.04em] text-slate-800 md:text-4xl">
                Secure access to patient care tools.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                Sign in to review patient records, monitor risk, and manage follow-up workflows in
                the same clinical dashboard used across this application.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <SimpleInfo
                title="Care Monitoring"
                text="Access diagnoses, engagement trends, and recent check-ins in one place."
              />
              <SimpleInfo
                title="Protected Sessions"
                text="Use authorized doctor credentials to enter the clinical workspace securely."
              />
            </div>

            <div className="mt-auto pt-10">
              <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Access Notice
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  This portal is for authorized doctors. Session activity may be monitored to
                  protect patient privacy and support clinical compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-8 md:p-10">
          <div className="w-full max-w-md">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-600">
                Doctor Login
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-800">
                Sign in to continue
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Use your doctor credentials to access the monitoring dashboard and patient follow-up
                tools.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Field
                id="username"
                label="Username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={setUsername}
                error={errors.username}
              />
              <Field
                id="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                error={errors.password}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600" />
                  Keep session active
                </label>
                <button type="button" className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5a4_0%,#2563eb_100%)] px-5 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.18)] transition hover:shadow-[0_18px_32px_rgba(37,99,235,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Access Dashboard"}
              </button>
            </form>

            <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Support
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                If you cannot access your account, contact your clinic administrator or internal IT
                support for credential assistance.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ id, label, type, placeholder, value, onChange, error }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block text-sm font-semibold uppercase tracking-[0.14em] text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border bg-white px-5 py-4 text-base text-slate-800 outline-none transition focus:ring-4 ${
          error
            ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
            : "border-slate-300 focus:border-teal-400 focus:ring-cyan-100"
        }`}
      />
      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}

function SimpleInfo({ title, text }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}
