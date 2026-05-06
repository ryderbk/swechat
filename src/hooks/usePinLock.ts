import { useState, useCallback } from "react";

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function usePinLock() {
  const [isLocked, setIsLocked] = useState(false);

  const hasPin = (): boolean => !!localStorage.getItem("sweetalk_pin_hash");

  const setupPin = useCallback(async (pin: string) => {
    const hash = await sha256(pin);
    localStorage.setItem("sweetalk_pin_hash", hash);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = localStorage.getItem("sweetalk_pin_hash");
    if (!stored) return true;
    const hash = await sha256(pin);
    return hash === stored;
  }, []);

  const lock = useCallback(() => setIsLocked(true), []);
  const unlock = useCallback(() => setIsLocked(false), []);

  return { isLocked, lock, unlock, setupPin, verifyPin, hasPin };
}
