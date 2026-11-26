export type MeetPreference = "in_person" | "open" | "chat_first";
export type WorkStatus = "employed" | "looking" | "hiring" | null;
export type Relationship = "peers" | "complementary" | "cross_domain" | "low";

export type Person = {
  stack: string[];
  topics: string[];
  tags: string[];
  meetPreference: MeetPreference;
  workStatus: WorkStatus;
};

export type MatchResult = {
  score: number; // 0-100
  relationship: Relationship;
  action: "meet" | "chat";
  why: string;
};

const norm = (xs: string[]) =>
  new Set(xs.map((x) => x.trim().toLowerCase()).filter(Boolean));
// Keeps the first list's original spelling (e.g. "TypeScript") for display.
const shared = (mine: string[], theirs: Set<string>) =>
  [...new Set(mine.map((x) => x.trim()).filter(Boolean))].filter((x) => theirs.has(x.toLowerCase()));
const pretty = (xs: string[]) => xs.slice(0, 3).join(", ");

// Plain, predictable score. The Living Brain agent later re-ranks the top few and rewrites "why".
export function scorePair(me: Person, other: Person): MatchResult {
  const sharedStack = shared(me.stack, norm(other.stack));
  const sharedField = shared([...me.topics, ...me.tags], norm([...other.topics, ...other.tags]));
  const sameStack = sharedStack.length > 0;
  const sameField = sharedField.length > 0;

  let relationship: Relationship;
  let score: number;
  const reasons: string[] = [];

  if (sameStack && sameField) {
    relationship = "peers";
    score = 70;
    reasons.push(`You both use ${pretty(sharedStack)} and care about ${pretty(sharedField)}`);
  } else if (!sameStack && sameField) {
    relationship = "complementary";
    score = 80;
    reasons.push(`Same field (${pretty(sharedField)}) with a different stack, a good pairing for a team`);
  } else if (sameStack && !sameField) {
    relationship = "cross_domain";
    score = 50;
    reasons.push(`Same tools (${pretty(sharedStack)}) in a different field`);
  } else {
    relationship = "low";
    score = 10;
    reasons.push("Not much in common yet");
  }

  // More overlap, small bonus (max +15).
  const extra = Math.max(0, sharedStack.length + sharedField.length - (sameStack ? 1 : 0) - (sameField ? 1 : 0));
  score += Math.min(15, extra * 5);

  // Job intent: one is looking, the other is hiring.
  const jobMatch =
    (me.workStatus === "looking" && other.workStatus === "hiring") ||
    (me.workStatus === "hiring" && other.workStatus === "looking");
  if (jobMatch) {
    score += 15;
    reasons.push("One of you is hiring and the other is looking");
  }

  // Meeting preference: shapes the suggestion and the order. Never excludes anyone.
  let action: "meet" | "chat" = "meet";
  if (me.meetPreference === "chat_first" || other.meetPreference === "chat_first") {
    action = "chat";
    score -= 30;
    reasons.push("Better to chat first");
  } else if (me.meetPreference === "in_person" && other.meetPreference === "in_person") {
    score += 10;
    reasons.push("You both like meeting in person");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, relationship, action, why: reasons.join(". ") + "." };
}
