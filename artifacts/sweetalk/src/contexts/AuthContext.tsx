import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { setUserPresence, saveFCMToken } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        let name = u.displayName ?? u.email?.split("@")[0] ?? "You";
        if (name === "sbharathkumar1125") name = "Mr. Kumarrr";
        if (name === "saiswetharr") name = "Mrs. Kumarrr";
        
        await setUserPresence(u.uid, true, name);
        const token = await requestNotificationPermission();
        if (token) await saveFCMToken(u.uid, token);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubFg = onForegroundMessage((payload) => {
      const senderId = payload.data?.senderId;
      if (senderId === user.uid) return;
      toast({
        title: payload.notification?.title ?? "SweeTalk",
        description: payload.notification?.body ?? "New message",
        duration: 4000,
      });
    });
    return unsubFg;
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    const handleUnload = () => {
      setUserPresence(user.uid, false);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [user]);

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (user) await setUserPresence(user.uid, false);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
