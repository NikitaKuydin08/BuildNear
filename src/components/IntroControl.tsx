import { sendIntro } from "@/app/inbox/actions";
import type { IntroState } from "@/lib/queries";

// The only action on a card. Contacts stay hidden until the other person accepts.
export function IntroControl({ toUserId, back, state }: { toUserId: string; back: string; state?: IntroState }) {
  if (state?.status === "accepted") {
    return <p className="mt-3 text-sm font-medium text-green-700 dark:text-green-400">Connected. Open your Inbox for the link.</p>;
  }
  if (state?.status === "declined") {
    return <p className="mt-3 text-xs text-neutral-500">Intro closed.</p>;
  }
  if (state?.direction === "sent") {
    return <p className="mt-3 text-sm text-neutral-500">Request sent. Waiting for an answer.</p>;
  }
  const incoming = state?.direction === "received";
  return (
    <form action={sendIntro} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="toUserId" value={toUserId} />
      <input type="hidden" name="back" value={back} />
      {incoming ? (
        <p className="text-sm text-neutral-500">They asked to connect with you. Tap to accept.</p>
      ) : (
        <input
          name="message"
          maxLength={200}
          placeholder="Say hi (optional)"
          className="min-h-11 rounded-xl border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
        />
      )}
      <button className="min-h-11 rounded-full bg-accent px-4 text-sm font-medium text-black" type="submit">
        {incoming ? "Accept intro" : "Request intro"}
      </button>
    </form>
  );
}
