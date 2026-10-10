import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import Dialog, { DialogBody, DialogFooter } from "../../components/Dialog";
import { Field } from "../../components/form";
import { parseDecimal, useFormat } from "../../lib/format";
import type { Parcel, Season } from "../../lib/types";
import { useData } from "../../storage/DataContext";

interface YieldDialogProps {
  parcel: Parcel;
  season: Season;
  onClose: () => void;
}

export default function YieldDialog({
  parcel,
  season,
  onClose,
}: YieldDialogProps) {
  const { t } = useTranslation();
  const f = useFormat();
  const { seasons } = useData();
  const id = useId();

  const [text, setText] = useState(
    season.yieldKg !== undefined ? f.number(season.yieldKg, 2) : "",
  );
  const kg = parseDecimal(text);
  const empty = text.trim() === "";
  const error =
    !empty && (kg === undefined || kg < 0) ? t("yield.invalid") : undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (error) return;
    const { id: seasonId, ...rest } = season;
    seasons.update(seasonId, { ...rest, yieldKg: empty ? undefined : kg });
    onClose();
  }

  return (
    <Dialog
      title={t("yield.dialogTitle", { year: season.year })}
      description={t("yield.dialogDescription")}
      onClose={onClose}
      size="sm"
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogBody>
          <Field label={t("yield.amount")} htmlFor={`${id}-kg`} error={error}>
            <div
              className={`flex max-w-[260px] items-center rounded-field bg-sand-50 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-leaf-600 ${error ? "border-2 border-clay-600" : "border border-sand-300"}`}
            >
              <input
                id={`${id}-kg`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                aria-invalid={!!error}
                autoFocus
                className="min-h-[42px] w-full min-w-0 flex-1 rounded-field bg-transparent px-3 text-right tabular-nums outline-none"
              />
              <span className="px-3 font-bold text-soil-700">kg</span>
            </div>
          </Field>
          <p className="m-0 text-sm text-soil-700">
            {kg !== undefined && !error && parcel.areaHa > 0
              ? t("yield.preview", {
                  perHa: f.integer(kg / parcel.areaHa),
                  area: f.area(parcel.areaHa),
                })
              : t("yield.clearHint")}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="primary" disabled={!!error}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
