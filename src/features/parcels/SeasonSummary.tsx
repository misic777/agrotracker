import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../components/Button";
import { ActivityChip } from "../../components/Chip";
import { PencilIcon } from "../../components/icons";
import type { Activity, Season } from "../../lib/types";

interface SeasonSummaryProps {
  season: Season;
  lastActivity?: Activity;
  onEdit: () => void;
}

export default function SeasonSummary({
  season,
  lastActivity,
  onEdit,
}: SeasonSummaryProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4 rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display text-xl font-semibold">
          {t("season.title", { year: season.year })}
        </h2>
        <IconButton bordered aria-label={t("season.edit")} onClick={onEdit}>
          <PencilIcon />
        </IconButton>
      </div>
      <dl className="m-0 flex flex-col gap-3.5">
        <Item label={t("season.crop")}>
          <span className="font-bold">{t(`crop.${season.crop}`)}</span>
        </Item>
        <Item label={t("season.hybrid")}>
          {season.hybrid ?? t("common.none")}
        </Item>
        <Item label={t("season.phase")}>
          {lastActivity ? (
            <span className="flex flex-wrap items-center gap-2">
              <ActivityChip type={lastActivity.type} />
              <span className="text-[13px] text-soil-700">
                {t("season.phaseHint")}
              </span>
            </span>
          ) : (
            <span className="text-soil-700">{t("season.noActivities")}</span>
          )}
        </Item>
        <Item label={t("season.note")}>{season.note ?? t("common.none")}</Item>
      </dl>
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[13px] font-semibold text-soil-700">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}
