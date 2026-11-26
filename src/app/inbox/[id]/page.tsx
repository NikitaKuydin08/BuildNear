import { Suspense } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Avatar } from "@/components/Avatar";
import { BackBar, Icon, firstName } from "@/components/ui";
import { contactLinks } from "@/lib/contacts";
import { eventTitles, getIntro, getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { sendMessage } from "./actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const TZ = "Asia/Bangkok";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
function dayLabel(d: Date) {
  const k = dayKey(d);
  if (k === dayKey(new Date())) return "Today";
  if (k === dayKey(new Date(Date.now() - 86_400_000))) return "Yesterday";
  return d.toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short" });
}

// Figma 12/13 · Chat. Only the two people of an accepted introduction can open it. Nothing here is sent to the Brain.
// "Contacts they shared" has no Figma screen: it is the existing contact reveal, placed at the top of the chat.
async function Thread({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireUserId(`/inbox/${id}`);
  const intro = await getIntro(id);
  if (!intro || intro.status !== "accepted" || (intro.fromUserId !== me && intro.toUserId !== me)) notFound();
  const other = await getUser(intro.fromUserId === me ? intro.toUserId : intro.fromUserId);
  if (!other) notFound();

  const [list, titles] = await Promise.all([
    getDb().select().from(messages).where(eq(messages.introId, id)).orderBy(asc(messages.createdAt)).limit(200),
    eventTitles(intro.eventId ? [intro.eventId] : []),
  ]);
  const at = intro.eventId ? titles.get(intro.eventId) : null;
  const links = [{ label: "GitHub", text: `github.com/${other.githubLogin}`, href: `https://github.com/${other.githubLogin}` }, ...contactLinks(other)];
  const lastMine = [...list].reverse().find((m) => m.fromUserId === me)?.id;

  // The intro note opens the conversation, as the first message from whoever sent it.
  type Item = { key: string; mine: boolean; body: string; at: Date };
  const items: Item[] = [
    ...(intro.message ? [{ key: "intro", mine: intro.fromUserId === me, body: intro.message, at: intro.createdAt }] : []),
    ...list.map((m) => ({ key: m.id, mine: m.fromUserId === me, body: m.body, at: m.createdAt })),
  ];

  return (
    <>
      <BackBar href="/inbox" title={other.name} sub={at ? `Connected at ${at}` : "Connected"} />
      <AutoRefresh />
      <main className="flex min-h-[calc(100dvh-68px)] flex-col px-5 pb-36">
        <details className="rounded-[16px] bg-lilac p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-purple">
            <Icon name="link" size={18} /> Contacts {firstName(other.name)} shared
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-[12px] bg-card px-4 text-[13px]">
                <span className="font-semibold">{l.label}</span>
                <span className="truncate text-muted">{l.text}</span>
              </a>
            ))}
          </div>
        </details>

        <ul className="mt-4 flex flex-col gap-3">
          {items.length === 0 && <li className="mt-6 text-center text-[13px] text-muted">No messages yet. Say hi.</li>}
          {items.map((m, i) => {
            const prev = items[i - 1];
            const newDay = !prev || dayKey(prev.at) !== dayKey(m.at);
            return (
              <li key={m.key} className="flex flex-col">
                {newDay && (
                  <p className="my-4 text-center text-[10px] font-semibold uppercase tracking-[1px] text-muted">
                    {dayLabel(m.at)} · {hhmm(m.at)}
                  </p>
                )}
                {m.mine ? (
                  <div className="ml-auto max-w-[80%]">
                    <p className="whitespace-pre-wrap break-words rounded-[18px] bg-lilac px-5 py-4 text-[14px] leading-[20px]">{m.body}</p>
                    {m.key === lastMine && <p className="mt-2 text-right text-[11px] text-muted">Delivered · {hhmm(m.at)}</p>}
                  </div>
                ) : (
                  <div className="flex max-w-[88%] items-start gap-3">
                    {(!prev || prev.mine || newDay) ? (
                      <Avatar userId={other.id} name={other.name} photoAt={other.photoAt} size={36} round />
                    ) : (
                      <span className="w-9 shrink-0" />
                    )}
                    <p className="whitespace-pre-wrap break-words rounded-[18px] bg-card px-5 py-4 text-[14px] leading-[20px]">{m.body}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      <form action={sendMessage} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto max-w-md px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <input type="hidden" name="introId" value={id} />
          {sp.error === "slow" && <p className="mb-2 text-[12px] text-red-600">Slow down a little. Try again in a minute.</p>}
          <div className="flex gap-3">
            <input
              name="body"
              required
              maxLength={500}
              autoComplete="off"
              placeholder="Write a message"
              aria-label="Message"
              className="min-h-[58px] min-w-0 flex-1 rounded-[15px] border border-line bg-soft px-4 text-[15px] text-ink placeholder:text-muted"
            />
            <button type="submit" aria-label="Send message" className="flex h-[58px] w-[52px] shrink-0 items-center justify-center rounded-[15px] bg-yellow text-[#202127]">
              <Icon name="send" size={22} />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">Only the two of you can read this. The Brain never sees messages.</p>
        </div>
      </form>
    </>
  );
}

export default function ThreadPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
      <Thread params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
