import type { Id, Parcel } from "./types";

/**
 * Normalizes text for comparisons: trims, collapses spaces, ignores case and
 * Serbian diacritics, so "Pačir", "pacir " and "PAČIR" are the same.
 */
export function normalizeKey(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function parcelKey(number: string, municipality: string): string {
  // Spaces inside a parcel number never matter: "1243 / 2" == "1243/2".
  return `${normalizeKey(number).replace(/\s/g, "")}|${normalizeKey(municipality)}`;
}

/**
 * A parcel number must be unique within a cadastral municipality.
 * Returns the existing parcel that clashes, or undefined.
 * `excludeId` is the parcel being edited, so it doesn't clash with itself.
 */
export function findDuplicateParcel(
  parcels: Parcel[],
  number: string,
  municipality: string,
  excludeId?: Id,
): Parcel | undefined {
  const key = parcelKey(number, municipality);
  return parcels.find(
    (p) => p.id !== excludeId && parcelKey(p.number, p.municipality) === key,
  );
}

/** Search by friendly name or parcel number. */
export function matchesParcelSearch(parcel: Parcel, query: string): boolean {
  const q = normalizeKey(query);
  if (q === "") return true;
  return (
    normalizeKey(parcel.name).includes(q) ||
    normalizeKey(parcel.number).includes(q)
  );
}

/**
 * Reuses the spelling of an already known municipality when the typed name
 * only differs in case, spaces or diacritics ("pacir" -> "Pačir"), so the
 * same municipality is never stored twice under different spellings.
 */
export function canonicalMunicipality(typed: string, known: string[]): string {
  const key = normalizeKey(typed);
  return known.find((m) => normalizeKey(m) === key) ?? typed.trim();
}
