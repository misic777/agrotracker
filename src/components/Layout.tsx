import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { useData } from "../storage/DataContext";
import Sidebar from "./Sidebar";

export default function Layout() {
  const { t } = useTranslation();
  const { saveFailed } = useData();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-7">
          {saveFailed && (
            <p
              role="alert"
              className="rounded-card border border-soil-400 bg-soil-100 px-5 py-3 font-semibold"
            >
              {t("layout.saveFailed")}
            </p>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
