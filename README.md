# ShopManager Pro

A multi-tenant retail management app built for small shops (kirana stores, pharmacies, general stores) that sell both packaged items and loose/weighed goods. Each shop signs up, gets its own isolated data (products, customers, sales), and runs day-to-day operations from a single dashboard.

Built end-to-end as a full-stack TypeScript project: Hono API on Postgres, React frontend, real server-side data tables, and a credit/partial-payment ledger — the kind of workflow a real shop actually needs, not just CRUD.

## Why this exists

Most "todo app" portfolio projects don't have to deal with real-world messiness. This one does:

- **Mixed pricing units** — some products are sold per piece (a soap bar), others by weight (rice, dal, spices) in arbitrary amounts (50g, 750g, 2.3kg) rather than fixed increments.
- **Credit sales (udhaar)** — a common pattern in small Indian retail: customers buy now, pay later, often in partial installments. The app tracks paid vs. pending per sale, not just a binary paid/unpaid flag.
- **Multi-tenant from day one** — every table is scoped by tenant, enforced at the query level, not bolted on after.

## Features

- **Auth** — JWT-based signup/login, editable profile (name, email, shop name).
- **Products** — catalog with category, price, stock; sold "each" or "per kg"; restock action that adds to existing stock instead of overwriting it; low-stock highlighting.
- **Customers** — contact list with running total-purchases.
- **Sales** — multi-item cart per sale, walk-in or linked customer, stock auto-decrements on sale; payment recorded as Paid (Cash/UPI) or Credit; partial payments against a credit sale with a running paid/pending balance.
- **Dashboard** — today's sales/revenue, low-stock alerts, top customers.
- **Data tables** — server-side search, sort, and pagination (not client-side filtering of an unbounded list) across Products, Customers, and Sales.
- **Theming** — light/dark mode, persisted per browser.

## Tech stack

| Layer | Choice |
|---|---|
| API | [Hono](https://hono.dev) on Node, [Drizzle ORM](https://orm.drizzle.team) |
| Database | Postgres ([Neon](https://neon.tech), serverless) |
| Auth | JWT (access + refresh), bcrypt |
| Web | React + Vite, [TanStack Table](https://tanstack.com/table) + Query |
| State | Zustand (auth, theme) |
| Styling | Hand-rolled CSS with theme tokens (no component library) |
| Validation | Zod, shared between client and server via `packages/shared` |

## Project structure

```
apps/api        Hono backend — routes, services, Drizzle schema/migrations
apps/web        React frontend
packages/shared Zod validators shared by both
```

## Running it locally

```bash
npm install
```

Each app needs its own `.env` (see `apps/api/.env.example` and `apps/web/.env.example`) — you'll need a Postgres connection string (Neon's free tier works) and a couple of JWT secrets.

```bash
cd apps/api
npm run db:generate   # generate migrations from the schema
npm run db:migrate    # apply them
cd ../..
npm run dev            # runs api (:4200) and web (:5173) together
```

### Demo login

The app ships with no seed script yet, but a quick way to see it populated: register a shop, then add a few products and customers through the UI. For a fully-seeded example (10 dummy customers + a realistic kirana product catalog), see the seeding commands in [`docs/seed-data.md`](docs/seed-data.md).

## Status / roadmap

This is an active portfolio project — see the [Issues](../../issues) tab for what's currently in progress vs. planned. Recently shipped: weight-based pricing, credit/partial-payment tracking, server-side table pagination. Open items are tracked as GitHub issues rather than a static TODO list.
