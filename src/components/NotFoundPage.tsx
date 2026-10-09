import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Card from "./Card";
import PageHeader from "./PageHeader";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("pages.notFound.title")} />
      <Card className="flex flex-col gap-3">
        <p className="m-0 text-soil-700">{t("pages.notFound.text")}</p>
        <Link to="/" className="font-bold">
          {t("pages.notFound.back")}
        </Link>
      </Card>
    </>
  );
}
