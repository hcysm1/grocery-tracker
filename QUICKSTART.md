# 🚀 GroceryTrack - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Prerequisites ✅
- Node.js 18+ installed
- Supabase account (free at supabase.com)
- Google Gemini API key (free at makersuite.google.com)

### 2. Get Environment Keys

**Google Gemini API:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

**Supabase:**
1. Create new project at supabase.com
2. Go to Settings → API → Copy URL & Anon Key

### 3. Setup .env.local

Create file: `d:\grocery-tracker\.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Visit: http://localhost:3000/dashboard

---

## 📋 Features Overview

| Feature | How to Use | Time |
|---------|-----------|------|
| **Scan Receipt** | Click "Scan Receipts" → Take/upload photo | 10 sec |
| **View Monthly** | Click "Monthly View" → Select month → View charts | 2 min |
| **Price History** | Click "Price History" → Select item → See trend | 2 min |
| **Price Compare** | Click "Price Compare" → Search product → Compare retailers | 2 min |

---

## 🎯 Sample Workflow

### First Time Users:
1. ✅ Go to `/dashboard`
2. 📸 Scan a receipt (or use sample data)
3. 📊 View Monthly Dashboard
4. 💰 Compare prices on items from receipt
---

## 🔧 Troubleshooting

**App won't start?**
```bash
npm install
npm run dev
```

**Gemini API Error?**
- Check API key in `.env.local`
- Verify key is active (makersuite.google.com)
- Check quota isn't exceeded

**Database Connection Error?**
- Verify Supabase URL & Key
- Check Supabase project is active
- Run database setup SQL (see README)

**Receipt Scanner Not Working?**
- Use clear, well-lit photo
- Try JPG or PNG format
- Keep file under 5MB

---

## 📁 Project Files

Key files for each feature:

```
Receipt Scanner    → src/app/components/modules/ReceiptScanner.tsx
Monthly Dashboard  → src/app/components/modules/MonthlyDashboard.tsx
Price History      → src/app/components/modules/PriceTracker.tsx
Price Compare      → src/app/components/modules/PriceScraper.tsx
Main Dashboard     → src/app/components/Dashboard.tsx
```

---

##💡 Quick Tips

- 📸 Take receipt photos in good lighting
- 💾 More receipts = better analytics
- 🏪 Compare prices for items you buy regularly
- 📱 Works great on mobile too!
- 🔄 Refresh page if data doesn't update

---

## 🚀 Next Steps

1. ✅ Run the app locally
2. ✅ Test each module
3. ✅ Customize colors/styling (src/app/globals.css)
4. ✅ Deploy to Vercel (free)
5. ✅ Share with recruiters as portfolio

---

## 📞 Support

**Problem?**
1. Check `.env.local` has all 3 keys
2. Check browser console (F12)
3. Try clearing cache & refreshing
4. Verify Supabase project is running

---

**Version**: 1.0.0
**Last Updated**: February 2026

**Happy tracking! 💡🛒**
