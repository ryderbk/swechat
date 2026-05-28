import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Mail, Lock, Loader2 } from "lucide-react";
import { FloatingHearts } from "@/components/FloatingHearts";
import { FloatingSparkles } from "@/components/FloatingSparkles";

export default function Login() {
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password, rememberMe);
      setLocation("/chat");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      {/* Decorative Canvas elements from projectswe */}
      <FloatingHearts />
      <FloatingSparkles />

      {/* Soft decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl pointer-events-none animate-float-delayed" />

      <div className="w-full max-w-sm mx-4 z-10 animate-fade-in-up">
        {/* Animated Heart Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-romantic-lg mb-4 animate-heartbeat">
            <Heart className="w-10 h-10 text-primary-foreground fill-current animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight drop-shadow-sm">SweeTalk</h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Your private sanctuary 💖</p>
        </div>

        {/* Beautiful Frosted Glass Card from projectswe */}
        <div className="glass-card rounded-2xl shadow-romantic p-8 border border-primary/20">
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-6 text-center">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground pl-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 rounded-full h-11 border-border bg-card/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground pl-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 rounded-full h-11 border-border bg-card/50 placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pl-1 py-1">
              <Checkbox
                id="remember"
                data-testid="checkbox-remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
                className="rounded-md border-primary/40 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-primary"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none font-medium hover:text-foreground transition-colors">
                Keep me signed in
              </Label>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 rounded-full py-2 px-4 animate-scale-in">
                {error}
              </p>
            )}

            <Button
              data-testid="button-login"
              type="submit"
              size="lg"
              className="w-full font-semibold transition-all duration-300 h-11 mt-2 text-base rounded-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/80 mt-8 font-medium">
          This is a private space. Only the two of you. 🔒
        </p>
      </div>
    </div>
  );
}
