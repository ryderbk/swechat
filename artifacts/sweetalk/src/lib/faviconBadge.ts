let originalHref: string | null = null;

function getFaviconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>("link[rel~='icon']");
}

export async function drawBadge(count: number): Promise<void> {
  if (count <= 0) { clearBadge(); return; }

  const link = getFaviconLink();
  if (!link) return;

  if (!originalHref) originalHref = link.href;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = originalHref;

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    setTimeout(resolve, 500);
  });

  ctx.drawImage(img, 0, 0, 32, 32);

  const radius = 8;
  const cx = 24;
  const cy = 24;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#ef4444";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(count > 99 ? "99+" : String(count), cx, cy + 0.5);

  link.href = canvas.toDataURL("image/png");
}

export function clearBadge(): void {
  const link = getFaviconLink();
  if (!link) return;
  if (originalHref) {
    link.href = originalHref;
    originalHref = null;
  }
}
