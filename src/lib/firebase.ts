import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let _messaging: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!_messaging) {
    try {
      _messaging = getMessaging(app);
    } catch {
      return null;
    }
  }
  return _messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) return null;
    return await getToken(messaging, { vapidKey });
  } catch {
    return null;
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
