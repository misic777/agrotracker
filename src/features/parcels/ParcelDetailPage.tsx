import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import ComingSoon from "../../components/ComingSoon";
import NotFoundPage from "../../components/NotFoundPage";
import PageHeader from "../../components/PageHeader";
import { useData } from "../../storage/DataContext";

export default function ParcelDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data } = useData();
  const parcel = data.parcels.find((p) => p.id === id);

  if (!parcel) return <NotFoundPage />;

  return (
    <>
      <Link to="/parcele" className="text-sm font-bold">
        ← {t("pages.parcel.back")}
      </Link>
      <PageHeader title={parcel.name} />
      <ComingSoon />
    </>
  );
}
