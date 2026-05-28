import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface Gif {
  id: string;
  url: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
    };
  };
}

interface Props {
  onSelect: (gif: { url: string; preview: string; width: number; height: number }) => void;
  trigger: React.ReactNode;
}

const GIPHY_API_KEY = "dc6zaTOxFJmzC"; // Public beta key

export function GifPicker({ onSelect, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
      
      const res = await fetch(endpoint);
      const { data } = await res.json();
      setGifs(data);
    } catch (err) {
      console.error("Failed to fetch GIFs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGifs(search);
    }
  }, [open, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl border-border">
        <div className="p-3 border-b border-border bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GIFs..."
              className="pl-9 pr-8 h-9 rounded-xl border-none bg-muted focus-visible:ring-primary/40"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="h-72 overflow-y-auto p-2 bg-background/50 backdrop-blur-sm custom-scrollbar">
          {loading && gifs.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect({
                      url: gif.images.fixed_height.url,
                      preview: gif.images.preview_gif.url,
                      width: parseInt(gif.images.fixed_height.width),
                      height: parseInt(gif.images.fixed_height.height),
                    });
                    setOpen(false);
                  }}
                  className="relative aspect-video rounded-lg overflow-hidden group hover:ring-2 ring-primary transition-all bg-muted"
                >
                  <img
                    src={gif.images.fixed_height.url}
                    alt="GIF"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
          {!loading && gifs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground">No GIFs found</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
