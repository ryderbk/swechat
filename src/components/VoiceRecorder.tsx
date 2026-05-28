import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadVoice } from "@/lib/storage";

interface Props {
  onVoiceReady: (url: string) => void;
}

export function VoiceRecorder({ onVoiceReady }: Props) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

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
        if (chunksRef.current.length === 0) return;
        
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

  const cancel = () => {
    chunksRef.current = [];
    recorderRef.current?.stop();
    setRecording(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (uploading) {
    return (
      <Button variant="ghost" size="icon" type="button" className="rounded-xl" disabled>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </Button>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 bg-destructive/10 rounded-2xl px-2 py-1 animate-in fade-in slide-in-from-left-2">
        <div className="flex items-center gap-1.5 px-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-mono font-medium text-destructive">{formatDuration(duration)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="rounded-xl text-muted-foreground hover:text-destructive transition-colors"
          onClick={cancel}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="rounded-xl text-destructive"
          onClick={stop}
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      data-testid="button-voice"
      variant="ghost"
      size="icon"
      type="button"
      className="rounded-xl text-muted-foreground hover:text-foreground"
      onClick={start}
      title="Record voice message"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}
