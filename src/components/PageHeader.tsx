import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Buttons or chips shown on the right, e.g. "Dodaj parcelu". */
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-[34px] leading-tight font-semibold">
          {title}
        </h1>
        {subtitle && <p className="m-0 text-soil-700">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
