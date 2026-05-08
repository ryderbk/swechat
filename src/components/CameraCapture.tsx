import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Video, X, RotateCcw, Circle, Square, Loader2, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, type: "image" | "video") => void;
}

export function CameraCapture({ open, onClose, onCapture }: Props) {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [flash, setFlash] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStream = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode === "video"
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
    }
  }, [facingMode, mode, stream]);

  useEffect(() => {
    if (open) {
      startStream();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, facingMode]); // Only restart on open/facingMode changes to avoid loop

  // Handle mode change separately to avoid stopping stream if not necessary
  // But video mode needs audio, photo doesn't necessarily.
  useEffect(() => {
    if (open) startStream();
  }, [mode]);

  const toggleMode = () => {
    if (recording) return;
    setMode(prev => prev === "image" ? "video" : "image");
  };

  const toggleFacingMode = () => {
    if (recording) return;
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Mirror if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob, "image");
        onClose();
      }
    }, "image/jpeg", 0.9);
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onCapture(blob, "video");
      onClose();
    };
    
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
    setRecordingDuration(0);
    
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-black border-none rounded-3xl">
        <DialogHeader className="absolute top-4 left-4 right-4 z-50 flex-row items-center justify-between pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          
          {recording && (
            <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              {formatDuration(recordingDuration)}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
            onClick={() => setFlash(!flash)}
          >
            {flash ? <Zap className="w-5 h-5 text-yellow-400 fill-current" /> : <ZapOff className="w-5 h-5" />}
          </Button>
        </DialogHeader>

        <div className="relative aspect-[3/4] bg-neutral-900 flex items-center justify-center">
          {error ? (
            <div className="text-white text-center p-6">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10" onClick={startStream}>
                Try Again
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
          )}
          
          {flash && !recording && <div className="absolute inset-0 bg-white/20 pointer-events-none animate-in fade-in" />}
        </div>

        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <div className="flex items-center justify-around mb-6">
            <button
              className={`text-sm font-semibold transition-colors ${mode === "image" ? "text-primary" : "text-white/60"}`}
              onClick={() => setMode("image")}
              disabled={recording}
            >
              PHOTO
            </button>
            <button
              className={`text-sm font-semibold transition-colors ${mode === "video" ? "text-primary" : "text-white/60"}`}
              onClick={() => setMode("video")}
              disabled={recording}
            >
              VIDEO
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={toggleFacingMode}
              disabled={recording}
            >
              <RotateCcw className="w-6 h-6" />
            </Button>

            <button
              className="relative flex items-center justify-center group"
              onClick={mode === "image" ? capturePhoto : (recording ? stopRecording : startRecording)}
            >
              <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 transition-transform active:scale-95">
                <div className={`w-full h-full rounded-full transition-all duration-300 ${
                  recording 
                    ? "bg-destructive scale-50 rounded-lg" 
                    : (mode === "image" ? "bg-white" : "bg-primary")
                }`} />
              </div>
            </button>

            <div className="w-12 h-12" /> {/* Placeholder for balance */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
