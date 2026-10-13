import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Chip, { CropChip } from "../../components/Chip";
import { PlusIcon } from "../../components/icons";
import { inputClass } from "../../components/inputClass";
import PageHeader from "../../components/PageHeader";
import { balanceYears } from "../../lib/balance";
import { sumRsd } from "../../lib/costs";
import { useFormat } from "../../lib/format";
import { incomeOfYear, splitIncome } from "../../lib/income";
import type { Income } from "../../lib/types";
import { useData } from "../../storage/DataContext";
import OtherIncomeDialog from "./OtherIncomeDialog";
import SaleDialog from "./SaleDialog";

type Editing =
  { kind: "sale"; income?: Income } | { kind: "other"; income?: Income } | null;

export default function IncomePage() {
  const { t } = useTranslation();
  const f = useFormat();
  const { data } = useData();
  const id = useId();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [editing, setEditing] = useState<Editing>(null);

  const years = useMemo(
    () => balanceYears(data, currentYear).reverse(),
    [data, currentYear],
  );
  const { sales, other } = useMemo(
    () => splitIncome(incomeOfYear(data.incomes, year)),
    [data.incomes, year],
  );
  const salesTotal = sumRsd(sales);
  const otherTotal = sumRsd(other);

  return (
    <>
      <PageHeader
        title={t("nav.income")}
        subtitle={t("pages.income.subtitle")}
        actions={
          <>
            <label htmlFor={`${id}-year`} className="sr-only">
              {t("costs.year")}
            </label>
            <select
              id={`${id}-year`}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={`${inputClass()} min-w-[110px] rounded-btn px-2.5 font-bold`}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button onClick={() => setEditing({ kind: "other" })}>
              <PlusIcon size={18} />
              {t("income.addOther")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setEditing({ kind: "sale" })}
            >
              <PlusIcon size={18} />
              {t("income.addSale")}
            </Button>
          </>
        }
      />

      <section
        aria-label={t("income.summaryLabel")}
        className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-5"
      >
        <SummaryCard
          label={t("income.sales")}
          amount={f.moneyShort(salesTotal)}
        />
        <SummaryCard
          label={t("income.subsidiesAndOther")}
          amount={f.moneyShort(otherTotal)}
        />
        <SummaryCard
          label={t("income.totalYear", { year })}
          amount={f.moneyShort(salesTotal + otherTotal)}
          highlight
        />
      </section>

      <TableCard
        title={t("income.sales")}
        count={t("income.salesCount", { count: sales.length })}
        empty={sales.length === 0 ? t("income.noSales", { year }) : undefined}
      >
        <table className="w-full min-w-[760px] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="bg-[#f7f2e8] text-[13px] text-soil-700">
              <th scope="col" className="py-3 pr-3.5 pl-5 text-left">
                {t("income.date")}
              </th>
              <th scope="col" className="px-3.5 py-3 text-left">
                {t("income.crop")}
              </th>
              <th scope="col" className="px-3.5 py-3 text-right">
                {t("income.col.quantity")}
              </th>
              <th scope="col" className="px-3.5 py-3 text-right">
                {t("income.col.pricePerKg")}
              </th>
              <th scope="col" className="px-3.5 py-3 text-left">
                {t("income.buyer")}
              </th>
              <th scope="col" className="py-3 pr-5 pl-3.5 text-right">
                {t("income.col.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr
                key={s.id}
                onClick={() => setEditing({ kind: "sale", income: s })}
                className="cursor-pointer border-t border-sand-200 hover:bg-sand-100"
              >
                <td className="py-3.5 pr-3.5 pl-5 whitespace-nowrap">
                  <EditButton
                    label={t("income.editAria", { date: f.date(s.date) })}
                    onClick={() => setEditing({ kind: "sale", income: s })}
                  >
                    {f.date(s.date)}
                  </EditButton>
                </td>
                <td className="p-3.5">
                  <CropChip>{t(`crop.${s.crop ?? "other"}`)}</CropChip>
                </td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  {s.quantityKg !== undefined
                    ? `${f.number(s.quantityKg, 3)} kg`
                    : t("common.none")}
                </td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  {s.pricePerKg !== undefined
                    ? f.money(s.pricePerKg)
                    : t("common.none")}
                </td>
                <td className="p-3.5">{s.buyer ?? t("common.none")}</td>
                <td className="py-3.5 pr-5 pl-3.5 text-right font-bold whitespace-nowrap">
                  {f.money(s.totalRsd)}
                </td>
              </tr>
            ))}
          </tbody>
          {sales.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-sand-300 bg-[#f7f2e8]">
                <td colSpan={5} className="py-3.5 pr-3.5 pl-5 font-bold">
                  {t("income.salesTotal")}
                </td>
                <td className="py-3.5 pr-5 pl-3.5 text-right font-extrabold whitespace-nowrap">
                  {f.money(salesTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </TableCard>

      <TableCard
        title={t("income.otherTitle")}
        count={t("income.itemsCount", { count: other.length })}
        empty={other.length === 0 ? t("income.noOther", { year }) : undefined}
      >
        <table className="w-full min-w-[560px] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="bg-[#f7f2e8] text-[13px] text-soil-700">
              <th scope="col" className="py-3 pr-3.5 pl-5 text-left">
                {t("income.date")}
              </th>
              <th scope="col" className="px-3.5 py-3 text-left">
                {t("income.kind")}
              </th>
              <th scope="col" className="px-3.5 py-3 text-left">
                {t("income.description")}
              </th>
              <th scope="col" className="py-3 pr-5 pl-3.5 text-right">
                {t("income.col.amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {other.map((o) => (
              <tr
                key={o.id}
                onClick={() => setEditing({ kind: "other", income: o })}
                className="cursor-pointer border-t border-sand-200 hover:bg-sand-100"
              >
                <td className="py-3.5 pr-3.5 pl-5 whitespace-nowrap">
                  <EditButton
                    label={t("income.editAria", { date: f.date(o.date) })}
                    onClick={() => setEditing({ kind: "other", income: o })}
                  >
                    {f.date(o.date)}
                  </EditButton>
                </td>
                <td className="p-3.5">
                  <Chip
                    className={
                      o.kind === "subsidy"
                        ? "bg-wheat-200 text-wheat-800"
                        : undefined
                    }
                  >
                    {t(`incomeKind.${o.kind}`)}
                  </Chip>
                </td>
                <td className="p-3.5">{o.description ?? t("common.none")}</td>
                <td className="py-3.5 pr-5 pl-3.5 text-right font-bold whitespace-nowrap">
                  {f.money(o.totalRsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {editing?.kind === "sale" && (
        <SaleDialog sale={editing.income} onClose={() => setEditing(null)} />
      )}
      {editing?.kind === "other" && (
        <OtherIncomeDialog
          entry={editing.income}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function SummaryCard({
  label,
  amount,
  highlight = false,
}: {
  label: string;
  amount: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-card border px-6 py-5 ${highlight ? "border-leaf-200 bg-leaf-100 text-leaf-800" : "border-sand-300 bg-sand-50"}`}
    >
      <span
        className={`text-sm ${highlight ? "font-bold" : "font-semibold text-soil-700"}`}
      >
        {label}
      </span>
      <span className="font-display text-[30px] font-semibold tabular-nums">
        {amount}{" "}
        <span className={`text-base ${highlight ? "" : "text-soil-700"}`}>
          RSD
        </span>
      </span>
    </div>
  );
}

function TableCard({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: string;
  /** Message shown instead of the table when there are no rows. */
  empty?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-card border border-sand-300 bg-sand-50">
      <div className="flex items-center justify-between gap-3 px-5 py-[18px]">
        <h2 className="m-0 font-display text-[22px] font-semibold">{title}</h2>
        <span className="text-sm text-soil-700">{count}</span>
      </div>
      {empty ? (
        <p className="m-0 border-t border-sand-200 px-5 py-6 text-soil-700">
          {empty}
        </p>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </section>
  );
}

/** The first cell of a row is a real button, so rows work with a keyboard. */
function EditButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer border-0 bg-transparent p-0 text-left text-soil-900 hover:underline"
    >
      {children}
    </button>
  );
}
