import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import Dialog, { DialogBody, DialogFooter } from "../../components/Dialog";
import { Field } from "../../components/form";
import { inputClass } from "../../components/inputClass";
import { TrashIcon } from "../../components/icons";
import { CROPS, type Crop, type Id, type Season } from "../../lib/types";
import { useData } from "../../storage/DataContext";

interface SeasonFormDialogProps {
  parcelId: Id;
  /** Season to edit; omit to add a new one. */
  season?: Season;
  onClose: () => void;
  onSaved?: (season: Season) => void;
  onDeleted?: () => void;
}

export default function SeasonFormDialog({
  parcelId,
  season,
  onClose,
  onSaved,
  onDeleted,
}: SeasonFormDialogProps) {
  const { t } = useTranslation();
  const { data, seasons } = useData();
  const id = useId();

  const [yearText, setYearText] = useState(
    String(season?.year ?? new Date().getFullYear()),
  );
  const [crop, setCrop] = useState<Crop>(season?.crop ?? "wheat");
  const [hybrid, setHybrid] = useState(season?.hybrid ?? "");
  const [note, setNote] = useState(season?.note ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const year = Number(yearText);
  const yearValid = Number.isInteger(year) && year >= 1990 && year <= 2100;
  // One season per parcel per year.
  const duplicateYear =
    yearValid &&
    data.seasons.some(
      (s) => s.parcelId === parcelId && s.year === year && s.id !== season?.id,
    );
  const yearError = !yearValid
    ? t("seasonForm.yearInvalid")
    : duplicateYear
      ? t("seasonForm.duplicateYear", { year })
      : undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (yearError) return;
    const draft = {
      parcelId,
      year,
      crop,
      hybrid: hybrid.trim() || undefined,
      note: note.trim() || undefined,
      // Editing must not drop the yield entered earlier.
      yieldKg: season?.yieldKg,
    };
    if (season) {
      seasons.update(season.id, draft);
      onSaved?.({ ...draft, id: season.id });
    } else {
      onSaved?.(seasons.add(draft));
    }
    onClose();
  }

  return (
    <>
      <Dialog
        title={
          season
            ? t("seasonForm.editTitle", { year: season.year })
            : t("seasonForm.addTitle")
        }
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} noValidate>
          <DialogBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
              <Field
                label={t("seasonForm.year")}
                htmlFor={`${id}-year`}
                error={yearError}
              >
                <input
                  id={`${id}-year`}
                  type="number"
                  min={1990}
                  max={2100}
                  value={yearText}
                  onChange={(e) => setYearText(e.target.value)}
                  aria-invalid={!!yearError}
                  className={`${inputClass(!!yearError)} tabular-nums`}
                />
              </Field>
              <Field label={t("seasonForm.crop")} htmlFor={`${id}-crop`}>
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

            <Field
              label={t("seasonForm.hybrid")}
              optionalLabel={t("common.optional")}
              htmlFor={`${id}-hybrid`}
            >
              <input
                id={`${id}-hybrid`}
                value={hybrid}
                onChange={(e) => setHybrid(e.target.value)}
                placeholder={t("seasonForm.hybridPlaceholder")}
                className={inputClass()}
              />
            </Field>

            <Field
              label={t("seasonForm.note")}
              optionalLabel={t("common.optional")}
              htmlFor={`${id}-note`}
            >
              <input
                id={`${id}-note`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("seasonForm.notePlaceholder")}
                className={inputClass()}
              />
            </Field>
          </DialogBody>

          <DialogFooter
            start={
              season && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <TrashIcon size={18} />
                  {t("seasonForm.delete")}
                </Button>
              )
            }
          >
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" variant="primary" disabled={!!yearError}>
              {t("seasonForm.save")}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {season && confirmingDelete && (
        <ConfirmDialog
          title={t("seasonForm.deleteTitle", { year: season.year })}
          message={t("seasonForm.deleteMessage")}
          confirmLabel={t("seasonForm.delete")}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => {
            seasons.remove(season.id);
            onDeleted?.();
            onClose();
          }}
        />
      )}
    </>
  );
}
