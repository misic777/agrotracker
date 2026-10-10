import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Dialog, { DialogBody, DialogFooter } from "../../components/Dialog";
import { Field } from "../../components/form";
import { inputClass } from "../../components/inputClass";
import { AlertIcon } from "../../components/icons";
import { parseDecimal, useFormat } from "../../lib/format";
import { canonicalMunicipality, findDuplicateParcel } from "../../lib/parcels";
import type { Parcel } from "../../lib/types";
import { useData } from "../../storage/DataContext";

interface ParcelFormDialogProps {
  /** Parcel to edit; omit to add a new one. */
  parcel?: Parcel;
  onClose: () => void;
  onSaved?: (parcel: Parcel) => void;
}

export default function ParcelFormDialog({
  parcel,
  onClose,
  onSaved,
}: ParcelFormDialogProps) {
  const { t } = useTranslation();
  const f = useFormat();
  const { data, parcels } = useData();
  const id = useId();

  const [name, setName] = useState(parcel?.name ?? "");
  const [number, setNumber] = useState(parcel?.number ?? "");
  const [municipality, setMunicipality] = useState(parcel?.municipality ?? "");
  const [areaText, setAreaText] = useState(
    parcel ? f.number(parcel.areaHa, 4) : "",
  );
  const [note, setNote] = useState(parcel?.note ?? "");
  // Required-field errors appear only after the first save attempt.
  const [submitted, setSubmitted] = useState(false);

  const area = parseDecimal(areaText);
  const errors = {
    name: name.trim() === "" ? t("parcelForm.required") : undefined,
    number: number.trim() === "" ? t("parcelForm.required") : undefined,
    municipality:
      municipality.trim() === "" ? t("parcelForm.required") : undefined,
    area:
      area === undefined || area <= 0 ? t("parcelForm.areaInvalid") : undefined,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  // Checked live, as the user types, like in the design.
  const duplicate =
    number.trim() && municipality.trim()
      ? findDuplicateParcel(data.parcels, number, municipality, parcel?.id)
      : undefined;

  // Municipalities already used, offered as suggestions to avoid typos.
  const knownMunicipalities = useMemo(
    () =>
      [...new Set(data.parcels.map((p) => p.municipality.trim()))].sort(
        (a, b) => a.localeCompare(b, "sr"),
      ),
    [data.parcels],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors || duplicate || area === undefined) return;

    const draft = {
      name: name.trim(),
      number: number.trim(),
      municipality: canonicalMunicipality(municipality, knownMunicipalities),
      areaHa: area,
      note: note.trim() || undefined,
    };
    const result = parcel
      ? parcels.update(parcel.id, draft)
      : parcels.add(draft);
    if (result.ok) {
      onSaved?.(result.parcel);
      onClose();
    }
  }

  const show = (error?: string) => (submitted ? error : undefined);

  return (
    <Dialog
      title={parcel ? t("parcelForm.editTitle") : t("parcelForm.addTitle")}
      description={t("parcelForm.description")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogBody>
          <Field
            label={t("parcelForm.name")}
            htmlFor={`${id}-name`}
            error={show(errors.name)}
          >
            <input
              id={`${id}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("parcelForm.namePlaceholder")}
              aria-invalid={!!show(errors.name)}
              className={inputClass(!!show(errors.name))}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label={t("parcelForm.number")}
              htmlFor={`${id}-number`}
              error={show(errors.number)}
            >
              <input
                id={`${id}-number`}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder={t("parcelForm.numberPlaceholder")}
                aria-invalid={!!duplicate || !!show(errors.number)}
                aria-describedby={duplicate ? `${id}-duplicate` : undefined}
                className={inputClass(!!duplicate || !!show(errors.number))}
              />
            </Field>
            <Field
              label={t("parcelForm.municipality")}
              htmlFor={`${id}-municipality`}
              error={show(errors.municipality)}
            >
              <input
                id={`${id}-municipality`}
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                list={`${id}-municipalities`}
                placeholder={t("parcelForm.municipalityPlaceholder")}
                aria-invalid={!!duplicate || !!show(errors.municipality)}
                aria-describedby={duplicate ? `${id}-duplicate` : undefined}
                className={inputClass(
                  !!duplicate || !!show(errors.municipality),
                )}
              />
              <datalist id={`${id}-municipalities`}>
                {knownMunicipalities.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          </div>

          {duplicate && (
            <div
              id={`${id}-duplicate`}
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3.5 text-clay-800"
            >
              <AlertIcon className="mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-extrabold">
                  {t("errors.duplicateParcel", {
                    number: duplicate.number,
                    municipality: duplicate.municipality,
                  })}
                </span>
                <span>
                  {t("parcelForm.duplicateDetail", { name: duplicate.name })}
                </span>
                <Link
                  to={`/parcele/${duplicate.id}`}
                  onClick={onClose}
                  className="self-start font-extrabold text-clay-800 hover:text-clay-600"
                >
                  {t("parcelForm.openExisting", { name: duplicate.name })}
                </Link>
              </div>
            </div>
          )}

          <Field
            label={t("parcelForm.area")}
            htmlFor={`${id}-area`}
            error={show(errors.area)}
          >
            <div
              className={`flex max-w-[220px] items-center rounded-field bg-sand-50 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-leaf-600 ${show(errors.area) ? "border-2 border-clay-600" : "border border-sand-300"}`}
            >
              <input
                id={`${id}-area`}
                value={areaText}
                onChange={(e) => setAreaText(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                aria-invalid={!!show(errors.area)}
                className="min-h-[42px] w-full min-w-0 flex-1 rounded-field bg-transparent px-3 text-right tabular-nums outline-none"
              />
              <span className="px-3 font-bold text-soil-700">ha</span>
            </div>
          </Field>

          <Field
            label={t("parcelForm.note")}
            optionalLabel={t("common.optional")}
            htmlFor={`${id}-note`}
          >
            <textarea
              id={`${id}-note`}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("parcelForm.notePlaceholder")}
              className={`${inputClass()} resize-y py-2.5`}
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="primary" disabled={!!duplicate}>
            {t("parcelForm.save")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
