import { Suspense } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { TopBar } from "@/components/TopBar";
import { EventPill, SectionLabel, Screen, Title, btnPrimary, btnSecondary } from "@/components/ui";
import { isHere } from "@/lib/presence";
import { activeEventsFor, eventCounts, eventTitles, lastMessages, listInbox } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { respondIntro } from "./actions";

type Row = Awaited<ReturnType<typeof listInbox>>["incoming"][number];

function Person({ row, children, href }: { row: Row; children: React.ReactNode; href?: string }) {
  const body = (
    <div className="flex items-center gap-4 rounded-[18px] bg-card p-4">
      <Avatar userId={row.userId} name={row.name} photoAt={row.photoAt} size={56} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold leading-[22px]">{row.name}</p>
        {children}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

// Figma 11 · Connections. "Requests for you" has no Figma screen; it uses the same rows with Accept / Decline.
async function InboxView() {
  const me = await requireUserId("/inbox");
  const [{ incoming, outgoing }, past] = await Promise.all([listInbox(me), activeEventsFor(me)]);

  const pending = incoming.filter((r) => r.status === "pending");
  const connected = [...incoming, ...outgoing].filter((r) => r.status === "accepted").sort((a, b) => b.at.getTime() - a.at.getTime());
  const sent = outgoing.filter((r) => r.status !== "accepted");
  const [last, titles] = await Promise.all([
    lastMessages(connected.map((r) => r.id)),
    eventTitles([...connected, ...sent].map((r) => r.eventId).filter((x): x is string => !!x)),
  ]);
  const current = past.find((r) => isHere(r.checkedInAt, r.leftAt, r.event.endsAt));
  const counts = current ? await eventCounts(current.event.id) : null;

  return (
    <>
      {current && counts && (
        <EventPill href={`/events/${current.event.slug}`} title={current.event.title} sub={`Checked in · ${counts.here} ${counts.here === 1 ? "builder" : "builders"} here`} />
      )}
      <Title size={30} className="mt-6">
        A hello becomes
        <br />
        a conversation.
      </Title>

      {pending.length > 0 && (
        <section className="mt-8">
          <SectionLabel>Requests for you</SectionLabel>
          <ul className="mt-3 flex flex-col gap-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-[18px] bg-card p-4">
                <div className="flex items-center gap-4">
                  <Avatar userId={r.userId} name={r.name} photoAt={r.photoAt} size={56} />
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold">{r.name}</p>
                    <p className="text-[10px] text-purple">{r.eventId && titles.get(r.eventId) ? `Said hello at ${titles.get(r.eventId)}` : "Said hello"}</p>
                  </div>
                </div>
                {r.message && <p className="mt-3 rounded-[14px] bg-soft p-3 text-[14px] leading-[20px]">“{r.message}”</p>}
                <form action={respondIntro} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button name="decision" value="decline" className={`${btnSecondary} !w-auto px-6`}>Decline</button>
                  <button name="decision" value="accept" className={btnPrimary}>Accept</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <SectionLabel>Connections</SectionLabel>
        {connected.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted">No connections yet. When someone accepts your hello, your chat and their contacts show up here.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {connected.map((r) => {
              const m = last.get(r.id);
              const at = r.eventId ? titles.get(r.eventId) : null;
              return (
                <li key={r.id}>
                  <Person row={r} href={`/inbox/${r.id}`}>
                    <p className="mt-1 truncate text-[13px] text-muted">{m ? `${m.fromUserId === me ? "You: " : ""}${m.body}` : r.message ? `“${r.message}”` : "Say hi."}</p>
                    <p className="mt-1 text-[10px] text-purple">{at ? `Mutual connection · ${at}` : "Mutual connection"}</p>
                  </Person>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {sent.length > 0 && (
        <section className="mt-8">
          <SectionLabel>Pending introductions</SectionLabel>
          <ul className="mt-3 flex flex-col gap-3">
            {sent.map((r) => (
              <li key={r.id}>
                <Person row={r}>
                  <p className="mt-1 text-[12px] text-muted">{r.status === "pending" ? "Waiting for a reply" : "Not this time"}</p>
                </Person>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-[14px] leading-[21px] text-muted">
        Good connections take a little time.
        <br />
        There’s a whole room to explore.
      </p>
      <Link href="/people" className={`${btnSecondary} mt-6`}>Meet more builders</Link>
    </>
  );
}

export default function InboxPage() {
  return (
    <>
      <TopBar />
      <Screen>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <InboxView />
        </Suspense>
      </Screen>
    </>
  );
}
