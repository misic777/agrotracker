import type { ReactNode } from "react";

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  /** Shown next to the label in lighter text, e.g. "(opciono)". */
  optionalLabel?: string;
  /** Error message shown under the input. */
  error?: string;
  children: ReactNode;
  className?: string;
}

/** A label above an input, with an optional error below it. */
export function Field({
  label,
  htmlFor,
  optionalLabel,
  error,
  children,
  className = "",
}: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-bold">
        {label}
        {optionalLabel && (
          <span className="font-medium text-soil-700"> {optionalLabel}</span>
        )}
      </label>
      {children}
      {error && (
        <span id={`${htmlFor}-error`} className="text-[13px] text-clay-800">
          {error}
        </span>
      )}
    </div>
  );
}
