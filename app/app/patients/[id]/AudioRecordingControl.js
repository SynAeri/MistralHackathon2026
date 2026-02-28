"use client";

import { useEffect, useRef, useState } from "react";

const DEMO_DURATION_SECONDS = 65;

export default function AudioRecordingControl() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  function playDemoTone() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.value = 0.03;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);

    oscillator.onended = () => {
      context.close().catch(() => {});
    };
  }

  function stopPlayback() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }

  function startPlayback() {
    playDemoTone();
    setIsPlaying(true);

    startedAtRef.current = Date.now() - elapsedSeconds * 1000;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const nextElapsed = Math.min(
        DEMO_DURATION_SECONDS,
        (Date.now() - startedAtRef.current) / 1000
      );

      setElapsedSeconds(nextElapsed);

      if (nextElapsed >= DEMO_DURATION_SECONDS) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPlaying(false);
      }
    }, 250);
  }

  function handleToggle() {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (elapsedSeconds >= DEMO_DURATION_SECONDS) {
      setElapsedSeconds(0);
    }

    startPlayback();
  }

  const progressPercent = Math.min(100, (elapsedSeconds / DEMO_DURATION_SECONDS) * 100);
  const currentWholeSeconds = Math.floor(elapsedSeconds);
  const timeLabel = `${formatTime(currentWholeSeconds)} / ${formatTime(DEMO_DURATION_SECONDS)}`;

  return (
    <div className="mt-3 rounded-[1.5rem] bg-cyan-50 p-4">
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
