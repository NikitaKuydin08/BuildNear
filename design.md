# BNB Hack Bangkok: design pages (approved 2026-11-26)
 
Working name: BuilderMatch (placeholder). Solo builder: Nikita. Event: BNB Hack Bangkok, Nov 25-27, 2026. Tracks: Developer Track + ChatAndBuild (Living Brain). Skipped: Flap, OpenFour, CoinMarketCap, Cournot, AWS.
 
## 1. Project overview
- **Problem:** Builders (developers, data analysts, IT specialists) find it hard to approach strangers at events, co-working spaces, libraries and cafes. They fear dead silence, so useful conversations never start.
- **Solution:** A mobile-first installable PWA that builds profiles from GitHub, shows who is at the same event, and ranks people by stack, field, intent and meeting preference. Contacts stay hidden until an intro request is approved.
- **Unique:** Luma gets you through the door; this app helps you find who to talk to once inside. A matchmaker agent uses Living Brain as persistent memory (past events, intros). A non-transferable BNB Chain NFT badge proves verified attendance.
- **Market:** Bangkok first (a networking app needs density). Nothing is Thailand-specific.
- **Platform:** Installable PWA deployed over HTTPS (link or QR for judges). No app store needed. Likely stack: TypeScript (Next.js), since Living Brain has a TypeScript SDK.
## 2. Core user flow
1. Sign in with GitHub (GitHub App, read-only, public data).
2. Profile builds itself (stack, topics). User adds tags, meet preference (in-person / open / chat-first), optional work status, and optional manual private projects (title, stack, one-line description).
3. Join an event tab.
4. At the venue, enter the event code (valid only in the event window) to check in. Others in the tab see "here now".
5. Browse Feed 1 (Everyone) and Feed 2 (For you).
6. Send an intro request with a short note. If accepted, each side sees the contacts the other chose to share. Contacts (and the GitHub link) stay hidden until then.
7. Claim the badge at check-in (wallet optional, connected at claim time; otherwise the verified check-in is kept and the badge can be minted later).
8. At the next event, the agent uses Living Brain memory to improve Feed 2.
**Demo path (3-5 min video):** problem story (~20 s) -> sign in and profile -> join event and check in -> two feeds with "why matched" -> intro request and contact reveal -> badge mint on BSC testnet explorer -> second event: Feed 2 changes because of Brain memory, Brain graph on screen -> evidence panel (plain ranking vs Brain re-rank).
 
## 3. Data model
Structured data lives in the app database; the Brain holds judgments and reasons only.
- **User:** GitHub ID, name, avatar, cached stack and topics, tags, meet preference, work status, optional coarse location, optional wallet address.
- **Project:** user, title, stack, description, visibility (public from GitHub, or private written by the user).
- **Event:** title, date, venue, optional Luma link, check-in code with time window.
- **CheckIn:** user, event, time.
- **IntroRequest:** from, to, note, status, shared contacts (only after approval).
- **Badge:** user, event, token ID, transaction hash.
- **RankingLog:** user, event, plain rank, final rank, Brain latency, reason (feeds the evaluation panel).
- **Never store:** GitHub tokens in plain text, location history, contacts in the Brain.
## 4. Integrations
- **GitHub App (from the start):** registered once, used for sign-in with read-only permissions. Optional later: users install it on chosen private repos (metadata only, never code). Private repo names are not shown automatically.
- **BSC testnet (chain ID 97):** non-transferable ERC-721, minted by a server-side wallet that pays gas with free tBNB. Key in an environment variable, never in the repo. Users need an address but no tBNB.
- **Living Brain:** API/MCP/TypeScript SDK; capture for writes, search for reads. Used for the app's users' data only (one shared community brain so people and events can connect). Captures stay coarse (check-ins, intro outcomes, stated goals). No contacts or secrets. Captures use a prepaid balance, so the balance must be topped up.
- **Luma:** no integration; optional event link only.
- **Geolocation:** opt-in, coarse, latest position only, auto-expiring.
- **Hosting:** HTTPS (e.g. Vercel). API keys stay server-side.
## 5. Feature tiers
- **Must-have:** GitHub App registration and sign-in, profile with tags and meet preference, manual private projects, event tabs with code check-in, Feed 1 + Feed 2 with "why matched" (plain score + Brain re-rank of the top few), intro requests with hidden contacts, badge on testnet, Brain matchmaker agent, seeded demo users, PWA install.
- **Should-have:** opt-in location, evaluation panel (plain vs Brain: rank movement, latency, requests, seeded scenarios, intro acceptance rate with sample size), filters, GitHub App private-repo picker, venue-level map, basic messaging.
- **Nice-to-have:** Spotify, Luma integration, mainnet, live individual location, full chat.
- **Cut rule:** the evaluation panel goes first if time runs short.
## 6. BNB badge decision
- NFT with transfers blocked (behaves as soulbound). Reason: attendance proof is meaningless if it can be sold or given away.
- Mechanics: event code proves attendance, server mints. Brain = the agent's private memory; chain = public tamper-proof credential. Check-in record lives in the app database.
- Honest limits: not RWA. The chain mainly serves the Developer Track.
## 7. Open questions
- Does the Developer Track accept testnet?
- Real cost of a test deployment (check early).
- How fast do Brain captures compile into linked pages? Test early.
- Cost per capture and how much balance to top up.
- HackQuest registration approved and project created? Which cutoff applies (09:00 on Nov 27 per the rules, or earlier)?
- How will the event code reach attendees at the demo events?
- Final project name.
- User consent and deletion for data in the Brain (Thailand has a data protection law, the PDPA).
 