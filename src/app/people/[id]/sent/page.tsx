import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withIndex } from "@/components/PersonDeck";
import { BackBar, IconBubble, Lead, Screen, Title, btnPrimary, btnSecondary, firstName } from "@/components/ui";
import { getUser, introStatesFor } from "@/lib/queries";
import { requireUserId, safePath } from "@/lib/session";

type Props = PageProps<"/people/[id]/sent">;

// Figma 10 · Introduction sent. Reads the real state of the request, so it never claims something that did not happen.
async function Sent({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const back = safePath(sp.back, "/people");
  // "Meet someone else" continues the deck at the next person.
  const at = Number(new URLSearchParams(back.split("?")[1] ?? "").get("i") ?? 0) || 0;
  const next = back.startsWith("/people") || back.startsWith("/nearby") ? withIndex(back, at + 1) : back;
  const meId = await requireUserId(`/people/${id}/sent`);
  const [other, states] = await Promise.all([getUser(id), introStatesFor(meId, [id])]);
  if (!other) notFound();
  const state = states.get(id);
  const them = firstName(other.name);

  // They had already said hello to you: sending yours connected you both right away.
  if (state?.status === "accepted") {
    return (
      <Screen>
        <div className="mt-8 self-center"><IconBubble name="check" /></div>
        <Title size={30} className="mt-12">You’re connected<br />with {them}.</Title>
        <Lead className="mt-4 text-[16px] leading-[24px]">You both said hello. Your chat is open and the contacts you each chose are shared.</Lead>
        <div className="mt-24 flex flex-col gap-3">
          <Link href={`/inbox/${state.id}`} className={btnPrimary}>Open chat</Link>
          <Link href={next} className={btnSecondary}>Meet someone else</Link>
        </div>
      </Screen>
    );
  }

  if (!state) {
    return (
      <Screen>
        <Title size={30} className="mt-8">That didn’t go through.</Title>
        <Lead className="mt-4">You can say hello to people who joined the same event as you, or who are nearby right now.</Lead>
        <Link href={back} className={`${btnPrimary} mt-10`}>Back</Link>
      </Screen>
    );
  }

  const waiting = state.status === "pending" && state.direction === "sent";
  return (
    <Screen>
      <div className="mt-8 self-center"><IconBubble name="send" /></div>
      <Title size={30} className="mt-12">
        A good conversation
        <br />
        starts somewhere.
      </Title>
      <Lead className="mt-4 text-[16px] leading-[24px]">
        Your introduction is with {them}.
        <br />
        When they accept, you can chat here.
      </Lead>
      <div className="mt-8 rounded-[16px] bg-card p-4">
        <p className="text-[15px] font-semibold">{waiting ? "Waiting for a reply" : state.status === "declined" ? "Not this time" : "Waiting for you"}</p>
        <p className="mt-1.5 text-[12px] text-muted">You can keep meeting other builders.</p>
      </div>
      <div className="mt-16 flex flex-col gap-3">
        <Link href="/inbox" className={btnPrimary}>View connections</Link>
        <Link href={next} className={btnSecondary}>Meet someone else</Link>
      </div>
    </Screen>
  );
}

export default function SentPage(props: Props) {
  return (
    <>
      <BackBar href="/inbox" title="Introduction sent" />
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Sent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
