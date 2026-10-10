import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { PlusIcon, SearchIcon } from "../../components/icons";
import PageHeader from "../../components/PageHeader";
import { useFormat } from "../../lib/format";
import { matchesParcelSearch } from "../../lib/parcels";
import {
  activitiesOfSeason,
  latestActivity,
  seasonsOfParcel,
} from "../../lib/seasons";
import { useData } from "../../storage/DataContext";
import ParcelCard from "./ParcelCard";
import ParcelFormDialog from "./ParcelFormDialog";

export default function ParcelsPage() {
  const { t } = useTranslation();
  const f = useFormat();
  const navigate = useNavigate();
  const { data } = useData();
  const searchId = useId();

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  // Each parcel with its newest season and that season's latest activity.
  const rows = useMemo(
    () =>
      [...data.parcels]
        .sort((a, b) => a.name.localeCompare(b.name, "sr"))
        .map((parcel) => {
          const season = seasonsOfParcel(data.seasons, parcel.id)[0];
          const lastActivity = season
            ? latestActivity(activitiesOfSeason(data.activities, season.id))
            : undefined;
          return { parcel, season, lastActivity };
        }),
    [data.parcels, data.seasons, data.activities],
  );

  const visible = rows.filter((r) => matchesParcelSearch(r.parcel, query));
  const totalArea = data.parcels.reduce((sum, p) => sum + p.areaHa, 0);

  const addButton = (
    <Button variant="primary" onClick={() => setAdding(true)}>
      <PlusIcon size={18} />
      {t("parcels.add")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={t("nav.parcels")}
        subtitle={
          rows.length > 0
            ? t("parcels.summary", {
                parcels: t("parcels.count", { count: rows.length }),
                area: f.area(totalArea),
              })
            : t("pages.parcels.subtitle")
        }
        actions={rows.length > 0 && addButton}
      />

      {rows.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 py-8">
          <h2 className="m-0 font-display text-[22px] font-semibold">
            {t("parcels.emptyTitle")}
          </h2>
          <p className="m-0 max-w-[60ch] text-soil-700">
            {t("parcels.emptyText")}
          </p>
          {addButton}
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={searchId} className="sr-only">
              {t("parcels.searchLabel")}
            </label>
            <div className="flex min-h-12 max-w-[520px] flex-[1_1_360px] items-center gap-2.5 rounded-xl border border-sand-300 bg-sand-50 px-3.5 text-soil-700 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-leaf-600">
              <SearchIcon />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("parcels.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-soil-900 outline-none placeholder:text-soil-700/70"
              />
            </div>
            <span className="text-sm text-soil-700" aria-live="polite">
              {t("parcels.shown", {
                shown: visible.length,
                total: rows.length,
              })}
            </span>
          </div>

          {visible.length === 0 ? (
            <Card>
              <p className="m-0 text-soil-700">
                {t("parcels.noMatch", { query })}
              </p>
            </Card>
          ) : (
            <section
              aria-label={t("parcels.listLabel")}
              className="grid grid-cols-[repeat(auto-fill,minmax(min(330px,100%),1fr))] gap-5"
            >
              {visible.map((row) => (
                <ParcelCard key={row.parcel.id} {...row} />
              ))}
            </section>
          )}
        </>
      )}

      {adding && (
        <ParcelFormDialog
          onClose={() => setAdding(false)}
          onSaved={(parcel) => navigate(`/parcele/${parcel.id}`)}
        />
      )}
    </>
  );
}
