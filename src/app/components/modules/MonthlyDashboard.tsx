"use client";

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  TrendingUp,
  Calendar,
  Wallet,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyDashboardProps {
  receipts: any[];
  userCurrency: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ["#00B14F", "#F97316", "#EAB308", "#06B6D4", "#8B5CF6", "#EC4899"];

const tooltipBase = {
  backgroundColor: "#0F172A",
  borderColor: "#1E293B",
  textStyle: { color: "#F8FAFC", fontSize: 13 },
  extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);",
};

// ─── KpiCard (inline, no external import needed) ──────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MonthlyDashboard({ receipts, userCurrency }: MonthlyDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const displayDate = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const currentViewKey = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const handlePreviousMonth = () =>
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });

  const handleNextMonth = () =>
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  // ── Data processing ──────────────────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    const months = new Map<string, any>();

    receipts.forEach((receipt) => {
      const date = new Date(receipt.scanned_at);
      const monthKey = date.toISOString().slice(0, 7);
      const monthLabel = date.toLocaleDateString("en-MY", {
        year: "numeric",
        month: "long",
      });

      if (!months.has(monthKey)) {
        months.set(monthKey, {
          key: monthKey,
          label: monthLabel,
          total: 0,
          count: 0,
          items: [],
          stores: new Map<string, number>(),
        });
      }

      const m = months.get(monthKey);
      m.total += receipt.total_amount || 0;
      m.count += 1;
      m.items.push(...(receipt.receipt_items || []));
      m.stores.set(
        receipt.store_name,
        (m.stores.get(receipt.store_name) || 0) + (receipt.total_amount || 0)
      );
    });

    return Array.from(months.values())
      .map((m) => ({
        ...m,
        // ECharts pie series expects { name, value }
        stores: (Array.from(m.stores.entries()) as [string, number][]).map(([name, value]) => ({
          name,
          value,
        })),
        average: (m.total / m.count).toFixed(2),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [receipts]);

  const currentMonthData = monthlyData.find((m) => m.key === currentViewKey);

  const topItems = useMemo(() => {
    if (!currentMonthData) return [];

    const itemMap = new Map<
      string,
      { name: string; count: number; total: number; emoji: string; unit: string; category: string }
    >();

    currentMonthData.items.forEach((item: any) => {
      const product = item.products;
      const name = product?.name || "Unknown";
      const cur = itemMap.get(name) || {
        name,
        count: 0,
        total: 0,
        emoji: product?.emoji || "📦",
        unit: item.unit || "pc",
        category: product?.category || "Other",
      };
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      cur.count += qty;
      cur.total += price * qty;
      itemMap.set(name, cur);
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [currentMonthData]);

  // ── ECharts: Store Donut ──────────────────────────────────────────────────────

  const storePieOption = useMemo(() => {
    if (!currentMonthData) return {};
    return {
      backgroundColor: "transparent",
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (p: any) =>
          `<b>${p.name}</b><br/>${userCurrency} ${Number(p.value).toFixed(2)} <span style="opacity:.55">(${p.percent}%)</span>`,
      },
      series: [
        {
          type: "pie",
          radius: ["52%", "78%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          padAngle: 3,
          itemStyle: { borderRadius: 6 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: "bold", color: "#1E293B" },
            scaleSize: 4,
          },
          data: currentMonthData.stores.map((s: any, i: number) => ({
            ...s,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
        },
      ],
    };
  }, [currentMonthData, userCurrency]);

  // ── ECharts: Top Items horizontal bar ────────────────────────────────────────

  const topItemsBarOption = useMemo(() => {
    if (!topItems.length) return {};
    const reversed = [...topItems].reverse();
    return {
      backgroundColor: "transparent",
      tooltip: {
        ...tooltipBase,
        trigger: "axis",
        axisPointer: { type: "none" },
        formatter: (p: any[]) =>
          `<b>${p[0].axisValue}</b><br/>${userCurrency} ${Number(p[0].value).toFixed(2)}`,
      },
      grid: { left: 12, right: 60, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value" as const,
        axisLine: { lineStyle: { color: "#E2E8F0" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#94A3B8",
          fontSize: 10,
          fontFamily: "ui-monospace, monospace",
        },
        splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } },
      },
      yAxis: {
        type: "category" as const,
        data: reversed.map((i) => i.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#64748B", fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          data: reversed.map((i) => +i.total.toFixed(2)),
          barMaxWidth: 20,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: {
              type: "linear",
              x: 1, y: 0, x2: 0, y2: 0,
              colorStops: [
                { offset: 0, color: "#00B14F" },
                { offset: 1, color: "#bbf7d0" },
              ],
            },
          },
          label: {
            show: true,
            position: "right" as const,
            color: "#00B14F",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            formatter: (p: any) => `${userCurrency} ${Number(p.value).toFixed(2)}`,
          },
        },
      ],
    };
  }, [topItems, userCurrency]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Monthly Dashboard</h1>
          <p className="text-slate-500 text-sm">Track your spending patterns by month</p>
        </div>
      </div>

      {/* Month navigator */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg border border-slate-200 transition"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{displayDate}</h2>
          <p className="text-sm text-gray-600 mt-1">Monthly Spending Overview</p>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg border border-slate-200 transition"
          onClick={handleNextMonth}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Empty state */}
      {!currentMonthData ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-20 text-center">
          <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">
            No receipts scanned for {displayDate}
          </h3>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Spent"
              value={`${userCurrency} ${currentMonthData.total.toFixed(2)}`}
              sub="This month"
              icon={<Wallet size={16} />}
              accent="#00B14F"
            />
            <KpiCard
              label="Receipts"
              value={currentMonthData.count}
              sub="Trips made"
              icon={<ShoppingCart size={16} />}
              accent="#8B5CF6"
            />
            <KpiCard
              label="Avg. Trip"
              value={`${userCurrency} ${currentMonthData.average}`}
              sub="Per visit"
              icon={<TrendingUp size={16} />}
              accent="#10B981"
            />
            <KpiCard
              label="Avg. Day"
              value={`${userCurrency} ${(currentMonthData.total / 30).toFixed(2)}`}
              sub="Daily estimate"
              icon={<Calendar size={16} />}
              accent="#F59E0B"
            />
          </div>

          {/* ── Charts row ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Store Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800">Store Breakdown</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Spend distribution by retailer</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-50 text-[#00B14F] rounded-full">
                  {currentMonthData.stores.length} Stores
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-2">
                {/* Donut */}
                <div className="w-full md:w-1/2">
                  <ReactECharts option={storePieOption} style={{ height: 200 }} notMerge />
                </div>

                {/* Legend */}
                <div className="w-full md:w-1/2 space-y-3">
                  {currentMonthData.stores.slice(0, 4).map((store: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-slate-600 truncate max-w-[110px]">
                          {store.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-800">
                          {((store.value / currentMonthData.total) * 100).toFixed(0)}%
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          {userCurrency} {Number(store.value).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Items */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-slate-800">Top Items</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Highest spend this month</p>
                </div>
                <TrendingUp size={18} className="text-slate-400" />
              </div>

              {topItems.length > 0 ? (
                <>
                  {/* Item metadata rows */}
                  <div className="space-y-3 mb-5">
                    {topItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg border border-slate-100">
                            {item.emoji}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 capitalize">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B14F] bg-green-50 px-1.5 py-0.5 rounded">
                                {item.category}
                              </span>
                              <span className="text-xs text-slate-400">
                                {item.count} {item.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {userCurrency} {item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Spend comparison bar */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                      Spend Comparison
                    </p>
                    <ReactECharts option={topItemsBarOption} style={{ height: 140 }} notMerge />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">No items this month</div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
