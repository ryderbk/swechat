const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file: File | Blob, resourceType: "image" | "video" | "raw" | "auto" = "auto"): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing. Please check your .env file.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  
  console.log(`Starting Cloudinary ${resourceType} upload...`);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    console.log("Upload successful:", data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

export async function uploadImage(file: File): Promise<string> {
  return uploadToCloudinary(file, "image");
}

export async function uploadVideo(file: File): Promise<string> {
  return uploadToCloudinary(file, "video");
}

export async function uploadAudio(blob: Blob): Promise<string> {
  // Cloudinary treats audio as video for the purpose of the API resource type
  return uploadToCloudinary(blob, "video");
}

export async function uploadVoice(blob: Blob): Promise<string> {
  return uploadToCloudinary(blob, "video");
}

export async function uploadFile(file: File): Promise<string> {
  return uploadToCloudinary(file, "auto");
}

export async function uploadDocument(file: File): Promise<string> {
  return uploadToCloudinary(file, "auto");
}
