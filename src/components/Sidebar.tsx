import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useHousehold } from "../features/household/household";
import { downloadJson } from "../lib/exportJson";
import { useData } from "../storage/DataContext";
import Avatar from "./Avatar";
import ImportData from "./ImportData";
import LanguageSwitch from "./LanguageSwitch";
import {
  ChartIcon,
  CoinIcon,
  DownloadIcon,
  HomeIcon,
  LogOutIcon,
  Logo,
  MapIcon,
  ReceiptIcon,
  UsersIcon,
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

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex min-h-11 items-center gap-3 rounded-btn px-3.5 no-underline",
    isActive
      ? "bg-sand-50 font-bold text-leaf-800 shadow-[0_1px_2px_rgba(51,41,31,0.08)] hover:text-leaf-800"
      : "font-semibold text-soil-900 hover:bg-leaf-200/60 hover:text-soil-900",
  ].join(" ");

export default function Sidebar() {
  const { t } = useTranslation();
  const { data } = useData();
  const { status } = useAuth();
  const { data: household } = useHousehold();

  const subtitle =
    status === "demo" ? t("layout.demoMode") : (household?.name ?? "");

  return (
    <aside className="flex flex-col gap-8 border-b border-leaf-200 bg-leaf-100 px-4 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-[232px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 px-1.5">
        <Logo />
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-xl leading-tight font-bold">
            {t("app.name")}
          </span>
          <span className="truncate text-[13px] text-soil-600">{subtitle}</span>
        </div>
      </div>

      <nav aria-label={t("nav.label")} className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, labelKey, Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={navLinkClass}>
            <Icon />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 lg:mt-auto">
        <button
          type="button"
          onClick={() => downloadJson(data)}
          className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-btn border border-leaf-200 bg-transparent px-3.5 text-left text-sm font-semibold text-soil-900 hover:bg-leaf-200/60"
        >
          <DownloadIcon size={18} />
          {t("layout.export")}
        </button>
        <ImportData />

        <div className="flex items-center justify-between gap-2 px-1.5">
          <span className="text-[13px] text-soil-600">
            {t("layout.language")}
          </span>
          <LanguageSwitch />
        </div>

        <AccountBlock />
      </div>
    </aside>
  );
}

/** Who is signed in, with links to the household and to sign out. */
function AccountBlock() {
  const { t } = useTranslation();
  const { status, user, signOut } = useAuth();

  const signOutButton = (label: string) => (
    <button
      type="button"
      onClick={() => signOut()}
      className="flex min-h-10 cursor-pointer items-center gap-2 rounded-btn border-0 bg-transparent px-2 text-sm font-semibold text-soil-700 hover:bg-leaf-200/60 hover:text-soil-900"
    >
      <LogOutIcon size={18} />
      {label}
    </button>
  );

  if (status === "demo") {
    return (
      <div className="mt-2 flex flex-col gap-1 border-t border-leaf-200 pt-3">
        <p className="m-0 px-1.5 text-[13px] text-soil-600">
          {t("layout.demoNote")}
        </p>
        {signOutButton(t("layout.exitDemo"))}
      </div>
    );
  }

  if (!user) return null;
  const display = user.name ?? user.email ?? "";

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-leaf-200 pt-3">
      <div className="flex items-center gap-2.5 px-1.5 pb-1">
        <Avatar name={display} size={34} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold">{display}</span>
          {user.name && user.email && (
            <span className="truncate text-xs text-soil-600">{user.email}</span>
          )}
        </div>
      </div>
      <NavLink to="/gazdinstvo" className={navLinkClass}>
        <UsersIcon size={18} />
        <span className="text-sm">{t("layout.household")}</span>
      </NavLink>
      {signOutButton(t("layout.signOut"))}
    </div>
  );
}
