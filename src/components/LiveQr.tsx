"use client";

import { useEffect, useState } from "react";

// Organizer screen: fetches a fresh QR every 20 s. Each QR stays valid for about 90 s.
export function LiveQr({ slug }: { slug: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/qr/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { image: string };
        if (alive) {
          setImage(data.image);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    }
    load();
    const id = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug]);

  if (error && !image) return <p className="text-red-600">Could not load the QR. Are you signed in as an admin?</p>;
  if (!image) return <p className="text-neutral-400">Loading QR…</p>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt="Check-in QR code" className="w-full max-w-sm rounded-2xl bg-white p-2" />;
}
