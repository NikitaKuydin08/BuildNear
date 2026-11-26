// Picture if the person uploaded one, otherwise their initial.
export function Avatar({ userId, name, photoAt, size = 44 }: { userId: string; name: string; photoAt: Date | null | undefined; size?: number }) {
  const box = { width: size, height: size };
  if (photoAt) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/avatar/${userId}?v=${photoAt.getTime()}`} alt="" style={box} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <div style={{ ...box, fontSize: size * 0.4 }} className="flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold dark:bg-neutral-800">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
