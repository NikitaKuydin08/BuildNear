"use client";

import { useEffect, useState } from "react";

type Prompt = Event & { prompt: () => Promise<void> };

// Registers the service worker and shows a one-time "add to home screen" hint:
// a real install button on Android/Chrome, and the Share-menu steps on iPhone.
export function InstallHint() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("install-hint-dismissed") === "1";
    } catch {}
    if (standalone || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem("install-hint-dismissed", "1");
    } catch {}
  }

  if (hidden || (!prompt && !ios)) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
      <div className="flex-1">
        <p className="font-medium">Add BuildNear to your home screen</p>
        {ios ? (
          <p className="text-xs text-neutral-500">Tap the Share button in Safari, then “Add to Home Screen”.</p>
        ) : (
          <p className="text-xs text-neutral-500">Opens like an app, full screen.</p>
        )}
      </div>
      {prompt && (
        <button
          onClick={async () => { await prompt.prompt(); dismiss(); }}
          className="min-h-11 rounded-full bg-accent px-4 text-sm font-medium text-black"
        >
          Install
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss" className="min-h-11 px-2 text-neutral-500">✕</button>
    </div>
  );
}
