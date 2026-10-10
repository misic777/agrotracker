import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { PlusIcon } from "../../components/icons";
import { inputClass } from "../../components/inputClass";
import PageHeader from "../../components/PageHeader";
import { costYears, filterCosts, sumRsd } from "../../lib/costs";
import { useFormat } from "../../lib/format";
import { COST_TYPES, type Cost, type CostType } from "../../lib/types";
import { useData } from "../../storage/DataContext";
import CostForm from "./CostForm";

const PAGE_SIZE = 20;

export default function CostsPage() {
  const { t } = useTranslation();
  const f = useFormat();
  const { data } = useData();
  const id = useId();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState<CostType | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // null = form closed, "new" = adding, a Cost = editing it.
  const [editing, setEditing] = useState<Cost | "new" | null>(null);

  const years = useMemo(
    () => costYears(data.costs, currentYear),
    [data.costs, currentYear],
  );
  const filtered = useMemo(
    () => filterCosts(data.costs, year, type),
    [data.costs, year, type],
  );
  const shown = filtered.slice(0, visibleCount);
  const total = sumRsd(filtered);

  return (
    <>
      <PageHeader
        title={t("nav.costs")}
        subtitle={t("pages.costs.subtitle")}
        actions={
          editing === null && (
            <Button variant="primary" onClick={() => setEditing("new")}>
              <PlusIcon size={18} />
              {t("costs.add")}
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label={t("costs.listLabel")}
          className="flex min-w-0 flex-[999_1_600px] flex-col rounded-card border border-sand-300 bg-sand-50"
        >
          <div className="flex flex-wrap items-end gap-3 border-b border-sand-300 px-5 py-[18px]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-year`} className="text-[13px] font-bold">
                {t("costs.year")}
              </label>
              <select
                id={`${id}-year`}
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`${inputClass()} min-w-[120px] px-2.5`}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-type`} className="text-[13px] font-bold">
                {t("costs.type")}
              </label>
              <select
                id={`${id}-type`}
                value={type}
                onChange={(e) => {
                  setType(e.target.value as CostType | "all");
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`${inputClass()} min-w-[210px] px-2.5`}
              >
                <option value="all">{t("costs.allTypes")}</option>
                {COST_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {t(`costType.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grow" />
            <div className="flex flex-col items-end" aria-live="polite">
              <span className="text-[13px] font-semibold text-soil-700">
                {type === "all"
                  ? t("costs.totalLabel", { year })
                  : t("costs.totalLabelType", {
                      year,
                      type: t(`costType.${type}`),
                    })}
              </span>
              <span className="font-display text-2xl font-semibold tabular-nums">
                {f.money(total)}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="m-0 px-5 py-8 text-soil-700">
              {data.costs.length === 0
                ? t("costs.emptyAll")
                : t("costs.emptyFiltered", { year })}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="bg-[#f7f2e8] text-[13px] text-soil-700">
                    <th scope="col" className="py-3 pr-3.5 pl-5 text-left">
                      {t("costs.col.date")}
                    </th>
                    <th scope="col" className="px-3.5 py-3 text-left">
                      {t("costs.col.type")}
                    </th>
                    <th scope="col" className="px-3.5 py-3 text-left">
                      {t("costs.col.description")}
                    </th>
                    <th scope="col" className="px-3.5 py-3 text-right">
                      {t("costs.col.quantity")}
                    </th>
                    <th scope="col" className="px-3.5 py-3 text-right">
                      {t("costs.col.unitPrice")}
                    </th>
                    <th scope="col" className="py-3 pr-5 pl-3.5 text-right">
                      {t("costs.col.total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => {
                    const selected = editing !== "new" && editing?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setEditing(c)}
                        className={`cursor-pointer border-t border-sand-200 hover:bg-sand-100 ${selected ? "bg-leaf-50" : ""}`}
                      >
                        <td className="py-3.5 pr-3.5 pl-5 whitespace-nowrap">
                          {f.date(c.date)}
                        </td>
                        <td className="p-3.5">
                          <Chip>{t(`costType.${c.type}`)}</Chip>
                        </td>
                        <td className="p-3.5">
                          {/* The button makes rows reachable by keyboard. */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(c);
                            }}
                            aria-label={t("costs.editAria", {
                              description: c.description,
                            })}
                            className="cursor-pointer border-0 bg-transparent p-0 text-left text-soil-900 hover:underline"
                          >
                            {c.description}
                          </button>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {c.quantity !== undefined
                            ? `${f.number(c.quantity, 3)} ${c.unit ? t(`unit.${c.unit}`) : ""}`
                            : t("common.none")}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {c.unitPrice !== undefined
                            ? c.currency === "EUR"
                              ? f.money(c.unitPrice, "EUR")
                              : f.moneyInput(c.unitPrice)
                            : t("common.none")}
                        </td>
                        <td className="py-3.5 pr-5 pl-3.5 text-right whitespace-nowrap">
                          {c.currency === "EUR" ? (
                            <span className="flex flex-col items-end">
                              <span className="font-bold">
                                {f.money(c.total, "EUR")}
                              </span>
                              <span className="text-xs text-soil-700">
                                {t("costs.converted", {
                                  rsd: f.money(c.totalRsd),
                                  rate: f.number(c.exchangeRate ?? 0, 4, 2),
                                })}
                              </span>
                            </span>
                          ) : (
                            <span className="font-bold">
                              {f.money(c.total)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > shown.length && (
            <div className="flex justify-center border-t border-sand-300 px-5 py-3.5">
              <Button
                variant="ghost"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                {t("costs.showOlder", {
                  count: filtered.length - shown.length,
                })}
              </Button>
            </div>
          )}
        </section>

        {editing !== null && (
          <CostForm
            key={editing === "new" ? "new" : editing.id}
            cost={editing === "new" ? undefined : editing}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </>
  );
}
