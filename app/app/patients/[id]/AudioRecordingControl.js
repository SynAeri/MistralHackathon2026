"use client";

import { useEffect, useRef, useState } from "react";

const DEMO_AUDIO_SRC = "/Sample_1.wav";

export default function AudioRecordingControl({
  audioSrc = DEMO_AUDIO_SRC,
  className = "",
  compact = false,
  onDurationChange,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const instanceIdRef = useRef(`audio-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    function handleExternalPlay(event) {
      const audio = audioRef.current;
      if (!audio || event.detail?.id === instanceIdRef.current) {
        return;
      }

      if (!audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    }

    window.addEventListener("patient-audio-play", handleExternalPlay);

    return () => {
      window.removeEventListener("patient-audio-play", handleExternalPlay);
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
      window.dispatchEvent(
        new CustomEvent("patient-audio-play", {
          detail: { id: instanceIdRef.current },
        })
      );
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
      onDurationChange?.(audio.duration);
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
    <div
      className={`${compact ? "rounded-2xl bg-white p-3" : "mt-3 rounded-[1.5rem] bg-cyan-50 p-4"} ${className}`.trim()}
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
      />
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className={`flex items-center justify-center gap-4 ${compact ? "w-full" : "w-full max-w-sm"}`}>
          <button
            type="button"
            onClick={handleToggle}
            className={`flex shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 ${
              compact ? "h-9 w-9" : "h-11 w-11"
            }`}
          >
            {isPlaying ? "||" : ">"}
          </button>
          <div className={`flex items-center gap-3 ${compact ? "w-full" : "w-full max-w-xs"}`}>
            <div className="w-full">
              <div className={`${compact ? "h-2.5" : "h-3"} overflow-hidden rounded-full bg-slate-200`}>
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <p className={`shrink-0 text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>{timeLabel}</p>
          </div>
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
