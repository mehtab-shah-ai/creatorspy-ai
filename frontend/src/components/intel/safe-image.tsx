"use client";

import { useState, useMemo } from "react";

interface CreatorAvatarProps {
  src?: string;
  name: string;
  className?: string;
}

export function CreatorAvatar({
  src,
  name,
  className = "h-14 w-14 rounded-2xl",
}: CreatorAvatarProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Generate clean 2-letter initials (e.g. "Raj Shamani" -> "RS")
  const initials = useMemo(() => {
    const clean = (name || "Creator").replace(/[@_]/g, " ").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "CR";
  }, [name]);

  if (!src || error) {
    return (
      <div
        className={`${className} flex items-center justify-center font-black text-amber-300 font-mono select-none bg-gradient-to-br from-amber-500/25 via-rose-500/15 to-zinc-900 border border-amber-500/40 shadow-inner`}
        title={name}
      >
        <span className="text-base tracking-wider">{initials}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className} border border-amber-500/30 bg-zinc-900`}>
      <img
        src={src}
        alt=""
        aria-label={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center font-bold text-amber-400/50 font-mono bg-zinc-900 animate-pulse">
          {initials}
        </div>
      )}
    </div>
  );
}

interface VideoThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
}

export function VideoThumbnail({
  src,
  alt = "Video Thumbnail",
  className = "h-full w-full object-cover",
}: VideoThumbnailProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (currentSrc.includes("maxresdefault.jpg")) {
      setCurrentSrc(currentSrc.replace("maxresdefault.jpg", "hqdefault.jpg"));
    } else if (currentSrc.includes("hqdefault.jpg")) {
      setCurrentSrc(currentSrc.replace("hqdefault.jpg", "mqdefault.jpg"));
    } else if (!hasError) {
      setHasError(true);
      setCurrentSrc("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640");
    }
  };

  return (
    <img
      src={currentSrc}
      alt=""
      aria-label={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      loading="lazy"
      onError={handleError}
      className={className}
    />
  );
}
