import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message } from "@/lib/firestore";
import { ArrowLeft, ImageIcon, Link2, Paperclip, X, ExternalLink, FileText, File, FileSpreadsheet, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Tab = "photos" | "links" | "files";

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

export default function Album() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("photos");
  const [images, setImages] = useState<{ id: string; url: string; createdAt: Date }[]>([]);
  const [links, setLinks] = useState<{ id: string; url: string; title: string; description: string; image: string | null; createdAt: Date }[]>([]);
  const [files, setFiles] = useState<{ id: string; name: string; url: string; size: number | null; createdAt: Date }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("type", "==", "image"),
      where("deleted", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const imgs = snap.docs.map((d) => {
        const data = d.data() as Omit<Message, "id">;
        return { id: d.id, url: data.imageUrl ?? "", createdAt: data.createdAt?.toDate?.() ?? new Date() };
      }).filter((img) => img.url);
      setImages(imgs);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("deleted", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const lnks: typeof links = [];
      const fls: typeof files = [];
      snap.docs.forEach((d) => {
        const data = d.data() as Omit<Message, "id">;
        if (data.linkPreview) {
          lnks.push({
            id: d.id,
            url: data.linkPreview.url,
            title: data.linkPreview.title,
            description: data.linkPreview.description,
            image: data.linkPreview.image,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          });
        }
        if (data.type === "document" && data.documentUrl) {
          fls.push({
            id: d.id,
            name: data.documentName ?? "Document",
            url: data.documentUrl,
            size: data.documentSize ?? null,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          });
        }
      });
      setLinks(lnks);
      setFiles(fls);
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          data-testid="button-back"
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/chat")}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">Our Memories</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-background sticky top-[57px] z-10">
        {[
          { id: "photos", icon: ImageIcon, label: "Photos" },
          { id: "links", icon: Link2, label: "Links" },
          { id: "files", icon: Paperclip, label: "Files" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as Tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Photos tab */}
        {activeTab === "photos" && (
          <div className="max-w-2xl mx-auto p-4">
            {loading ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No photos yet</h3>
                <p className="text-sm text-muted-foreground">Share your first photo in the chat</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    data-testid={`photo-${img.id}`}
                    onClick={() => setLightbox(img.url)}
                    className="aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                  >
                    <img src={img.url} alt="Shared photo" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links tab */}
        {activeTab === "links" && (
          <div className="max-w-2xl mx-auto p-4 space-y-3">
            {links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Link2 className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No links shared yet</p>
              </div>
            ) : (
              links.map((lnk) => (
                <button
                  key={lnk.id}
                  onClick={() => window.open(lnk.url, "_blank")}
                  className="w-full text-left bg-card border border-border rounded-2xl overflow-hidden hover:opacity-90 transition-opacity flex"
                >
                  {lnk.image && (
                    <img src={lnk.image} alt="" className="w-20 h-20 object-cover flex-shrink-0" />
                  )}
                  <div className="p-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(lnk.url).hostname}&sz=16`}
                        alt=""
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {new URL(lnk.url).hostname}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate">{lnk.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{lnk.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground m-3 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Files tab */}
        {activeTab === "files" && (
          <div className="max-w-2xl mx-auto p-4">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Paperclip className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No files shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupByDate(files)).map(([date, dateFiles]) => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{date}</p>
                    <div className="space-y-2">
                      {dateFiles.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:opacity-90 transition-opacity"
                        >
                          <DocIcon name={f.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            {f.size != null && (
                              <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
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

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <Button
            data-testid="button-close-lightbox"
            variant="ghost"
            size="icon"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/10 rounded-xl"
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={lightbox}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
