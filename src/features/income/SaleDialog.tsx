import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import Dialog, { DialogBody, DialogFooter } from "../../components/Dialog";
import { Field } from "../../components/form";
import { TrashIcon } from "../../components/icons";
import { inputClass } from "../../components/inputClass";
import LineAmountInput from "../../components/LineAmountInput";
import { useLineAmounts, type LineField } from "../../hooks/useLineAmounts";
import { todayIso, useFormat } from "../../lib/format";
import { CROPS, type Crop, type Income } from "../../lib/types";
import { useData } from "../../storage/DataContext";

interface SaleDialogProps {
  /** Sale to edit; omit to add a new one. */
  sale?: Income;
  onClose: () => void;
}

/** A crop sale: quantity × price per kg, with "enter any two of three". */
export default function SaleDialog({ sale, onClose }: SaleDialogProps) {
  const { t } = useTranslation();
  const f = useFormat();
  const { incomes } = useData();
  const id = useId();

  const [date, setDate] = useState(sale?.date ?? todayIso());
  const [crop, setCrop] = useState<Crop>(sale?.crop ?? "wheat");
  const [buyer, setBuyer] = useState(sale?.buyer ?? "");
  const [description, setDescription] = useState(sale?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const line = useLineAmounts(
    {
      quantity:
        sale?.quantityKg !== undefined ? f.number(sale.quantityKg, 3) : "",
      unitPrice:
        sale?.pricePerKg !== undefined ? f.moneyInput(sale.pricePerKg) : "",
      total: sale ? f.moneyInput(sale.total) : "",
    },
    sale && sale.pricePerKg === undefined
      ? ["quantity", "total"]
      : ["quantity", "unitPrice"],
  );
  const { quantity, unitPrice, total } = line.resolved;

  const dateError = date === "" ? t("costForm.dateRequired") : undefined;
  const amountError =
    total === undefined || total <= 0 ? t("income.amountRequired") : undefined;
  const anyInvalid =
    line.invalid("quantity") ||
    line.invalid("unitPrice") ||
    line.invalid("total");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (dateError || amountError || anyInvalid || total === undefined) return;

    const draft = {
      date,
      kind: "sale" as const,
      crop,
      quantityKg: quantity,
      pricePerKg: unitPrice,
      buyer: buyer.trim() || undefined,
      description: description.trim() || undefined,
      // Income is entered in dinars for now.
      currency: "RSD" as const,
      total,
      totalRsd: total,
    };
    if (sale) incomes.update(sale.id, draft);
    else incomes.add(draft);
    onClose();
  }

  function computedText(field: LineField): string {
    if (field === "quantity") return f.number(quantity ?? 0, 3);
    if (field === "unitPrice") return f.moneyInput(unitPrice ?? 0);
    return f.moneyInput(total ?? 0);
  }

  function amount(field: LineField, label: string) {
    const isComputed = line.computed === field;
    return (
      <LineAmountInput
        id={`${id}-${field}`}
        label={label}
        value={
          isComputed
            ? line.hasComputed
              ? computedText(field)
              : ""
            : line.texts[field]
        }
        computed={isComputed && line.hasComputed}
        invalid={line.invalid(field)}
        onChange={(text) => line.set(field, text)}
      />
    );
  }

  return (
    <>
      <Dialog
        title={sale ? t("income.editSale") : t("income.newSale")}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} noValidate>
          <DialogBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={t("income.date")}
                htmlFor={`${id}-date`}
                error={submitted ? dateError : undefined}
              >
                <input
                  id={`${id}-date`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass(submitted && !!dateError)}
                />
              </Field>
              <Field label={t("income.crop")} htmlFor={`${id}-crop`}>
                <select
                  id={`${id}-crop`}
                  value={crop}
                  onChange={(e) => setCrop(e.target.value as Crop)}
                  className={inputClass()}
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {t(`crop.${c}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-[#f7f2e8] p-4">
              <span className="text-[13px] text-soil-600">
                {t("costForm.twoOfThree")}
              </span>
              {amount("quantity", t("income.quantityKg"))}
              {amount("unitPrice", t("income.pricePerKg"))}
              {amount("total", t("income.totalRsd"))}
              {submitted && amountError && !anyInvalid && (
                <span role="alert" className="text-[13px] text-clay-800">
                  {amountError}
                </span>
              )}
            </div>

            <Field
              label={t("income.buyer")}
              optionalLabel={t("common.optional")}
              htmlFor={`${id}-buyer`}
            >
              <input
                id={`${id}-buyer`}
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder={t("income.buyerPlaceholder")}
                className={inputClass()}
              />
            </Field>
            <Field
              label={t("income.note")}
              optionalLabel={t("common.optional")}
              htmlFor={`${id}-note`}
            >
              <input
                id={`${id}-note`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass()}
              />
            </Field>
          </DialogBody>

          <DialogFooter
            start={
              sale && (
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
              {t("income.saveSale")}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {sale && confirmingDelete && (
        <ConfirmDialog
          title={t("income.deleteTitle")}
          message={t("income.deleteMessage", {
            date: f.date(sale.date),
            amount: f.money(sale.totalRsd),
          })}
          confirmLabel={t("common.delete")}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            incomes.remove(sale.id);
            onClose();
          }}
        />
      )}
    </>
  );
}
