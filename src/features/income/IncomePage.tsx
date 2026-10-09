import { useTranslation } from "react-i18next";
import ComingSoon from "../../components/ComingSoon";
import PageHeader from "../../components/PageHeader";

export default function IncomePage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t("nav.income")}
        subtitle={t("pages.income.subtitle")}
      />
      <ComingSoon />
    </>
  );
}
