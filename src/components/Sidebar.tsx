import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { LANGUAGES } from "../i18n";
import { downloadJson } from "../lib/exportJson";
import { useData } from "../storage/DataContext";
import {
  ChartIcon,
  CoinIcon,
  DownloadIcon,
  HomeIcon,
  Logo,
  MapIcon,
  ReceiptIcon,
} from "./icons";

const NAV_ITEMS: {
  to: string;
  labelKey: string;
  Icon: ComponentType<{ size?: number }>;
}[] = [
  { to: "/", labelKey: "nav.home", Icon: HomeIcon },
  { to: "/parcele", labelKey: "nav.parcels", Icon: MapIcon },
  { to: "/troskovi", labelKey: "nav.costs", Icon: ReceiptIcon },
  { to: "/prihodi", labelKey: "nav.income", Icon: CoinIcon },
  { to: "/bilans", labelKey: "nav.balance", Icon: ChartIcon },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { data } = useData();

  return (
    <aside className="flex flex-col gap-8 border-b border-leaf-200 bg-leaf-100 px-4 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-[232px] lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 px-1.5">
        <Logo />
        <div className="flex flex-col">
          <span className="font-display text-xl leading-tight font-bold">
            {t("app.name")}
          </span>
          <span className="text-[13px] text-soil-600">
            {t("app.household")}
          </span>
        </div>
      </div>

      <nav aria-label={t("nav.label")} className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [
                "flex min-h-11 items-center gap-3 rounded-btn px-3.5 no-underline",
                isActive
                  ? "bg-sand-50 font-bold text-leaf-800 shadow-[0_1px_2px_rgba(51,41,31,0.08)] hover:text-leaf-800"
                  : "font-semibold text-soil-900 hover:bg-leaf-200/60 hover:text-soil-900",
              ].join(" ")
            }
          >
            <Icon />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 lg:mt-auto">
        <button
          type="button"
          onClick={() => downloadJson(data)}
          className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-btn border text-left border-leaf-200 px-3.5 text-sm font-semibold text-soil-900 hover:bg-leaf-200/60"
        >
          <DownloadIcon size={18} />
          {t("layout.export")}
        </button>

        <div className="flex items-center justify-between gap-2 px-1.5">
          <span className="text-[13px] text-soil-600">
            {t("layout.language")}
          </span>
          <div className="flex gap-0.5 rounded-btn bg-leaf-200 p-[3px]">
            {LANGUAGES.map((lng) => {
              const active = i18n.language === lng;
              return (
                <button
                  key={lng}
                  type="button"
                  aria-pressed={active}
                  onClick={() => i18n.changeLanguage(lng)}
                  className={[
                    "min-h-9 min-w-11 cursor-pointer rounded-lg text-[13px]",
                    active
                      ? "bg-sand-50 font-bold text-leaf-800"
                      : "font-semibold text-soil-900",
                  ].join(" ")}
                >
                  {lng.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
