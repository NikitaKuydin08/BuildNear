import type { MetadataRoute } from "next";

// Makes the app installable (PWA). Name is a placeholder until the final product name is chosen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BuildNear",
    short_name: "BuildNear",
    description: "Find builders to talk to at events, cafes and co-working spaces.",
    start_url: "/events",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    categories: ["social", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Events", url: "/events" },
      { name: "Nearby", url: "/nearby" },
      { name: "Inbox", url: "/inbox" },
    ],
  };
}
