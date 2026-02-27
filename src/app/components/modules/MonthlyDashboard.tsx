"use client";

import { useMemo, useState } from "react";
import { StatsCard } from './StatsCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Calendar, Wallet, ShoppingCart, AlertCircle, ChevronLeft, ChevronRight, ReceiptText } from "lucide-react";

interface MonthlyDashboardProps {
  receipts: any[];
  userCurrency: string;
}

export default function MonthlyDashboard({ receipts, userCurrency }: MonthlyDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());


  // Format the date for the UI (e.g., "December 2023")
  const displayDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const currentViewKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // handle previous buttons
  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  //handle next buttons
  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

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

  const currentMonthData = monthlyData.find((m) => m.key === currentViewKey);

  ////////CURRENTLY WORKING ON THIS PART

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



      {/* Month Selector */}
      <div className="bg-white rounded-xl p-4 mb-8 shadow-sm border border-slate-100 flex items-center justify-between">
        <button className="p-2 hover:bg-gray-100 rounded-lg border border-slate-200" onClick={handlePreviousMonth}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{displayDate}</h2>
          <p className="text-sm text-gray-600 mt-1">Monthly Inventory Overview</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg border border-slate-200" onClick={handleNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>
      {!currentMonthData ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-20 text-center">
          <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No recipes scanned for {displayDate}</h3>
        </div>
      ) : (
        /* Everything below is wrapped in the "else" condition */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Total Spent" value={currentMonthData.total.toFixed(2)} sub={`${userCurrency}`} icon={<Wallet className="text-blue-500" />} />
            <StatsCard title="Receipts" value={currentMonthData.count} sub="Trips" icon={<ShoppingCart className="text-blue-500" />} />
            <StatsCard title="Avg. Trip" value={currentMonthData.average} sub="Per visit" icon={<TrendingUp className="text-green-500" />} />
            <StatsCard title="Avg. Day" value={(currentMonthData.total / 30).toFixed(2)} sub="Daily" icon={<Calendar className="text-orange-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-bold mb-4">Store Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={currentMonthData.stores} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {currentMonthData.stores.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => {
                      if (value === undefined || value === null) return [`${userCurrency} 0.00`, 'Amount'];
                      return [`${userCurrency} ${Number(value).toFixed(2)}`, 'Amount'];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-bold mb-4">Top Items</h3>
              {topItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b last:border-0">
                  <span className="capitalize">{item.name}</span>
                  <span className="font-bold">{userCurrency} {item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}





