import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);

window.addEventListener("online", async () => {
  const { processQueue } = await import("@/lib/offlineQueue");
  const { sendMessage } = await import("@/lib/firestore");
  await processQueue(async (msg) => {
    await sendMessage(msg.senderId, msg.payload as any);
  });
});
