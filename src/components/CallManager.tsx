import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerUid } from "@/hooks/usePartnerUid";
import {
  subscribeToCallForCallee,
  CallDoc,
  sendMessage,
} from "@/lib/firestore";
import {
  createOffer,
  createAnswer,
  endCall,
  subscribeToCallDoc,
  closePeer,
} from "@/lib/webrtc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  FlipHorizontal,
} from "lucide-react";

interface ActiveCallState {
  roomId: string;
  type: "voice" | "video";
  role: "caller" | "callee";
  startedAt: number;
  pc: RTCPeerConnection | null;
}

export function CallManager() {
  const { user } = useAuth();
  const { partnerUid, partnerName } = usePartnerUid();
  const [incomingCall, setIncomingCall] = useState<{
    roomId: string;
    data: CallDoc;
  } | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubCallRef = useRef<(() => void) | null>(null);

  const partnerInitial = partnerName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCallForCallee(user.uid, (roomId, data) => {
      if (!incomingCall && !activeCall) {
        setIncomingCall({ roomId, data });
      }
    });
    return unsub;
  }, [user, incomingCall, activeCall]);

  useEffect(() => {
    if (!activeCall) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeCall]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const getLocalStream = async (type: "voice" | "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const attachRemoteStream = (pc: RTCPeerConnection) => {
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };
  };

  const startCallTimer = (roomId: string) => {
    unsubCallRef.current = subscribeToCallDoc(roomId, (data) => {
      if (!data || data["status"] === "ended") {
        handleHangUp(roomId, true);
      }
    });
  };

  const handleStartCall = async (type: "voice" | "video") => {
    if (!user || !partnerUid) return;
    const roomId = `call_${Date.now()}`;
    const stream = await getLocalStream(type);
    const pc = await createOffer(roomId, stream, user.uid, partnerUid, type);
    attachRemoteStream(pc);
    setActiveCall({ roomId, type, role: "caller", startedAt: Date.now(), pc });
    startCallTimer(roomId);
  };

  const handleAccept = async () => {
    if (!incomingCall) return;
    const { roomId, data } = incomingCall;
    setIncomingCall(null);
    const stream = await getLocalStream(data.type);
    const pc = await createAnswer(roomId, stream);
    attachRemoteStream(pc);
    setActiveCall({ roomId, type: data.type, role: "callee", startedAt: Date.now(), pc });
    startCallTimer(roomId);
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    await endCall(incomingCall.roomId);
    if (user) {
      await sendMessage(user.uid, {
        type: "text",
        text: "📵 Missed call",
      });
    }
    setIncomingCall(null);
  };

  const handleHangUp = async (roomIdOverride?: string, silent = false) => {
    const roomId = roomIdOverride ?? activeCall?.roomId;
    if (!roomId) return;
    const dur = elapsed;
    closePeer();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (unsubCallRef.current) unsubCallRef.current();
    if (!silent) await endCall(roomId);
    if (user && !silent) {
      await sendMessage(user.uid, {
        type: "text",
        text: `📞 Call ended (${formatElapsed(dur)})`,
      });
    }
    setActiveCall(null);
    setElapsed(0);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMuted((m) => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setVideoOff((v) => !v);
  };

  if (!incomingCall && !activeCall) {
    return (
      <div className="hidden" data-call-trigger>
        <button
          id="start-voice-call"
          onClick={() => handleStartCall("voice")}
          className="hidden"
        />
        <button
          id="start-video-call"
          onClick={() => handleStartCall("video")}
          className="hidden"
        />
      </div>
    );
  }

  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/30">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {partnerInitial}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full ring-4 ring-primary/20 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{partnerName}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {incomingCall.data.type === "video" ? "📹 Video call" : "📞 Voice call"}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <button
            onClick={handleDecline}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity active:scale-95"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={handleAccept}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity active:scale-95"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (activeCall) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {activeCall.type === "video" ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-4 w-28 h-40 rounded-xl object-cover border-2 border-white/20 cursor-move"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {partnerInitial}
              </AvatarFallback>
            </Avatar>
            <p className="text-white text-xl font-semibold">{partnerName}</p>
            <div className="flex gap-1 items-end h-8">
              {[3,5,7,5,3,6,4].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-primary rounded-full animate-pulse"
                  style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <span className="text-white/80 text-sm bg-black/40 rounded-full px-4 py-1">
            {formatElapsed(elapsed)}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              muted ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          {activeCall.type === "video" && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                videoOff ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {videoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
            </button>
          )}

          <button
            onClick={() => handleHangUp()}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export function useCallTrigger() {
  const startVoiceCall = () => {
    document.getElementById("start-voice-call")?.click();
  };
  const startVideoCall = () => {
    document.getElementById("start-video-call")?.click();
  };
  return { startVoiceCall, startVideoCall };
}
