import { useRef, useCallback } from "react";

export function useSound() {
  const enabledRef = useRef<boolean>(() => {
    try {
      return localStorage.getItem("soundEnabled") !== "false";
    } catch {
      return true;
    }
  });

  const playChime = useCallback(() => {
    try {
      const enabled = localStorage.getItem("soundEnabled") !== "false";
      if (!enabled) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext not available
    }
  }, []);

  const toggleSound = useCallback(() => {
    const current = localStorage.getItem("soundEnabled") !== "false";
    localStorage.setItem("soundEnabled", String(!current));
    return !current;
  }, []);

  const isSoundEnabled = useCallback(() => {
    return localStorage.getItem("soundEnabled") !== "false";
  }, []);

  return { playChime, toggleSound, isSoundEnabled };
}
