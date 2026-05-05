import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const GRADIENTS = [
  "none",
  "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)",
  "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
  "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
  "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
  "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
  "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
  "linear-gradient(135deg, #fafafa 0%, #eeeeee 100%)",
];

const GRADIENT_LABELS = [
  "None",
  "Blush",
  "Sky",
  "Mint",
  "Peach",
  "Lavender",
  "Aqua",
  "Pebble",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function WallpaperSelector({ value, onChange }: Props) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onChange(`url(${dataUrl})`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {GRADIENTS.map((g, i) => (
          <button
            key={i}
            title={GRADIENT_LABELS[i]}
            onClick={() => onChange(g)}
            className={`h-12 rounded-xl border-2 transition-all hover:scale-105 ${
              value === g ? "border-primary" : "border-border"
            }`}
            style={{
              background: g === "none" ? "transparent" : g,
            }}
          >
            {g === "none" && <span className="text-xs text-muted-foreground">None</span>}
          </button>
        ))}
      </div>
      <label className="block">
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button variant="outline" size="sm" className="w-full rounded-xl gap-2" asChild>
          <span>
            <Upload className="w-3.5 h-3.5" />
            Upload custom image
          </span>
        </Button>
      </label>
    </div>
  );
}
