import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadVoice } from "@/lib/storage";

interface Props {
  onVoiceReady: (url: string) => void;
}

export function VoiceRecorder({ onVoiceReady }: Props) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setUploading(true);
        try {
          const url = await uploadVoice(blob);
          onVoiceReady(url);
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert("Microphone access is required for voice messages.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  if (uploading) {
    return (
      <Button variant="ghost" size="icon" type="button" className="rounded-xl" disabled>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </Button>
    );
  }

  return (
    <Button
      data-testid="button-voice"
      variant="ghost"
      size="icon"
      type="button"
      className={`rounded-xl ${recording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
      onClick={recording ? stop : start}
    >
      {recording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
    </Button>
  );
}
