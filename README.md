# AgroTracker

A web app for managing a family farm: parcels and seasons, an activity log,
yields, costs, income and a yearly balance. The interface is in Serbian and
English.

**Live demo:** https://misic777.github.io/agrotracker/

## Features

- **Parcels**: name, cadastral number, municipality and area, with search and
  edit. The number plus municipality must be unique.
- **Seasons**: one crop per parcel per year, with an activity log (tillage,
  sowing, fertilizing, spraying, harvest...) that records product and rate
  per hectare.
- **Yield**: total and per hectare, with a yield history for each parcel.
- **Costs**: in RSD or EUR (each EUR cost stores its exchange rate). Fill in
  any two of quantity, unit price and total, and the third is calculated.
- **Income**: crop sales and other income such as subsidies.
- **Balance**: yearly totals by category, per hectare figures, and a
  comparison across years.
- **Home page**: overview of the current season and the latest activities.
- **Backup**: export all data to JSON, and import it again.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 (custom theme tokens)
- React Router (HashRouter, so it works on GitHub Pages)
- react-i18next (sr / en, including Serbian plural forms)
- Vitest + Testing Library for unit tests
- ESLint + Prettier
- Deployed to GitHub Pages with GitHub Actions (lint and tests must pass first)

## Architecture notes

- All data access goes through `src/storage/`. For now
  `localStore.ts` keeps everything in the browser's localStorage; it is the
  only file that knows about it, so it can be swapped for a real backend
  later without touching the pages.
- Money is stored as whole numbers in minor units (para / cents) to avoid
  floating point errors. Each cost and income also stores its value in RSD
  at the moment it was saved.
- The code stores fixed codes (`corn`, `spraying`...) and the UI translates
  them, so data does not depend on the language.
- The database schema lives in `supabase/migrations/`. Every table has a
  `household_id`, and Row Level Security lets a signed-in user reach only the
  rows of their own household. `supabase/tests/rls.test.ts` checks these
  rules against a real Postgres engine (PGlite), so they are tested on every
  push without Docker or a live project.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # type check + production build
npm run lint
npm test         # run the unit tests once
npm run test:watch  # re-run tests on every save
```

Backend (Supabase): copy `.env.example` to `.env.local` and fill in the
project URL and publishable key, then:

```bash
npm run check:supabase  # is the project reachable, is Google sign-in on?
npm run db:push         # apply new migrations to the linked project
npm run db:types        # regenerate TypeScript types from the schema
```

## Roadmap

- [x] Project setup and deploy
- [x] Parcels, seasons and activity log
- [x] Yield per season
- [x] Costs (RSD / EUR)
- [x] Income
- [x] Yearly balance and year comparison
- [x] Home page
- [x] Unit tests (Vitest) and CI checks
- [ ] Supabase backend, Google sign-in and shared household
- [ ] Installable app (PWA) and offline use
