import Link from "next/link";

/** Shared look for buttons and button-styled links. */
export const btn = {
  primary:
    "inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] bg-ocean px-5 text-sm font-bold text-white no-underline hover:bg-ocean-dark disabled:opacity-60",
  secondary:
    "inline-flex h-[46px] items-center justify-center gap-2 rounded-[14px] border border-control bg-white px-[18px] text-sm font-bold text-ink no-underline hover:bg-ocean-tint disabled:opacity-60",
  icon: "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-white text-sm hover:bg-ocean-tint",
};

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        {eyebrow && <div className="text-sm font-semibold text-muted">{eyebrow}</div>}
        <h1 className="m-0 font-display text-[40px] font-extrabold leading-tight">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </header>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-[22px] border border-line bg-white p-6 ${className}`}>{children}</section>;
}

export function EmptyState({ icon, title, text, href, cta }: { icon: string; title: string; text: string; href: string; cta: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center">
      <span aria-hidden="true" className="text-5xl">{icon}</span>
      <h2 className="m-0 font-display text-2xl font-extrabold">{title}</h2>
      <p className="m-0 max-w-md text-muted">{text}</p>
      <Link href={href} className={btn.primary}>{cta}</Link>
    </Card>
  );
}

export function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "ocean" | "dark" }) {
  const tones = {
    plain: "bg-white border border-line text-ink",
    ocean: "bg-ocean-tint text-ocean-dark",
    dark: "bg-ink text-white",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold ${tones[tone]}`}>{children}</span>;
}
