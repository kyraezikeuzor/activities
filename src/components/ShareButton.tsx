"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    try {
      const url = window.location.href;
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setMessage("Link copied"); }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setMessage("Copy the page address to share this project.");
    }
  }
  return <div>
    <button type="button" onClick={share} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-muted"><Share2 className="h-4 w-4" aria-hidden />Share</button>
    <p className="text-center text-xs text-foreground" role="status">{message}</p>
  </div>;
}
