import { FIELD_KEYS } from "@/lib/fields";

// Feed filters live in the URL (?meet=&stack=&field=), so they survive switching tabs and can be shared as a link.
export type FeedFilters = { meet: string; stack: string; field: string };
export const NO_FILTERS: FeedFilters = { meet: "", stack: "", field: "" };

const MEET = ["in_person", "open", "chat_first"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: Record<string, string | string[] | undefined>): FeedFilters {
  const meet = one(sp.meet);
  const field = one(sp.field);
  return {
    meet: MEET.includes(meet) ? meet : "",
    stack: one(sp.stack).trim().slice(0, 30),
    field: FIELD_KEYS.includes(field) ? field : "",
  };
}

export const hasFilters = (f: FeedFilters) => !!(f.meet || f.stack || f.field);

export function filterQuery(f: FeedFilters) {
  const q = new URLSearchParams();
  if (f.meet) q.set("meet", f.meet);
  if (f.stack) q.set("stack", f.stack);
  if (f.field) q.set("field", f.field);
  return q.toString();
}

// Adds the filters to a feed link such as "/people?event=x" or "/events/x".
export function withFilters(base: string, f: FeedFilters) {
  const q = filterQuery(f);
  return q ? `${base}${base.includes("?") ? "&" : "?"}${q}` : base;
}

export function matchesFilters(u: { stack: string[]; topics: string[]; meetPreference: string }, f: FeedFilters) {
  if (f.meet && u.meetPreference !== f.meet) return false;
  if (f.field && !u.topics.map((t) => t.toLowerCase()).includes(f.field)) return false;
  if (f.stack) {
    const needle = f.stack.toLowerCase();
    if (!u.stack.some((s) => s.toLowerCase().includes(needle))) return false;
  }
  return true;
}
