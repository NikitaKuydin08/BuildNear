"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { btnPrimary, btnSecondary } from "@/components/ui";

// In-app scanner for the event QR. Decodes the camera picture on the phone (nothing is uploaded),
// and only follows a link that belongs to this event on this site.
export function QrScanner({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    }

    function handle(data: string) {
      try {
        const u = new URL(data, window.location.origin);
        const ok = u.origin === window.location.origin && u.pathname === `/events/${slug}/checkin` && !!u.searchParams.get("t");
        if (!ok) return setMsg("That QR is not for this event.");
        stop();
        setOpen(false);
        router.push(u.pathname + u.search);
      } catch {
        setMsg("That QR is not for this event.");
      }
    }

    function tick() {
      const v = video.current;
      if (stopped || !v || !ctx) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
        const w = 480;
        const h = Math.round((v.videoHeight / v.videoWidth) * w);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(v, 0, 0, w, h);
        const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
        if (code?.data) return handle(code.data);
      }
      raf = requestAnimationFrame(tick);
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        raf = requestAnimationFrame(tick);
      } catch {
        setMsg("Camera not available. Allow camera access, or use your phone's camera app to scan the QR.");
        setOpen(false);
      }
    })();

    return stop;
  }, [open, slug, router]);

  return (
    <div className="flex flex-col gap-2">
      {open ? (
        <div className="flex flex-col gap-2">
          <video ref={video} playsInline muted className="aspect-square w-full rounded-[18px] bg-black object-cover" />
          <button onClick={() => setOpen(false)} className={btnSecondary}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setMsg(null); setOpen(true); }}
          className={btnPrimary}
        >
          Scan QR to check in
        </button>
      )}
      {msg && <p className="text-[13px] text-red-600">{msg}</p>}
    </div>
  );
}
