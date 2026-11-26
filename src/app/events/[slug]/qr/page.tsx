import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LiveQr } from "@/components/LiveQr";
import { requireAdmin } from "@/lib/organizer";
import { getEventBySlug } from "@/lib/queries";

// Admin screen: show it on a projector or print it. Only admins can open it, because the QR
// lets anyone who sees it check in.
async function QrView({ params }: { params: PageProps<"/events/[slug]/qr">["params"] }) {
  const { slug } = await params;
  await requireAdmin(`/events/${slug}/qr`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <p className="text-neutral-500">Scan to check in. The code changes every few seconds.</p>
      <LiveQr slug={slug} />
    </div>
  );
}

export default function QrPage(props: PageProps<"/events/[slug]/qr">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <QrView params={props.params} />
      </Suspense>
    </main>
  );
}
