import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button, { IconButton } from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Field } from "../../components/form";
import { CloseIcon, TrashIcon } from "../../components/icons";
import { inputClass } from "../../components/inputClass";
import { DEFAULT_UNIT, lastExchangeRate } from "../../lib/costs";
import { parseDecimal, todayIso, useFormat } from "../../lib/format";
import { toRsd } from "../../lib/money";
import {
  COST_TYPES,
  CURRENCIES,
  QUANTITY_UNITS,
  type Cost,
  type CostType,
  type Currency,
  type QuantityUnit,
} from "../../lib/types";
import { useData } from "../../storage/DataContext";
import { useLineAmounts, type LineField } from "./useLineAmounts";

interface CostFormProps {
  /** Cost to edit; omit to add a new one. */
  cost?: Cost;
  onClose: () => void;
}

export default function CostForm({ cost, onClose }: CostFormProps) {
  const { t } = useTranslation();
  const f = useFormat();
  const { data, costs } = useData();
  const id = useId();

  const lastRate = lastExchangeRate(
    data.costs.filter((c) => c.id !== cost?.id),
  );

  const [date, setDate] = useState(cost?.date ?? todayIso());
  const [type, setType] = useState<CostType>(cost?.type ?? "fuel");
  const [description, setDescription] = useState(cost?.description ?? "");
  const [currency, setCurrency] = useState<Currency>(cost?.currency ?? "RSD");
  const [unit, setUnit] = useState<QuantityUnit>(
    cost?.unit ?? DEFAULT_UNIT[cost?.type ?? "fuel"],
  );
  const [rateText, setRateText] = useState(
    cost?.exchangeRate
      ? f.number(cost.exchangeRate, 4, 2)
      : lastRate
        ? f.number(lastRate.rate, 4, 2)
        : "",
  );
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // When editing a cost saved with only a total, keep the total as an input.
  const line = useLineAmounts(
    {
      quantity: cost?.quantity !== undefined ? f.number(cost.quantity, 3) : "",
      unitPrice:
        cost?.unitPrice !== undefined ? f.moneyInput(cost.unitPrice) : "",
      total: cost ? f.moneyInput(cost.total) : "",
    },
    cost && cost.unitPrice === undefined
      ? ["quantity", "total"]
      : ["quantity", "unitPrice"],
  );
  const { quantity, unitPrice, total } = line.resolved;

  const isEur = currency === "EUR";
  const rate = parseDecimal(rateText);
  const rateValid = !isEur || (rate !== undefined && rate > 0);
  const totalRsd =
    total !== undefined && rateValid
      ? toRsd(total, currency, isEur ? rate : undefined)
      : undefined;

  const errors = {
    date: date === "" ? t("costForm.dateRequired") : undefined,
    description:
      description.trim() === "" ? t("costForm.descriptionRequired") : undefined,
    amount:
      total === undefined || total <= 0
        ? t("costForm.amountRequired")
        : undefined,
    rate: rateValid ? undefined : t("costForm.rateInvalid"),
  };
  const anyInvalidNumber =
    line.invalid("quantity") ||
    line.invalid("unitPrice") ||
    line.invalid("total");

  function changeType(next: CostType) {
    setType(next);
    if (line.texts.quantity.trim() === "") setUnit(DEFAULT_UNIT[next]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || anyInvalidNumber) return;
    if (total === undefined || totalRsd === undefined) return;

    const draft = {
      date,
      type,
      description: description.trim(),
      quantity,
      unit: quantity !== undefined ? unit : undefined,
      unitPrice,
      total,
      currency,
      exchangeRate: isEur ? rate : undefined,
      totalRsd,
    };
    if (cost) costs.update(cost.id, draft);
    else costs.add(draft);
    onClose();
  }

  const symbol = isEur ? "€" : "RSD";

  /** One of the three amount inputs; the computed one is styled green. */
  function amountInput(field: LineField, label: string) {
    const computed = line.computed === field;
    const value = computed
      ? line.hasComputed
        ? formatComputed(field)
        : ""
      : line.texts[field];
    const invalid = line.invalid(field);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`${id}-${field}`} className="text-[13px] font-bold">
            {label}
          </label>
          {computed && line.hasComputed && (
            <span className="rounded-full bg-leaf-200 px-2 py-0.5 text-xs font-bold text-leaf-800">
              {t("costForm.computed")}
            </span>
          )}
        </div>
        <input
          id={`${id}-${field}`}
          value={value}
          onChange={(e) => line.set(field, e.target.value)}
          inputMode="decimal"
          placeholder="0"
          aria-invalid={invalid}
          className={
            computed && line.hasComputed
              ? "min-h-11 rounded-field border border-dashed border-[#a9be97] bg-leaf-50 px-3 text-right font-extrabold text-leaf-800 tabular-nums"
              : `${inputClass(invalid)} text-right tabular-nums`
          }
        />
        {invalid && (
          <span className="text-[13px] text-clay-800">
            {t("costForm.numberInvalid")}
          </span>
        )}
      </div>
    );
  }

  function formatComputed(field: LineField): string {
    if (field === "quantity") return f.number(quantity ?? 0, 3);
    if (field === "unitPrice") return f.moneyInput(unitPrice ?? 0);
    return f.moneyInput(total ?? 0);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 self-start rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px] shadow-[0_8px_24px_rgba(51,41,31,0.08)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={`${id}-title`}
          className="m-0 font-display text-[22px] font-semibold"
        >
          {cost ? t("costForm.editTitle") : t("costForm.newTitle")}
        </h2>
        <IconButton aria-label={t("common.close")} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t("costForm.date")}
          htmlFor={`${id}-date`}
          error={submitted ? errors.date : undefined}
        >
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass(submitted && !!errors.date)}
          />
        </Field>
        <Field label={t("costForm.type")} htmlFor={`${id}-type`}>
          <select
            id={`${id}-type`}
            value={type}
            onChange={(e) => changeType(e.target.value as CostType)}
            className={inputClass()}
          >
            {COST_TYPES.map((c) => (
              <option key={c} value={c}>
                {t(`costType.${c}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={t("costForm.description")}
        htmlFor={`${id}-description`}
        error={submitted ? errors.description : undefined}
      >
        <input
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("costForm.descriptionPlaceholder")}
          aria-invalid={submitted && !!errors.description}
          className={inputClass(submitted && !!errors.description)}
        />
      </Field>

      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 p-0 text-[13px] font-bold">
          {t("costForm.currency")}
        </legend>
        <div className="grid grid-cols-2 gap-0.5 rounded-btn bg-sand-200 p-[3px]">
          {CURRENCIES.map((c) => {
            const active = currency === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCurrency(c)}
                className={`min-h-10 cursor-pointer rounded-lg border-0 ${active ? "bg-sand-50 font-extrabold text-leaf-800 shadow-[0_1px_2px_rgba(51,41,31,0.12)]" : "bg-transparent font-semibold text-soil-900"}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-xl bg-[#f7f2e8] p-4">
        <span className="text-[13px] text-soil-600">
          {t("costForm.twoOfThree")}
        </span>
        <div className="grid grid-cols-[minmax(0,1fr)_104px] items-end gap-2">
          {amountInput("quantity", t("costForm.quantity"))}
          <select
            aria-label={t("costForm.unit")}
            value={unit}
            onChange={(e) => setUnit(e.target.value as QuantityUnit)}
            className={`${inputClass()} px-2 ${line.invalid("quantity") ? "mb-[22px]" : ""}`}
          >
            {QUANTITY_UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`unitName.${u}`)}
              </option>
            ))}
          </select>
        </div>
        {amountInput(
          "unitPrice",
          t("costForm.unitPrice", { currency: symbol }),
        )}
        {amountInput("total", t("costForm.total", { currency: symbol }))}
        {submitted && errors.amount && !anyInvalidNumber && (
          <span role="alert" className="text-[13px] text-clay-800">
            {errors.amount}
          </span>
        )}
      </div>

      {isEur && (
        <Field
          label={t("costForm.rate")}
          htmlFor={`${id}-rate`}
          error={submitted ? errors.rate : undefined}
        >
          <input
            id={`${id}-rate`}
            value={rateText}
            onChange={(e) => setRateText(e.target.value)}
            inputMode="decimal"
            placeholder="117,20"
            aria-invalid={submitted && !!errors.rate}
            className={`${inputClass(submitted && !!errors.rate)} text-right tabular-nums`}
          />
          {lastRate && !cost && (
            <span className="text-[13px] text-soil-700">
              {t("costForm.rateHint", { date: f.date(lastRate.date) })}
            </span>
          )}
        </Field>
      )}

      {isEur && (
        <div className="flex items-baseline justify-between gap-3 rounded-xl bg-leaf-100 px-4 py-3.5">
          <span className="text-sm font-bold text-leaf-800">
            {t("costForm.inRsd")}
          </span>
          <span className="font-display text-[22px] font-semibold text-leaf-800 tabular-nums">
            {totalRsd !== undefined
              ? f.money(totalRsd)
              : `${f.number(0, 2, 2)} RSD`}
          </span>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <div>
          {cost && (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              <TrashIcon size={18} />
              {t("common.delete")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="primary">
            {t("costForm.save")}
          </Button>
        </div>
      </div>

      {cost && confirmingDelete && (
        <ConfirmDialog
          title={t("costForm.deleteTitle")}
          message={t("costForm.deleteMessage", {
            description: cost.description,
            amount: f.money(cost.total, cost.currency),
          })}
          confirmLabel={t("common.delete")}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            costs.remove(cost.id);
            onClose();
          }}
        />
      )}
    </form>
  );
}
