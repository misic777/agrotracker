import { useTranslation } from "react-i18next";
import { inputClass } from "./inputClass";

interface LineAmountInputProps {
  id: string;
  label: string;
  value: string;
  /** Shown in green with a "calculated" badge when computed from the others. */
  computed: boolean;
  invalid: boolean;
  onChange: (text: string) => void;
}

/**
 * One of the three "enter any two" inputs (quantity, price, total).
 * Used with the useLineAmounts hook in the cost and sale forms.
 */
export default function LineAmountInput({
  id,
  label,
  value,
  computed,
  invalid,
  onChange,
}: LineAmountInputProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-bold">
          {label}
        </label>
        {computed && (
          <span className="rounded-full bg-leaf-200 px-2 py-0.5 text-xs font-bold text-leaf-800">
            {t("costForm.computed")}
          </span>
        )}
      </div>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        aria-invalid={invalid}
        className={
          computed
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
