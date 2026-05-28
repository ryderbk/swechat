import { useState, useEffect } from "react";
import { collection, onSnapshot, QuerySnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";

const kUserA = 'sbharathkumar1125';
const kUserB = 'saiswetharr';

function sanitizeName(name: string, uid?: string): string {
  const n = name.toLowerCase();
  if (n.includes("bharath") || n.includes("kumarr") || uid === kUserA) return "Bharath Kumar";
  if (n.includes("swetha") || n.includes("saiswetha") || uid === kUserB) return "Saiswetha";
  return name;
}

export function usePartnerUid() {
  const { user } = useAuth();
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("Partner");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "userPresence"), (snap: QuerySnapshot) => {
      const other = snap.docs.find((d: QueryDocumentSnapshot) => d.id !== user.uid);
      if (other) {
        setPartnerUid(other.id);
        const data = other.data();
        setPartnerName(sanitizeName(data.displayName || "", other.id));
      } else {
        // Fallback: use env variable if partner hasn't set presence yet
        const fallbackUid = import.meta.env.VITE_PARTNER_UID;
        if (fallbackUid) {
          setPartnerUid(fallbackUid);
          setPartnerName(sanitizeName("", fallbackUid));
        }
      }
    });
    return unsub;
  }, [user]);

  return { partnerUid, partnerName };
}
