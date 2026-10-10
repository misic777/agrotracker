import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ActivityType } from "../lib/types";

/** Pastel colour per activity type, from the design tokens. */
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  tillage: "bg-soil-100 text-soil-800",
  sowing: "bg-leaf-200 text-leaf-800",
  fertilizing: "bg-olive-100 text-olive-800",
  spraying: "bg-sky-100 text-sky-800",
  harvest: "bg-wheat-200 text-wheat-800",
  other: "bg-sand-200 text-soil-600",
};

interface ChipProps {
  children: ReactNode;
  className?: string;
}

/** Small rounded label. Defaults to the neutral sand colour. */
export default function Chip({
  children,
  className = "bg-sand-200 text-soil-600",
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] leading-tight font-bold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/** Coloured chip for an activity type, optionally with extra text. */
export function ActivityChip({
  type,
  suffix,
}: {
  type: ActivityType;
  suffix?: string;
}) {
  const { t } = useTranslation();
  return (
    <Chip className={ACTIVITY_COLORS[type]}>
      {t(`activityType.${type}`)}
      {suffix && ` · ${suffix}`}
    </Chip>
  );
}

/** Light green outlined chip used for a crop. */
export function CropChip({ children }: { children: ReactNode }) {
  return (
    <Chip className="border border-leaf-200 bg-leaf-50 text-leaf-800">
      {children}
    </Chip>
  );
}
