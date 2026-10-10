import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "./Button";
import { CloseIcon } from "./icons";

interface DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Narrow dialogs for confirmations, wide for forms. */
  size?: "sm" | "md";
}

/**
 * Modal built on the native <dialog> element, which gives focus trapping,
 * Esc to close and an accessible backdrop for free.
 *
 * Render it conditionally ({open && <Dialog …/>}): it opens when mounted and
 * its form state starts fresh every time.
 */
export default function Dialog({
  title,
  description,
  onClose,
  children,
  size = "md",
}: DialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Esc: let React decide by unmounting instead of closing natively.
        e.preventDefault();
        onClose();
      }}
      className={`mx-auto mt-[8vh] max-h-[84vh] w-[calc(100%-32px)] overflow-y-auto rounded-[18px] bg-sand-50 p-0 text-soil-900 shadow-[0_24px_64px_rgba(51,41,31,0.28)] backdrop:bg-soil-900/40 ${size === "sm" ? "max-w-[440px]" : "max-w-[560px]"}`}
    >
      <div className="flex items-center justify-between gap-3 px-[26px] pt-[22px] pb-1.5">
        <h2 id={titleId} className="m-0 font-display text-2xl font-semibold">
          {title}
        </h2>
        <IconButton aria-label={t("common.close")} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      {description && (
        <p className="m-0 px-[26px] text-sm text-soil-700">{description}</p>
      )}
      {children}
    </dialog>
  );
}

/** Padded body of a dialog. */
export function DialogBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 px-[26px] py-5">{children}</div>;
}

/** Bottom bar with actions; `start` holds e.g. a delete button on the left. */
export function DialogFooter({
  children,
  start,
}: {
  children: ReactNode;
  start?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 px-[26px] pt-4 pb-[22px]">
      <div>{start}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
