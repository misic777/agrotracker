import type { Activity, Id, Parcel, Season } from "./types";

/** Seasons of one parcel, newest year first. */
export function seasonsOfParcel(seasons: Season[], parcelId: Id): Season[] {
  return seasons
    .filter((s) => s.parcelId === parcelId)
    .sort((a, b) => b.year - a.year);
}

/** Activities of one season, newest date first. */
export function activitiesOfSeason(
  activities: Activity[],
  seasonId: Id,
): Activity[] {
  return activities
    .filter((a) => a.seasonId === seasonId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * The field's phase is not stored: it is the type of the latest activity,
 * so it can never get out of sync with the log.
 */
export function latestActivity(activities: Activity[]): Activity | undefined {
  let latest: Activity | undefined;
  for (const a of activities) {
    if (!latest || a.date > latest.date) latest = a;
  }
  return latest;
}

/** Yield per hectare, or undefined when there is no yield or no area. */
export function yieldPerHa(season: Season, areaHa: number): number | undefined {
  if (season.yieldKg === undefined || areaHa <= 0) return undefined;
  return season.yieldKg / areaHa;
}

/** An activity together with the season and parcel it belongs to. */
export interface ActivityWithContext {
  activity: Activity;
  season: Season;
  parcel: Parcel;
}

/** The latest activities across all parcels, newest first. */
export function recentActivities(
  data: { activities: Activity[]; seasons: Season[]; parcels: Parcel[] },
  limit: number,
): ActivityWithContext[] {
  const seasons = new Map(data.seasons.map((s) => [s.id, s]));
  const parcels = new Map(data.parcels.map((p) => [p.id, p]));
  const rows: ActivityWithContext[] = [];
  for (const activity of data.activities) {
    const season = seasons.get(activity.seasonId);
    const parcel = season && parcels.get(season.parcelId);
    if (season && parcel) rows.push({ activity, season, parcel });
  }
  return rows
    .sort((a, b) => b.activity.date.localeCompare(a.activity.date))
    .slice(0, limit);
}
