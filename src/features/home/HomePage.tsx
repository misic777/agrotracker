import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import { ActivityChip } from "../../components/Chip";
import PageHeader from "../../components/PageHeader";
import { balanceForYear } from "../../lib/balance";
import { useFormat } from "../../lib/format";
import { normalizeKey } from "../../lib/parcels";
import { recentActivities } from "../../lib/seasons";
import type { Activity } from "../../lib/types";
import { useData } from "../../storage/DataContext";

const RECENT_COUNT = 6;

export default function HomePage() {
  const { t } = useTranslation();
  const f = useFormat();
  const { data } = useData();
  const year = new Date().getFullYear();

  const stats = useMemo(() => {
    const municipalities = new Set(
      data.parcels.map((p) => normalizeKey(p.municipality)),
    );
    const crops = new Set(
      data.seasons.filter((s) => s.year === year).map((s) => s.crop),
    );
    return {
      parcels: data.parcels.length,
      municipalities: municipalities.size,
      area: data.parcels.reduce((sum, p) => sum + p.areaHa, 0),
      crops: crops.size,
      balance: balanceForYear(data, year),
      recent: recentActivities(data, RECENT_COUNT),
    };
  }, [data, year]);

  const { balance } = stats;
  const sign = balance.difference > 0 ? "+" : balance.difference < 0 ? "−" : "";

  return (
    <>
      <PageHeader
        title={t("nav.home")}
        subtitle={t("pages.home.subtitle")}
        actions={
          <span className="inline-flex items-center rounded-full border border-sand-300 bg-sand-50 px-3.5 py-2 text-sm font-bold">
            {t("home.season", { year })}
          </span>
        }
      />

      {stats.parcels === 0 ? (
        <Card className="flex flex-col items-start gap-3 py-8">
          <h2 className="m-0 font-display text-[22px] font-semibold">
            {t("home.welcomeTitle")}
          </h2>
          <p className="m-0 max-w-[60ch] text-soil-700">
            {t("home.welcomeText")}
          </p>
          <Link
            to="/parcele"
            className="inline-flex min-h-11 items-center rounded-btn bg-leaf-600 px-[18px] font-bold text-sand-50 no-underline hover:bg-leaf-700 hover:text-sand-50"
          >
            {t("home.welcomeAction")}
          </Link>
        </Card>
      ) : (
        <section
          aria-label={t("home.overviewLabel")}
          className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5"
        >
          <StatCard
            label={t("nav.parcels")}
            value={String(stats.parcels)}
            note={t("home.municipalities", { count: stats.municipalities })}
          />
          <StatCard
            label={t("home.totalArea")}
            value={f.number(stats.area, 2, 2)}
            unit="ha"
            note={
              stats.crops > 0
                ? t("home.crops", { count: stats.crops, year })
                : t("home.noSeasons", { year })
            }
          />
          <Link
            to="/bilans"
            className="flex flex-col gap-1.5 rounded-card border border-leaf-200 bg-leaf-100 px-6 py-[22px] text-soil-900 no-underline hover:text-soil-900 hover:shadow-[0_4px_16px_rgba(51,41,31,0.10)]"
          >
            <span className="text-sm font-semibold text-leaf-800">
              {t("home.currentBalance", { year })}
            </span>
            <span
              className={`font-display text-[40px] leading-tight font-semibold tabular-nums ${balance.difference < 0 ? "text-clay-800" : "text-leaf-800"}`}
            >
              {sign}
              {f.moneyShort(Math.abs(balance.difference))}{" "}
              <span className="text-[22px]">RSD</span>
            </span>
            <span className="text-sm text-leaf-700 tabular-nums">
              {t("home.balanceNote", {
                income: f.moneyShort(balance.income),
                costs: f.moneyShort(balance.costs),
              })}
            </span>
          </Link>
        </section>
      )}

      {stats.parcels > 0 && (
        <section className="flex flex-col gap-2 rounded-card border border-sand-300 bg-sand-50 px-7 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <h2 className="m-0 font-display text-[22px] font-semibold">
              {t("home.recentTitle")}
            </h2>
            <Link to="/parcele" className="text-sm font-bold">
              {t("home.allParcels")}
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="m-0 border-t border-sand-200 pt-4 text-soil-700">
              {t("home.noActivities")}
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {stats.recent.map(({ activity, season, parcel }) => (
                <li
                  key={activity.id}
                  className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-t border-sand-200 py-3 sm:min-h-[60px] sm:grid-cols-[110px_170px_minmax(0,1fr)_minmax(0,1.2fr)] sm:py-2"
                >
                  <span className="font-bold tabular-nums">
                    {f.date(activity.date)}
                  </span>
                  <span>
                    <ActivityChip type={activity.type} />
                  </span>
                  <Link
                    to={`/parcele/${parcel.id}`}
                    className="font-bold text-soil-900 no-underline hover:text-leaf-800 hover:underline"
                  >
                    {parcel.name}{" "}
                    <span className="font-medium text-soil-700">
                      · {t(`crop.${season.crop}`)}
                    </span>
                  </Link>
                  <span className="text-soil-700">
                    {describe(activity, (n) => f.number(n, 3), t)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

/** "Nikosulfuron · 1,25 l/ha", or the note, or a dash. */
function describe(
  a: Activity,
  num: (n: number) => string,
  t: (key: string) => string,
): string {
  const rate =
    a.ratePerHa !== undefined && a.rateUnit
      ? `${num(a.ratePerHa)} ${t(`unit.${a.rateUnit}`)}`
      : undefined;
  const product = [a.product, rate].filter(Boolean).join(" · ");
  return product || a.note || t("common.none");
}

function StatCard({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px]">
      <span className="text-sm font-semibold text-soil-700">{label}</span>
      <span className="font-display text-[40px] leading-tight font-semibold tabular-nums">
        {value}
        {unit && <span className="text-[22px] text-soil-700"> {unit}</span>}
      </span>
      <span className="text-sm text-soil-700">{note}</span>
    </div>
  );
}
