import { useLocation } from "wouter";
import { usePinLock } from "@/hooks/usePinLock";
import { PinLock } from "@/components/PinLock";
import { registerBiometric, isWebAuthnAvailable } from "@/lib/biometric";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, ArrowRight, ShieldCheck } from "lucide-react";
import { FloatingHearts } from "@/components/FloatingHearts";
import { FloatingSparkles } from "@/components/FloatingSparkles";

export default function SetupPin() {
  const [, setLocation] = useLocation();
  const { setupPin } = usePinLock();
  const [done, setDone] = useState(false);
  const [biometricDone, setBiometricDone] = useState(false);

  const handleSetupComplete = async (pin: string) => {
    await setupPin(pin);
    setDone(true);
  };

  const handleBiometric = async () => {
    await registerBiometric();
    setBiometricDone(true);
  };

  if (done) {
    return (
      <div className="h-full w-full bg-background flex flex-col items-center justify-center gap-6 p-4 relative overflow-hidden">
        {/* Decorative canvas animations from projectswe */}
        <FloatingHearts />
        <FloatingSparkles />

        {/* Soft background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none animate-float-delayed" />

        <div className="text-center z-10 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-romantic-lg mb-4 mx-auto animate-heartbeat">
            <ShieldCheck className="w-8 h-8 text-primary-foreground fill-current animate-pulse-glow" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">PIN Set Successfully!</h2>
          <p className="text-muted-foreground text-sm font-medium">Your private sanctuary is now protected.</p>
        </div>

        {isWebAuthnAvailable() && !biometricDone && (
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center space-y-4 border border-primary/20 z-10 animate-fade-in-up shadow-romantic">
            <Fingerprint className="w-12 h-12 text-primary mx-auto animate-pulse-glow" />
            <h3 className="text-lg font-serif font-semibold text-foreground">Enable Biometrics?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unlock the private space effortlessly using Face ID or fingerprint scanner.
            </p>
            <Button className="w-full font-semibold rounded-full h-11" onClick={handleBiometric}>
              Enable Biometrics
            </Button>
          </div>
        )}

        <Button
          size="lg"
          className="gap-2 z-10 rounded-full font-semibold px-8 shadow-romantic"
          onClick={() => setLocation("/chat")}
        >
          Go to Chat
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <PinLock
      mode="setup"
      onUnlock={() => setLocation("/chat")}
      onSetupComplete={handleSetupComplete}
    />
  );
}
