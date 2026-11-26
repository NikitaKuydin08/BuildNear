import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { getIntro, getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { sendMessage } from "./actions";

const time = (d: Date) => d.toLocaleString("en-GB", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// A short chat with someone whose intro you both agreed to. Nothing here is sent to the Brain.
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Thread({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireUserId(`/inbox/${id}`);
  const intro = await getIntro(id);
  // Not a participant, or not accepted: the page does not exist for you.
  if (!intro || intro.status !== "accepted" || (intro.fromUserId !== me && intro.toUserId !== me)) notFound();
  const other = await getUser(intro.fromUserId === me ? intro.toUserId : intro.fromUserId);
  if (!other) notFound();

  const list = await getDb().select().from(messages).where(eq(messages.introId, id)).orderBy(asc(messages.createdAt)).limit(200);

  return (
    <>
      <div>
        <Link href="/inbox" className="text-sm text-neutral-500">← Inbox</Link>
        <h1 className="mt-1 text-2xl font-semibold">{other.name}</h1>
        <p className="text-xs text-neutral-500">Only the two of you can read this. The Brain never sees messages.</p>
      </div>

      <ul className="flex flex-col gap-2">
        {list.length === 0 && <li className="text-sm text-neutral-500">No messages yet. Say hi.</li>}
        {list.map((m) => {
          const mine = m.fromUserId === me;
          return (
            <li key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto bg-accent text-black" : "bg-neutral-100 dark:bg-neutral-900"}`}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`mt-1 text-[10px] ${mine ? "text-black/60" : "text-neutral-500"}`}>{time(m.createdAt)}</p>
            </li>
          );
        })}
      </ul>

      <form action={sendMessage} className="sticky bottom-20 flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
        <input type="hidden" name="introId" value={id} />
        {sp.error === "slow" && <p className="text-sm text-red-600">Slow down a little. Try again in a minute.</p>}
        <textarea name="body" required maxLength={500} rows={2} placeholder="Write a message (max 500 characters)" className="rounded-xl border border-neutral-300 bg-transparent p-3 text-sm dark:border-neutral-700" />
        <div className="flex gap-2">
          <button className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-medium text-black" type="submit">Send</button>
          <Link href={`/inbox/${id}`} className="flex min-h-11 items-center justify-center rounded-full border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700">Refresh</Link>
        </div>
      </form>
    </>
  );
}

export default function ThreadPage(props: Props) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <Thread params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
