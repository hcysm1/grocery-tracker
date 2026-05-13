"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  TrendingUp,
  Wallet,
  ShoppingCart,
  Store,
  Layers,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceiptItem {
  products?: {
    name?: string;
    emoji?: string;
    category?: string;
  };
  quantity?: number | string;
  unit_price?: number | string;
  unit?: string;
}

interface Receipt {
  id?: string | number;
  store_name?: string;
  total_amount?: number;
  scanned_at?: string;
  receipt_items?: ReceiptItem[];
}

interface SpendingAnalysisProps {
  receipts: Receipt[];
  userCurrency: string;
}

// ─── Palette & ECharts base styles ───────────────────────────────────────────

const PALETTE = ["#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899"];

const axisBase = {
  axisLine:  { lineStyle: { color: "#E2E8F0" } },
  axisTick:  { show: false },
  axisLabel: { color: "#94A3B8", fontSize: 11, fontFamily: "ui-monospace, monospace" },
  splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } },
};

const tooltipBase = {
  backgroundColor: "#0F172A",
  borderColor: "#1E293B",
  textStyle: { color: "#F8FAFC", fontFamily: "sans-serif", fontSize: 13 },
  extraCssText: "border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.25);",
};

const gridBase = { left: 16, right: 16, top: 12, bottom: 8, containLabel: true };

// ─── Helper: moving average ───────────────────────────────────────────────────

function movingAvg(arr: number[], w: number): number[] {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - w + 1), i + 1);
    return +( slice.reduce((s, x) => s + x, 0) / slice.length ).toFixed(2);
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, accent,
}: { label: string; value: string | number; sub: string; icon: React.ReactNode; accent: string; }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-2 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function ChartCard({
  title, subtitle, tag, children,
}: { title: string; subtitle?: string; tag?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {tag && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-500 border border-blue-100 whitespace-nowrap">
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SpendingAnalysis({ receipts, userCurrency }: SpendingAnalysisProps) {

  // ── 1. Core data processing ────────────────────────────────────────────────

  const {
    months,
    categoryMap,
    storeMap,
    itemMap,
    priceHistory,
    weekdayCounts,
    weekdaySpend,
    basketBuckets,
  } = useMemo(() => {
    const monthMap  = new Map<string, { key: string; label: string; total: number; count: number }>();
    const catMap    = new Map<string, number>();
    const storeMap  = new Map<string, number>();
    const itemMap   = new Map<string, { name: string; count: number; total: number; emoji: string; category: string }>();
    const priceHist = new Map<string, { month: string; price: number }[]>();
    const wdCounts  = [0, 0, 0, 0, 0, 0, 0];
    const wdSpend   = [0, 0, 0, 0, 0, 0, 0];
    const baskets   = [0, 0, 0, 0, 0]; // <50 / 50–100 / 100–150 / 150–200 / 200+

    receipts.forEach((r) => {
      const d     = new Date(r.scanned_at ?? "");
      const mKey  = d.toISOString().slice(0, 7);
      const mLabel= d.toLocaleDateString("en-MY", { month: "short", year: "numeric" });
      const total = r.total_amount ?? 0;
      const wd    = d.getDay();

      // monthly
      if (!monthMap.has(mKey)) monthMap.set(mKey, { key: mKey, label: mLabel, total: 0, count: 0 });
      const m = monthMap.get(mKey)!;
      m.total += total;
      m.count += 1;

      // store
      storeMap.set(r.store_name ?? "Unknown", (storeMap.get(r.store_name ?? "Unknown") ?? 0) + total);

      // weekday
      wdCounts[wd]++;
      wdSpend[wd] += total;

      // basket buckets
      if      (total < 50)  baskets[0]++;
      else if (total < 100) baskets[1]++;
      else if (total < 150) baskets[2]++;
      else if (total < 200) baskets[3]++;
      else                  baskets[4]++;

      // items
      (r.receipt_items ?? []).forEach((it) => {
        const p     = it.products;
        const name  = p?.name ?? "Unknown";
        const cat   = p?.category ?? "Other";
        const qty   = Number(it.quantity) || 1;
        const price = Number(it.unit_price) || 0;

        catMap.set(cat, (catMap.get(cat) ?? 0) + price * qty);

        const cur = itemMap.get(name) ?? { name, count: 0, total: 0, emoji: p?.emoji ?? "📦", category: cat };
        cur.count += qty;
        cur.total += price * qty;
        itemMap.set(name, cur);

        if (!priceHist.has(name)) priceHist.set(name, []);
        priceHist.get(name)!.push({ month: mKey, price });
      });
    });

    return {
      months:       [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key)),
      categoryMap:  catMap,
      storeMap,
      itemMap,
      priceHistory: priceHist,
      weekdayCounts: wdCounts,
      weekdaySpend:  wdSpend,
      basketBuckets: baskets,
    };
  }, [receipts]);

  // ── 2. Derived data ────────────────────────────────────────────────────────

  const totalSpent    = receipts.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalReceipts = receipts.length;
  const avgTrip       = totalReceipts ? totalSpent / totalReceipts : 0;

  const allItems   = [...itemMap.values()].sort((a, b) => b.total - a.total);
  const topBySpend = allItems.slice(0, 5);
  const topByFreq  = [...itemMap.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  const monthTotals = months.map((m) => +m.total.toFixed(2));
  const movAvg3     = movingAvg(monthTotals, 3);
  const monthKeys   = months.map((m) => m.key);

  // Top 3 items to track price over time
  const priceTracked = topByFreq.slice(0, 3).map((item) => item.name);

  // Price delta for summary table
  const priceDelta = [...priceHistory.entries()]
    .filter(([n]) => topByFreq.slice(0, 6).some((i) => i.name === n))
    .map(([name, hist]) => {
      const sorted = [...hist].sort((a, b) => a.month.localeCompare(b.month));
      const first  = sorted[0].price;
      const latest = sorted[sorted.length - 1].price;
      const pct    = ((latest - first) / first) * 100;
      return { name, first, latest, pct };
    })
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 7);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ── 3. Chart options ───────────────────────────────────────────────────────

  // 3a. Spending Trend
  const spendTrendOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "axis",
      formatter: (params: any[]) => {
        let s = `<div style="font-weight:700;margin-bottom:6px">${params[0].axisValue}</div>`;
        params.forEach((p) => {
          s += `<div style="display:flex;justify-content:space-between;gap:16px">
            <span>${p.marker} ${p.seriesName}</span>
            <b>${userCurrency} ${Number(p.value).toFixed(2)}</b>
          </div>`;
        });
        return s;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#94A3B8", fontSize: 12 },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { ...gridBase, bottom: 40 },
    xAxis: { ...axisBase, type: "category" as const, data: months.map((m) => m.label), boundaryGap: true },
    yAxis: {
      ...axisBase,
      type: "value" as const,
      axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => `${userCurrency} ${v}` },
    },
    series: [
      {
        name: "Monthly Total",
        type: "bar",
        data: monthTotals,
        barMaxWidth: 48,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#2563EB" },
              { offset: 1, color: "#93C5FD" },
            ],
          },
        },
      },
      {
        name: "3-mo Avg",
        type: "line",
        data: movAvg3,
        smooth: true,
        lineStyle: { color: "#F59E0B", width: 2.5 },
        itemStyle: { color: "#F59E0B" },
        symbol: "circle",
        symbolSize: 6,
      },
    ],
  };

  // 3b. Category Donut
  const catData = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value: +value.toFixed(2),
      itemStyle: { color: PALETTE[i % PALETTE.length] },
    }));

  const categoryOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "item",
      formatter: (p: any) =>
        `<b>${p.name}</b><br/>${userCurrency} ${p.value} &nbsp;<span style="opacity:.6">(${p.percent}%)</span>`,
    },
    legend: {
      orient: "vertical" as const,
      right: 4,
      top: "middle",
      textStyle: { color: "#64748B", fontSize: 12 },
      formatter: (name: string) => (name.length > 14 ? name.slice(0, 14) + "…" : name),
    },
    series: [
      {
        name: "Category",
        type: "pie",
        radius: ["44%", "70%"],
        center: ["36%", "50%"],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold", color: "#1E293B" },
          scaleSize: 4,
        },
        data: catData,
      },
    ],
  };

  // 3c. Store Horizontal Bar
  const stores = [...storeMap.entries()].sort((a, b) => a[1] - b[1]);
  const storeOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "axis",
      axisPointer: { type: "none" },
      formatter: (p: any[]) =>
        `<b>${p[0].axisValue}</b>: <b>${userCurrency} ${Number(p[0].value).toFixed(2)}</b>`,
    },
    grid: { left: 12, right: 48, top: 8, bottom: 8, containLabel: true },
    xAxis: { ...axisBase, type: "value" as const, axisLabel: { ...axisBase.axisLabel } },
    yAxis: {
      ...axisBase,
      type: "category" as const,
      data: stores.map((s) => s[0]),
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: stores.map((s) => +s[1].toFixed(2)),
        barMaxWidth: 22,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: (params: any) => PALETTE[params.dataIndex % PALETTE.length],
        },
        label: {
          show: true,
          position: "right" as const,
          color: "#94A3B8",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          formatter: (p: any) => `${userCurrency} ${Number(p.value).toFixed(0)}`,
        },
      },
    ],
  };

  // 3d. Frequency Bar (horizontal)
  const freqOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "axis",
      axisPointer: { type: "none" },
      formatter: (p: any[]) =>
        `<b>${p[0].axisValue}</b>: <b>${Number(p[0].value).toFixed(1)} units</b>`,
    },
    grid: { left: 12, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: { ...axisBase, type: "value" as const },
    yAxis: {
      ...axisBase,
      type: "category" as const,
      data: topByFreq.map((i) => i.name).reverse(),
      axisLine: { show: false },
      axisLabel: { ...axisBase.axisLabel, fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: topByFreq.map((i) => +i.count.toFixed(1)).reverse(),
        barMaxWidth: 18,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: {
            type: "linear", x: 1, y: 0, x2: 0, y2: 0,
            colorStops: [
              { offset: 0, color: "#10B981" },
              { offset: 1, color: "#D1FAE5" },
            ],
          },
        },
        label: {
          show: true,
          position: "right" as const,
          color: "#10B981",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
        },
      },
    ],
  };

  // 3e. Price Line Chart
  const priceLineOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "axis",
      formatter: (params: any[]) => {
        let s = `<div style="font-weight:700;margin-bottom:6px">${params[0].axisValue}</div>`;
        params.forEach((p) => {
          if (p.value != null)
            s += `<div style="display:flex;justify-content:space-between;gap:16px">
              <span>${p.marker} ${p.seriesName}</span>
              <b>${userCurrency} ${Number(p.value).toFixed(2)}</b>
            </div>`;
        });
        return s;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#94A3B8", fontSize: 12 },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { ...gridBase, bottom: 40 },
    xAxis: { ...axisBase, type: "category" as const, data: months.map((m) => m.label), boundaryGap: false },
    yAxis: {
      ...axisBase,
      type: "value" as const,
      axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => `${userCurrency}${v}` },
    },
    series: priceTracked.map((name, i) => {
      const hist     = priceHistory.get(name) ?? [];
      const byMonth  = new Map(hist.map((h) => [h.month, h.price]));
      return {
        name,
        type: "line",
        smooth: true,
        connectNulls: false,
        lineStyle: { color: PALETTE[i], width: 2.5 },
        itemStyle: { color: PALETTE[i] },
        symbol: "circle",
        symbolSize: 7,
        data: monthKeys.map((k) => byMonth.has(k) ? byMonth.get(k) : null),
      };
    }),
  };

  // 3f. Weekday chart
  const weekdayOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "axis",
      formatter: (p: any[]) =>
        `<b>${p[0].axisValue}</b><br/>
         ${p[0].marker} Trips: <b>${p[0].value}</b><br/>
         ${p[1]?.marker} Spend: <b>${userCurrency} ${Number(p[1]?.value ?? 0).toFixed(0)}</b>`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#94A3B8", fontSize: 12 },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { ...gridBase, bottom: 40 },
    xAxis: { ...axisBase, type: "category" as const, data: dayNames },
    yAxis: [
      { ...axisBase, type: "value" as const, name: "Trips", nameTextStyle: { color: "#94A3B8", fontSize: 10 } },
      {
        ...axisBase,
        type: "value" as const,
        name: "Spend",
        nameTextStyle: { color: "#94A3B8", fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => `${v}` },
      },
    ],
    series: [
      {
        name: "Trips",
        type: "bar",
        yAxisIndex: 0,
        data: weekdayCounts,
        barMaxWidth: 32,
        itemStyle: { color: "#2563EB", borderRadius: [6, 6, 0, 0] },
      },
      {
        name: "Total Spend",
        type: "line",
        yAxisIndex: 1,
        data: weekdaySpend.map((v) => +v.toFixed(2)),
        smooth: true,
        lineStyle: { color: "#F59E0B", width: 2.5 },
        itemStyle: { color: "#F59E0B" },
        symbol: "circle",
        symbolSize: 6,
      },
    ],
  };

  // 3g. Basket histogram
  const basketOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...tooltipBase,
      trigger: "axis",
      formatter: (p: any[]) => `<b>${p[0].axisValue}</b>: <b>${p[0].value} receipt(s)</b>`,
    },
    grid: { ...gridBase, bottom: 8 },
    xAxis: {
      ...axisBase,
      type: "category" as const,
      data: [`< ${userCurrency}50`, `50–100`, `100–150`, `150–200`, `200+`],
    },
    yAxis: { ...axisBase, type: "value" as const, minInterval: 1 },
    series: [
      {
        type: "bar",
        data: basketBuckets,
        barMaxWidth: 56,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (p: any) => ({
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: PALETTE[p.dataIndex % PALETTE.length] },
              { offset: 1, color: "rgba(255,255,255,0)" },
            ],
          }),
        },
        label: {
          show: true,
          position: "top" as const,
          color: "#94A3B8",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          formatter: (p: any) => (p.value > 0 ? String(p.value) : ""),
        },
      },
    ],
  };

  // ── 4. Render ──────────────────────────────────────────────────────────────

  const noData = receipts.length === 0;

  return (
    <div className="space-y-2 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spending Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {noData
              ? "Scan your first receipt to see insights"
              : `Insights across ${totalReceipts} receipt${totalReceipts !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!noData && (
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-0.5">
              Total Spend
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {userCurrency} {totalSpent.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
          <div className="text-5xl mb-4">🧾</div>
          <h3 className="text-lg font-semibold text-slate-700">No receipts yet</h3>
          <p className="text-sm text-slate-400 mt-1">Scan a receipt to unlock your spending insights.</p>
        </div>
      ) : (
        <>
          {/* ── KPI row ─────────────────────────────────────────────────────── */}
          <SectionLabel>Key Metrics</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
            <KpiCard label="Total Spent"  value={`${userCurrency} ${totalSpent.toFixed(2)}`} sub="All time" icon={<Wallet size={16} />}     accent="#2563EB" />
            <KpiCard label="Receipts"     value={totalReceipts}                               sub="Scanned"  icon={<ShoppingCart size={16}/>}  accent="#F59E0B" />
            <KpiCard label="Avg. Trip"    value={`${userCurrency} ${avgTrip.toFixed(2)}`}    sub="Per visit" icon={<TrendingUp size={16}/>}   accent="#10B981" />
            <KpiCard label="Stores"       value={storeMap.size}                               sub="Unique"   icon={<Store size={16}/>}         accent="#8B5CF6" />
            <KpiCard label="Categories"   value={categoryMap.size}                            sub="Product types" icon={<Layers size={16}/>}  accent="#EF4444" />
            <KpiCard label="Items"        value={itemMap.size}                                sub="Unique products" icon={<Package size={16}/>} accent="#06B6D4" />
          </div>

          {/* ── Monthly trend ────────────────────────────────────────────────── */}
          <SectionLabel>Spending Over Time</SectionLabel>
          <ChartCard
            title="Monthly Spending Trend"
            subtitle="Total expenditure per month with 3-month moving average"
            tag={`${months.length} months`}
          >
            <ReactECharts option={spendTrendOption} style={{ height: 280 }} notMerge />
          </ChartCard>

          {/* ── Category + Store ─────────────────────────────────────────────── */}
          <SectionLabel>Breakdown</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <ChartCard title="Spend by Category" subtitle="Where your money goes, grouped by product type" tag="Donut">
                <ReactECharts option={categoryOption} style={{ height: 280 }} notMerge />
              </ChartCard>
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="Top Stores" subtitle="Retailers ranked by total spend" tag="Bar">
                <ReactECharts option={storeOption} style={{ height: 280 }} notMerge />
              </ChartCard>
            </div>
          </div>

          {/* ── Product intelligence ─────────────────────────────────────────── */}
          <SectionLabel>Product Intelligence</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Frequency bar */}
            <ChartCard title="Most Frequently Bought" subtitle="Items ranked by total units purchased" tag="Occurrence">
              <ReactECharts option={freqOption} style={{ height: 300 }} notMerge />
            </ChartCard>

            {/* Top spend items */}
            <ChartCard title="Top Spend Items" subtitle="Highest total expenditure by item">
              <div className="space-y-0 divide-y divide-slate-50">
                {topBySpend.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-5 text-center">#{i + 1}</span>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border border-slate-100 bg-slate-50"
                      >
                        {item.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700 capitalize">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {+item.count.toFixed(1)} units
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">
                        {userCurrency} {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* ── Price Tracker ────────────────────────────────────────────────── */}
          <SectionLabel>Price Movement Tracker</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <ChartCard title="Price Trends" subtitle="Unit price over time for top purchased items" tag="Line">
                <ReactECharts option={priceLineOption} style={{ height: 300 }} notMerge />
              </ChartCard>
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="Price Change Summary" subtitle="First vs. latest recorded unit price">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["Item", "First", "Latest", "Δ"].map((h) => (
                          <th
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left pb-3 pr-3"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {priceDelta.map((row) => {
                        const isUp   = row.pct > 0.5;
                        const isDown = row.pct < -0.5;
                        return (
                          <tr key={row.name}>
                            <td className="py-2.5 pr-3 font-medium text-slate-700 text-xs max-w-[100px] truncate">
                              {row.name}
                            </td>
                            <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">
                              {row.first.toFixed(2)}
                            </td>
                            <td className="py-2.5 pr-3 font-mono text-xs text-slate-700 font-semibold">
                              {row.latest.toFixed(2)}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isUp
                                    ? "bg-red-50 text-red-500"
                                    : isDown
                                    ? "bg-green-50 text-green-600"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {isUp ? (
                                  <ArrowUpRight size={11} />
                                ) : isDown ? (
                                  <ArrowDownRight size={11} />
                                ) : (
                                  <Minus size={11} />
                                )}
                                {Math.abs(row.pct).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* ── Shopping behaviour ───────────────────────────────────────────── */}
          <SectionLabel>Shopping Behaviour</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Shopping by Day of Week" subtitle="When do you shop most — trips & spend overlay">
              <ReactECharts option={weekdayOption} style={{ height: 260 }} notMerge />
            </ChartCard>
            <ChartCard title="Basket Size Distribution" subtitle="How much do you typically spend per trip?">
              <ReactECharts option={basketOption} style={{ height: 260 }} notMerge />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
