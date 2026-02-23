# 🎯 GroceryTrack - Complete Features Documentation

## 📸 Module 1: Receipt Scanner

### Location
`src/app/components/modules/ReceiptScanner.tsx`

### Features
#### Upload Methods
- 📷 **Camera Capture**: Take photos directly from phone camera
- 📁 **File Upload**: Upload images from device storage
- 🖼️ **Preview**: See image before processing

#### Image Processing
- 🔄 **Auto Compression**: Reduces to 0.8MB max
- 🖥️ **Client-Side**: Fast processing on device
- 📊 **Progress Tracking**: Real-time status updates

#### AI Extraction (Gemini 2.5 Flash)
Automatically extracts:
- Store name (e.g., "Tesco Malaysia")
- Receipt date
- All items with:
  - Item name (standardized)
  - Quantity per item
  - Price per unit
  - Total price
- Receipt total amount

#### User Feedback
- ✅ Success notifications
- ❌ Error messages with solutions
- ⏳ Real-time processing status
- 🎯 Clear instructions

#### Error Handling
- Invalid file types → User guidance
- No file selected → Disabled button
- API failures → Retry option
- Poor image quality → Suggestions

---

## 📊 Module 2: Monthly Dashboard

### Location
`src/app/components/modules/MonthlyDashboard.tsx`

### Key Metrics (4 Cards)
```
┌─────────────────────┬──────────────────┐
│ Total Spent         │ Receipts Count   │
│ (This Month)        │ (Shopping Trips) │
├─────────────────────┼──────────────────┤
│ Avg Per Trip        │ Daily Average    │
│ (Total ÷ Receipts)  │ (Total ÷ 30 days)│
└─────────────────────┴──────────────────┘
```

### Visual Analytics

#### 1. Pie Chart - Store Breakdown
Shows percentage of spending by store:
- Each store as a slice
- Different colors
- Hover for exact amounts
- Legend showing all stores

#### 2. Top Items List
Top 5 items by total spending:
- Item name
- Quantity purchased
- Total amount spent
- Ranked from highest to lowest

#### 3. Monthly Trend Chart
(When multiple months available)
- Bar chart showing total per month
- Compare spending across months
- Identify high-spending periods

### Monthly Selection
- Easy button selector
- All available months listed
- Current month highlighted
- Quick navigation

### Data Aggregation
- Sums all receipt amounts for period
- Counts number of receipts
- Calculates averages
- Groups items by name
- Tracks store totals

---

## � Module 3: Price Comparison (Malaysian Retailers)

### Location
`src/app/components/modules/PriceScraper.tsx`

## � Module 4: Price Comparison (Malaysian Retailers)

### Location
`src/app/components/modules/PriceScraper.tsx`

### Retailers Available (6+)
1. **Tesco Malaysia** 🏬
   - Large hypermarket
   - Wide variety
   - Loyalty program

2. **Giant Hypermarket** 🏪
   - High-street supermarket
   - Popular chain
   - Good pricing

3. **Aeon Big** 🏢
   - Premium retailer
   - Department store
   - Full range

4. **MyDin** 🟢
   - Budget-friendly
   - Best for staples
   - Great prices

5. **Carrefour** 🟠
   - International chain
   - Full selection
   - Competitive pricing

6. **Jusco** 🏬
   - Department store
   - Wide range
   - Premium options

### Product Search
- Text input for product name
- Suggestions for popular products
- Real-time search
- Works with partial names
- Smart matching

### Search Results Display
#### Summary Cards (3)
- Lowest Price (green highlight)
- Potential Savings (vs highest)
- Retailers Compared (count)

#### Price Rankings
For each retailer:
- Store name + emoji
- Current price
- Discount badge (if applicable)
- Savings vs lowest
- Green highlight for best price

### Shopping Recommendations
Tips for each search:
- Which retailer has best prices
- Discount availability
- Bulk buying advantages
- Timing suggestions

### Featured Products
- Pre-populated suggestions
- Click to search instantly
- Includes typical groceries:
  - Chicken Breast
  - Rice
  - Cooking Oil
  - Milk
  - Eggs

### Savings Calculation
- Shows RM difference from cheapest
- Percentage savings shown
- Helps identify best buys
- Encourages smart shopping

---

## 🎯 Dashboard Hub

### Location
`src/app/components/Dashboard.tsx`

### Header
- **Logo + Brand**: "GroceryTrack"
- **Settings Icon**: User preferences
- **User Info**: Name and email
- **Sticky**: Always visible while scrolling

### Navigation

#### Desktop (Sidebar)
- Fixed left sidebar
- 4 module tabs
- Active tab highlighted
- Quick stats panel:
  - Total Spent
  - Receipts Count

#### Mobile (Bottom Navigation)
- Bottom fixed bar
- Icon + label for each module
- Swipeable/scrollable
- Shows current selection

#### Module Tabs
1. 📊 Dashboard (main)
2. 📸 Scan Receipts
3. 📈 Monthly View
4.  Price Compare

### Content Area
- Main content changes with selected tab
- Full width on desktop
- Mobile optimized
- Padding and spacing
- Loading indicators

### Quick Stats (Sidebar)
- Total spent to date (all receipts)
- Number of receipts uploaded
- Eye-catching displays

---

## 🎨 Design System

### Color Palette
```
Primary:     #3B82F6 (Blue)
Secondary:   #8B5CF6 (Purple)
Success:     #10B981 (Green)
Warning:     #F59E0B (Amber)
Error:       #EF4444 (Red)
Background:  #F8FAFC (Slate-50)
Surface:     #FFFFFF (White)
Text Dark:   #1E293B (Slate-900)
Text Light:  #64748B (Slate-500)
```

### Components

#### Cards
```css
Background: white
Border: 1px slate-200
Border-radius: 8px
Padding: 6px
Shadow: light
Hover: subtle
```

#### Buttons
```css
Primary: blue-600
Hover: blue-700
Disabled: gray-400
Padding: 8px 16px
Border-radius: 8px
Font-weight: 600
Transition: smooth
```

#### Charts
- Recharts library
- Responsive sizing
- Color-coded by metric
- Interactive tooltips
- Legend support

#### Tables
```css
Header background: slate-50
Row hover: light gray
Borders: subtle
Padding: comfortable
Text-align: mixed (right for numbers)
```

### Typography
- **Headings**: Bold, large spacing
- **Body**: Regular, clean
- **Labels**: Small, semibold
- **Monospace**: For data/prices

### Spacing
- 4px grid system
- 8px padding standard
- 16px margins standard
- 8px gaps between items

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Bottom navigation only
- Full-width cards
- Stacked forms
- Touch-friendly sizes

### Tablet (768px - 1024px)
- Two-column layout
- Sidebar navigation
- Side-by-side cards
- Horizontal scrolling tables

### Desktop (> 1024px)
- Three-column potential
- Full sidebar
- Multi-column grids
- All features visible

---

## 🔄 Data Flow Summary

### Receipt Upload Flow
```
User Photo → Compress → Gemini API → Extract Data 
    → Database → Update Charts → Display Results
```

### Analytics Flow
```
Fetch Receipts → Group by Month → Calculate Totals 
    → Generate Chart Data → Display Dashboard
```

### Price Comparison Flow
```
Search Query → Match Products → Get Prices 
    → Sort by Cost → Display Rankings → Show Savings
```

### Inventory Flow
```
Add Item → Check History → Suggest Quantity → Store 
    → Update Total Value → Display List
```

---

## ✨ User Experience

### Workflow for New User
1. 📸 Upload first receipt
2. 👀 See data extracted
3. 📊 View on monthly dashboard
4. 💰 Compare prices
5. 📦 Add to inventory
6. 📈 Monitor spending trends

### Best Practices Embedded
- 💡 Smart recommendations
- 🏷️ Discount alerts
- 🎯 Savings opportunities
- 📊 Visual insights
- 🔔 Status feedback

---

## 🎓 Learning Outcomes

Using this app demonstrates:
- ✅ Modern React patterns
- ✅ Data visualization
- ✅ Responsive design
- ✅ Database integration
- ✅ AI API usage
- ✅ Server-side processing
- ✅ User experience design
- ✅ TypeScript mastery

---

**Document Version**: 1.0
**Last Updated**: February 2026

---
