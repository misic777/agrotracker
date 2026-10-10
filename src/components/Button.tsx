import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-0 bg-leaf-600 px-[18px] text-sand-50 hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-[#a9b79f]",
  secondary:
    "border border-sand-300 bg-sand-50 text-soil-900 hover:bg-sand-100",
  ghost: "border-0 bg-transparent text-leaf-600 hover:bg-leaf-50",
  danger:
    "border border-clay-200 bg-clay-50 text-clay-800 hover:bg-clay-200/60",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "secondary",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-btn px-4 font-bold ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need a text label for screen readers. */
  "aria-label": string;
  bordered?: boolean;
}

/** Square 44px button holding only an icon, e.g. edit or close. */
export function IconButton({
  bordered = false,
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-btn text-soil-700 hover:bg-sand-200 hover:text-soil-900 ${bordered ? "border border-sand-300 bg-sand-50" : "border-0 bg-transparent"} ${className}`}
      {...rest}
    />
  );
}
