import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  isMine: boolean;
}

export function VoiceMessage({ url, isMine }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (val: number[]) => {
    const time = val[0];
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-3 py-1 min-w-[200px] sm:min-w-[240px] ${isMine ? "text-primary-foreground" : "text-foreground"}`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <Button
        variant="ghost"
        size="icon"
        className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${
          isMine 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        }`}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 h-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${
                isMine ? "bg-white/40" : "bg-primary/20"
              }`}
              style={{
                height: `${Math.max(4, Math.random() * (isPlaying ? 100 : 40))}%`,
                opacity: (currentTime / duration) * 20 > i ? 1 : 0.4
              }}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium opacity-80">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] font-medium opacity-80">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <Volume2 className={`w-4 h-4 opacity-40 flex-shrink-0 ${isMine ? "text-white" : "text-primary"}`} />
    </div>
  );
}
