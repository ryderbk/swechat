import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePinLock } from "@/hooks/usePinLock";
import { PinLock } from "@/components/PinLock";
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import Album from "@/pages/Album";
import Starred from "@/pages/Starred";
import SetupPin from "@/pages/SetupPin";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Redirect to="/" />;
  return <Component />;
}

function GuestRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Redirect to="/chat" />;
  return <Component />;
}

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function PinGuard({ children }: { children: React.ReactNode }) {
  const { isLocked, lock, unlock, hasPin } = usePinLock();
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (hasPin() && Date.now() - lastActiveRef.current > LOCK_TIMEOUT_MS) {
          lock();
        }
        lastActiveRef.current = Date.now();
      } else {
        lastActiveRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lock, hasPin]);

  if (isLocked && hasPin()) {
    return <PinLock onUnlock={unlock} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <GuestRoute component={Login} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={Chat} />} />
      <Route path="/album" component={() => <ProtectedRoute component={Album} />} />
      <Route path="/starred" component={() => <ProtectedRoute component={Starred} />} />
      <Route path="/setup-pin" component={() => <ProtectedRoute component={SetupPin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeInitializer>
            <PinGuard>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </PinGuard>
            <Toaster />
          </ThemeInitializer>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
