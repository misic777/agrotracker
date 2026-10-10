import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import { useFormat } from "../../lib/format";
import { yieldPerHa } from "../../lib/seasons";
import type { Parcel, Season } from "../../lib/types";

/** Green card with the selected season's total yield. */
export function YieldCard({
  parcel,
  season,
  onEdit,
}: {
  parcel: Parcel;
  season: Season;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const perHa = yieldPerHa(season, parcel.areaHa);

  return (
    <section className="flex flex-col gap-2.5 rounded-card border border-leaf-200 bg-leaf-100 px-6 py-[22px]">
      <h2 className="m-0 text-sm font-bold text-leaf-800">
        {t("yield.title", { year: season.year })}
      </h2>
      {season.yieldKg !== undefined ? (
        <>
          <span className="font-display text-[38px] leading-tight font-semibold text-leaf-800 tabular-nums">
            {f.integer(season.yieldKg)} <span className="text-xl">kg</span>
          </span>
          {perHa !== undefined && (
            <span className="text-sm text-leaf-700">
              {t("yield.perHa", {
                perHa: f.integer(perHa),
                area: f.area(parcel.areaHa),
              })}
            </span>
          )}
        </>
      ) : (
        <span className="text-leaf-700">{t("yield.notEntered")}</span>
      )}
      <Button onClick={onEdit} className="mt-1 self-start border-leaf-200">
        {season.yieldKg !== undefined ? t("yield.edit") : t("yield.enter")}
      </Button>
    </section>
  );
}

/** Yield per hectare for every season of the parcel, newest first. */
export function YieldHistory({
  parcel,
  seasons,
}: {
  parcel: Parcel;
  seasons: Season[];
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const rows = seasons.filter((s) => s.yieldKg !== undefined);

  return (
    <section className="flex flex-col gap-1 rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px]">
      <h2 className="m-0 mb-2 font-display text-xl font-semibold">
        {t("yield.historyTitle")}
      </h2>
      {rows.length === 0 ? (
        <p className="m-0 text-soil-700">{t("yield.historyEmpty")}</p>
      ) : (
        rows.map((s) => {
          const perHa = yieldPerHa(s, parcel.areaHa);
          return (
            <div
              key={s.id}
              className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 border-t border-sand-200 py-2.5"
            >
              <span className="font-extrabold">{s.year}</span>
              <span>{t(`crop.${s.crop}`)}</span>
              <span className="text-right font-bold tabular-nums">
                {perHa !== undefined
                  ? `${f.integer(perHa)} kg/ha`
                  : `${f.integer(s.yieldKg ?? 0)} kg`}
              </span>
            </div>
          );
        })
      )}
    </section>
  );
}
