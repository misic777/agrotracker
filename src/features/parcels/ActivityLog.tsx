import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button, { IconButton } from "../../components/Button";
import { ActivityChip } from "../../components/Chip";
import { PencilIcon, PlusIcon } from "../../components/icons";
import { useFormat } from "../../lib/format";
import type { Activity, Season } from "../../lib/types";
import ActivityForm from "./ActivityForm";

interface ActivityLogProps {
  season: Season;
  /** Activities of the season, newest first. */
  activities: Activity[];
}

export default function ActivityLog({ season, activities }: ActivityLogProps) {
  const { t } = useTranslation();
  const f = useFormat();
  // null = form closed, "new" = adding, an Activity = editing it.
  const [editing, setEditing] = useState<Activity | "new" | null>(null);

  return (
    <section className="flex min-w-0 flex-[999_1_540px] flex-col gap-[18px] rounded-card border border-sand-300 bg-sand-50 px-[26px] py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="m-0 font-display text-[22px] font-semibold">
            {t("activities.title")}
          </h2>
          <span className="text-sm text-soil-700">
            {t("activities.count", { count: activities.length })}
          </span>
        </div>
        {editing === null && (
          <Button variant="ghost" onClick={() => setEditing("new")}>
            <PlusIcon size={18} />
            {t("activities.add")}
          </Button>
        )}
      </div>

      {editing !== null && (
        <ActivityForm
          // A new key resets the form state when switching what is edited.
          key={editing === "new" ? "new" : editing.id}
          seasonId={season.id}
          activity={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {activities.length === 0 ? (
        editing === null && (
          <p className="m-0 text-soil-700">{t("activities.empty")}</p>
        )
      ) : (
        <ol
          aria-label={t("activities.listLabel")}
          className="m-0 flex list-none flex-col p-0"
        >
          {activities.map((a) => (
            <li
              key={a.id}
              className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-x-4 gap-y-1.5 border-b border-sand-200 py-3.5 last:border-b-0 sm:grid-cols-[100px_160px_minmax(0,1fr)_44px]"
            >
              <span className="font-bold tabular-nums">{f.date(a.date)}</span>
              <span className="row-start-2 sm:row-start-auto">
                <ActivityChip type={a.type} />
              </span>
              <ActivityDescription activity={a} />
              <IconButton
                aria-label={t("activities.edit")}
                onClick={() => setEditing(a)}
                className="col-start-2 row-span-3 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto"
              >
                <PencilIcon />
              </IconButton>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ActivityDescription({ activity: a }: { activity: Activity }) {
  const { t } = useTranslation();
  const f = useFormat();

  const productLine = [
    a.product,
    a.ratePerHa !== undefined && a.rateUnit
      ? `${f.number(a.ratePerHa, 3)} ${t(`unit.${a.rateUnit}`)}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  if (!productLine) {
    return (
      <span className="row-start-3 text-soil-700 sm:row-start-auto">
        {a.note ?? t("common.none")}
      </span>
    );
  }
  return (
    <span className="row-start-3 flex flex-col sm:row-start-auto">
      <span className="font-bold tabular-nums">{productLine}</span>
      {a.note && <span className="text-sm text-soil-700">{a.note}</span>}
    </span>
  );
}
