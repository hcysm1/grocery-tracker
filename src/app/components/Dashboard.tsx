"use client";

import { useState, useEffect, useCallback } from "react";
import ReceiptScanner from "./modules/ReceiptScanner";
import MonthlyDashboard from "./modules/MonthlyDashboard";
import SpendingAnalysis from "./modules/SpendingAnalysis";
import Inventory from "./modules/Inventory";
import { Sheet, Home, Settings, Loader2, Package, PieChart, CreditCard } from "lucide-react";
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
    { id: "dashboard", label: "Overview", icon: Home },
    { id: "receipts", label: "Scan Receipt", icon: Sheet },
    { id: "inventory", label: "Pantry", icon: Package },
    { id: "spending", label: "Analysis", icon: PieChart },
  ];

  return (
    // Grab uses a very clean, slightly off-white background
    <div className="min-h-screen bg-[#F9F9F9] text-[#252525]">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Grab's signature logo color #00B14F */}
            <div className="w-10 h-10 bg-[#00B14F] rounded-full flex items-center justify-center shadow-md">
              <Sheet className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#252525] tracking-tight">
                Grocery<span className="text-[#00B14F]">Track</span>
              </h1>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#00B14F] rounded-full animate-pulse"></span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live Session</p>
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-[#00B14F] text-sm font-bold">
              <Loader2 className="animate-spin" size={16} /> Updating...
            </div>
          )}

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition-colors">
              <Settings size={20} />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
               <div className="w-full h-full bg-[#00B14F]/10 flex items-center justify-center text-[#00B14F] font-bold text-xs">
                 {userProfile.name[0]}
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR - Styled like Grab's side menus */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex-1 px-4 py-8 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#00B14F] text-white shadow-lg shadow-green-100 font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#252525] font-semibold"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[15px]">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Grab Wallet Style Summary */}
          <div className="p-4 m-4 rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#00B14F]/10 rounded-lg">
                <CreditCard size={14} className="text-[#00B14F]" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Expenses</span>
            </div>
            <p className="text-2xl font-black text-[#252525]">
              <span className="text-sm font-bold mr-0.5 text-gray-400">{userProfile.currency}</span>
              {receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto p-6 lg:p-10">
            {!loading || receipts.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                <div className="w-16 h-16 border-4 border-[#00B14F]/20 border-t-[#00B14F] rounded-full animate-spin mb-6"></div>
                <p className="text-gray-400 font-semibold text-lg">Getting things ready...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}