import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ActivityChip, CropChip } from "../../components/Chip";
import Chip from "../../components/Chip";
import { useFormat } from "../../lib/format";
import type { Activity, Parcel, Season } from "../../lib/types";

interface ParcelCardProps {
  parcel: Parcel;
  /** The parcel's newest season, if any. */
  season?: Season;
  /** Latest activity in that season, if any. */
  lastActivity?: Activity;
}

export default function ParcelCard({
  parcel,
  season,
  lastActivity,
}: ParcelCardProps) {
  const { t } = useTranslation();
  const f = useFormat();

  return (
    <Link
      to={`/parcele/${parcel.id}`}
      className="flex flex-col gap-4 rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px] text-soil-900 no-underline transition-shadow hover:text-soil-900 hover:shadow-[0_4px_16px_rgba(51,41,31,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-[21px] leading-tight font-semibold">
            {parcel.name}
          </span>
          <span className="text-sm text-soil-700">
            {t("parcels.numberShort", {
              number: parcel.number,
              municipality: parcel.municipality,
            })}
          </span>
        </div>
        <span className="font-display text-[21px] font-semibold whitespace-nowrap">
          {f.number(parcel.areaHa, 2, 2)}{" "}
          <span className="text-sm text-soil-700">ha</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {season ? (
          <CropChip>
            {t(`crop.${season.crop}`)} · {season.year}
          </CropChip>
        ) : (
          <Chip>{t("parcels.noSeason")}</Chip>
        )}
        {lastActivity && (
          <ActivityChip
            type={lastActivity.type}
            suffix={f.shortDate(lastActivity.date)}
          />
        )}
      </div>

      <p className="m-0 border-t border-sand-200 pt-3.5 text-sm text-soil-700">
        {parcel.note || t("parcels.noNote")}
      </p>
    </Link>
  );
}
