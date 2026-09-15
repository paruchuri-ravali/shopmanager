const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function NameBadge({ name }: { name: string }) {
  return (
    <span className="name-badge">
      <span className="name-badge-avatar">{initials(name)}</span>
      {name}
    </span>
  );
}
