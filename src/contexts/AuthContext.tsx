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
import { setUserPresence, saveFCMToken, getOrCreateEncryptionSalt } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { deriveKey } from "@/lib/crypto";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  cryptoKey: CryptoKey | null;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  cryptoKey: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: User | null) => {
      setUser(u);
      setLoading(false);
      if (u) {
        let name = "User";
        if (u.email === "sbharathkumar1125@gmail.com" || u.email?.includes("bharath")) name = "Bharath Kumar";
        else if (u.email === "saiswetharr@gmail.com" || u.email?.includes("swetha")) name = "Saiswetha";
        else name = u.displayName ?? u.email?.split("@")[0] ?? "User";
        
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
    const { user: u } = await signInWithEmailAndPassword(auth, email, password);
    
    // Derive and store key
    const salt = await getOrCreateEncryptionSalt();
    const key = await deriveKey(password, salt);
    setCryptoKey(key);
  };

  const signOut = async () => {
    if (user) await setUserPresence(user.uid, false);
    setCryptoKey(null);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, cryptoKey, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
