# GroceryTrack - Professional Receipt Management System

## 📱 Project Overview

**GroceryTrack** is a modern, professional-grade grocery receipt management and price tracking application. It enables users to scan receipts using their phone camera, automatically extract item data using Google's Gemini 2.5 Flash AI, and provides comprehensive analytics for spending patterns, price history, and price comparison across Malaysian retailers.

### Perfect for:
- Personal grocery budget tracking
- Household expense management  
- Price comparison and savings optimization
- Portfolio demonstration of modern web technologies

---

## ✨ Core Features

### 1. **📸 Smart Receipt Scanning**
- **Phone Camera Integration**: Take photos directly from your device
- **AI-Powered Extraction**: Gemini 2.5 Flash automatically extracts:
  - Store name and date
  - All item names and quantities
  - Individual prices and totals
- **Auto Compression**: Client-side image compression for faster processing
- **Real-time Feedback**: Status updates during processing

### 2. **📊 Monthly Dashboard**
- **Monthly Breakdown**: View spending organized by month
- **Key Statistics**:
  - Total spent per month
  - Number of shopping trips
  - Average per trip
  - Daily spending average
- **Visual Charts**:
  - Pie chart showing store breakdown
  - Top 5 items by spending
  - Monthly trend comparison
- **Month Selection**: Easy switching between months

### 3. ** Malaysian Price Comparison**
- **Multi-Retailer Comparison**: Compare prices across 5+ major retailers:
  - Tesco Malaysia
  - Giant Hypermarket
  - Aeon Big
  - MyDin
  - Carrefour
  - Jusco
- **Smart Search**: Search for any product
- **Price Rankings**: Items sorted from cheapest to most expensive
- **Savings Calculation**: Show potential savings vs highest price
- **Discount Alerts**: Highlight items with current discounts
- **Shopping Tips**: AI-powered recommendations for best retailers

---

## 🏗️ Technical Stack & Architecture

### Frontend Technologies
```
- Next.js 16.1.6 (React Framework)
- React 19.2.3 (UI Library)
- TypeScript 5 (Type Safety)
- Tailwind CSS 4 (Styling)
- Recharts (Data Visualization)
- Lucide React (Icons)
```

### Backend Services
```
- Next.js Server Actions (Form Handling)
- Next.js API Routes (RESTful)
- Supabase (Database & Auth)
- Google Gemini 2.5 Flash (AI)
```

### Database (Supabase PostgreSQL)
```
Tables:
- receipts (receipt metadata)
- receipt_items (individual items)
- products (product catalog)
- users (user profiles - optional)
```

### Key Libraries
- **browser-image-compression**: Client-side image resize
- **@supabase/ssr**: Supabase client utilities
- **@google/generative-ai**: Gemini AI integration
- **recharts**: Professional charts
- **motion**: Smooth animations

---

## 🎯 User Interface Design

### Design Principles
- **Modern & Clean**: Contemporary design with gradients and smooth transitions
- **Professional Colors**: 
  - Blue: Primary actions (#3B82F6)
  - Purple: Secondary elements (#8B5CF6)
  - Slate/Gray: Backgrounds and text
  - Green: Positive indicators
- **Responsive**: Works seamlessly on mobile, tablet, and desktop
- **Accessible**: Proper contrast, keyboard navigation, semantic HTML

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│           Header (Logo, User Info, Settings)         │
├────────────┬──────────────────────────────────────────┤
│            │                                           │
│ Sidebar    │         Main Content Area                │
│ Navigation │    (Changes based on active tab)         │
│            │                                           │
│ - Dashboard│                                           │
│ - Receipts │                                           │
│ - Monthly  │                                           │
│ - Prices   │                                           │
│ - Scraper  │                                           │
│            │                                           │
└────────────┴──────────────────────────────────────────┘
```

---

## 📝 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Google Gemini API key
- Git

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd grocery-tracker
npm install
```

### Step 2: Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Step 3: Database Setup
Run these SQL queries in Supabase SQL editor - Please see `supabase/snippets/` for complete schema.

### Step 4: Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Environment Variables on Vercel
Set in Vercel Dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GEMINI_API_KEY

---

## 📊 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── Dashboard.tsx (Main nav hub)
│   │   ├── Navigation.tsx
│   │   └── modules/
│   │       ├── ReceiptScanner.tsx (Scan receipts)
│   │       ├── MonthlyDashboard.tsx (Monthly view + charts)
│   │       └── PriceScraper.tsx (Price comparison)
│   ├── actions/
│   │   └── upload-receipt.ts (Server action)
│   ├── api/
│   │   └── (API routes)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── lib/
│   ├── data.ts (Database queries)
│   └── ...
└── utils/
    ├── supabase/
    └── ...
```

---

## 🎓 Portfolio Highlights

### What Makes This Production-Ready:
✅ Complete feature set (5+ major modules)
✅ Professional UI/UX design (modern, responsive)
✅ Real AI integration (Gemini 2.5 Flash)
✅ Database design (Supabase PostgreSQL)
✅ Data visualization (Recharts charts)
✅ Type safety (TypeScript)
✅ Modern tech stack (Next.js 16, React 19)
✅ Server-side rendering (SSR)
✅ API routes & Server Actions
✅ Dark mode ready, Responsive design

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Receipt not processing | Check image quality, ensure clear photo |
| Prices not showing | Verify internet connection |
| Database errors | Check Supabase .env variables |
| Gemini API errors | Verify API key & quota |
| Styling issues | npm run dev + clear browser cache |

---

## 📄 License

MIT License - Free for personal and commercial use

---

**Last Updated**: February 2026
**Version**: 1.0.0 - Professional Edition

**Track smarter, spend less! 💡**