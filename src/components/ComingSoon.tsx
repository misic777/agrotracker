import { useTranslation } from "react-i18next";
import Card from "./Card";

/** Temporary placeholder for pages that are not built yet. */
export default function ComingSoon() {
  const { t } = useTranslation();
  return (
    <Card>
      <p className="m-0 text-soil-700">{t("pages.comingSoon")}</p>
    </Card>
  );
}
