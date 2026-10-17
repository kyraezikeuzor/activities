function centerHash(value: string): number {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
}

export function CenterFlowerIcon({
  centerName,
  className = "",
}: {
  centerName: string;
  className?: string;
}) {
  const hash = centerHash(centerName);
  const yellowAndPink = hash % 5 === 0;
  const palette = yellowAndPink
    ? { background: "#F8E77C", petals: "#E85D9E", center: "#C83C78" }
    : {
        background: `hsl(${hash % 360} 68% 86%)`,
        petals: `hsl(${(hash * 7) % 360} 62% 55%)`,
        center: `hsl(${(hash * 7) % 360} 68% 38%)`,
      };
  const petalCount = hash % 2 === 0 ? 4 : 5;
  const rotationOffset = hash % 24;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white ${className}`}
      style={{ backgroundColor: palette.background }}
      role="img"
      aria-label={`${centerName} center icon`}
      title={centerName}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        {Array.from({ length: petalCount }, (_, index) => (
          <ellipse
            key={index}
            cx="24"
            cy="14"
            rx="6.5"
            ry="10"
            fill={palette.petals}
            transform={`rotate(${rotationOffset + (360 / petalCount) * index} 24 24)`}
          />
        ))}
        <circle cx="24" cy="24" r="5.5" fill={palette.center} />
      </svg>
    </span>
  );
}
