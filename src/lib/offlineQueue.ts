const DB_NAME = "sweetalk_offline";
const STORE_NAME = "message_queue";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface QueuedMessage {
  id?: number;
  senderId: string;
  payload: Record<string, unknown>;
  queuedAt: number;
}

export async function queueMessage(msg: Omit<QueuedMessage, "id" | "queuedAt">) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({ ...msg, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedMessage(id: number) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function processQueue(
  sendFn: (msg: QueuedMessage) => Promise<void>
): Promise<void> {
  const queued = await getQueuedMessages();
  for (const msg of queued) {
    try {
      await sendFn(msg);
      await removeQueuedMessage(msg.id!);
    } catch (err) {
      console.error("Failed to send queued message:", err);
      break; // stop on first failure, retry later
    }
  }
}
