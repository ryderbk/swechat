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
  getDoc,
  setDoc,
  onSnapshot,
  where,
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
  type: "text" | "image" | "voice" | "video" | "document";
  imageUrl: string | null;
  voiceUrl: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  documentSize: number | null;
  createdAt: Timestamp;
  status: "sent" | "delivered" | "read";
  edited: boolean;
  deleted: boolean;
  reactions: Record<string, string[]>;
  replyTo: { id: string; text: string; senderId: string } | null;
  starred: boolean;
  isAI?: boolean;
  linkPreview: {
    url: string;
    title: string;
    description: string;
    image: string | null;
  } | null;
}

export interface AIMemory {
  summary: string;
  userAProfile: string;
  userBProfile: string;
  lastUpdated: Timestamp;
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

export interface PinnedMessage {
  id: string;
  messageId: string;
  messageText: string;
  senderId: string;
  pinnedAt: Timestamp;
}

export interface CallDoc {
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  status: "calling" | "active" | "ended";
  type: "voice" | "video";
  callerId: string;
  calleeId: string;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
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
    type: "text" | "image" | "voice" | "video" | "document";
    imageUrl?: string | null;
    voiceUrl?: string | null;
    videoUrl?: string | null;
    documentUrl?: string | null;
    documentName?: string | null;
    documentSize?: number | null;
    replyTo?: { id: string; text: string; senderId: string } | null;
    linkPreview?: {
      url: string;
      title: string;
      description: string;
      image: string | null;
    } | null;
    isAI?: boolean;
  }
) {
  return addDoc(collection(db, "messages"), {
    senderId,
    text: payload.text ?? null,
    type: payload.type,
    imageUrl: payload.imageUrl ?? null,
    voiceUrl: payload.voiceUrl ?? null,
    videoUrl: payload.videoUrl ?? null,
    documentUrl: payload.documentUrl ?? null,
    documentName: payload.documentName ?? null,
    documentSize: payload.documentSize ?? null,
    createdAt: serverTimestamp(),
    status: "sent",
    edited: false,
    deleted: false,
    reactions: {},
    replyTo: payload.replyTo ?? null,
    starred: false,
    isAI: payload.isAI ?? false,
    linkPreview: payload.linkPreview ?? null,
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

export async function starMessage(id: string, starred: boolean) {
  await updateDoc(doc(db, "messages", id), { starred });
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

export async function getAIMemory(): Promise<AIMemory | null> {
  const snap = await getDoc(doc(db, "aiMemory", "main"));
  return snap.exists() ? (snap.data() as AIMemory) : null;
}

export function subscribeToAIMemory(callback: (memory: AIMemory | null) => void) {
  return onSnapshot(doc(db, "aiMemory", "main"), (snap) => {
    callback(snap.exists() ? (snap.data() as AIMemory) : null);
  });
}

export async function updateAIMemory(memory: Partial<AIMemory>) {
  await setDoc(doc(db, "aiMemory", "main"), {
    ...memory,
    lastUpdated: serverTimestamp(),
  }, { merge: true });
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

export function subscribeToStarredMessages(callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, "messages"),
    where("starred", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }));
    callback(msgs);
  });
}

export async function pinMessage(messageId: string, messageText: string, senderId: string) {
  const q = query(collection(db, "pinnedMessages"));
  const snap = await getDocs(q);
  if (snap.size >= 3) throw new Error("Max 3 pinned messages");
  await setDoc(doc(db, "pinnedMessages", messageId), {
    messageId,
    messageText,
    senderId,
    pinnedAt: serverTimestamp(),
  });
}

export async function unpinMessage(messageId: string) {
  await deleteDoc(doc(db, "pinnedMessages", messageId));
}

export function subscribeToPinnedMessages(callback: (msgs: PinnedMessage[]) => void) {
  return onSnapshot(collection(db, "pinnedMessages"), (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PinnedMessage, "id">) }));
    callback(msgs);
  });
}

export async function saveFCMToken(uid: string, token: string) {
  await setDoc(doc(db, "users", uid, "tokens", token), {
    token,
    updatedAt: serverTimestamp(),
  });
}

export async function muteNotifications(uid: string, until: Date | null) {
  await setDoc(
    doc(db, "userPreferences", uid),
    { mutedUntil: until ? until.toISOString() : null },
    { merge: true }
  );
}

export async function getMuteStatus(uid: string): Promise<Date | null> {
  const snap = await getDoc(doc(db, "userPreferences", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data?.mutedUntil) return null;
  const d = new Date(data.mutedUntil);
  return d > new Date() ? d : null;
}

export async function saveUserPreference(uid: string, prefs: Record<string, unknown>) {
  await setDoc(doc(db, "userPreferences", uid), prefs, { merge: true });
}

export async function getUserPreferences(uid: string): Promise<Record<string, unknown>> {
  const snap = await getDoc(doc(db, "userPreferences", uid));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : {};
}

export async function clearAllMessages(): Promise<void> {
  const snap = await getDocs(collection(db, "messages"));
  const chunks: Promise<void>[] = [];
  snap.docs.forEach((d) => {
    chunks.push(deleteDoc(doc(db, "messages", d.id)));
  });
  await Promise.all(chunks);
}

export function subscribeToCallForCallee(
  calleeId: string,
  callback: (callId: string, data: CallDoc) => void
) {
  const q = query(
    collection(db, "calls"),
    where("calleeId", "==", calleeId),
    where("status", "==", "calling")
  );
  return onSnapshot(q, (snap) => {
    snap.docs.forEach((d) => callback(d.id, d.data() as CallDoc));
  });
}
