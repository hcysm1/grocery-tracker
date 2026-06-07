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

interface MonthlyDashboardProps {
  receipts: any[];
  userCurrency: string;
}

const COLORS = ["#00B14F", "#F97316", "#EAB308", "#06B6D4", "#8B5CF6", "#EC4899"];

const tooltipBase = {
  backgroundColor: "#0F172A",
  borderColor: "#1E293B",
  textStyle: { color: "#F8FAFC", fontSize: 13 },
  extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);",
};

function KpiCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 hover:shadow-md transition-shadow"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight break-all">{value}</div>
        <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

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
        axisLabel: { color: "#94A3B8", fontSize: 10, fontFamily: "ui-monospace, monospace" },
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

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-2xl font-bold">Monthly Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your spending patterns by month</p>
      </div>

      {/* Month navigator */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-2">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg border border-slate-200 transition flex-shrink-0"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">{displayDate}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monthly Spending Overview</p>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg border border-slate-200 transition flex-shrink-0"
          onClick={handleNextMonth}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Empty state */}
      {!currentMonthData ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-16 sm:py-20 text-center px-4">
          <ReceiptText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-slate-900">
            No receipts scanned for {displayDate}
          </h3>
        </div>
      ) : (
        <>
          {/* KPI Cards — 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              label="Total Spent"
              value={`${userCurrency} ${currentMonthData.total.toFixed(2)}`}
              sub="This month"
              icon={<Wallet size={15} />}
              accent="#00B14F"
            />
            <KpiCard
              label="Receipts"
              value={currentMonthData.count}
              sub="Trips made"
              icon={<ShoppingCart size={15} />}
              accent="#8B5CF6"
            />
            <KpiCard
              label="Avg. Trip"
              value={`${userCurrency} ${currentMonthData.average}`}
              sub="Per visit"
              icon={<TrendingUp size={15} />}
              accent="#10B981"
            />
            <KpiCard
              label="Avg. Day"
              value={`${userCurrency} ${(currentMonthData.total / 30).toFixed(2)}`}
              sub="Daily estimate"
              icon={<Calendar size={15} />}
              accent="#F59E0B"
            />
          </div>

          {/* Charts row — stacked on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Store Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Store Breakdown</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Spend distribution by retailer</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-50 text-[#00B14F] rounded-full flex-shrink-0">
                  {currentMonthData.stores.length} Stores
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="w-full sm:w-1/2">
                  <ReactECharts option={storePieOption} style={{ height: 180 }} notMerge />
                </div>
                <div className="w-full sm:w-1/2 space-y-2.5">
                  {currentMonthData.stores.slice(0, 4).map((store: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-slate-600 truncate max-w-[100px] sm:max-w-[110px] text-xs sm:text-sm">
                          {store.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {((store.value / currentMonthData.total) * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 ml-1">
                          {userCurrency} {Number(store.value).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Items */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Top Items</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Highest spend this month</p>
                </div>
                <TrendingUp size={16} className="text-slate-400 flex-shrink-0" />
              </div>

              {topItems.length > 0 ? (
                <div className="space-y-3">
                  {topItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 flex items-center justify-center text-base sm:text-lg border border-slate-100 flex-shrink-0">
                          {item.emoji}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-700 capitalize truncate">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00B14F] bg-green-50 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.count} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex-shrink-0">
                        {userCurrency} {item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
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
