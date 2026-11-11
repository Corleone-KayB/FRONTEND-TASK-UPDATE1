"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageSlot({
  src,
  fallbackSrc,
  alt,
  label,
  hint,
  className,
  imageClassName,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  label: string;
  hint: string;
  className?: string;
  imageClassName?: string;
}) {
  const [source, setSource] = useState(src);

  if (source) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={source}
          alt={alt}
          fill
          className={cn("object-contain", imageClassName)}
          onError={() => setSource(fallbackSrc ?? "")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-mindora-purple/25 bg-[#F9F6FF] px-4 py-6 text-center",
        className
      )}
    >
      <ImageIcon className="h-6 w-6 text-mindora-purple" />
      <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
      <p className="max-w-[220px] text-xs leading-relaxed text-[#6B7280]">{hint}</p>
    </div>
  );
}
