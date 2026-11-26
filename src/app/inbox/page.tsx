import { Suspense } from "react";
import { listInbox } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { respondIntro } from "./actions";

type Contact = { login: string; links: { label: string; text: string; href: string }[] };
type Row = { id: string; status: string; message: string; name: string; stack: string[]; contact: Contact | null };

function Reveal({ contact }: { contact: Contact | null }) {
  if (!contact) return null;
  const btn =
    "flex min-h-11 items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 text-sm dark:border-neutral-800";
  return (
    <div className="mt-3 flex flex-col gap-2">
      <a href={`https://github.com/${contact.login}`} target="_blank" rel="noreferrer" className={btn}>
        <span className="font-medium">GitHub</span>
        <span className="truncate text-neutral-500">github.com/{contact.login}</span>
      </a>
      {contact.links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={btn}>
          <span className="font-medium">{l.label}</span>
          <span className="truncate text-neutral-500">{l.text}</span>
        </a>
      ))}
    </div>
  );
}

function Card({ row, children }: { row: Row; children?: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="font-medium">{row.name}</p>
      {row.stack.length > 0 && <p className="text-xs text-neutral-500">{row.stack.slice(0, 5).join(" · ")}</p>}
      {row.message && <p className="mt-2 text-sm">“{row.message}”</p>}
      {children}
    </li>
  );
}

async function InboxView() {
  const me = await requireUserId();
  const { incoming, outgoing } = await listInbox(me);

  const pending = incoming.filter((r) => r.status === "pending");
  const connected = [...incoming, ...outgoing].filter((r) => r.status === "accepted");
  const sent = outgoing.filter((r) => r.status !== "accepted");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Requests for you</h2>
        {pending.length === 0 && <p className="text-sm text-neutral-500">Nothing waiting.</p>}
        <ul className="flex flex-col gap-3">
          {pending.map((r) => (
            <Card key={r.id} row={r}>
              <form action={respondIntro} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <button name="decision" value="accept" className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-medium text-black">
                  Accept
                </button>
                <button name="decision" value="decline" className="min-h-11 flex-1 rounded-full border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700">
                  Decline
                </button>
              </form>
            </Card>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Connected</h2>
        {connected.length === 0 && <p className="text-sm text-neutral-500">No connections yet. Contacts show up here once an intro is approved.</p>}
        <ul className="flex flex-col gap-3">
          {connected.map((r) => (
            <Card key={r.id} row={r}>
              <Reveal contact={r.contact} />
            </Card>
          ))}
        </ul>
      </section>

      {sent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">Sent by you</h2>
          <ul className="flex flex-col gap-3">
            {sent.map((r) => (
              <Card key={r.id} row={r}>
                <p className="mt-2 text-xs text-neutral-500">{r.status === "pending" ? "Waiting for an answer" : "Not this time"}</p>
              </Card>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <InboxView />
      </Suspense>
    </main>
  );
}
