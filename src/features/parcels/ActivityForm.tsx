import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Field } from "../../components/form";
import { inputClass } from "../../components/inputClass";
import { TrashIcon } from "../../components/icons";
import { parseDecimal, todayIso, useFormat } from "../../lib/format";
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPES_WITH_PRODUCT,
  RATE_UNITS,
  type Activity,
  type ActivityType,
  type Id,
  type RateUnit,
} from "../../lib/types";
import { useData } from "../../storage/DataContext";

interface ActivityFormProps {
  seasonId: Id;
  /** Activity to edit; omit to add a new one. */
  activity?: Activity;
  onDone: () => void;
}

/** Inline form above the activity log, as in the design. */
export default function ActivityForm({
  seasonId,
  activity,
  onDone,
}: ActivityFormProps) {
  const { t } = useTranslation();
  const f = useFormat();
  const { activities } = useData();
  const id = useId();

  const [type, setType] = useState<ActivityType>(activity?.type ?? "tillage");
  const [date, setDate] = useState(activity?.date ?? todayIso());
  const [product, setProduct] = useState(activity?.product ?? "");
  const [rateText, setRateText] = useState(
    activity?.ratePerHa !== undefined ? f.number(activity.ratePerHa, 3) : "",
  );
  const [rateUnit, setRateUnit] = useState<RateUnit>(
    activity?.rateUnit ?? "kgPerHa",
  );
  const [note, setNote] = useState(activity?.note ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const withProduct = ACTIVITY_TYPES_WITH_PRODUCT.includes(type);
  const rate = parseDecimal(rateText);
  const rateError =
    withProduct && rateText.trim() !== "" && (rate === undefined || rate < 0)
      ? t("activityForm.rateInvalid")
      : undefined;
  const dateError = date === "" ? t("activityForm.dateRequired") : undefined;

  function changeType(next: ActivityType) {
    setType(next);
    // Sensible default unit: fertilizer in kg, crop protection in litres.
    if (rateText.trim() === "") {
      if (next === "spraying") setRateUnit("lPerHa");
      if (next === "fertilizing") setRateUnit("kgPerHa");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (dateError || rateError) return;

    const draft = {
      seasonId,
      type,
      date,
      // Product fields are only kept for fertilizing and spraying.
      product: withProduct ? product.trim() || undefined : undefined,
      ratePerHa: withProduct ? rate : undefined,
      rateUnit: withProduct && rate !== undefined ? rateUnit : undefined,
      note: note.trim() || undefined,
    };
    if (activity) activities.update(activity.id, draft);
    else activities.add(draft);
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-3.5 rounded-xl border border-leaf-200 bg-leaf-50 px-5 py-[18px]"
    >
      <span id={`${id}-title`} className="font-extrabold text-leaf-800">
        {activity ? t("activityForm.editTitle") : t("activityForm.newTitle")}
      </span>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3">
        <Field label={t("activityForm.type")} htmlFor={`${id}-type`}>
          <select
            id={`${id}-type`}
            value={type}
            onChange={(e) => changeType(e.target.value as ActivityType)}
            className={inputClass()}
          >
            {ACTIVITY_TYPES.map((a) => (
              <option key={a} value={a}>
                {t(`activityType.${a}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={t("activityForm.date")}
          htmlFor={`${id}-date`}
          error={submitted ? dateError : undefined}
        >
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={submitted && !!dateError}
            className={inputClass(submitted && !!dateError)}
          />
        </Field>

        {withProduct && (
          <>
            <Field label={t("activityForm.product")} htmlFor={`${id}-product`}>
              <input
                id={`${id}-product`}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder={t("activityForm.productPlaceholder")}
                className={inputClass()}
              />
            </Field>

            <Field
              label={t("activityForm.rate")}
              htmlFor={`${id}-rate`}
              error={rateError}
            >
              <div className="flex gap-1.5">
                <input
                  id={`${id}-rate`}
                  value={rateText}
                  onChange={(e) => setRateText(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  aria-invalid={!!rateError}
                  className={`${inputClass(!!rateError)} flex-1 tabular-nums`}
                />
                <select
                  aria-label={t("activityForm.unit")}
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value as RateUnit)}
                  className={`${inputClass()} shrink-0 px-2`}
                >
                  {RATE_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t(`unit.${u}`)}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
          </>
        )}
      </div>

      <Field label={t("activityForm.note")} htmlFor={`${id}-note`}>
        <input
          id={`${id}-note`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("activityForm.notePlaceholder")}
          className={inputClass()}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-leaf-700">
          {t("activityForm.productHint")}
        </span>
        <div className="flex flex-wrap gap-2">
          {activity && (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              <TrashIcon size={18} />
              {t("common.delete")}
            </Button>
          )}
          <Button onClick={onDone} className="border-leaf-200 bg-transparent">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="primary">
            {t("activityForm.save")}
          </Button>
        </div>
      </div>

      {activity && confirmingDelete && (
        <ConfirmDialog
          title={t("activityForm.deleteTitle")}
          message={t("activityForm.deleteMessage", {
            date: f.date(activity.date),
          })}
          confirmLabel={t("common.delete")}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            activities.remove(activity.id);
            onDone();
          }}
        />
      )}
    </form>
  );
}
