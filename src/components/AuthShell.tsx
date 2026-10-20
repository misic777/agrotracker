import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./LanguageSwitch";
import { Logo } from "./icons";

/**
 * Full-screen frame for pages outside the main layout: login, household
 * setup and loading. Logo on top, content centered, language switch in the
 * corner.
 */
export default function AuthShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  /** Wider column for pages with two cards side by side. */
  wide?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-sand-100 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-display text-xl font-bold">
            {t("app.name")}
          </span>
        </div>
        <LanguageSwitch />
      </header>
      <main
        className={`mx-auto flex w-full flex-1 flex-col justify-center gap-6 py-10 ${wide ? "max-w-[880px]" : "max-w-[440px]"}`}
      >
        {children}
      </main>
    </div>
  );
}
