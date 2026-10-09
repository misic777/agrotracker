import { useTranslation } from "react-i18next";
import ComingSoon from "../../components/ComingSoon";
import PageHeader from "../../components/PageHeader";

export default function ParcelsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t("nav.parcels")}
        subtitle={t("pages.parcels.subtitle")}
      />
      <ComingSoon />
    </>
  );
}
