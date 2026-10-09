import { useTranslation } from "react-i18next";
import ComingSoon from "../../components/ComingSoon";
import PageHeader from "../../components/PageHeader";

export default function BalancePage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t("nav.balance")}
        subtitle={t("pages.balance.subtitle")}
      />
      <ComingSoon />
    </>
  );
}
