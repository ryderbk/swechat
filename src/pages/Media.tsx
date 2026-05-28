import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message } from "@/lib/firestore";
import { ArrowLeft, ImageIcon, Link2, Paperclip, X, ExternalLink, FileText, File, FileSpreadsheet, Archive, PlayCircle, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FloatingSparkles } from "@/components/FloatingSparkles";

type Tab = "media" | "links" | "files";

function DocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (["zip", "gz", "rar"].includes(ext)) return <Archive className="w-5 h-5 text-yellow-500" />;
  if (ext === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Media() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("media");
  const [mediaItems, setMediaItems] = useState<{ id: string; type: "image" | "video" | "voice" | "gif"; url: string; createdAt: Date }[]>([]);
  const [links, setLinks] = useState<{ id: string; url: string; title: string; description: string; image: string | null; createdAt: Date }[]>([]);
  const [files, setFiles] = useState<{ id: string; name: string; url: string; size: number | null; createdAt: Date }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ url: string; type: string } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("deleted", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const media: typeof mediaItems = [];
      const lnks: typeof links = [];
      const fls: typeof files = [];
      
      snap.docs.forEach((d) => {
        const data = d.data() as Omit<Message, "id">;
        const createdAt = data.createdAt?.toDate?.() ?? new Date();

        if (data.type === "image" && data.imageUrl) {
          media.push({ id: d.id, type: "image", url: data.imageUrl, createdAt });
        } else if (data.type === "video" && data.videoUrl) {
          media.push({ id: d.id, type: "video", url: data.videoUrl, createdAt });
        } else if (data.type === "voice" && data.voiceUrl) {
          media.push({ id: d.id, type: "voice", url: data.voiceUrl, createdAt });
        } else if (data.type === "gif" && data.gifUrl) {
          media.push({ id: d.id, type: "gif", url: data.gifUrl, createdAt });
        }

        if (data.linkPreview) {
          lnks.push({
            id: d.id,
            url: data.linkPreview.url,
            title: data.linkPreview.title,
            description: data.linkPreview.description,
            image: data.linkPreview.image,
            createdAt,
          });
        }

        if (data.type === "document" && data.documentUrl) {
          fls.push({
            id: d.id,
            name: data.documentName ?? "Document",
            url: data.documentUrl,
            size: data.documentSize ?? null,
            createdAt,
          });
        }
      });

      setMediaItems(media);
      setLinks(lnks);
      setFiles(fls);
      setLoading(false);
    });
    return unsub;
  }, []);

  const groupByDate = <T extends { createdAt: Date }>(items: T[]) => {
    const groups: Record<string, T[]> = {};
    items.forEach((item) => {
      const key = format(item.createdAt, "MMMM d, yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  };

  return (
    <div className="h-full max-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Decorative Sparkles */}
      <FloatingSparkles />

      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-background/60 backdrop-blur-xl border-b border-primary/10 px-4 py-3 flex items-center gap-3 shadow-sm animate-fade-in">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/chat")}
          className="rounded-full w-10 h-10 hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-serif font-bold text-xl text-foreground drop-shadow-sm">Shared Media</h1>
        </div>
      </div>

      {/* Glass navigation tabs */}
      <div className="flex border-b border-primary/10 bg-card/60 backdrop-blur-md sticky top-[57px] z-10 animate-fade-in">
        {[
          { id: "media", icon: ImageIcon, label: "Media" },
          { id: "links", icon: Link2, label: "Links" },
          { id: "files", icon: Paperclip, label: "Files" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as Tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium border-b-2 transition-all duration-300 ${
              activeTab === id
                ? "border-primary text-primary font-bold scale-102"
                : "border-transparent text-muted-foreground hover:text-foreground hover:scale-102"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto z-10 animate-fade-in-up">
        {/* Media Tab (Polaroids!) */}
        {activeTab === "media" && (
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white p-4 pb-12 rounded-lg shadow aspect-square">
                    <Skeleton className="w-full h-full rounded" />
                  </div>
                ))}
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center max-w-xs mx-auto glass-card rounded-2xl p-8 border border-primary/15 shadow-romantic mt-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-float">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-2">No Media Yet</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Photos, videos, and voice recordings you send in chat will appear here as polaroids.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 justify-items-center">
                {mediaItems.map((item, index) => {
                  // Subtle natural tilts like a real scrapbook!
                  const tilts = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-1", "rotate-3", "-rotate-3"];
                  const tiltClass = tilts[index % tilts.length];

                  return (
                    <button
                      key={item.id}
                      onClick={() => setLightbox({ url: item.url, type: item.type })}
                      className={`polaroid-frame ${tiltClass} max-w-[180px] w-full border border-black/5 hover:z-20 cursor-pointer`}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative mb-2.5 rounded-sm shadow-inner border border-black/5">
                        {item.type === "image" ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        ) : item.type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <PlayCircle className="w-8 h-8 text-white/80" />
                            <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          </div>
                        ) : item.type === "gif" ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Music className="w-8 h-8 text-primary/60 animate-pulse-glow" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 font-mono text-center tracking-wide mt-1 truncate">
                        {format(item.createdAt, "MMM d, yyyy")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="max-w-2xl mx-auto p-6 space-y-4">
            {links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center max-w-xs mx-auto glass-card rounded-2xl p-8 border border-primary/15 shadow-romantic mt-16 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-float">
                  <Link2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-2">No Links Shared</h3>
                <p className="text-sm text-muted-foreground">Any shared URL previews will be organized here.</p>
              </div>
            ) : (
              links.map((lnk) => (
                <button
                  key={lnk.id}
                  onClick={() => window.open(lnk.url, "_blank")}
                  className="w-full text-left glass-card border border-primary/15 rounded-2xl overflow-hidden hover:scale-[1.01] transition-all duration-300 flex shadow-sm hover:shadow-romantic cursor-pointer"
                >
                  {lnk.image && (
                    <img src={lnk.image} alt="" className="w-24 h-24 object-cover flex-shrink-0 border-r border-primary/10" />
                  )}
                  <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(lnk.url).hostname}&sz=16`}
                        alt=""
                        className="w-3.5 h-3.5 rounded-sm"
                      />
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {new URL(lnk.url).hostname}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate mb-0.5">{lnk.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{lnk.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground m-4 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="max-w-2xl mx-auto p-6">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center max-w-xs mx-auto glass-card rounded-2xl p-8 border border-primary/15 shadow-romantic mt-16 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-float">
                  <Paperclip className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-2">No Files Shared</h3>
                <p className="text-sm text-muted-foreground">Any shared documents or zip files will be listable here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupByDate(files)).map(([date, dateFiles]) => (
                  <div key={date} className="space-y-2.5">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider pl-1">{date}</p>
                    <div className="space-y-2">
                      {dateFiles.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 bg-card/75 backdrop-blur-sm border border-primary/10 rounded-2xl p-4 hover:shadow-romantic hover:scale-[1.01] transition-all duration-300"
                        >
                          <div className="w-10 h-10 rounded-xl bg-muted/65 flex items-center justify-center border border-primary/5">
                            <DocIcon name={f.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                            {f.size != null && (
                              <p className="text-xs text-muted-foreground/80 mt-0.5">{formatBytes(f.size)}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox details modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full w-12 h-12 z-10 transition-all hover:scale-110"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {lightbox.type === "image" ? (
              <img src={lightbox.url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10 animate-scale-in" />
            ) : lightbox.type === "video" ? (
              <video src={lightbox.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg shadow-2xl animate-scale-in" />
            ) : lightbox.type === "gif" ? (
              <img src={lightbox.url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-scale-in" />
            ) : (
              <div className="glass-card bg-zinc-900/90 text-white p-8 rounded-3xl flex flex-col items-center gap-6 border border-white/10 shadow-2xl animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-heartbeat">
                  <Music className="w-8 h-8 text-primary animate-pulse-glow" />
                </div>
                <audio src={lightbox.url} controls autoPlay className="outline-none" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
