import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message } from "@/lib/firestore";
import { ArrowLeft, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Album() {
  const [, setLocation] = useLocation();
  const [images, setImages] = useState<{ id: string; url: string; createdAt: Date }[]>([]);
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
        return {
          id: d.id,
          url: data.imageUrl ?? "",
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      }).filter((img) => img.url);
      setImages(imgs);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div>
          <h1 className="font-semibold text-foreground">Our Memories</h1>
          <p className="text-xs text-muted-foreground">
            {images.length} photo{images.length !== 1 ? "s" : ""} shared
          </p>
        </div>
      </div>

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
                className="aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={img.url}
                  alt="Shared photo"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
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
