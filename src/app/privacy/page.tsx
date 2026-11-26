export const metadata = { title: "Privacy & data - BuildNear" };

const h2 = "mt-6 text-lg font-semibold";
const p = "mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300";
const li = "mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300";

export default function PrivacyPage() {
  return (
    <main className="p-4 pb-10">
      <h1 className="text-2xl font-semibold">Privacy &amp; data</h1>
      <p className={p}>
        BuildNear helps builders talk to each other at events, cafes and co-working spaces. This page says what we collect, where it comes from, how we use it, who else touches it, and how you delete it. It is written for the Thailand Personal Data Protection Act (PDPA) and for plain reading. It was prepared by the developer, not a lawyer.
      </p>

      <h2 className={h2}>What we collect, and how</h2>
      <ul className="list-disc pl-5">
        <li className={li}><b>From GitHub, when you sign in:</b> your name, GitHub username, avatar, and public repository languages and topics. We never receive your GitHub password. The temporary GitHub access token lives only in your encrypted session cookie, never in our database.</li>
        <li className={li}><b>From your repositories, only if you pick them:</b> on &quot;Import from GitHub&quot; we read the name, description (or the first paragraph of the README) and main language of a repository you choose (private ones too, if you gave the app access). We never read code. A private repository shows no link.</li>
        <li className={li}><b>A profile picture, only if you upload one:</b> your phone shrinks it to a small square before sending. It is shown to signed-in people who can see your card or profile. Remove it any time on your profile, and it is deleted with your account.</li>
        <li className={li}><b>From you:</b> stack, interests, tags, meeting preference, work status (optional), up to 3 projects, and optional Telegram, WhatsApp, LinkedIn and email contacts, and a wallet address if you claim a badge.</li>
        <li className={li}><b>From your use:</b> which events you join and check in to, when you check in, intro requests you send or receive, short messages you send to people you connected with, and badges you claim (with the token number once it is confirmed). For evaluating the matching, the app also logs how a feed was ordered for you (positions only).</li>
        <li className={li}><b>Location, only if you tap &quot;Share my area&quot;:</b> your browser asks permission. We store one approximate position (rounded to about 1 km) and the time. No history. It is erased automatically soon after 4 hours (the cleanup runs whenever the app is in use) and straight away when you stop sharing.</li>
      </ul>

      <h2 className={h2}>Why we use it</h2>
      <ul className="list-disc pl-5">
        <li className={li}>To show you and other attendees to each other and suggest who to talk to (matching by stack, interests and meeting preference).</li>
        <li className={li}>Contacts are shown only to a person whose intro request you accept, or who accepts yours. They never appear on cards.</li>
        <li className={li}>Messages can only be exchanged between two people who both accepted an intro. They are never sent to the Living Brain.</li>
        <li className={li}>Location is used only to list opted-in people within about 5 km, shown as &quot;same area&quot; or an approximate distance, never coordinates.</li>
        <li className={li}>Your legal basis is your consent, which you can withdraw at any time by editing your profile, stopping location sharing, or deleting your account.</li>
      </ul>

      <h2 className={h2}>Who else processes it</h2>
      <ul className="list-disc pl-5">
        <li className={li}><b>GitHub</b> (sign-in). <b>Vercel</b> (hosting). <b>Neon</b> (database, Singapore).</li>
        <li className={li}><b>Living Brain</b> (optional smart matching): a short text summary of your profile (name, stack, interests, tags, meeting style, proudest project) may be sent to this service, which uses external AI processing. When an intro is accepted, the two names, the event and the intro message (shortened) are sent too, so the Brain can remember why you met. Declined intros are never sent. Phone numbers, emails and links typed into an intro message are removed before it is sent. We never send contacts, messages, location or wallet address. Copies there cannot be deleted automatically from this app; ask us and we will remove them.</li>
        <li className={li}><b>The organizer</b> (the person running this app) can see a private page that lists how the matching re-ordered feeds (names, positions, timing) and how often intro requests were accepted, to judge whether the matching works. Nothing else is added to it.</li>
        <li className={li}><b>BNB Smart Chain (testnet):</b> if you claim a badge, your wallet address and the badge are written to a public blockchain. Blockchain records are permanent and cannot be deleted by anyone, including us. Do not claim a badge if that is a problem.</li>
      </ul>

      <h2 className={h2}>How long we keep it</h2>
      <p className={p}>Your data stays until you delete your account. Location expires after 4 hours. We do not sell data or show ads.</p>

      <h2 className={h2}>Your rights</h2>
      <p className={p}>
        You can see and edit your data on the Profile tab, download everything we hold (Profile, &quot;Download my data&quot;), and delete your account and all linked records (Profile, &quot;Delete my account&quot;). For anything else, including Living Brain copies, open an issue at github.com/NikitaKuydin08/BuildNear.
      </p>

      <h2 className={h2}>Safety</h2>
      <p className={p}>Only meet people in public places, share contacts only with people you chose to accept, and stop sharing location when you leave.</p>
    </main>
  );
}
