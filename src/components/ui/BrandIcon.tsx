/** ExamsExpress "EE" app icon (matches src/app/icon.svg). */
export function BrandIcon({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="15" fill="#312e81" />
      <g fill="#ffffff" opacity="0.9">
        <rect x="7" y="24" width="9" height="4.5" rx="2.25" />
        <rect x="9" y="32" width="12" height="4.5" rx="2.25" />
        <rect x="7" y="40" width="9" height="4.5" rx="2.25" />
      </g>
      <text x="18" y="45.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="30" fill="#ffffff" fontStyle="italic">
        E
      </text>
      <text x="35" y="45.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="30" fill="#a78bfa" fontStyle="italic">
        E
      </text>
    </svg>
  );
}
