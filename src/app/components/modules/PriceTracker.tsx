"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface PriceTrackerProps {
  receipts: any[];
  userCurrency: string;
}

export default function PriceTracker({ receipts, userCurrency }: PriceTrackerProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const priceHistory = useMemo(() => {
    const itemMap = new Map<string, Array<{ date: string; price: number; quantity: number }>>();

    receipts.forEach((receipt) => {
      const date = new Date(receipt.scanned_at);
      const dateLabel = date.toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });

      receipt.receipt_items?.forEach((item: any) => {
        const itemName = item.products?.name || "Unknown";
        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, []);
        }
        itemMap.get(itemName)!.push({
          date: dateLabel,
          price: Number(item.unit_price) || 0,
          quantity: item.quantity || 1,
        });
      });
    });

    return Array.from(itemMap.entries())
      .map(([name, history]) => ({
        name,
        history: history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }))
      .sort((a, b) => b.history.length - a.history.length);
  }, [receipts]);

  const selectedItemData = selectedItem ? priceHistory.find((item) => item.name === selectedItem) : priceHistory[0];

  const priceStats = useMemo(() => {
    if (!selectedItemData) return null;
    const prices = selectedItemData.history.map((h) => h.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    return { avgPrice, minPrice, maxPrice, change, lastPrice, firstPrice };
  }, [selectedItemData]);

  if (priceHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No price history available. Add more receipts to see price trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Price History</h2>
        <p className="text-slate-600">Track how prices change over time for your favorite items</p>
      </div>

      {/* ITEM SELECTOR */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Item</label>
        <div className="flex flex-wrap gap-2">
          {priceHistory.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedItem(item.name)}
              className={`px-4 py-2 rounded-lg transition border text-sm ${
                selectedItem === item.name || (selectedItem === null && item === priceHistory[0])
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:border-blue-400"
              }`}
            >
              {item.name} ({item.history.length})
            </button>
          ))}
        </div>
      </div>

      {/* PRICE STATS */}
      {priceStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600 font-semibold uppercase">Current Price</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{userCurrency} {priceStats.lastPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600 font-semibold uppercase">Average Price</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{userCurrency} {priceStats.avgPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600 font-semibold uppercase">Lowest Price</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{userCurrency} {priceStats.minPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600 font-semibold uppercase">Highest Price</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{userCurrency} {priceStats.maxPrice.toFixed(2)}</p>
          </div>
          <div className={`bg-white border rounded-lg p-4 ${priceStats.change >= 0 ? "border-red-200" : "border-green-200"}`}>
            <p className="text-xs font-semibold uppercase flex items-center gap-1">
              {priceStats.change >= 0 ? (
                <>
                  <TrendingUp className="text-red-600" size={14} /> Price Change
                </>
              ) : (
                <>
                  <TrendingDown className="text-green-600" size={14} /> Price Change
                </>
              )}
            </p>
            <p className={`text-2xl font-bold mt-2 ${priceStats.change >= 0 ? "text-red-600" : "text-green-600"}`}>
              {priceStats.change >= 0 ? "+" : ""}
              {priceStats.change.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* PRICE TREND CHART */}
      {selectedItemData && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">Price Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={selectedItemData.history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: `Price (${userCurrency})`, angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value: any) => `${userCurrency} ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#3B82F6" name="Price" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TOP 10 ITEMS */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-bold text-slate-900 mb-4">Most Tracked Items</h3>
        <div className="space-y-2">
          {priceHistory.slice(0, 10).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition">
              <div>
                <p className="font-medium text-slate-900 capitalize">{item.name}</p>
                <p className="text-xs text-slate-500">{item.history.length} records</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {userCurrency} {(item.history[item.history.length - 1]?.price || 0).toFixed(2)}
                </p>
                <p
                  className={`text-xs ${
                    item.history[item.history.length - 1].price >=
                    item.history[0].price
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {((item.history[item.history.length - 1].price - item.history[0].price) / item.history[0].price * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
