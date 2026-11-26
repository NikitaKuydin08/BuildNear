import { Suspense } from "react";
import { IntroControl } from "@/components/IntroControl";
import { LocationPanel } from "@/components/LocationPanel";
import { PersonCard } from "@/components/PersonCard";
import { scorePair, type MeetPreference, type Person, type WorkStatus } from "@/lib/match";
import { distanceLabel, isFresh, LOCATION_TTL_MS } from "@/lib/presence";
import { featuredFor, getUser, introStatesFor, nearbyPeople } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const toPerson = (u: { stack: string[]; topics: string[]; tags: string[]; meetPreference: string; workStatus: string | null }): Person => ({
  stack: u.stack, topics: u.topics, tags: u.tags,
  meetPreference: u.meetPreference as MeetPreference,
  workStatus: u.workStatus as WorkStatus,
});

async function NearbyView() {
  const meId = await requireUserId();
  const me = await getUser(meId);
  if (!me) return null;

  const sharing = me.shareLocation && isFresh(me.locationAt);
  const until = sharing && me.locationAt
    ? new Date(me.locationAt.getTime() + LOCATION_TTL_MS).toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" })
    : null;

  const people = sharing ? await nearbyPeople(me) : [];
  const ids = people.map((p) => p.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);
  const mine = toPerson(me);
  const ranked = people
    .map((p) => ({ ...p, match: scorePair(mine, toPerson(p.user)) }))
    .sort((a, b) => b.match.score - a.match.score);

  return (
    <>
      <LocationPanel sharing={sharing} until={until} />
      {sharing && ranked.length === 0 && <p className="text-neutral-500">No one else is sharing nearby right now. Check back later.</p>}
      <ul className="flex flex-col gap-3">
        {ranked.map(({ user, km, match }) => (
          <PersonCard
            key={user.id}
            userId={user.id}
            photoAt={user.photoAt}
            name={user.name}
            stack={user.stack}
            topics={user.topics}
            meetPreference={user.meetPreference as MeetPreference}
            hereNow
            distance={distanceLabel(km)}
            project={projectsBy.get(user.id)}
            why={match.why}
            action={match.action}
          >
            <IntroControl toUserId={user.id} back="/nearby" state={states.get(user.id)} />
          </PersonCard>
        ))}
      </ul>
    </>
  );
}

export default function NearbyPage() {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Nearby</h1>
      <p className="text-sm text-neutral-500">For cafes, co-working spaces and libraries: no event needed.</p>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <NearbyView />
      </Suspense>
    </main>
  );
}
