"use client";

import { useState, useEffect, useCallback } from "react";
import ReceiptScanner from "./modules/ReceiptScanner";
import MonthlyDashboard from "./modules/MonthlyDashboard";
import SpendingAnalysis from "./modules/SpendingAnalysis";
import InventoryDashboard from "./modules/Inventory";
import { Sheet, Home, Package, PieChart, CreditCard } from "lucide-react";
import { getReceiptsAction } from "@/app/actions/get-receipts";
import { fetchInventoryAction } from "../actions/inventory";

type ActiveTab = "dashboard" | "receipts" | "inventory" | "spending";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("receipts");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile] = useState({
    name: "User",
    email: "user@example.com",
    currency: "MYR"
  });

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const receiptsData = await getReceiptsAction();
      const { data: inventoryData } = await fetchInventoryAction();
      setReceipts(receiptsData || []);
      setInventory(inventoryData || []);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleReceiptAdded = async () => {
    await refreshData();
  };

  const changeTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
  };

  const navigationItems = [
    { id: "dashboard", label: "Overview", icon: Home },
    { id: "receipts",  label: "Scan",     icon: Sheet },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "spending",  label: "Analysis",  icon: PieChart },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#252525]">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#00B14F] rounded-full flex items-center justify-center shadow-md">
              <Sheet className="text-white" size={18} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#252525] tracking-tight">
              Grocery<span className="text-[#00B14F]">Track</span>
            </h1>
          </div>

          {/* Total expenses chip — visible on mobile header */}
          <div className="flex md:hidden items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
            <CreditCard size={13} className="text-[#00B14F]" />
            <span className="text-xs font-bold text-[#252525]">
              {userProfile.currency}{" "}
              {receipts.reduce((s, r) => s + (r.total_amount || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      {/* ── LAYOUT ──────────────────────────────────────────────────────────── */}
      <div className="flex">

        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex-1 px-4 py-8 space-y-1">
            {navigationItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => changeTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#00B14F] text-white shadow-lg shadow-green-100 font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#252525] font-semibold"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[15px]">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 m-4 rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#00B14F]/10 rounded-lg">
                <CreditCard size={14} className="text-[#00B14F]" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Expenses</span>
            </div>
            <p className="text-2xl font-black text-[#252525]">
              <span className="text-sm font-bold mr-0.5 text-gray-400">{userProfile.currency}</span>
              {receipts.reduce((s, r) => s + (r.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* pb-24 on mobile reserves space above bottom nav */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8 pb-24 md:pb-8">
            {!loading || receipts.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === "dashboard" && (
                  <MonthlyDashboard receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "receipts" && (
                  <ReceiptScanner onReceiptAdded={handleReceiptAdded} />
                )}
                {activeTab === "inventory" && (
                  <InventoryDashboard receipts={receipts}  initialInventory={inventory ?? []} />
                )}
                {activeTab === "spending" && (
                  <SpendingAnalysis receipts={receipts} userCurrency={userProfile.currency} />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-14 h-14 border-4 border-[#00B14F]/20 border-t-[#00B14F] rounded-full animate-spin mb-6" />
                <p className="text-gray-400 font-semibold text-base sm:text-lg">Getting things ready...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV (Instagram-style) — hidden on md+ ────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-16 safe-area-pb">
          {navigationItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 active:scale-95"
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00B14F]" />
                )}

                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#00B14F]/10"
                      : ""
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "text-[#00B14F]" : "text-gray-400"}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    isActive ? "text-[#00B14F]" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
