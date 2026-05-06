import { useState, useEffect } from "react";
import { collection, onSnapshot, QuerySnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";

function sanitizeName(name: string): string {
  if (/sbharathkumar|mr\.?\s*kumarr*/i.test(name)) return "Bharath Kumar";
  if (/saiswetha|mrs\.?\s*kumarr*/i.test(name)) return "Saiswetha";
  return name;
}

export function usePartnerUid() {
  const { user } = useAuth();
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("My Love");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "userPresence"), (snap: QuerySnapshot) => {
      const other = snap.docs.find((d: QueryDocumentSnapshot) => d.id !== user.uid);
      if (other) {
        setPartnerUid(other.id);
        const data = other.data();
        if (data.displayName) setPartnerName(sanitizeName(data.displayName));
      } else {
        // Fallback: use env variable if partner hasn't set presence yet
        const fallbackUid = import.meta.env.VITE_PARTNER_UID;
        const fallbackName = import.meta.env.VITE_PARTNER_NAME || "My Love";
        if (fallbackUid) {
          setPartnerUid(fallbackUid);
          setPartnerName(fallbackName);
        }
      }
    });
    return unsub;
  }, [user]);

  return { partnerUid, partnerName };
}
