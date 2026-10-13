import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import Dialog, { DialogBody, DialogFooter } from "../../components/Dialog";
import { Field } from "../../components/form";
import { TrashIcon } from "../../components/icons";
import { inputClass } from "../../components/inputClass";
import { parseDecimal, todayIso, useFormat } from "../../lib/format";
import { toMinor } from "../../lib/money";
import type { Income } from "../../lib/types";
import { useData } from "../../storage/DataContext";

type OtherKind = "subsidy" | "other";

interface OtherIncomeDialogProps {
  /** Entry to edit; omit to add a new one. */
  entry?: Income;
  onClose: () => void;
}

/** Subsidies and any other income that is not a crop sale. */
export default function OtherIncomeDialog({
  entry,
  onClose,
}: OtherIncomeDialogProps) {
  const { t } = useTranslation();
  const f = useFormat();
  const { incomes } = useData();
  const id = useId();

  const [date, setDate] = useState(entry?.date ?? todayIso());
  const [kind, setKind] = useState<OtherKind>(
    entry?.kind === "other" ? "other" : "subsidy",
  );
  const [description, setDescription] = useState(entry?.description ?? "");
  const [amountText, setAmountText] = useState(
    entry ? f.moneyInput(entry.total) : "",
  );
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const amount = parseDecimal(amountText);
  const errors = {
    date: date === "" ? t("costForm.dateRequired") : undefined,
    description:
      description.trim() === "" ? t("costForm.descriptionRequired") : undefined,
    amount:
      amount === undefined || amount <= 0
        ? t("income.amountInvalid")
        : undefined,
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || amount === undefined) return;
    const total = toMinor(amount);
    const draft = {
      date,
      kind,
      description: description.trim(),
      currency: "RSD" as const,
      total,
      totalRsd: total,
    };
    if (entry) incomes.update(entry.id, draft);
    else incomes.add(draft);
    onClose();
  }

  const show = (error?: string) => (submitted ? error : undefined);

  return (
    <>
      <Dialog
        title={entry ? t("income.editOther") : t("income.newOther")}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} noValidate>
          <DialogBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={t("income.date")}
                htmlFor={`${id}-date`}
                error={show(errors.date)}
              >
                <input
                  id={`${id}-date`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass(!!show(errors.date))}
                />
              </Field>
              <Field label={t("income.kind")} htmlFor={`${id}-kind`}>
                <select
                  id={`${id}-kind`}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as OtherKind)}
                  className={inputClass()}
                >
                  <option value="subsidy">{t("incomeKind.subsidy")}</option>
                  <option value="other">{t("incomeKind.other")}</option>
                </select>
              </Field>
            </div>

            <Field
              label={t("income.description")}
              htmlFor={`${id}-description`}
              error={show(errors.description)}
            >
              <input
                id={`${id}-description`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("income.descriptionPlaceholder")}
                aria-invalid={!!show(errors.description)}
                className={inputClass(!!show(errors.description))}
              />
            </Field>

            <Field
              label={t("income.amountRsd")}
              htmlFor={`${id}-amount`}
              error={show(errors.amount)}
            >
              <input
                id={`${id}-amount`}
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                aria-invalid={!!show(errors.amount)}
                className={`${inputClass(!!show(errors.amount))} max-w-[260px] text-right tabular-nums`}
              />
            </Field>
          </DialogBody>

          <DialogFooter
            start={
              entry && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <TrashIcon size={18} />
                  {t("common.delete")}
                </Button>
              )
            }
          >
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {entry && confirmingDelete && (
        <ConfirmDialog
          title={t("income.deleteTitle")}
          message={t("income.deleteMessage", {
            date: f.date(entry.date),
            amount: f.money(entry.totalRsd),
          })}
          confirmLabel={t("common.delete")}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            incomes.remove(entry.id);
            onClose();
          }}
        />
      )}
    </>
  );
}
