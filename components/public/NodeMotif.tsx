/** Shared node-graph SVG motif used as post cover placeholder */
export function NodeMotif({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className="node-motif"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="18" cy="18" r="4" />
        <circle cx="54" cy="14" r="4" />
        <circle cx="36" cy="40" r="5" />
        <circle cx="16" cy="56" r="4" />
        <circle cx="56" cy="54" r="4" />
        <line x1="18" y1="18" x2="36" y2="40" />
        <line x1="54" y1="14" x2="36" y2="40" />
        <line x1="36" y1="40" x2="16" y2="56" />
        <line x1="36" y1="40" x2="56" y2="54" />
      </g>
    </svg>
  )
}
