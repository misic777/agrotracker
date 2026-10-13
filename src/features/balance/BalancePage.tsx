import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader";
import {
  balanceForYear,
  balanceYears,
  relativeChange,
  type BreakdownRow,
  type YearBalance,
} from "../../lib/balance";
import { useFormat } from "../../lib/format";
import { fromMinor } from "../../lib/money";
import type { Money } from "../../lib/types";
import { useData } from "../../storage/DataContext";

type Mode = "total" | "perHa";

/** How many years the comparison chart shows at most. */
const COMPARE_YEARS = 5;

export default function BalancePage() {
  const { t } = useTranslation();
  const f = useFormat();
  const { data } = useData();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState<Mode>("total");

  const years = useMemo(
    () => balanceYears(data, currentYear),
    [data, currentYear],
  );
  const balances = useMemo(
    () => new Map(years.map((y) => [y, balanceForYear(data, y)])),
    [data, years],
  );
  const current = balances.get(year) ?? balanceForYear(data, year);
  const previous = balances.get(year - 1);

  const perHaAvailable = current.areaHa > 0;
  const showPerHa = mode === "perHa" && perHaAvailable;

  /** Formats a money amount as a total or per hectare, per the toggle. */
  const big = (amount: Money) =>
    showPerHa
      ? f.integer(fromMinor(amount) / current.areaHa)
      : f.moneyShort(amount);
  const unit = showPerHa ? "RSD/ha" : "RSD";
  /** The "other" figure shown under each big number. */
  const secondary = (amount: Money) =>
    showPerHa
      ? `${f.moneyShort(amount)} RSD`
      : perHaAvailable
        ? `${f.integer(fromMinor(amount) / current.areaHa)} RSD/ha`
        : undefined;

  const change =
    previous?.hasData && current.hasData
      ? relativeChange(current.difference, previous.difference)
      : undefined;
  const sign = (amount: number) => (amount > 0 ? "+" : amount < 0 ? "−" : "");

  const compared = years
    .filter((y) => balances.get(y)?.hasData || y === year)
    .slice(-COMPARE_YEARS)
    .map((y) => balances.get(y)!);

  return (
    <>
      <PageHeader
        title={t("nav.balance")}
        subtitle={t("pages.balance.subtitle")}
        actions={
          <>
            <Segmented
              label={t("balance.yearLabel")}
              options={years.map((y) => ({ value: y, label: String(y) }))}
              value={year}
              onChange={setYear}
            />
            <Segmented
              label={t("balance.modeLabel")}
              options={[
                { value: "total" as Mode, label: t("balance.total") },
                { value: "perHa" as Mode, label: t("balance.perHa") },
              ]}
              value={mode}
              onChange={setMode}
            />
          </>
        }
      />

      {mode === "perHa" && !perHaAvailable && (
        <p className="m-0 rounded-card border border-sand-300 bg-sand-50 px-5 py-3 text-soil-700">
          {t("balance.noArea")}
        </p>
      )}
      {!current.hasData && (
        <p className="m-0 rounded-card border border-sand-300 bg-sand-50 px-5 py-3 text-soil-700">
          {t("balance.noData", { year })}
        </p>
      )}

      <section
        aria-label={t("balance.summaryLabel", { year })}
        className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5"
      >
        <BigCard
          label={t("balance.income")}
          value={big(current.income)}
          unit={unit}
          note={secondary(current.income)}
        />
        <BigCard
          label={t("balance.costs")}
          value={big(current.costs)}
          unit={unit}
          note={secondary(current.costs)}
        />
        <BigCard
          label={t("balance.difference")}
          value={`${sign(current.difference)}${big(Math.abs(current.difference))}`}
          unit={unit}
          note={[
            secondary(current.difference),
            change !== undefined &&
              t("balance.changeVs", {
                change: `${sign(change)}${f.number(Math.abs(change) * 100, 1, 1)}%`,
                year: year - 1,
              }),
          ]
            .filter(Boolean)
            .join(" · ")}
          tone={current.difference < 0 ? "negative" : "positive"}
        />
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-start gap-5">
        <Breakdown
          title={t("balance.costsByType")}
          rows={current.costsByType}
          label={(key) => t(`costType.${key}`)}
          format={big}
          barClass="bg-soil-400"
          trackClass="bg-[#f1eadd]"
        />
        <Breakdown
          title={t("balance.incomeBySource")}
          rows={current.incomeBySource}
          label={(key) =>
            key.startsWith("sale:")
              ? t("balance.saleOf", {
                  crop: t(`crop.${key.slice(5)}`).toLocaleLowerCase(),
                })
              : t(`incomeKind.${key}`)
          }
          format={big}
          barClass="bg-leaf-600"
          trackClass="bg-leaf-50"
        />
      </div>

      <YearComparison balances={compared} selected={year} onSelect={setYear} />
    </>
  );
}

/** Segmented control (pill buttons), used for the year and the mode. */
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap gap-0.5 rounded-btn bg-sand-200 p-[3px]"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`min-h-10 min-w-16 cursor-pointer rounded-lg border-0 px-3.5 ${active ? "bg-sand-50 font-extrabold text-leaf-800 shadow-[0_1px_2px_rgba(51,41,31,0.12)]" : "bg-transparent font-semibold text-soil-900"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function BigCard({
  label,
  value,
  unit,
  note,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  note?: string;
  /** Difference card: green when positive, clay when negative. */
  tone?: "positive" | "negative";
}) {
  const colored =
    tone === "positive"
      ? "border-transparent bg-leaf-600 text-sand-50"
      : tone === "negative"
        ? "border-transparent bg-clay-800 text-sand-50"
        : "border-sand-300 bg-sand-50";
  const muted = tone ? "text-leaf-100" : "text-soil-700";
  return (
    <div
      className={`flex flex-col gap-1 rounded-card border px-6 py-[22px] ${colored}`}
    >
      <span className={`text-sm font-bold ${muted}`}>{label}</span>
      <span className="font-display text-[34px] leading-tight font-semibold tabular-nums">
        {value}{" "}
        <span className={`text-[17px] ${tone ? "" : muted}`}>{unit}</span>
      </span>
      {note && <span className={`text-sm tabular-nums ${muted}`}>{note}</span>}
    </div>
  );
}

function Breakdown<K extends string>({
  title,
  rows,
  label,
  format,
  barClass,
  trackClass,
}: {
  title: string;
  rows: BreakdownRow<K>[];
  label: (key: K) => string;
  format: (amount: Money) => string;
  barClass: string;
  trackClass: string;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const max = rows[0]?.amount ?? 0;

  return (
    <section className="flex flex-col gap-3.5 rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px]">
      <h2 className="m-0 mb-1 font-display text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="m-0 text-soil-700">{t("balance.nothingYet")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {rows.map((r) => (
            <li
              key={r.key}
              className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_auto] items-center gap-3 text-sm"
            >
              <span className="font-semibold">{label(r.key)}</span>
              <span className={`h-3 rounded-full ${trackClass}`}>
                <span
                  className={`block h-3 rounded-full ${barClass}`}
                  style={{ width: `${max > 0 ? (r.amount / max) * 100 : 0}%` }}
                />
              </span>
              <span className="min-w-[132px] text-right tabular-nums">
                <strong>{format(r.amount)}</strong>{" "}
                <span className="text-soil-700">
                  · {f.number((r.amount / total) * 100, 1, 1)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Side-by-side income and cost bars per year; click a year to select it. */
function YearComparison({
  balances,
  selected,
  onSelect,
}: {
  balances: YearBalance[];
  selected: number;
  onSelect: (year: number) => void;
}) {
  const { t } = useTranslation();
  const f = useFormat();
  const max = Math.max(1, ...balances.flatMap((b) => [b.income, b.costs]));
  const height = (amount: Money) => `${Math.round((amount / max) * 188)}px`;

  return (
    <section className="flex flex-col gap-5 rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-xl font-semibold">
          {t("balance.compareTitle")}
        </h2>
        <div className="flex gap-[18px] text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 rounded bg-leaf-600" />
            {t("balance.income")}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 rounded bg-soil-400" />
            {t("balance.costs")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        {balances.map((b) => {
          const active = b.year === selected;
          return (
            <button
              key={b.year}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(b.year)}
              aria-label={t("balance.compareAria", {
                year: b.year,
                income: f.money(b.income),
                costs: f.money(b.costs),
              })}
              className="flex min-w-[160px] flex-[1_1_200px] cursor-pointer flex-col gap-2.5 border-0 bg-transparent p-0 text-soil-900"
            >
              <span
                className={`flex h-[210px] w-full items-end justify-center gap-2.5 border-b border-sand-300 ${active ? "rounded-t-[10px] bg-[#f7f2e8]" : ""}`}
              >
                <span
                  className="w-12 rounded-t-md bg-leaf-600"
                  style={{ height: height(b.income) }}
                />
                <span
                  className="w-12 rounded-t-md bg-soil-400"
                  style={{ height: height(b.costs) }}
                />
              </span>
              <span className="flex w-full flex-col items-center gap-0.5 tabular-nums">
                <span className="font-extrabold">{b.year}</span>
                <span className="text-[13px] text-soil-700">
                  {f.moneyShort(b.income)} / {f.moneyShort(b.costs)}
                </span>
                <span
                  className={`text-sm font-bold ${b.difference < 0 ? "text-clay-800" : "text-leaf-800"}`}
                >
                  {b.difference > 0 ? "+" : b.difference < 0 ? "−" : ""}
                  {f.moneyShort(Math.abs(b.difference))} RSD
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
