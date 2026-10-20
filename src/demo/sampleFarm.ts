/**
 * The demo's sample farm: made-up but realistic data for a small farm in
 * Vojvodina, so every page has something to show.
 *
 * - Three seasons: two years ago, last year and this year, so the balance
 *   page can compare years. Dates are relative to today, so the demo never
 *   looks out of date.
 * - Nothing lies in the future: this year's activities, harvests, sales and
 *   costs only appear once their date has passed.
 * - Codes (crops, cost types...) are translated by the UI anyway; only the
 *   free text (parcel names, descriptions, notes) comes in two languages.
 * - Amounts are derived from areas, rates and prices, so they add up the
 *   way real ones would.
 */
import type { Language } from "../i18n";
import { toIsoDate } from "../lib/format";
import { toMinor, toRsd } from "../lib/money";
import type {
  Activity,
  AppData,
  Cost,
  Crop,
  Income,
  IsoDate,
  Parcel,
  Season,
} from "../lib/types";

type Texts = Record<Language, string>;
const tx = (sr: string, en: string): Texts => ({ sr, en });

interface ParcelPlan {
  name: Texts;
  number: string;
  municipality: string;
  areaHa: number;
  /** Crops two years ago, last year, this year. */
  rotation: [Crop, Crop, Crop];
  leased?: boolean;
}

const PARCELS: ParcelPlan[] = [
  {
    name: tx("Kod bunara", "By the well"),
    number: "1243/2",
    municipality: "Čantavir",
    areaHa: 4.2,
    rotation: ["wheat", "corn", "soybean"],
  },
  {
    name: tx("Velika njiva", "Big field"),
    number: "2871",
    municipality: "Čantavir",
    areaHa: 7.85,
    rotation: ["sunflower", "wheat", "corn"],
    leased: true,
  },
  {
    name: tx("Pored puta", "Roadside"),
    number: "655/1",
    municipality: "Bačka Topola",
    areaHa: 2.1,
    rotation: ["soybean", "corn", "wheat"],
  },
  {
    name: tx("Salaš", "Homestead field"),
    number: "3104/3",
    municipality: "Bačka Topola",
    areaHa: 5.6,
    rotation: ["corn", "soybean", "sunflower"],
  },
];

interface CropPlan {
  hybrid: string;
  /** Yield in kg/ha in an average year. */
  yieldPerHa: number;
  /** Sale price in RSD per kg. */
  price: number;
  /** Month and day of the harvest. */
  harvest: string;
  activities: {
    type: Activity["type"];
    /** "MM-DD"; "prev:MM-DD" is in the previous year (autumn sowing). */
    date: string;
    note?: Texts;
    product?: string;
    rate?: number;
    unit?: Activity["rateUnit"];
  }[];
}

const CROPS: Partial<Record<Crop, CropPlan>> = {
  wheat: {
    hybrid: "NS Obala",
    yieldPerHa: 6500,
    price: 23,
    harvest: "07-06",
    activities: [
      {
        type: "tillage",
        date: "prev:10-02",
        note: tx("Oranje i tanjiranje", "Ploughing and disking"),
      },
      {
        type: "sowing",
        date: "prev:10-18",
        note: tx("250 kg semena po hektaru", "250 kg of seed per hectare"),
      },
      {
        type: "fertilizing",
        date: "03-08",
        product: "KAN",
        rate: 200,
        unit: "kgPerHa",
      },
      {
        type: "spraying",
        date: "04-18",
        product: "Tribenuron-metil",
        rate: 0.03,
        unit: "kgPerHa",
      },
    ],
  },
  corn: {
    hybrid: "NS 6030",
    yieldPerHa: 9500,
    price: 21,
    harvest: "10-04",
    activities: [
      {
        type: "tillage",
        date: "03-24",
        note: tx("Setvospremanje", "Seedbed preparation"),
      },
      {
        type: "fertilizing",
        date: "04-04",
        product: "Urea",
        rate: 150,
        unit: "kgPerHa",
      },
      {
        type: "sowing",
        date: "04-19",
        note: tx("70.000 biljaka po hektaru", "70,000 plants per hectare"),
      },
      {
        type: "spraying",
        date: "05-16",
        product: "Nikosulfuron",
        rate: 1.25,
        unit: "lPerHa",
      },
    ],
  },
  soybean: {
    hybrid: "Galina",
    yieldPerHa: 3300,
    price: 52,
    harvest: "09-24",
    activities: [
      {
        type: "tillage",
        date: "03-30",
        note: tx("Setvospremanje", "Seedbed preparation"),
      },
      {
        type: "sowing",
        date: "04-24",
        note: tx("Seme inokulisano pre setve", "Seed inoculated before sowing"),
      },
      {
        type: "spraying",
        date: "05-22",
        product: "Imazamoks",
        rate: 1,
        unit: "lPerHa",
      },
    ],
  },
  sunflower: {
    hybrid: "NS Sumo Sol",
    yieldPerHa: 3100,
    price: 48,
    harvest: "09-03",
    activities: [
      {
        type: "tillage",
        date: "03-18",
        note: tx("Setvospremanje", "Seedbed preparation"),
      },
      {
        type: "fertilizing",
        date: "03-27",
        product: "NPK 15:15:15",
        rate: 250,
        unit: "kgPerHa",
      },
      { type: "sowing", date: "04-08" },
      {
        type: "spraying",
        date: "04-10",
        product: "S-metolahlor",
        rate: 1.4,
        unit: "lPerHa",
      },
    ],
  },
};

/** What each product is and what it costs per kg or l, in RSD. */
const PRODUCTS: Record<
  string,
  { type: "fertilizer" | "pesticide"; price: number }
> = {
  KAN: { type: "fertilizer", price: 52 },
  Urea: { type: "fertilizer", price: 78 },
  "NPK 15:15:15": { type: "fertilizer", price: 86 },
  "Tribenuron-metil": { type: "pesticide", price: 21000 },
  Nikosulfuron: { type: "pesticide", price: 2600 },
  Imazamoks: { type: "pesticide", price: 3900 },
  "S-metolahlor": { type: "pesticide", price: 2300 },
};

/** Two years ago was a drought year; this year is good so far. */
const YIELD_FACTOR = [0.82, 1, 1.07];
/** Small yearly price changes, so years differ. */
const PRICE_FACTOR = [1.08, 0.96, 1];
const EUR_RATE = [117.3, 117.1, 117.2];
const DIESEL_PRICE = [196, 203, 199];

const T = {
  dieselSpring: tx("Nafta za prolećne radove", "Diesel for spring work"),
  dieselWheat: tx("Nafta za žetvu pšenice", "Diesel for the wheat harvest"),
  dieselAutumn: tx("Nafta za jesenju berbu", "Diesel for the autumn harvest"),
  seed: tx("Seme", "Seed"),
  fertilizer: tx("Đubrivo", "Fertilizer"),
  pesticide: tx("Zaštita", "Crop protection"),
  rent: tx("Zakup – Velika njiva", "Lease – Big field"),
  combineService: tx(
    "Servis kombajna pred žetvu",
    "Combine service before harvest",
  ),
  tyres: tx("Nove gume za traktor", "New tractor tyres"),
  drying: tx("Sušenje kukuruza", "Corn drying"),
  insurance: tx("Osiguranje useva", "Crop insurance"),
  subsidy: tx("Podsticaj po hektaru", "Per-hectare subsidy"),
  harvestNote: tx("Vlažnost zrna {{m}}%", "Grain moisture {{m}}%"),
};

const BUYERS: Partial<Record<Crop, string>> = {
  wheat: "Mlin Topola",
  corn: "Silos Čantavir",
  soybean: "Sojaprotein",
  sunflower: "Uljara Bačka",
};

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Adds days to an ISO date. */
function addDays(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

export function createSampleFarm(
  language: Language,
  today: Date = new Date(),
): AppData {
  const L = (t: Texts) => t[language];
  const todayIso = toIsoDate(today);
  const thisYear = today.getFullYear();
  const years = [thisYear - 2, thisYear - 1, thisYear];
  const past = (date: IsoDate) => date <= todayIso;
  // Money only from the first year on: the autumn sowing for the first
  // harvest would otherwise create a year with nothing but one cost.
  const firstDay = `${years[0]}-01-01`;

  const parcels: Parcel[] = [];
  const seasons: Season[] = [];
  const activities: Activity[] = [];
  const costs: Cost[] = [];
  const incomes: Income[] = [];

  let n = 0;
  const id = (prefix: string) => `demo-${prefix}-${++n}`;

  const addCost = (
    cost: Omit<Cost, "id" | "totalRsd"> & { totalRsd?: number },
  ) => {
    if (!past(cost.date) || cost.date < firstDay) return;
    costs.push({
      ...cost,
      id: id("cost"),
      totalRsd:
        cost.totalRsd ?? toRsd(cost.total, cost.currency, cost.exchangeRate),
    });
  };
  /** A cost entered as quantity × unit price, in RSD. */
  const addRsdCost = (
    date: IsoDate,
    type: Cost["type"],
    description: string,
    quantity: number,
    unit: Cost["unit"],
    unitPrice: number,
  ) => {
    const unitMinor = toMinor(unitPrice);
    addCost({
      date,
      type,
      description,
      quantity,
      unit,
      unitPrice: unitMinor,
      currency: "RSD",
      total: Math.round(quantity * unitMinor),
    });
  };

  for (const plan of PARCELS) {
    parcels.push({
      id: id("parcel"),
      name: L(plan.name),
      number: plan.number,
      municipality: plan.municipality,
      areaHa: plan.areaHa,
    });
  }

  years.forEach((year, y) => {
    const date = (mmdd: string): IsoDate =>
      mmdd.startsWith("prev:")
        ? `${year - 1}-${mmdd.slice(5)}`
        : `${year}-${mmdd}`;
    const harvestedKg: Partial<Record<Crop, number>> = {};

    PARCELS.forEach((plan, p) => {
      const crop = plan.rotation[y];
      const cropPlan = CROPS[crop]!;
      const harvestDate = date(cropPlan.harvest);
      const harvested = past(harvestDate);
      const yieldKg = round10(
        cropPlan.yieldPerHa * plan.areaHa * YIELD_FACTOR[y],
      );

      const season: Season = {
        id: id("season"),
        parcelId: parcels[p].id,
        year,
        crop,
        hybrid: cropPlan.hybrid,
        yieldKg: harvested ? yieldKg : undefined,
      };
      seasons.push(season);

      for (const a of cropPlan.activities) {
        const when = date(a.date);
        if (!past(when)) continue;
        activities.push({
          id: id("activity"),
          seasonId: season.id,
          type: a.type,
          date: when,
          product: a.product,
          ratePerHa: a.rate,
          rateUnit: a.unit,
          note: a.note ? L(a.note) : undefined,
        });
        // Every product used on the field was also bought.
        if (a.product && a.rate) {
          const product = PRODUCTS[a.product];
          const label =
            product.type === "fertilizer" ? T.fertilizer : T.pesticide;
          addRsdCost(
            addDays(when, -5),
            product.type,
            `${L(label)}: ${a.product} – ${L(plan.name)}`,
            Math.round(a.rate * plan.areaHa * 100) / 100,
            a.unit === "lPerHa" ? "l" : "kg",
            Math.round(product.price * PRICE_FACTOR[y]),
          );
        }
      }

      if (harvested) {
        const moisture = crop === "corn" ? 21 : crop === "soybean" ? 13 : 12;
        activities.push({
          id: id("activity"),
          seasonId: season.id,
          type: "harvest",
          date: harvestDate,
          note: L(T.harvestNote).replace("{{m}}", String(moisture)),
        });
        harvestedKg[crop] = (harvestedKg[crop] ?? 0) + yieldKg;
      }

      // Seed: corn and sunflower bought in EUR from a distributor.
      const sowing = cropPlan.activities.find((a) => a.type === "sowing")!;
      const seedDate = addDays(date(sowing.date), -10);
      if (crop === "corn" || crop === "sunflower") {
        const units = Math.ceil(plan.areaHa * (crop === "corn" ? 1.4 : 1.2));
        const price = toMinor(crop === "corn" ? 98 : 135);
        addCost({
          date: seedDate,
          type: "seed",
          description: `${L(T.seed)}: ${cropPlan.hybrid} – ${L(plan.name)}`,
          quantity: units,
          unit: "pcs",
          unitPrice: price,
          currency: "EUR",
          total: units * price,
          exchangeRate: EUR_RATE[y],
        });
      } else {
        const kgPerHa = crop === "wheat" ? 250 : 120;
        addRsdCost(
          seedDate,
          "seed",
          `${L(T.seed)}: ${cropPlan.hybrid} – ${L(plan.name)}`,
          Math.round(kgPerHa * plan.areaHa),
          "kg",
          crop === "wheat" ? 62 : 110,
        );
      }
    });

    // Sales: each crop's harvest, sold about three weeks later.
    for (const [crop, kg] of Object.entries(harvestedKg) as [Crop, number][]) {
      const cropPlan = CROPS[crop]!;
      const saleDate = addDays(date(cropPlan.harvest), 21);
      if (!past(saleDate)) continue;
      const price = toMinor(
        Math.round(cropPlan.price * PRICE_FACTOR[y] * 100) / 100,
      );
      const total = Math.round(kg * price);
      incomes.push({
        id: id("income"),
        date: saleDate,
        kind: "sale",
        crop,
        quantityKg: kg,
        pricePerKg: price,
        buyer: BUYERS[crop],
        currency: "RSD",
        total,
        totalRsd: total,
      });
    }

    const totalArea = PARCELS.reduce((sum, p) => sum + p.areaHa, 0);
    const subsidyDate = date("06-20");
    if (past(subsidyDate)) {
      const total = toMinor(Math.round(totalArea * 18000));
      incomes.push({
        id: id("income"),
        date: subsidyDate,
        kind: "subsidy",
        description: L(T.subsidy),
        currency: "RSD",
        total,
        totalRsd: total,
      });
    }

    // Running costs of the year.
    addRsdCost(
      date("03-12"),
      "fuel",
      L(T.dieselSpring),
      620,
      "l",
      DIESEL_PRICE[y],
    );
    addRsdCost(
      date("07-02"),
      "fuel",
      L(T.dieselWheat),
      240,
      "l",
      DIESEL_PRICE[y],
    );
    addRsdCost(
      date("09-28"),
      "fuel",
      L(T.dieselAutumn),
      460,
      "l",
      DIESEL_PRICE[y],
    );

    // Lease: 300 EUR per hectare per year, paid in January.
    const leased = PARCELS.find((p) => p.leased)!;
    addCost({
      date: date("01-20"),
      type: "rent",
      description: L(T.rent),
      currency: "EUR",
      total: toMinor(leased.areaHa * 300),
      exchangeRate: EUR_RATE[y],
    });

    addCost({
      date: date("06-24"),
      type: "machineMaintenance",
      description: L(T.combineService),
      currency: "RSD",
      total: toMinor(85000 + y * 6000),
    });
    if (y === 1) {
      addRsdCost(
        date("02-15"),
        "machineMaintenance",
        L(T.tyres),
        2,
        "pcs",
        68000,
      );
    }

    addCost({
      date: date("05-05"),
      type: "other",
      description: L(T.insurance),
      currency: "RSD",
      total: toMinor(Math.round(totalArea * 1800)),
    });

    const cornKg = harvestedKg.corn ?? 0;
    if (cornKg > 0) {
      addRsdCost(date("10-12"), "services", L(T.drying), cornKg, "kg", 2.4);
    }
  });

  return { version: 1, parcels, seasons, activities, costs, incomes };
}
