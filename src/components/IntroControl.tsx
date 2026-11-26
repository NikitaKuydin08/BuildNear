import Link from "next/link";
import { sendIntro } from "@/app/inbox/actions";
import { Icon, btnPrimary } from "@/components/ui";
import type { IntroState } from "@/lib/queries";

// The "Let's connect" button (Figma 05) in every state of an introduction. Contacts stay hidden until it is accepted.
// `back` is where the intro screens return to (the feed or the profile the person came from).
export function IntroControl({ toUserId, back, state }: { toUserId: string; back: string; state?: IntroState }) {
  if (state?.status === "accepted") {
    return (
      <Link href={`/inbox/${state.id}`} className={btnPrimary}>
        <Icon name="chat" size={20} /> Open chat
      </Link>
    );
  }
  if (state?.status === "declined") {
    return <button disabled className={btnPrimary}>Intro closed</button>;
  }
  if (state?.direction === "sent") {
    return <button disabled className={btnPrimary}>Introduction sent</button>;
  }
  if (state?.direction === "received") {
    // They said hello first: one tap accepts it.
    return (
      <form action={sendIntro} className="w-full">
        <input type="hidden" name="toUserId" value={toUserId} />
        <input type="hidden" name="back" value={`/inbox`} />
        <button className={btnPrimary} type="submit">
          <Icon name="check" size={20} /> Accept their hello
        </button>
      </form>
    );
  }
  return (
    <Link href={`/people/${toUserId}/intro?back=${encodeURIComponent(back)}`} className={btnPrimary}>
      <Icon name="plus" size={20} /> Let’s connect
    </Link>
  );
}
