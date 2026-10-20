import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";

/** SR / EN toggle. */
export default function LanguageSwitch({
  className = "",
}: {
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("layout.language")}
      className={`flex gap-0.5 rounded-btn bg-leaf-200 p-[3px] ${className}`}
    >
      {LANGUAGES.map((lng) => {
        const active = i18n.language === lng;
        return (
          <button
            key={lng}
            type="button"
            aria-pressed={active}
            onClick={() => i18n.changeLanguage(lng)}
            className={[
              "min-h-9 min-w-11 cursor-pointer rounded-lg border-0 text-[13px]",
              active
                ? "bg-sand-50 font-bold text-leaf-800"
                : "bg-transparent font-semibold text-soil-900",
            ].join(" ")}
          >
            {lng.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
