import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/ui";
import { getUser } from "@/lib/queries";

async function Me() {
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const me = await getUser(id);
  if (!me) return null;
  return (
    <Link href="/profile" aria-label="My profile" className="rounded-full">
      <Avatar userId={me.id} name={me.name} photoAt={me.photoAt} size={44} round />
    </Link>
  );
}

// Brand bar of the main tabs: link mark + "buildnear", and your avatar (opens your profile).
export function TopBar({ showMe = true }: { showMe?: boolean }) {
  return (
    <header className="pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-[76px] items-center justify-between px-5">
        <Link href="/people" className="flex items-center gap-[9px] text-[23px] font-semibold tracking-[-0.4px] text-ink">
          <span className="text-purple">
            <Icon name="link" size={25} />
          </span>
          buildnear
        </Link>
        {showMe && (
          <Suspense fallback={<span className="size-11 rounded-full bg-lilac" />}>
            <Me />
          </Suspense>
        )}
      </div>
    </header>
  );
}
