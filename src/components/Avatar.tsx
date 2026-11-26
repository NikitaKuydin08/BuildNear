import { initials } from "@/components/ui";

// Picture if the person uploaded one, otherwise their initials on lilac (as in the Figma screens).
// Corners: 20 px like the Figma photos, which makes small avatars round.
export function Avatar({ userId, name, photoAt, size = 44, round = false }: { userId: string; name: string; photoAt: Date | null | undefined; size?: number; round?: boolean }) {
  const box = { width: size, height: size, borderRadius: round ? size / 2 : Math.min(20, size / 2) };
  if (photoAt) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/avatar/${userId}?v=${photoAt.getTime()}`} alt="" style={box} className="shrink-0 object-cover" />;
  }
  return (
    <div style={{ ...box, fontSize: Math.max(12, size * 0.3) }} className="flex shrink-0 items-center justify-center bg-lilac font-semibold text-purple">
      {initials(name)}
    </div>
  );
}
