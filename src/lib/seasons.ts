import type { Activity, Id, Season } from "./types";

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
