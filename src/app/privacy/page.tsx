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
        <li className={li}><b>From GitHub, when you sign in:</b> your name, GitHub username, avatar, and public repository languages and topics. We do not receive or store your GitHub password or a long-lived access token.</li>
        <li className={li}><b>From you:</b> stack, interests, tags, meeting preference, work status (optional), up to 3 projects, and optional Telegram, WhatsApp, LinkedIn and email contacts, and a wallet address if you claim a badge.</li>
        <li className={li}><b>From your use:</b> which events you join, when you check in, intro requests you send or receive, and badges you claim.</li>
        <li className={li}><b>Location, only if you tap &quot;Share my area&quot;:</b> your browser asks permission. We store one approximate position (rounded to about 1 km) and the time. No history. It is ignored after 4 hours and deleted when you stop sharing.</li>
      </ul>

      <h2 className={h2}>Why we use it</h2>
      <ul className="list-disc pl-5">
        <li className={li}>To show you and other attendees to each other and suggest who to talk to (matching by stack, interests and meeting preference).</li>
        <li className={li}>Contacts are shown only to a person whose intro request you accept, or who accepts yours. They never appear on cards.</li>
        <li className={li}>Location is used only to list opted-in people within about 5 km, shown as &quot;same area&quot; or an approximate distance, never coordinates.</li>
        <li className={li}>Your legal basis is your consent, which you can withdraw at any time by editing your profile, stopping location sharing, or deleting your account.</li>
      </ul>

      <h2 className={h2}>Who else processes it</h2>
      <ul className="list-disc pl-5">
        <li className={li}><b>GitHub</b> (sign-in). <b>Vercel</b> (hosting). <b>Neon</b> (database, Singapore).</li>
        <li className={li}><b>Living Brain</b> (optional smart matching): a short text summary of your profile (name, stack, interests, tags, meeting style, proudest project) may be sent to this service, which uses external AI processing. We never send contacts, location or wallet address. Copies there cannot be deleted automatically from this app; ask us and we will remove them.</li>
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
