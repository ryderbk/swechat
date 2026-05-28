import { AlertCircle, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FloatingHearts } from "@/components/FloatingHearts";
import { FloatingSparkles } from "@/components/FloatingSparkles";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full w-full flex items-center justify-center bg-background relative overflow-hidden py-4">
      {/* Decorative Canvas elements */}
      <FloatingHearts />
      <FloatingSparkles />

      {/* Background soft glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-4 z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-primary fill-current animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight text-center drop-shadow-sm">
            Lost in love?
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium text-center">
            This secret path does not exist.
          </p>
        </div>

        <div className="glass-card rounded-2xl shadow-romantic p-8 border border-primary/20 text-center space-y-6">
          <AlertCircle className="h-12 w-12 text-primary mx-auto animate-float" />
          <h2 className="text-2xl font-serif font-semibold text-foreground">404 - Not Found</h2>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Don't worry, darling. You can return to the private sanctuary with a single click.
          </p>

          <Button
            size="lg"
            className="w-full gap-2 rounded-full font-semibold px-8 shadow-romantic"
            onClick={() => setLocation("/chat")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sanctuary
          </Button>
        </div>
      </div>
    </div>
  );
}
