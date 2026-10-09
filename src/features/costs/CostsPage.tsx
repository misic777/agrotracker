import { useTranslation } from "react-i18next";
import ComingSoon from "../../components/ComingSoon";
import PageHeader from "../../components/PageHeader";

export default function CostsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("nav.costs")} subtitle={t("pages.costs.subtitle")} />
      <ComingSoon />
    </>
  );
}
