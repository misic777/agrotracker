import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ConfirmDialog from "../../components/ConfirmDialog";
import { PencilIcon, PlusIcon, TrashIcon } from "../../components/icons";
import NotFoundPage from "../../components/NotFoundPage";
import { useFormat } from "../../lib/format";
import {
  activitiesOfSeason,
  latestActivity,
  seasonsOfParcel,
} from "../../lib/seasons";
import type { Id } from "../../lib/types";
import { useData } from "../../storage/DataContext";
import ActivityLog from "./ActivityLog";
import ParcelFormDialog from "./ParcelFormDialog";
import SeasonFormDialog from "./SeasonFormDialog";
import SeasonSummary from "./SeasonSummary";
import { YieldCard, YieldHistory } from "./YieldCards";
import YieldDialog from "./YieldDialog";

type OpenDialog =
  "editParcel" | "deleteParcel" | "newSeason" | "editSeason" | "yield" | null;

export default function ParcelDetailPage() {
  const { t } = useTranslation();
  const f = useFormat();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, parcels } = useData();

  const [selectedSeasonId, setSelectedSeasonId] = useState<Id | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const parcel = data.parcels.find((p) => p.id === id);
  if (!parcel) return <NotFoundPage />;

  const seasons = seasonsOfParcel(data.seasons, parcel.id);
  // Newest season by default, or when the selected one was deleted.
  const season = seasons.find((s) => s.id === selectedSeasonId) ?? seasons[0];
  const activities = season
    ? activitiesOfSeason(data.activities, season.id)
    : [];

  const close = () => setDialog(null);

  return (
    <>
      <nav
        aria-label={t("parcel.breadcrumb")}
        className="flex items-center gap-2 text-sm"
      >
        <Link to="/parcele" className="font-semibold">
          {t("nav.parcels")}
        </Link>
        <span aria-hidden="true" className="text-soil-400">
          /
        </span>
        <span className="text-soil-700">{parcel.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="m-0 font-display text-[34px] leading-tight font-semibold">
          {parcel.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog("editParcel")}>
            <PencilIcon size={18} />
            {t("parcel.edit")}
          </Button>
          <Button variant="danger" onClick={() => setDialog("deleteParcel")}>
            <TrashIcon size={18} />
            {t("parcel.delete")}
          </Button>
        </div>
      </header>

      <section
        aria-label={t("parcel.infoLabel")}
        className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-px overflow-hidden rounded-card border border-sand-300 bg-sand-300"
      >
        <InfoCell label={t("parcel.number")} value={parcel.number} strong />
        <InfoCell
          label={t("parcel.municipality")}
          value={parcel.municipality}
          strong
        />
        <InfoCell
          label={t("parcel.area")}
          value={f.area(parcel.areaHa)}
          strong
        />
        <InfoCell
          label={t("parcel.note")}
          value={parcel.note ?? t("common.none")}
        />
      </section>

      {seasons.length === 0 || !season ? (
        <Card className="flex flex-col items-start gap-3 py-8">
          <h2 className="m-0 font-display text-[22px] font-semibold">
            {t("parcel.noSeasonsTitle")}
          </h2>
          <p className="m-0 max-w-[60ch] text-soil-700">
            {t("parcel.noSeasonsText")}
          </p>
          <Button variant="primary" onClick={() => setDialog("newSeason")}>
            <PlusIcon size={18} />
            {t("parcel.newSeason")}
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-300">
            <div
              role="tablist"
              aria-label={t("parcel.seasonsLabel")}
              className="-mb-px flex gap-1 overflow-x-auto"
            >
              {seasons.map((s) => {
                const selected = s.id === season.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSelectedSeasonId(s.id)}
                    className={`flex min-h-14 cursor-pointer flex-col items-start border-0 border-b-[3px] bg-transparent px-[18px] py-2 ${selected ? "border-leaf-600 text-leaf-800" : "border-transparent text-soil-700 hover:text-soil-900"}`}
                  >
                    <span
                      className={`text-base ${selected ? "font-extrabold" : "font-bold"}`}
                    >
                      {s.year}
                    </span>
                    <span
                      className={`text-[13px] ${selected ? "font-semibold" : ""}`}
                    >
                      {t(`crop.${s.crop}`)}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => setDialog("newSeason")}>
              <PlusIcon size={18} />
              {t("parcel.newSeason")}
            </Button>
          </div>

          <div role="tabpanel" className="flex flex-wrap items-start gap-6">
            <ActivityLog
              key={season.id}
              season={season}
              activities={activities}
            />
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
              <SeasonSummary
                season={season}
                lastActivity={latestActivity(activities)}
                onEdit={() => setDialog("editSeason")}
              />
              <YieldCard
                parcel={parcel}
                season={season}
                onEdit={() => setDialog("yield")}
              />
              <YieldHistory parcel={parcel} seasons={seasons} />
            </div>
          </div>
        </>
      )}

      {dialog === "editParcel" && (
        <ParcelFormDialog parcel={parcel} onClose={close} />
      )}
      {dialog === "deleteParcel" && (
        <ConfirmDialog
          title={t("parcel.deleteTitle")}
          message={t("parcel.deleteMessage", { name: parcel.name })}
          confirmLabel={t("parcel.delete")}
          onClose={close}
          onConfirm={() => {
            navigate("/parcele");
            parcels.remove(parcel.id);
          }}
        />
      )}
      {dialog === "newSeason" && (
        <SeasonFormDialog
          parcelId={parcel.id}
          onClose={close}
          onSaved={(s) => setSelectedSeasonId(s.id)}
        />
      )}
      {dialog === "editSeason" && season && (
        <SeasonFormDialog
          parcelId={parcel.id}
          season={season}
          onClose={close}
          onDeleted={() => setSelectedSeasonId(null)}
        />
      )}
      {dialog === "yield" && season && (
        <YieldDialog parcel={parcel} season={season} onClose={close} />
      )}
    </>
  );
}

function InfoCell({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-sand-50 px-[22px] py-[18px]">
      <span className="text-[13px] font-semibold text-soil-700">{label}</span>
      <span className={strong ? "text-lg font-bold" : ""}>{value}</span>
    </div>
  );
}
