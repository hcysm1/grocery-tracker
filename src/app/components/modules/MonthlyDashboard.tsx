"use client";

import { useMemo, useState } from "react";
import { StatsCard } from './StatsCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Calendar, Wallet, ShoppingCart, AlertCircle, Package } from "lucide-react";

interface MonthlyDashboardProps {
  receipts: any[];
  userCurrency: string;
}

export default function MonthlyDashboard({ receipts, userCurrency }: MonthlyDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const monthlyData = useMemo(() => {
    const months = new Map<string, any>();

    receipts.forEach((receipt) => {
      const date = new Date(receipt.scanned_at);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString("en-MY", { year: "numeric", month: "long" });

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

      const monthData = months.get(monthKey);
      monthData.total += receipt.total_amount || 0;
      monthData.count += 1;
      monthData.items.push(...(receipt.receipt_items || []));

      // Track store spending
      const current = monthData.stores.get(receipt.store_name) || 0;
      monthData.stores.set(receipt.store_name, current + (receipt.total_amount || 0));
    });

    return Array.from(months.values())
      .map((m) => {
        const storesArray = Array.from(m.stores.entries()).map((entry) => {
          const [name, amount] = entry as [string, number];
          return { name, amount };
        });
        return {
          ...m,
          stores: storesArray,
          average: (m.total / m.count).toFixed(2),
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [receipts]);

  const currentMonthData = selectedMonth ? monthlyData.find((m) => m.key === selectedMonth) : monthlyData[monthlyData.length - 1];

  const topItems = useMemo(() => {
    if (!currentMonthData) return [];
    const itemMap = new Map<string, { name: string; count: number; total: number }>();

    currentMonthData.items.forEach((item: any) => {
      const name = item.products?.name || "Unknown";
      const current = itemMap.get(name) || { name, count: 0, total: 0 };
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      current.count += qty;
      current.total += price * qty;
      itemMap.set(name, current);
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [currentMonthData]);

  if (!currentMonthData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No receipt data available. Start by scanning a receipt.</p>
      </div>
    );
  }

  const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"];

  return (
    <div className="space-y-6">
     {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Monthly Dashboard</h1>
          <p className="text-slate-500 text-sm">Track your spending patterns by month</p>   
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Month</label>
        <div className="flex flex-wrap gap-2">
          {monthlyData.map((month) => (
            <button
              key={month.key}
              onClick={() => setSelectedMonth(month.key)}
              className={`px-4 py-2 rounded-lg transition border ${
                selectedMonth === month.key || (selectedMonth === null && month === monthlyData[monthlyData.length - 1])
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:border-blue-400"
              }`}
            >
              {month.label}
            </button>
          ))}
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard title="Total Spent" value={currentMonthData.total.toFixed(2)} sub="Total Spent this month" icon={<Wallet className="text-blue-300" />} />
      <StatsCard title="Total Receipts" value={currentMonthData.count} sub="Total Receipts this month" icon={<ShoppingCart className="text-blue-300" />} />
      <StatsCard title="Avg. Per Trip" value={currentMonthData.average} sub="Average spent per receipt" icon={<TrendingUp className="text-green-300" />} />
      <StatsCard title="Avg. Per Day" value={(currentMonthData.total / 30).toFixed(2)} sub="Average spent per day" icon={<Calendar className="text-orange-300" />} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STORE BREAKDOWN */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">Store Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={currentMonthData.stores} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {currentMonthData.stores.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${userCurrency} ${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* TOP ITEMS */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">Top Items</h3>
          <div className="space-y-3">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 capitalize">{item.name}</p>
                  <p className="text-sm text-slate-500">Qty: {item.count}</p>
                </div>
                <p className="font-bold text-slate-900">{userCurrency} {item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MONTHLY TREND - Only show if multiple months */}
      {monthlyData.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${userCurrency} ${value.toFixed(2)}`} />
              <Bar dataKey="total" fill="#3B82F6" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
