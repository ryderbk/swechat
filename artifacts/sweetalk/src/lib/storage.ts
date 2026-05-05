const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(
  file: File | Blob, 
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing. Please check your .env file.");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        const error = JSON.parse(xhr.responseText);
        reject(new Error(error.error?.message || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export async function uploadImage(file: File, onProgress?: (p: number) => void): Promise<string> {
  return uploadToCloudinary(file, "image", onProgress);
}

export async function uploadVideo(file: File, onProgress?: (p: number) => void): Promise<string> {
  return uploadToCloudinary(file, "video", onProgress);
}

export async function uploadAudio(blob: Blob, onProgress?: (p: number) => void): Promise<string> {
  return uploadToCloudinary(blob, "video", onProgress);
}

export async function uploadVoice(blob: Blob, onProgress?: (p: number) => void): Promise<string> {
  return uploadToCloudinary(blob, "video", onProgress);
}

export async function uploadFile(file: File, onProgress?: (p: number) => void): Promise<string> {
  return uploadToCloudinary(file, "auto", onProgress);
}

export async function uploadDocument(file: File, onProgress?: (p: number) => void): Promise<string> {
  return uploadToCloudinary(file, "auto", onProgress);
}
