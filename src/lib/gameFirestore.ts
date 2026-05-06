import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PandaGameMemory } from "./panda";

const ROOM = "main";

// ─── Panda Memory ──────────────────────────────────────────────────────────
export async function getPandaMemory(): Promise<PandaGameMemory> {
  try {
    const snap = await getDoc(doc(db, "pandaMemory", ROOM));
    if (snap.exists()) return snap.data() as PandaGameMemory;
  } catch {}
  return { gameHistory: [], knownFacts: [], streaks: {}, totalPoints: { player1: 0, player2: 0 }, matchRates: {} };
}

export async function updatePandaMemory(update: Partial<PandaGameMemory>) {
  await setDoc(doc(db, "pandaMemory", ROOM), { ...update, lastUpdated: new Date().toISOString() }, { merge: true });
}

export async function addGameHistory(game: string, result: string) {
  const memory = await getPandaMemory();
  const history = [{ game, result, date: new Date().toISOString() }, ...memory.gameHistory].slice(0, 100);
  await updatePandaMemory({ gameHistory: history });
}

export async function addPoints(player: "player1" | "player2", pts: number) {
  const memory = await getPandaMemory();
  const points = { ...memory.totalPoints };
  points[player] = (points[player] || 0) + pts;
  await updatePandaMemory({ totalPoints: points });
}

export function subscribePandaMemory(callback: (m: PandaGameMemory) => void) {
  return onSnapshot(doc(db, "pandaMemory", ROOM), (snap) => {
    if (snap.exists()) callback(snap.data() as PandaGameMemory);
  });
}

// ─── Generic game doc helpers ──────────────────────────────────────────────
export async function getGameDoc(gameType: string, docId: string) {
  const snap = await getDoc(doc(db, "games", gameType, "rounds", docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Record<string, unknown> : null;
}

export async function setGameDoc(gameType: string, docId: string, data: object) {
  await setDoc(doc(db, "games", gameType, "rounds", docId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addGameDoc(gameType: string, data: object) {
  const ref = await addDoc(collection(db, "games", gameType, "rounds"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export function subscribeGameDoc(
  gameType: string,
  docId: string,
  callback: (data: Record<string, unknown> | null) => void
) {
  return onSnapshot(doc(db, "games", gameType, "rounds", docId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Record<string, unknown> : null);
  });
}

export function subscribeLatestGame(
  gameType: string,
  callback: (data: Record<string, unknown> | null) => void
) {
  const q = query(collection(db, "games", gameType, "rounds"), orderBy("createdAt", "desc"), limit(1));
  return onSnapshot(q, (snap) => {
    if (snap.empty) callback(null);
    else callback({ id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, unknown>);
  });
}

export async function getLatestGame(gameType: string) {
  const q = query(collection(db, "games", gameType, "rounds"), orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, unknown>;
}

// ─── Daily Question ─────────────────────────────────────────────────────────
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyDoc(dateKey: string) {
  const snap = await getDoc(doc(db, "games", "dailyquestion", "days", dateKey));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Record<string, unknown> : null;
}

export async function setDailyDoc(dateKey: string, data: object) {
  await setDoc(doc(db, "games", "dailyquestion", "days", dateKey), { ...data }, { merge: true });
}

export function subscribeDailyDoc(dateKey: string, callback: (data: Record<string, unknown> | null) => void) {
  return onSnapshot(doc(db, "games", "dailyquestion", "days", dateKey), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Record<string, unknown> : null);
  });
}

// ─── Moods ──────────────────────────────────────────────────────────────────
export function hourKey() {
  return new Date().toISOString().slice(0, 13);
}

export async function setMoodField(key: string, field: string, mood: string) {
  await setDoc(doc(db, "games", "moods", "entries", key), { [field]: mood, [`${field}At`]: new Date().toISOString() }, { merge: true });
}

export function subscribeMoodDoc(key: string, callback: (data: Record<string, unknown> | null) => void) {
  return onSnapshot(doc(db, "games", "moods", "entries", key), (snap) => {
    callback(snap.exists() ? snap.data() as Record<string, unknown> : null);
  });
}
