"use client";

import { useState } from "react";
import AudioRecordingControl from "./AudioRecordingControl";

export default function AudioArchive({ recordings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [frontendDurations, setFrontendDurations] = useState({});
  const visibleRecordings = isOpen ? recordings : recordings.slice(0, 1);

  return (
    <div>
      {recordings.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            {isOpen ? "Hide archive" : "View all"}
          </button>
        </div>
      )}
      {visibleRecordings.length > 0 && (
        <div className="mt-3 max-h-96 space-y-3 overflow-auto rounded-[1.5rem] bg-slate-50 p-4">
          {visibleRecordings.map((recording) => (
            <div
              key={recording.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{recording.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{recording.date}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {frontendDurations[recording.id]
                    ? formatTime(Math.floor(frontendDurations[recording.id]))
                    : "--:--"}
                </span>
              </div>
              {recording.audioSrc ? (
                <AudioRecordingControl
                  audioSrc={recording.audioSrc}
                  compact
                  className="mt-3 bg-slate-50"
                  onDurationChange={(duration) =>
                    setFrontendDurations((current) => ({
                      ...current,
                      [recording.id]: duration,
                    }))
                  }
                />
              ) : (
                <p className="mt-3 text-xs font-medium text-slate-400">Audio unavailable</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
