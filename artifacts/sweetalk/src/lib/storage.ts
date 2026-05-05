import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File): Promise<string> {
  const path = `images/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  const snap = await new Promise<import("firebase/storage").UploadTaskSnapshot>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed", undefined, reject, () => resolve(task.snapshot));
  });
  return getDownloadURL(snap.ref);
}

export async function uploadVoice(blob: Blob): Promise<string> {
  const path = `voice/${Date.now()}.webm`;
  const storageRef = ref(storage, path);
  const snap = await new Promise<import("firebase/storage").UploadTaskSnapshot>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob);
    task.on("state_changed", undefined, reject, () => resolve(task.snapshot));
  });
  return getDownloadURL(snap.ref);
}

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const path = `videos/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(pct);
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const path = `docs/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(pct);
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}
