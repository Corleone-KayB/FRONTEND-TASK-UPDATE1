"use client";

import { useEffect, useState } from "react";

// Samples the average color of an image's top-left corner (where these headshot-style
// photos tend to show their solid backdrop, away from the subject) so a card can be
// tinted to match. Requires the image response to allow cross-origin pixel reads
// (Access-Control-Allow-Origin) - if it doesn't, the canvas read throws and this
// silently returns null so callers can fall back to a default palette instead.
export function useDominantColor(src: string | null): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Downscaling a corner region into a single pixel gives a cheap average sample.
        ctx.drawImage(img, 0, 0, img.naturalWidth * 0.15, img.naturalHeight * 0.15, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setColor(`rgb(${r}, ${g}, ${b})`);
      } catch {
        setColor(null);
      }
    };
    img.onerror = () => setColor(null);
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Gate on `src` here rather than resetting `color` synchronously in the effect -
  // avoids a same-tick setState-in-effect (flagged by the React Compiler) while still
  // correctly reporting null the instant `src` goes away, not a stale prior color.
  return src ? color : null;
}

export function isLightColor(rgb: string): boolean {
  const match = rgb.match(/\d+/g);
  if (!match) return false;
  const [r, g, b] = match.map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
