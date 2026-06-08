# GroceryTrack

A grocery receipt scanner and spending tracker built for Malaysian households.

---

## What it does

- **Scan receipts** — take a photo or upload an image; Gemini AI extracts the store, items, quantities, and prices automatically
- **Monthly Dashboard** — KPI cards (total spent, trips, avg per trip, daily avg), store breakdown donut chart, and top items by spend
- **Spending Analysis** — full history with monthly trend chart, category breakdown, top stores, and shopping behaviour heatmap
- **Inventory** — track stock levels at home, get low-stock alerts, and add items directly from your receipt history

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 2.5 Flash |
| Charts | ECharts (echarts-for-react) |

---

## Setup

**1. Install dependencies**
```bash
git clone <your-repo-url>
cd grocery-tracker
npm install
```

**2. Create `.env.local`**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

**3. Run database schema**

See `supabase/snippets/` for the full SQL schema (includes `receipts`, `receipt_items`, `products`, `inventory` tables).

**4. Start dev server**
```bash
npm run dev
# http://localhost:3000/dashboard
```

---

## Deployment

```bash
npm run build
vercel deploy
```

Add the three env vars above in your Vercel project settings.

---

## Project structure

```
src/app/
├── components/modules/
│   ├── Dashboard.tsx          # Nav shell (bottom tab bar on mobile, sidebar on desktop)
│   ├── ReceiptScanner.tsx     # Upload + AI extraction
│   ├── MonthlyDashboard.tsx   # Monthly charts and stats
│   ├── SpendingAnalysis.tsx   # Full spending history and analytics
│   └── Inventory.tsx          # Stock tracking
└── actions/
    ├── upload-receipt.ts      # Gemini AI + DB insert
    ├── get-receipts.ts        # Fetch receipts
    └── inventory.ts           # Inventory CRUD
```

---

**Version 1.1.0 · June 2026**