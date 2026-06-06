"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  TrendingUp,
  ShoppingCart,
  Store,
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

// ─── Palette ─────────────────────────────────────────────────────────────────

const GREEN      = "#059669";
const GREEN_SOFT = "#D1FAE5";
const AMBER      = "#D97706";

// Category donut: slate steps + one green for variety without rainbow chaos
const CAT_PALETTE = ["#059669", "#64748B", "#94A3B8", "#CBD5E1", "#334155", "#475569", "#0F172A", "#0EA5E9"];

// ─── ECharts shared styles ────────────────────────────────────────────────────

const axisBase = {
  axisLine:  { lineStyle: { color: "#E2E8F0" } },
  axisTick:  { show: false },
  axisLabel: { color: "#94A3B8", fontSize: 11 },
  splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } },
};

const tooltipBase = {
  backgroundColor: "#0F172A",
  borderColor:     "#1E293B",
  textStyle: { color: "#F8FAFC", fontFamily: "sans-serif", fontSize: 13 },
  extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);",
};

const gridBase = { left: 16, right: 16, top: 12, bottom: 8, containLabel: true };

// ─── Helper ───────────────────────────────────────────────────────────────────

function movingAvg(arr: number[], w: number): number[] {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - w + 1), i + 1);
    return +( slice.reduce((s, x) => s + x, 0) / slice.length ).toFixed(2);
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, accent,
}: { label: string; value: string | number; sub: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
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
    <div className="flex items-center gap-3 mt-4 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function ChartCard({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SpendingAnalysis({ receipts, userCurrency }: SpendingAnalysisProps) {

  // ── 1. Core data processing ───────────────────────────────────────────────

  const { months, categoryMap, storeMap, itemMap, weekdayCounts, weekdaySpend } = useMemo(() => {
    const monthMap = new Map<string, { key: string; label: string; total: number; count: number }>();
    const catMap   = new Map<string, number>();
    const sMap     = new Map<string, number>();
    const iMap     = new Map<string, { name: string; count: number; total: number; emoji: string; category: string }>();
    const wdCounts = [0, 0, 0, 0, 0, 0, 0];
    const wdSpend  = [0, 0, 0, 0, 0, 0, 0];

    receipts.forEach((r) => {
      const d      = new Date(r.scanned_at ?? "");
      const mKey   = d.toISOString().slice(0, 7);
      const mLabel = d.toLocaleDateString("en-MY", { month: "short", year: "numeric" });
      const total  = r.total_amount ?? 0;
      const wd     = d.getDay();

      if (!monthMap.has(mKey)) monthMap.set(mKey, { key: mKey, label: mLabel, total: 0, count: 0 });
      const m = monthMap.get(mKey)!;
      m.total += total;
      m.count += 1;

      sMap.set(r.store_name ?? "Unknown", (sMap.get(r.store_name ?? "Unknown") ?? 0) + total);
      wdCounts[wd]++;
      wdSpend[wd] += total;

      (r.receipt_items ?? []).forEach((it) => {
        const p     = it.products;
        const name  = p?.name ?? "Unknown";
        const cat   = p?.category ?? "Other";
        const qty   = Number(it.quantity) || 1;
        const price = Number(it.unit_price) || 0;

        catMap.set(cat, (catMap.get(cat) ?? 0) + price * qty);

        const cur = iMap.get(name) ?? { name, count: 0, total: 0, emoji: p?.emoji ?? "📦", category: cat };
        cur.count += qty;
        cur.total += price * qty;
        iMap.set(name, cur);
      });
    });

    return {
      months:        [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key)),
      categoryMap:   catMap,
      storeMap:      sMap,
      itemMap:       iMap,
      weekdayCounts: wdCounts,
      weekdaySpend:  wdSpend,
    };
  }, [receipts]);

  // ── 2. Derived data ───────────────────────────────────────────────────────

  const totalSpent    = receipts.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalReceipts = receipts.length;
  const avgTrip       = totalReceipts ? totalSpent / totalReceipts : 0;

  const topBySpend  = [...itemMap.values()].sort((a, b) => b.total - a.total).slice(0, 6);
  const monthTotals = months.map((m) => +m.total.toFixed(2));
  const movAvg3     = movingAvg(monthTotals, 3);
  const dayNames    = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ── 3. Chart options ──────────────────────────────────────────────────────

  // 3a. Monthly Spending Trend
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
      axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => `${userCurrency}${v}` },
    },
    series: [
      {
        name: "Monthly Total",
        type: "bar",
        data: monthTotals,
        barMaxWidth: 44,
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: GREEN },
              { offset: 1, color: GREEN_SOFT },
            ],
          },
        },
      },
      {
        name: "3-mo Avg",
        type: "line",
        data: movAvg3,
        smooth: true,
        lineStyle: { color: AMBER, width: 2 },
        itemStyle: { color: AMBER },
        symbol: "circle",
        symbolSize: 5,
      },
    ],
  };

  // 3b. Category Donut
  const catData = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value: +value.toFixed(2),
      itemStyle: { color: CAT_PALETTE[i % CAT_PALETTE.length] },
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
        radius: ["44%", "68%"],
        center: ["36%", "50%"],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: "bold", color: "#1E293B" },
          scaleSize: 3,
        },
        data: catData,
      },
    ],
  };

  // 3c. Top Stores horizontal bar
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
    grid: { left: 12, right: 52, top: 8, bottom: 8, containLabel: true },
    xAxis: { ...axisBase, type: "value" as const },
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
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
          color: GREEN,
        },
        label: {
          show: true,
          position: "right" as const,
          color: "#94A3B8",
          fontSize: 11,
          formatter: (p: any) => `${userCurrency}${Number(p.value).toFixed(0)}`,
        },
      },
    ],
  };

  // 3d. Day of week
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
      },
    ],
    series: [
      {
        name: "Trips",
        type: "bar",
        yAxisIndex: 0,
        data: weekdayCounts,
        barMaxWidth: 32,
        itemStyle: { color: GREEN, borderRadius: [5, 5, 0, 0] },
      },
      {
        name: "Total Spend",
        type: "line",
        yAxisIndex: 1,
        data: weekdaySpend.map((v) => +v.toFixed(2)),
        smooth: true,
        lineStyle: { color: AMBER, width: 2 },
        itemStyle: { color: AMBER },
        symbol: "circle",
        symbolSize: 5,
      },
    ],
  };

  // ── 4. Render ─────────────────────────────────────────────────────────────

  const noData = receipts.length === 0;

  return (
    <div className="space-y-2 pb-12">

      {/* Page header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spending Analysis</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {noData
              ? "Scan your first receipt to see insights"
              : `Insights across ${totalReceipts} receipt${totalReceipts !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!noData && (
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">
              Total Spend
            </div>
            <div className="text-2xl font-bold" style={{ color: GREEN }}>
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
          {/* ── KPI row ────────────────────────────────────────────────────── */}
          <SectionLabel>Overview</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <KpiCard label="Total Receipts" value={totalReceipts}                            sub="Scanned"   icon={<ShoppingCart size={16}/>} accent={GREEN}   />
            <KpiCard label="Avg. Trip"      value={`${userCurrency} ${avgTrip.toFixed(2)}`} sub="Per visit" icon={<TrendingUp size={16}/>}   accent={AMBER}   />
            <KpiCard label="Stores"         value={storeMap.size}                            sub="Unique"    icon={<Store size={16}/>}        accent="#64748B" />
          </div>

          {/* ── Spending trend ─────────────────────────────────────────────── */}
          <SectionLabel>Spending Over Time</SectionLabel>
          <ChartCard
            title="Monthly Spending"
            subtitle="Total per month with 3-month moving average"
          >
            <ReactECharts option={spendTrendOption} style={{ height: 260 }} notMerge />
          </ChartCard>

          {/* ── Category + Store ───────────────────────────────────────────── */}
          <SectionLabel>Breakdown</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <ChartCard title="Spend by Category" subtitle="Where your money goes">
                <ReactECharts option={categoryOption} style={{ height: 260 }} notMerge />
              </ChartCard>
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="Top Stores" subtitle="Ranked by total spend">
                <ReactECharts option={storeOption} style={{ height: 260 }} notMerge />
              </ChartCard>
            </div>
          </div>

          {/* ── Top items + Day of week ─────────────────────────────────────── */}
          <SectionLabel>Products & Behaviour</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Top spend items list */}
            <ChartCard title="Top Spend Items" subtitle="Highest total expenditure by item">
              <div className="divide-y divide-slate-50">
                {topBySpend.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-5 text-center">#{i + 1}</span>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-slate-50 border border-slate-100">
                        {item.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700 capitalize">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: GREEN_SOFT, color: GREEN }}
                          >
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400">{+item.count.toFixed(1)} units</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {userCurrency} {item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Day of week */}
            <ChartCard title="Shopping by Day" subtitle="Trip frequency and spend by day of week">
              <ReactECharts option={weekdayOption} style={{ height: 280 }} notMerge />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
