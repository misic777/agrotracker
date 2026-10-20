import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useData } from "../storage/DataContext";
import { IconButton } from "./Button";
import { AlertIcon, CloseIcon } from "./icons";
import Sidebar from "./Sidebar";

export default function Layout() {
  const { t } = useTranslation();
  const { saveError, dismissSaveError } = useData();
  const { status, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-7">
          {status === "demo" && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border border-wheat-200 bg-wheat-200/40 px-5 py-3">
              <p className="m-0 text-sm text-wheat-800">
                <strong>{t("demo.bannerTitle")}</strong> {t("demo.bannerText")}
              </p>
              <button
                type="button"
                onClick={() => signOut()}
                className="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-leaf-700 underline-offset-2 hover:underline"
              >
                {t("demo.signIn")}
              </button>
            </div>
          )}
          {saveError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-card border border-clay-200 bg-clay-50 py-2 pr-2 pl-5 text-clay-800"
            >
              <AlertIcon className="mt-2.5 shrink-0" />
              <p className="m-0 flex-1 py-2 font-semibold">
                {t(`layout.saveError.${saveError}`)}
              </p>
              <IconButton
                aria-label={t("common.close")}
                onClick={dismissSaveError}
              >
                <CloseIcon size={18} />
              </IconButton>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
