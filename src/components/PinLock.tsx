import { useState, useEffect } from "react";
import { usePinLock } from "@/hooks/usePinLock";
import { isWebAuthnAvailable, authenticateBiometric } from "@/lib/biometric";
import { Heart, Delete, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingHearts } from "@/components/FloatingHearts";
import { FloatingSparkles } from "@/components/FloatingSparkles";

interface Props {
  onUnlock: () => void;
  mode?: "verify" | "setup";
  onSetupComplete?: (pin: string) => void;
}

export function PinLock({ onUnlock, mode = "verify", onSetupComplete }: Props) {
  const { verifyPin } = usePinLock();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [biometricAvail] = useState(isWebAuthnAvailable);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setCountdown(0);
        setAttempts(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const triggerShake = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleDigit = (d: string) => {
    if (lockedUntil) return;
    const current = mode === "setup" && step === "confirm" ? confirmPin : pin;
    if (current.length >= 4) return;
    const next = current + d;
    if (mode === "setup" && step === "confirm") {
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === pin) {
          onSetupComplete?.(next);
        } else {
          triggerShake("PINs don't match");
          setConfirmPin("");
        }
      }
    } else {
      setPin(next);
      if (next.length === 4) {
        if (mode === "setup") {
          setStep("confirm");
          setPin(next);
        } else {
          handleVerify(next);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (mode === "setup" && step === "confirm") {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
  };

  const handleVerify = async (p: string) => {
    if (lockedUntil) return;
    const ok = await verifyPin(p);
    if (ok) {
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");
      if (newAttempts >= 3) {
        setLockedUntil(Date.now() + 30000);
        triggerShake("Too many attempts. Wait 30s.");
      } else {
        triggerShake(`Incorrect PIN (${3 - newAttempts} left)`);
      }
    }
  };

  const handleBiometric = async () => {
    const ok = await authenticateBiometric();
    if (ok) onUnlock();
    else triggerShake("Biometric failed");
  };

  const currentPin = mode === "setup" && step === "confirm" ? confirmPin : pin;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8 relative overflow-hidden px-4">
      {/* Decorative floating canvases from projectswe */}
      <FloatingHearts />
      <FloatingSparkles />

      {/* Decorative background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none animate-float-delayed" />

      <div className="flex flex-col items-center gap-3 z-10 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-romantic-lg mb-2 animate-heartbeat">
          <Heart className="w-8 h-8 text-primary-foreground fill-current animate-pulse-glow" />
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-foreground drop-shadow-sm">
          {mode === "setup"
            ? step === "enter"
              ? "Create your PIN"
              : "Confirm your PIN"
            : "Enter PIN"}
        </h1>
        
        {errorMsg && (
          <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-1.5 rounded-full animate-scale-in">{errorMsg}</p>
        )}
        {lockedUntil && (
          <p className="text-sm text-muted-foreground font-semibold bg-muted/50 px-4 py-1.5 rounded-full">Locked for {countdown}s</p>
        )}
      </div>

      {/* Dots representing entered PIN digits */}
      <div className={`flex gap-4 z-10 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              i < currentPin.length
                ? "bg-primary border-primary scale-110 shadow-romantic"
                : "border-muted-foreground/40 bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Beautiful circular Glass Numpad */}
      <div className="grid grid-cols-3 gap-4 z-10 max-w-xs w-full px-4 justify-items-center">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            disabled={!!lockedUntil}
            className="w-16 h-16 rounded-full glass-card border border-primary/20 text-xl font-semibold text-foreground hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          disabled={!!lockedUntil}
          className="w-16 h-16 rounded-full glass-card border border-primary/20 text-xl font-semibold text-foreground hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full glass-card border border-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {biometricAvail && mode === "verify" && (
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground z-10 rounded-full hover:text-foreground transition-colors mt-2"
          onClick={handleBiometric}
        >
          <Fingerprint className="w-4 h-4 text-primary" />
          Use Face ID / Fingerprint
        </Button>
      )}
    </div>
  );
}
