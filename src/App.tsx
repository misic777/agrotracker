import { useTranslation } from "react-i18next";

export default function App() {
  const { t, i18n } = useTranslation();

  function switchLanguage() {
    const next = i18n.language === "sr" ? "en" : "sr";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-green-700">{t("app.name")}</h1>
      <ul className="mt-4 list-disc pl-6">
        <li>{t("nav.home")}</li>
        <li>{t("nav.parcels")}</li>
        <li>{t("nav.costs")}</li>
      </ul>
      <button
        onClick={switchLanguage}
        className="mt-4 rounded bg-green-700 px-4 py-2 text-white"
      >
        {i18n.language.toUpperCase()}
      </button>
    </div>
  );
}
