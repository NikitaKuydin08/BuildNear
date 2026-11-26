import { Suspense } from "react";
import { LocationPanel } from "@/components/LocationPanel";
import { cardOf } from "@/components/PeopleFeed";
import { DeckEmpty, PersonDeck, parseIndex } from "@/components/PersonDeck";
import { TopBar } from "@/components/TopBar";
import { Eyebrow, Lead, Screen, Title } from "@/components/ui";
import { scorePair, type MeetPreference, type Person, type WorkStatus } from "@/lib/match";
import { distanceLabel, isFresh, LOCATION_TTL_MS } from "@/lib/presence";
import { featuredFor, getUser, introStatesFor, nearbyPeople } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const toPerson = (u: { stack: string[]; topics: string[]; tags: string[]; meetPreference: string; workStatus: string | null }): Person => ({
  stack: u.stack, topics: u.topics, tags: u.tags,
  meetPreference: u.meetPreference as MeetPreference,
  workStatus: u.workStatus as WorkStatus,
});

// Nearby has no Figma screen: it reuses the People deck and the Figma colours, for cafés and co-working spaces.
async function NearbyView({ searchParams }: { searchParams: PageProps<"/nearby">["searchParams"] }) {
  const sp = await searchParams;
  const meId = await requireUserId("/nearby");
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
  const ranked = people.map((p) => ({ ...p, match: scorePair(mine, toPerson(p.user)) })).sort((a, b) => b.match.score - a.match.score);

  return (
    <>
      <div className="mt-6">
        <LocationPanel sharing={sharing} until={until} />
      </div>
      {sharing && (
        <div className="mt-6">
          {ranked.length === 0 ? (
            <DeckEmpty title="No one nearby yet." body="Nobody else is sharing their area right now. Check back later." />
          ) : (
            <PersonDeck
              base="/nearby"
              index={parseIndex(sp.i)}
              items={ranked.map(({ user, km, match }) => ({
                card: cardOf(user, { hereNow: true, distance: distanceLabel(km), project: projectsBy.get(user.id), why: match.why, action: match.action }),
                state: states.get(user.id),
              }))}
            />
          )}
        </div>
      )}
    </>
  );
}

export default function NearbyPage(props: PageProps<"/nearby">) {
  return (
    <>
      <TopBar />
      <Screen>
        <Eyebrow className="mt-2">No event needed</Eyebrow>
        <Title size={32} className="mt-3">
          Builders
          <br />
          near you.
        </Title>
        <Lead className="mt-3">For cafés, co-working spaces and libraries.</Lead>
        <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
          <NearbyView searchParams={props.searchParams} />
        </Suspense>
      </Screen>
    </>
  );
}
