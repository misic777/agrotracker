/**
 * Domain model for AgroTracker.
 *
 * - A parcel holds data that never changes between years.
 * - A season is one parcel in one year (crop, hybrid, yield).
 * - Activities belong to a season (tillage, sowing, spraying...).
 * - Costs and income belong to the household, not to parcels.
 *
 * Stored values are internal codes ("fuel", "corn"); the UI translates them.
 * Money is stored as integers in minor units (para / euro cents) to avoid
 * floating point rounding errors.
 */

export type Id = string;

/** Calendar date as "YYYY-MM-DD". */
export type IsoDate = string;

/** Integer amount in minor units: 1 RSD = 100 para, 1 EUR = 100 cents. */
export type Money = number;

export const CURRENCIES = ["RSD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CROPS = [
  "wheat",
  "corn",
  "sunflower",
  "soybean",
  "rapeseed",
  "barley",
  "clover",
  "other",
] as const;
export type Crop = (typeof CROPS)[number];

export const ACTIVITY_TYPES = [
  "tillage",
  "sowing",
  "fertilizing",
  "spraying",
  "harvest",
  "other",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Activity types that record a product and an amount per hectare. */
export const ACTIVITY_TYPES_WITH_PRODUCT: readonly ActivityType[] = [
  "fertilizing",
  "spraying",
];

export const RATE_UNITS = ["kgPerHa", "lPerHa"] as const;
export type RateUnit = (typeof RATE_UNITS)[number];

export const COST_TYPES = [
  "fuel",
  "seed",
  "fertilizer",
  "pesticide",
  "machineMaintenance",
  "services",
  "rent",
  "other",
] as const;
export type CostType = (typeof COST_TYPES)[number];

export const QUANTITY_UNITS = ["kg", "l", "pcs"] as const;
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];

export const INCOME_KINDS = ["sale", "subsidy", "other"] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];

export interface Parcel {
  id: Id;
  /** Friendly name used inside the family, e.g. "Kod bunara". */
  name: string;
  /** Cadastral parcel number, e.g. "1243/2". */
  number: string;
  /** Cadastral municipality (katastarska opština). */
  municipality: string;
  areaHa: number;
  note?: string;
}

export interface Season {
  id: Id;
  parcelId: Id;
  year: number;
  crop: Crop;
  /** Free-text hybrid / variety description. */
  hybrid?: string;
  /** Total harvested amount for the whole parcel. */
  yieldKg?: number;
  note?: string;
}

export interface Activity {
  id: Id;
  seasonId: Id;
  type: ActivityType;
  date: IsoDate;
  /** Fertilizer or crop protection product (fertilizing / spraying only). */
  product?: string;
  ratePerHa?: number;
  rateUnit?: RateUnit;
  note?: string;
}

/** Fields shared by costs and income: an amount in RSD or EUR. */
interface Amount {
  currency: Currency;
  /** Total in the payment currency. */
  total: Money;
  /** RSD for 1 EUR on the payment date; only for EUR amounts. */
  exchangeRate?: number;
  /** Total converted to RSD, fixed when the entry is saved. */
  totalRsd: Money;
}

export interface Cost extends Amount {
  id: Id;
  date: IsoDate;
  type: CostType;
  description: string;
  quantity?: number;
  unit?: QuantityUnit;
  /** Price per unit in the payment currency. */
  unitPrice?: Money;
}

export interface Income extends Amount {
  id: Id;
  date: IsoDate;
  kind: IncomeKind;
  description?: string;
  /** Sale only. */
  crop?: Crop;
  quantityKg?: number;
  pricePerKg?: Money;
  buyer?: string;
}

/** Everything the app stores, as one versioned document. */
export interface AppData {
  version: 1;
  parcels: Parcel[];
  seasons: Season[];
  activities: Activity[];
  costs: Cost[];
  incomes: Income[];
}

/** Input for creating or editing an entity: everything except its id. */
export type Draft<T extends { id: Id }> = Omit<T, "id">;
