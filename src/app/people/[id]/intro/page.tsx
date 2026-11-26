import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { sendIntro } from "@/app/inbox/actions";
import { Avatar } from "@/components/Avatar";
import { BackBar, Icon, Lead, SectionLabel, Screen, Title, btnPrimary, firstName } from "@/components/ui";
import { canConnect, featuredFor, getUser, introStatesFor } from "@/lib/queries";
import { requireUserId, safePath } from "@/lib/session";

type Props = PageProps<"/people/[id]/intro">;

// Figma 08/09 · Intro: a short note that goes with the request. A chat opens only when they accept.
async function Intro({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const back = safePath(sp.back, "/people");
  const meId = await requireUserId(`/people/${id}/intro`);
  if (meId === id) redirect("/profile");

  const [me, other, states] = await Promise.all([getUser(meId), getUser(id), introStatesFor(meId, [id])]);
  if (!me || !other) notFound();
  // Already asked (either way): the sent screen shows where it stands.
  if (states.get(id)) redirect(`/people/${id}/sent?back=${encodeURIComponent(back)}`);
  if (!(await canConnect(meId, id)).allowed) notFound();

  const project = (await featuredFor([id])).get(id);
  const them = firstName(other.name);
  const myStack = me.stack[0];
  // A starting point, not a template to send as is: it uses what the two profiles really say.
  const draft = [
    `Hey ${them}!`,
    myStack ? `I’m building with ${myStack}.` : "",
    project ? `I’d love to hear about ${project.title}.` : "I’d love to hear about your project.",
    "Want to compare notes?",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 200);

  return (
    <Screen>
      <div className="mt-2">
        <Avatar userId={other.id} name={other.name} photoAt={other.photoAt} size={80} />
      </div>
      <Title size={32} className="mt-8">
        Say hello
        <br />
        to {them}.
      </Title>
      <Lead className="mt-4 text-[14px]">Start with something you have in common.</Lead>

      <form action={sendIntro} className="flex flex-col">
        <input type="hidden" name="toUserId" value={id} />
        <input type="hidden" name="back" value={`/people/${id}/sent?back=${encodeURIComponent(back)}`} />
        <SectionLabel className="mt-9">Your introduction</SectionLabel>
        <textarea
          name="message"
          maxLength={200}
          rows={5}
          defaultValue={draft}
          className="mt-3 min-h-[174px] w-full resize-none rounded-[16px] border border-line bg-card p-5 text-[15px] leading-[22px] text-ink"
        />
        <div className="mt-6 flex gap-3 text-muted">
          <span className="text-purple"><Icon name="chat" /></span>
          <p className="text-[13px] leading-[20px]">
            A chat opens when they accept.
            <br />
            Give them something to reply to.
          </p>
        </div>
        <button type="submit" className={`${btnPrimary} mt-10`}>
          Send introduction
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] text-muted">Your contacts stay hidden until they accept · Max 200 characters</p>
    </Screen>
  );
}

async function Back({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  return <BackBar href={safePath(sp.back, "/people")} title="Make a connection" />;
}

export default function IntroPage(props: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <Back searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Intro params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
