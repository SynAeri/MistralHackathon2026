"use client";

import { useEffect, useRef, useState } from "react";

const DEMO_AUDIO_SRC = "/Sample_1.wav";

export default function AudioRecordingControl() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  async function handleToggle() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDurationSeconds(audio.duration);
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    setElapsedSeconds(audio.currentTime);
  }

  function handleEnded() {
    setIsPlaying(false);
    setElapsedSeconds(0);
  }

  const progressPercent = durationSeconds
    ? Math.min(100, (elapsedSeconds / durationSeconds) * 100)
    : 0;
  const currentWholeSeconds = Math.floor(elapsedSeconds);
  const timeLabel = `${formatTime(currentWholeSeconds)} / ${
    durationSeconds ? formatTime(Math.floor(durationSeconds)) : "--:--"
  }`;

  return (
    <div className="mt-3 rounded-[1.5rem] bg-cyan-50 p-4">
      <audio
        ref={audioRef}
        src={DEMO_AUDIO_SRC}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="flex w-full max-w-sm items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleToggle}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600"
          >
            {isPlaying ? "||" : ">"}
          </button>
          <div className="w-full max-w-xs">
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <p className="text-center text-lg text-slate-500">{timeLabel}</p>
        </div>
      </div>
    </div>
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
