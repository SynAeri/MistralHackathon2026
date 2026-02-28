import Link from "next/link";
import AudioRecordingControl from "./AudioRecordingControl";
import SendConfirmationButton from "./SendConfirmationButton";

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

function buildUiModel(patient) {
  const diagnoses = ["Depression", "Anxiety", "Mood Disorder", "Stress Response"];
  const assignedClinicians = [
    "Dr. William Carter",
    "Dr. Maya Singh",
    "Dr. Elena Brooks",
    "Dr. Daniel Kim", 
  ];
  const transcriptMap = [
    "I barely made it through the call today. Everything feels heavy, work keeps piling up, and I have been skipping medication some days because I forget or because it just feels pointless.",
    "My sleep has been inconsistent this week. I keep waking up early, missing routine check-ins, and I do not feel like I have fully recovered from the last episode.",
    "I am keeping up with some of the plan, but the last few days have been rough. I canceled one appointment, avoided calls, and felt more withdrawn than usual.",
    "The good days feel shorter right now. I can still manage basic tasks, but I notice less energy, slower speech, and less motivation to respond to people.",
  ];
  const index = patient.id % diagnoses.length;
  const completion = Math.max(62, 94 - patient.id * 2);
  const streak = patient.id % 3 === 0 ? 2 : 1;

  return {
    diagnosis: diagnoses[index],
    assignedClinician: assignedClinicians[index],
    updatedAt: "February 28, 2026",
    requestedDate: patient.nextAppointment === "-" ? "March 5, 2026" : patient.nextAppointment,
    requestedTime: "2:30 PM",
    latestCheckInDate: "Apr 22, 2024, 4:05PM",
    duration: "65 seconds",
    transcript: transcriptMap[index],
    completion,
    callLabel: "12/14 calls",
    missedStreak: streak,
    symptomDelta: "+22% vs baseline",
    biomarkers: [
      {
        title: "Speech Duration",
        value: "2.3",
        unit: "s",
        delta: "+0.8s vs baseline",
        badge: "Alert",
        tone: "red",
        yLabel: "Seconds",
        yTicks: ["0", "0.6", "1.2", "1.8", "2.4"],
        xTicks: ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Day 13", "Day 17"],
        baseline: 1.6,
        max: 2.4,
        points: [1.2, 1.25, 1.5, 1.4, 1.65, 1.85, 2.05, 2.3],
      },
      {
        title: "Speech Rate",
        value: "34",
        unit: "%",
        delta: "+12% vs baseline",
        badge: "Monitor",
        tone: "amber",
        yLabel: "Percentage",
        yTicks: ["0", "9", "18", "27", "36"],
        xTicks: ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Day 13", "Day 17"],
        baseline: 27,
        max: 36,
        points: [20, 22, 23, 25, 27, 28, 30, 34],
      },
      {
        title: "Intensity",
        value: "118",
        unit: "wpm",
        delta: "-24 vs baseline",
        badge: "Alert",
        tone: "red",
        yLabel: "WPM",
        yTicks: ["80", "120", "160"],
        xTicks: ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Day 13", "Day 17"],
        baseline: 130,
        max: 160,
        min: 80,
        points: [142, 140, 138, 135, 132, 128, 122, 118],
      },
      {
        title: "Variability",
        value: "68",
        unit: "Hz",
        delta: "Stable",
        badge: "Within normal range",
        tone: "green",
        yLabel: "Hz",
        yTicks: ["50", "75", "100"],
        xTicks: ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 11", "Day 13", "Day 17"],
        baseline: 75,
        max: 100,
        min: 50,
        points: [85, 84, 82, 80, 78, 74, 71, 68],
      },
    ],
  };
}

export default async function PatientDetailPage({ params }) {
  const { id } = await params;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  let response;

  try {
    response = await fetch(`${apiBaseUrl}/api/patients/${id}`, {
      cache: "no-store",
    });
  } catch {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-800">Backend unavailable</h1>
          <p className="mt-3 text-slate-600">
            The patient detail page could not reach the backend at {apiBaseUrl}. Make sure the
            FastAPI server is running on port 8000, then refresh this page.
          </p>
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

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-800">Patient not found</h1>
          <p className="mt-3 text-slate-600">
            No patient matches ID {id}. Check that the backend is running and the record exists.
          </p>
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
  const ui = buildUiModel(patient);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf7fb_0%,#eef7f4_100%)] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
          >
            Back to patient list
          </Link>
        </div>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-[0_14px_40px_rgba(44,62,80,0.08)] md:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-800 md:text-4xl">
                {patient.name}
              </h1>
              <div className="mt-5 flex flex-wrap gap-x-10 gap-y-3 text-lg text-slate-600">
                <p>DOB: 08/12/1985 (Age {patient.age})</p>
                <p>MRN: {patient.mrn}</p>
                <p>{patient.phone}</p>
              </div>
            </div>
            <div className="text-left text-base text-slate-500 lg:text-right">
              <p>
                Assigned: <span className="font-medium text-slate-700">{ui.assignedClinician}</span>
              </p>
              <p className="mt-2">Updated: {ui.updatedAt}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-[0_14px_40px_rgba(44,62,80,0.08)]">
              <div className="flex flex-wrap items-center gap-5 border-b border-slate-200 pb-6 text-slate-700">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl font-bold text-amber-600">
                  !
                </div>
                <p className="text-xl">
                  Diagnosis: <span className="font-semibold text-slate-800">{ui.diagnosis}</span>
                </p>
                <div className="hidden h-10 w-px bg-slate-200 md:block" />
                <div className="flex items-center gap-4 text-xl">
                  <span>Status:</span>
                  <span className="rounded-full border border-amber-400 bg-amber-50 px-5 py-1.5 text-base font-semibold tracking-[0.08em] text-amber-700">
                    MONITOR
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-5">
                  <div className="rounded-[1.6rem] border border-amber-300 bg-amber-50 p-6">
                    <h2 className="text-xl font-semibold text-slate-800">Triggered Alerts:</h2>
                    <ul className="mt-4 space-y-3 text-base leading-7 text-slate-700">
                      <li>• Symptom score {ui.symptomDelta}</li>
                      <li>• Speech rate decreased significantly</li>
                      <li>• Missed 2 consecutive check-ins</li>
                    </ul>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-lg font-semibold text-slate-800">Last Action</p>
                    <p className="mt-4 text-xl font-semibold text-slate-800">Scheduled follow-up call</p>
                    <p className="mt-2 text-base text-slate-600">By: {ui.assignedClinician}</p>
                    <p className="mt-1 text-base text-slate-600">
                      Due: <span className="font-semibold text-orange-600">2026-03-02</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-sky-200 bg-sky-50/80 p-6">
                  <div className="space-y-8">
                    <InfoRow label="Requested Appointment Date" value={ui.requestedDate} />
                    <InfoRow label="Requested Time" value={ui.requestedTime} />
                  </div>
                  <SendConfirmationButton />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-[0_14px_40px_rgba(44,62,80,0.08)]">
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-800">
                Engagement &amp; Adherence
              </h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <MetricCard
                  label="Call Completion (14d)"
                  value={`${ui.completion}%`}
                  detail={ui.callLabel}
                  tone="green"
                />
                <MetricCard
                  label="Missed Call Streak"
                  value={`${ui.missedStreak}`}
                  detail="consecutive"
                  tone="rose"
                />
              </div>
            </section>
          </div>

          <aside className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-[0_14px_40px_rgba(44,62,80,0.08)]">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-800">Latest Check-In</h2>
            <div className="mt-8 space-y-6 text-slate-700">
              <InfoRow label="Date & Time" value={ui.latestCheckInDate} />
              <InfoRow label="Duration" value={ui.duration} />

              <div>
                <p className="text-xl font-medium text-slate-500">Audio Recording</p>
                <AudioRecordingControl />
              </div>

              <div>
                <p className="text-xl font-medium text-slate-500">Transcript</p>
                <div className="mt-3 max-h-[26rem] overflow-auto rounded-[1.5rem] bg-slate-50 p-5 text-lg leading-9 text-slate-700">
                  {ui.transcript}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-[0_14px_40px_rgba(44,62,80,0.08)]">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-800">
            Voice Biomarkers (Change vs Baseline)
          </h2>
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {ui.biomarkers.map((item) => (
              <BiomarkerCard key={item.title} item={item} />
            ))}
          </div>
        </section>
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

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-lg font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-800">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, detail, tone }) {
  const styles =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-[1.6rem] border p-6 ${styles}`}>
      <p className="text-lg font-medium">{label}</p>
      <div className="mt-5 flex items-end gap-3">
        <p className="text-5xl font-bold tracking-[-0.04em]">{value}</p>
        <p className="pb-2 text-base">{detail}</p>
      </div>
    </div>
  );
}

function BiomarkerCard({ item }) {
  const toneStyles = {
    red: {
      card: "border-rose-200 bg-rose-50/70",
      badge: "bg-rose-100 text-rose-700",
      value: "text-rose-600",
      line: "#ef4444",
      fill: "rgba(239,68,68,0.12)",
      baseline: "#fca5a5",
    },
    amber: {
      card: "border-amber-200 bg-amber-50/70",
      badge: "bg-amber-100 text-amber-700",
      value: "text-amber-600",
      line: "#f59e0b",
      fill: "rgba(245,158,11,0.12)",
      baseline: "#f7c873",
    },
    green: {
      card: "border-emerald-200 bg-emerald-50/70",
      badge: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-600",
      line: "#10b981",
      fill: "rgba(16,185,129,0.12)",
      baseline: "#6ee7b7",
    },
  };
  const style = toneStyles[item.tone];

  return (
    <div className={`rounded-[1.7rem] border p-6 ${style.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-800">{item.title}</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p className="text-4xl font-bold tracking-[-0.04em] text-slate-800">{item.value}</p>
            <p className="pb-2 text-lg text-slate-500">{item.unit}</p>
            <p className={`pb-2 text-base font-medium ${style.value}`}>{item.delta}</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${style.badge}`}>
          {item.badge}
        </span>
      </div>
      <div className="mt-6">
        <MiniChart
          item={item}
          lineColor={style.line}
          fillColor={style.fill}
          baselineColor={style.baseline}
        />
      </div>
    </div>
  );
}

function MiniChart({ item, lineColor, fillColor, baselineColor }) {
  const width = 520;
  const height = 230;
  const left = 64;
  const right = 18;
  const top = 14;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const min = item.min ?? 0;
  const max = item.max;
  const stepX = chartWidth / (item.points.length - 1);
  const toY = (value) => top + (1 - (value - min) / (max - min)) * chartHeight;
  const toX = (index) => left + index * stepX;

  const linePath = item.points
    .map((value, index) => `${index === 0 ? "M" : "L"} ${toX(index)} ${toY(value)}`)
    .join(" ");
  const areaPath = `${linePath} L ${toX(item.points.length - 1)} ${top + chartHeight} L ${toX(0)} ${top + chartHeight} Z`;
  const baselineY = toY(item.baseline);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {[0, 1, 2, 3].map((n) => {
        const y = top + (chartHeight / 4) * n;
        return (
          <line
            key={`h-${n}`}
            x1={left}
            y1={y}
            x2={left + chartWidth}
            y2={y}
            stroke="#cfd8e3"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
        );
      })}
      {item.xTicks.map((tick, index) => (
        <g key={tick}>
          <line
            x1={toX(index)}
            y1={top}
            x2={toX(index)}
            y2={top + chartHeight}
            stroke="#d9e2ec"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
          <text x={toX(index)} y={height - 6} textAnchor="middle" fontSize="11" fill="#64748b">
            {tick}
          </text>
        </g>
      ))}
      <line
        x1={left}
        y1={top + chartHeight}
        x2={left + chartWidth}
        y2={top + chartHeight}
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <line x1={left} y1={top} x2={left} y2={top + chartHeight} stroke="#94a3b8" strokeWidth="1" />
      <line
        x1={left}
        y1={baselineY}
        x2={left + chartWidth}
        y2={baselineY}
        stroke={baselineColor}
        strokeDasharray="4 4"
        strokeWidth="2"
      />
      <path d={areaPath} fill={fillColor} />
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {item.yTicks.map((tick, index) => {
        const ratio = item.yTicks.length === 1 ? 0 : index / (item.yTicks.length - 1);
        const y = top + chartHeight - ratio * chartHeight;
        return (
          <text key={tick} x={left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
            {tick}
          </text>
        );
      })}
      <text
        x={18}
        y={top + chartHeight / 2}
        textAnchor="middle"
        fontSize="12"
        fill="#64748b"
        transform={`rotate(-90 18 ${top + chartHeight / 2})`}
      >
        {item.yLabel}
      </text>
    </svg>
  );
}
