import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  setDoc,
  onSnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Message {
  id: string;
  senderId: string;
  text: string | null;
  type: "text" | "image" | "voice";
  imageUrl: string | null;
  voiceUrl: string | null;
  createdAt: Timestamp;
  status: "sent" | "delivered" | "read";
  edited: boolean;
  deleted: boolean;
  reactions: Record<string, string[]>;
}

export interface SharedNote {
  content: string;
  updatedAt: Timestamp;
}

export interface UserPresence {
  online: boolean;
  lastSeen: Timestamp;
  displayName?: string;
}

export interface TypingStatus {
  isTyping: boolean;
  updatedAt: Timestamp;
}

const MESSAGES_PER_PAGE = 20;

export function messagesQuery(lastDoc?: QueryDocumentSnapshot) {
  const base = query(
    collection(db, "messages"),
    orderBy("createdAt", "desc"),
    limit(MESSAGES_PER_PAGE)
  );
  if (lastDoc) {
    return query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(MESSAGES_PER_PAGE)
    );
  }
  return base;
}

export async function loadMoreMessages(lastDoc: QueryDocumentSnapshot) {
  const q = messagesQuery(lastDoc);
  const snap = await getDocs(q);
  return snap;
}

export function subscribeToMessages(
  callback: (messages: Message[], lastDoc: QueryDocumentSnapshot | null) => void
) {
  const q = query(
    collection(db, "messages"),
    orderBy("createdAt", "desc"),
    limit(MESSAGES_PER_PAGE)
  );
  return onSnapshot(q, (snap) => {
    const msgs: Message[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
      .reverse();
    const last = snap.docs[snap.docs.length - 1] ?? null;
    callback(msgs, last);
  });
}

export async function sendMessage(
  senderId: string,
  payload: {
    text?: string | null;
    type: "text" | "image" | "voice";
    imageUrl?: string | null;
    voiceUrl?: string | null;
  }
) {
  return addDoc(collection(db, "messages"), {
    senderId,
    text: payload.text ?? null,
    type: payload.type,
    imageUrl: payload.imageUrl ?? null,
    voiceUrl: payload.voiceUrl ?? null,
    createdAt: serverTimestamp(),
    status: "sent",
    edited: false,
    deleted: false,
    reactions: {},
  });
}

export async function editMessage(id: string, newText: string) {
  await updateDoc(doc(db, "messages", id), {
    text: newText,
    edited: true,
  });
}

export async function deleteMessage(id: string) {
  await updateDoc(doc(db, "messages", id), { deleted: true });
}

export async function reactToMessage(
  id: string,
  emoji: string,
  uid: string,
  hasReacted: boolean
) {
  const ref = doc(db, "messages", id);
  const field = `reactions.${emoji}`;
  if (hasReacted) {
    await updateDoc(ref, { [field]: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { [field]: arrayUnion(uid) });
  }
}

export async function markMessagesRead(messageIds: string[]) {
  await Promise.all(
    messageIds.map((id) =>
      updateDoc(doc(db, "messages", id), { status: "read" })
    )
  );
}

export async function markMessagesDelivered(messageIds: string[]) {
  await Promise.all(
    messageIds.map((id) =>
      updateDoc(doc(db, "messages", id), { status: "delivered" })
    )
  );
}

export function subscribeToSharedNote(callback: (note: SharedNote | null) => void) {
  return onSnapshot(doc(db, "sharedNote", "main"), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SharedNote);
    } else {
      callback(null);
    }
  });
}

export async function updateSharedNote(content: string) {
  await setDoc(doc(db, "sharedNote", "main"), {
    content,
    updatedAt: serverTimestamp(),
  });
}

export async function setTypingStatus(uid: string, isTyping: boolean) {
  await setDoc(doc(db, "typingStatus", uid), {
    isTyping,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToTyping(
  partnerUid: string,
  callback: (isTyping: boolean) => void
) {
  return onSnapshot(doc(db, "typingStatus", partnerUid), (snap) => {
    if (snap.exists()) {
      const data = snap.data() as TypingStatus;
      callback(data.isTyping);
    } else {
      callback(false);
    }
  });
}

export async function setUserPresence(uid: string, online: boolean, displayName?: string) {
  await setDoc(
    doc(db, "userPresence", uid),
    { online, lastSeen: serverTimestamp(), ...(displayName ? { displayName } : {}) },
    { merge: true }
  );
}

export function subscribeToPresence(
  partnerUid: string,
  callback: (presence: UserPresence | null) => void
) {
  return onSnapshot(doc(db, "userPresence", partnerUid), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserPresence);
    } else {
      callback(null);
    }
  });
}
