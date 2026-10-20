/** Round badge with initials, e.g. "AM" for Andrija Mišić. */
export default function Avatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-leaf-200 text-sm font-bold text-leaf-800"
    >
      {initials}
    </span>
  );
}
