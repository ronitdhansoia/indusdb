import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/5">
        <Image
          src="/indus-logo.jpeg"
          alt="Indus Appliances"
          width={30}
          height={30}
          className="rounded"
          priority
        />
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex w-fit items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5">
        <Image
          src="/indus-logo.jpeg"
          alt="Indus Appliances Pvt Ltd"
          width={112}
          height={112}
          className="h-auto w-28 rounded-lg"
          priority
        />
      </span>
      <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
        Task Tracker
      </span>
    </div>
  );
}
