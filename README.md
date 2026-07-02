# Cashier

A mobile-first income & expense tracker: manual income/expense logging, category breakdowns, debts & loans with repayment tracking, recurring bills/instalments that stay pending until you confirm them, and multi-currency accounts rolled up into one primary currency.

No backend, no login. Everything is stored in the browser's `localStorage`. Use **Settings → Backup & data** to export/import a JSON snapshot.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS, hand-built UI primitives (no component library)
- Zustand (`persist` middleware → localStorage) as the only data store
- Recharts for analytics charts
- date-fns for recurring-schedule math

## Structure

- `lib/types.ts` — data model (Account, Category, Transaction, Debt, RecurringRule)
- `lib/store.ts` — Zustand store: all CRUD + the recurring-instance generator
- `lib/recurring.ts`, `lib/selectors.ts`, `lib/currency.ts` — scheduling, aggregation, currency conversion
- `app/*` — one route per screen (dashboard, transactions, analytics, debts, recurring, accounts, settings)
- `components/*` — screen-specific components plus `components/ui` primitives
