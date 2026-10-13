import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { AppData } from "../lib/types";
import { useData } from "../storage/DataContext";
import { parseBackup } from "../storage/localStore";
import Button from "./Button";
import ConfirmDialog from "./ConfirmDialog";
import Dialog, { DialogBody, DialogFooter } from "./Dialog";

/** Short summary like "3 parcele, 12 troškova, 4 prihoda". */
function useSummary() {
  const { t } = useTranslation();
  return (d: AppData) =>
    [
      t("import.parcels", { count: d.parcels.length }),
      t("import.seasons", { count: d.seasons.length }),
      t("import.costs", { count: d.costs.length }),
      t("import.incomes", { count: d.incomes.length }),
    ].join(", ");
}

/**
 * Loads a JSON backup made with "Izvezi podatke". Mainly for moving data
 * between computers while data is stored locally, and for the later move
 * to the database.
 */
export default function ImportData() {
  const { t } = useTranslation();
  const { data, replaceAll } = useData();
  const summary = useSummary();
  const fileInput = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<AppData | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (backup) setPending(backup);
    else setInvalid(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="cursor-pointer self-start border-0 bg-transparent px-3.5 py-1 text-[13px] font-semibold text-soil-600 underline-offset-2 hover:text-soil-900 hover:underline"
      >
        {t("import.button")}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {pending && (
        <ConfirmDialog
          title={t("import.confirmTitle")}
          message={t("import.confirmMessage", {
            current: summary(data),
            incoming: summary(pending),
          })}
          confirmLabel={t("import.confirm")}
          onClose={() => setPending(null)}
          onConfirm={() => {
            replaceAll(pending);
            setDone(true);
          }}
        />
      )}

      {(invalid || done) && (
        <Dialog
          title={invalid ? t("import.invalidTitle") : t("import.doneTitle")}
          size="sm"
          onClose={() => {
            setInvalid(false);
            setDone(false);
          }}
        >
          <DialogBody>
            <p className="m-0">
              {invalid ? t("import.invalidText") : t("import.doneText")}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="primary"
              onClick={() => {
                setInvalid(false);
                setDone(false);
              }}
            >
              {t("import.ok")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
}
