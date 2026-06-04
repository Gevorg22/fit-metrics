'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './RestTimer.module.scss';

const PRESETS = [60, 90, 120];

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

interface Props {
  onClose: () => void;
}

export function RestTimer({ onClose }: Props) {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(true);
  const beeped = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    setRunning(true);
    beeped.current = false;
  }, [duration]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      if (!beeped.current) {
        beeped.current = true;
        beep();
      }
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  const progress = remaining / duration;
  const done = remaining <= 0;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const circumference = 2 * Math.PI * 28;

  return (
    <div className={styles.wrap}>
      <div className={styles.ring}>
        <svg width="72" height="72" className={styles.svg}>
          <circle cx="36" cy="36" r="28" className={styles.track} />
          <circle
            cx="36"
            cy="36"
            r="28"
            className={`${styles.bar} ${done ? styles.barDone : ''}`}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <span className={`${styles.time} ${done ? styles.timeDone : ''}`}>
          {done ? '✓' : `${mm}:${ss}`}
        </span>
      </div>

      <div className={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p}
            className={`${styles.preset} ${duration === p ? styles.presetActive : ''}`}
            onClick={() => setDuration(p)}
          >
            {p}с
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.ctrl}
          onClick={() => setRunning((v) => !v)}
        >
          {running && !done ? '⏸' : '▶'}
        </button>
        <button
          className={styles.ctrl}
          onClick={() => { setRemaining(duration); setRunning(true); beeped.current = false; }}
        >
          ↺
        </button>
        <button className={`${styles.ctrl} ${styles.ctrlClose}`} onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
