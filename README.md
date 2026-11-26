# BuildNear

Meet the right builders at tech events. A mobile-first web app (installable as a PWA) for BNB Hack Bangkok.

You sign in with GitHub, check in at the venue by scanning a QR code, and see who else is there, ranked by who you would actually click with. Contacts stay hidden until both sides agree.

Live: https://buildnear-eight.vercel.app

## What it does

- **GitHub sign-in.** Your profile (name, picture, main languages) comes from your public GitHub. You can edit everything.
- **Check in at the venue.** The organizer shows a QR code that changes every 30 seconds. Scanning it signs you in (if needed) and checks you in. A typed code is the fallback. Check-in only works from 2 hours before the event until it ends.
- **People feed** for the event you are at:
  - **Everyone**: all checked-in people.
  - **For you**: a plain, predictable score (shared stack, shared fields, meeting style, hiring vs looking). Easy to explain.
  - **Brain**: ranked by meaning, using the Living Brain (see below).
  - **Across events**: people from every event you checked in to, ranked by the Brain. This is how matching continues after the venue.
- **Intro requests.** Say hi with an optional short message. Telegram, WhatsApp, LinkedIn, email and the GitHub link are shown only after the other person accepts.
- **Badges.** An on-chain, non-transferable attendance badge on BNB Smart Chain testnet, plus field badges (Web3, AI, Cloud, Security, Web, Green tech, Fintech) that level up from real check-ins: Newbie 1, Explorer 2, Researcher 4, Veteran 7, Legend 12 events.
- **Nearby (opt-in).** Share your location only while you choose to, to see people close to you. Never on by default.
- **Privacy built in.** Download or delete all your data from the profile page. See `/privacy` in the app.

## How the Living Brain is used

The Brain is the app's memory of builders. It learns from:

- a short note per profile: name, GitHub login, stack, topics, tags, proudest project, meeting style, work status;
- a note when someone checks in to an event ("X checked in at Y");
- a note when an intro is accepted: the two names, the event, shared stack, and the intro message (first 200 characters).

It never receives contact details, photos, location, wallet addresses, or declined intros.

The Brain is only used for **ranking**: the app asks it which profiles are closest in meaning to yours and shows the similarity as a percentage. Text written by the Brain is **not** shown to other users, because its summaries can mention who met whom. If the Brain is off or slow, the app falls back to the plain score and keeps working.

## Why GitHub-only sign-in (for now)

GitHub gives us a real, verifiable builder profile with no form to fill in, which fits a developer event. The trade-off is clear: people without GitHub cannot join yet. A Google sign-in with a manual profile is the planned next step, and nothing in the matching depends on GitHub.

## GitHub App permissions

Sign-in uses a GitHub App with read-only **Metadata** access. To add a private repository as a project, a person installs the App on just the repositories they pick. Only the name, description and main language are copied, never code. No webhooks are used.

## Tech

Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Auth.js v5, Drizzle ORM on Neon Postgres, Living Brain SDK, viem for BSC testnet (Solidity badge contract in `contracts/`, built on OpenZeppelin).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:push              # create tables
npm run dev
```

Useful scripts: `npm run db:seed` (demo data), `npm run brain:sync` (send profiles to the Brain), `npm run chain:deploy` (deploy the badge contract), `npm run test:match`, `npm run test:contract`.

Never commit `.env.local`. The API keys and the minter wallet key live only in environment variables.

## Admin

Accounts listed in `ADMIN_GITHUB_LOGINS` can open `/admin/events` to create events, set each event's badge field, and show the rotating check-in QR.
