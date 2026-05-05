import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";

export function usePartnerUid() {
  const { user } = useAuth();
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("My Love");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "userPresence"), (snap) => {
      const other = snap.docs.find((d) => d.id !== user.uid);
      if (other) {
        setPartnerUid(other.id);
        const data = other.data();
        if (data.displayName) {
          let name = data.displayName;
          if (name === "sbharathkumar1125") name = "Mr. Kumarr";
          if (name === "saiswetharr") name = "Mrs. Kumarr";
          setPartnerName(name);
        }
      }
    });
    return unsub;
  }, [user]);

  return { partnerUid, partnerName };
}
