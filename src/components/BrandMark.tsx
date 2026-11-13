export function LensLeafMark({ className = "", decorative = false }: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <svg
      className={`lens-leaf-mark ${className}`.trim()}
      viewBox="0 0 120 120"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Residue Lens"}
    >
      <circle className="lens-leaf-ring" cx="48" cy="48" r="31" />
      <path className="lens-leaf-handle" d="M70 70 101 101" />
      <path className="lens-leaf-leaf" d="M34 55c2-18 14-27 31-26-1 18-11 29-31 26Z" />
      <path className="lens-leaf-vein" d="M39 51c8-2 14-7 20-15-4 10-10 17-20 20Z" />
      <circle className="lens-leaf-dot" cx="74" cy="24" r="6" />
    </svg>
  );
}

export function ResidueLensBrand() {
  return (
    <>
      <LensLeafMark decorative />
      <span>Residue Lens</span>
    </>
  );
}
