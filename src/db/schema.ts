import { pgTable, uuid, text, timestamp, primaryKey, unique, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Structured data lives here. The Living Brain stores judgments and reasons, not these rows.
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  githubId: text("github_id").notNull().unique(),
  githubLogin: text("github_login").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  stack: text("stack").array().notNull().default(sql`'{}'::text[]`),
  topics: text("topics").array().notNull().default(sql`'{}'::text[]`),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  // 'in_person' | 'open' | 'chat_first'
  meetPreference: text("meet_preference").notNull().default("open"),
  // 'employed' | 'looking' | 'hiring' | null (optional, opt-in)
  workStatus: text("work_status"),
  // Optional: where the attendance badge is minted. Never shown to other users.
  walletAddress: text("wallet_address"),
  // Contacts the user chooses to share. Revealed only to someone whose intro request is accepted.
  telegram: text("telegram"),
  whatsapp: text("whatsapp"),
  linkedin: text("linkedin"),
  contactEmail: text("contact_email"),
  // Opt-in, coarse (rounded to ~1 km), latest position only. Ignored after 4 hours without a refresh.
  shareLocation: boolean("share_location").notNull().default(false),
  locationLat: doublePrecision("location_lat"),
  locationLon: doublePrecision("location_lon"),
  locationAt: timestamp("location_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  venue: text("venue").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  // Shown at the venue; entering it proves presence.
  checkInCode: text("check_in_code").notNull(),
  lumaUrl: text("luma_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// joinedAt = signed up for the event tab. checkedInAt = entered the venue code ("here now").
export const attendances = pgTable(
  "attendances",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    // Set when the person taps "I left". Hides "here now" without erasing proof of attendance (the badge needs checkedInAt).
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

// One request per ordered pair. Contacts (the GitHub link) are revealed only when status = 'accepted'.
export const introRequests = pgTable(
  "intro_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    message: text("message").notNull().default(""),
    // 'pending' | 'accepted' | 'declined'
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [unique("intro_pair").on(t.fromUserId, t.toUserId)],
);

// A minted attendance badge (ERC-721, non-transferable) on BSC testnet.
export const badges = pgTable(
  "badges",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    wallet: text("wallet").notNull(),
    txHash: text("tx_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

// Up to 3 per user; one is "featured" (the project they are proudest of) and shown on their card.
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  stack: text("stack").array().notNull().default(sql`'{}'::text[]`),
  url: text("url"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
