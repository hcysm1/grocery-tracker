"use client";

import { useState, useEffect, useCallback } from "react";
import ReceiptScanner from "./modules/ReceiptScanner";
import MonthlyDashboard from "./modules/MonthlyDashboard";
import SpendingAnalysis from "./modules/SpendingAnalysis";
import Inventory from "./modules/Inventory";
import { Sheet, Home, Settings, Loader2, Package, PieChart } from "lucide-react";
import { getReceiptsAction } from "@/app/actions/get-receipts";

type ActiveTab = "dashboard" | "receipts" | "inventory" | "spending";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("receipts");
  const [receipts, setReceipts] = useState<any[]>([]);
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
      setReceipts(receiptsData || []);
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

  const navigationItems = [
    { id: "dashboard", label: "Monthly Overview", icon: Home },
    { id: "receipts", label: "Scan Receipts", icon: Sheet },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "spending", label: "Spending Analysis", icon: PieChart },
  ];

  return (
    // Updated background to a very slight green-tinted slate
    <div className="min-h-screen bg-[#f8faf9]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo: Shifted from Blue to Emerald 500 */}
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Sheet className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                Grocery<span className="text-emerald-600">Track</span>
              </h1>
              <p className="text-[10px] text-emerald-600/60 uppercase tracking-widest font-bold">Authenticated Session</p>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold animate-pulse">
              <Loader2 className="animate-spin" size={16} /> Syncing Pantry...
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{userProfile.name}</p>
              <p className="text-xs text-slate-500">{userProfile.email}</p>
            </div>
            <button className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-full transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-white border-r border-emerald-50 flex-col sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-1 ring-emerald-500"
                      : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-bold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Spend Summary Widget */}
          <div className="p-4 m-4 rounded-2xl border border-emerald-100 bg-emerald-50/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">Lifetime Spend</span>
            </div>
            <p className="text-2xl font-black text-emerald-900">
              <span className="text-sm font-medium mr-1 opacity-60">{userProfile.currency}</span>
              {receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto p-6 lg:p-10">
            {!loading || receipts.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === "dashboard" && (
                  <MonthlyDashboard receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "receipts" && (
                  <ReceiptScanner onReceiptAdded={handleReceiptAdded} />
                )}
                {activeTab === "inventory" && (
                  <Inventory receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "spending" && (
                  <SpendingAnalysis receipts={receipts} userCurrency={userProfile.currency}/>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <div className="absolute inset-0 bg-emerald-200 blur-2xl opacity-20 animate-pulse"></div>
                </div>
                <p className="text-emerald-800/60 font-bold tracking-tight">Stocking your shelves...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}