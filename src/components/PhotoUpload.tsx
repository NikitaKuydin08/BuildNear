"use client";

import { useRef, useState, useTransition } from "react";
import { removePhoto, savePhoto } from "@/app/profile/actions";

const SIDE = 320;

// Picks a picture, crops it to a centred square and shrinks it on the phone, then uploads only the small result.
export function PhotoUpload({ userId, name, photoAt }: { userId: string; name: string; photoAt: number | null }) {
  const [pending, start] = useTransition();
  const [src, setSrc] = useState<string | null>(photoAt ? `/api/avatar/${userId}?v=${photoAt}` : null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const bmp = await createImageBitmap(file);
      const side = Math.min(bmp.width, bmp.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIDE;
      canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, SIDE, SIDE);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      start(async () => {
        const r = await savePhoto(dataUrl);
        if (r.ok) setSrc(dataUrl);
        else setError("Could not save the picture. Try another one.");
      });
    } catch {
      setError("Could not read that picture. Try a JPEG or PNG.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Your picture" className="size-20 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-lilac text-3xl font-semibold text-purple">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <input ref={input} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <button
          type="button"
          disabled={pending}
          onClick={() => input.current?.click()}
          className="min-h-11 rounded-[14px] bg-yellow px-4 text-sm font-semibold text-[#202127]"
        >
          {pending ? "Saving…" : src ? "Change picture" : "Add a picture"}
        </button>
        {src && (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => { await removePhoto(); setSrc(null); })}
            className="min-h-11 rounded-[14px] border border-line bg-card px-4 text-sm font-medium"
          >
            Remove
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
