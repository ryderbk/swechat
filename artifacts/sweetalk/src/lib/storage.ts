import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File): Promise<string> {
  const path = `images/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  try {
    console.log(`Starting image upload to: ${path}`);
    const snap = await uploadBytes(storageRef, file);
    return await getDownloadURL(snap.ref);
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
}

export async function uploadVoice(blob: Blob): Promise<string> {
  const path = `voice/${Date.now()}.webm`;
  const storageRef = ref(storage, path);
  try {
    console.log(`Starting voice upload to: ${path}`);
    const snap = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snap.ref);
  } catch (error) {
    console.error("Voice upload failed:", error);
    throw error;
  }
}

export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const path = `videos/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  console.log(`Starting video upload to: ${path}`);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        console.log(`Video upload progress: ${Math.round(pct)}%`);
        onProgress?.(pct);
      },
      (error) => {
        console.error("Video upload failed:", error);
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        console.log("Video upload complete:", url);
        resolve(url);
      }
    );
  });
}

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const path = `docs/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  console.log(`Starting document upload to: ${path}`);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        console.log(`Document upload progress: ${Math.round(pct)}%`);
        onProgress?.(pct);
      },
      (error) => {
        console.error("Document upload failed:", error);
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        console.log("Document upload complete:", url);
        resolve(url);
      }
    );
  });
}
