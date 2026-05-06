import { useLocation } from "wouter";
import { usePinLock } from "@/hooks/usePinLock";
import { PinLock } from "@/components/PinLock";
import { registerBiometric, isWebAuthnAvailable } from "@/lib/biometric";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, ArrowRight } from "lucide-react";

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">PIN Set!</h2>
          <p className="text-muted-foreground text-sm">Your app is now protected.</p>
        </div>

        {isWebAuthnAvailable() && !biometricDone && (
          <div className="bg-card border border-border rounded-2xl p-5 max-w-xs w-full text-center space-y-3">
            <Fingerprint className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-semibold">Enable Biometric?</h3>
            <p className="text-sm text-muted-foreground">
              Use Face ID or fingerprint for faster access.
            </p>
            <Button className="w-full" onClick={handleBiometric}>
              Enable Biometric
            </Button>
          </div>
        )}

        <Button
          className="gap-2"
          onClick={() => setLocation("/chat")}
        >
          Go to Chat
          <ArrowRight className="w-4 h-4" />
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
