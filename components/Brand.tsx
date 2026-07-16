export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm">
        {/* Stylised "I" mark for Indus */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 4h8M8 20h8M12 4v16"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-text">
            Indus Tracker
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
            Appliances
          </p>
        </div>
      )}
    </div>
  );
}
