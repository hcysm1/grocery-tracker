"use client";

import { useState, useEffect, useCallback } from "react";
import ReceiptScanner from "./modules/ReceiptScanner";
import MonthlyDashboard from "./modules/MonthlyDashboard";
import SpendingAnalysis from "./modules/SpendingAnalysis";
import InventoryDashboard from "./modules/Inventory";
import { Sheet, Home, Settings, Loader2, Package, PieChart, CreditCard, Menu, X, ArrowLeft } from "lucide-react";
import { getReceiptsAction } from "@/app/actions/get-receipts";
import { fetchInventoryAction } from "../actions/inventory";

type ActiveTab = "dashboard" | "receipts" | "inventory" | "spending";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("receipts");
  const [prevTab, setPrevTab] = useState<ActiveTab | null>(null); // Track previous screen
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
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

  // Custom tab changer that tracks screen history
  const changeTab = (tabId: ActiveTab) => {
    setPrevTab(activeTab);
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); // Close drawer on selection
  };

  // Go back to the previous view
  const handleGoBack = () => {
    if (prevTab) {
      setActiveTab(prevTab);
      setPrevTab(null); // Clear history or map deeper if needed
    }
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { id: "dashboard", label: "Overview", icon: Home },
    { id: "receipts", label: "Scan Receipt", icon: Sheet },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "spending", label: "Analysis", icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#252525] relative">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3-Line Menu Button (Visible only on Mobile/Tablet) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
              aria-label="Open Menu"
            >
              <Menu size={24} />
            </button>

            <div className="w-10 h-10 bg-[#00B14F] rounded-full flex items-center justify-center shadow-md">
              <Sheet className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#252525] tracking-tight">
                Grocery<span className="text-[#00B14F]">Track</span>
              </h1>
            </div>
          </div>

          {/* Quick Back Button on Header if history exists (Mobile Only) */}
          {prevTab && (
            <button 
              onClick={handleGoBack}
              className="md:hidden flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
        </div>
      </header>

      {/* MOBILE SIDEBAR OVERLAY DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Shadow overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Sliding Content */}
          <div className="relative w-72 max-w-sm bg-white h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">Navigation</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Back Button inside menu drawer if previous screen exists */}
            {prevTab && (
              <button
                onClick={handleGoBack}
                className="mb-4 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-[15px] border border-gray-200/50 transition-all"
              >
                <ArrowLeft size={20} className="text-[#00B14F]" />
                <span>Go Back to Previous</span>
              </button>
            )}

            {/* Nav items */}
            <nav className="flex-1 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => changeTab(item.id as ActiveTab)}
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

            {/* Expenses Widget inside Mobile Sidebar */}
            <div className="mt-auto p-4 rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm">
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
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR & MAIN BODY */}
      <div className="flex">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex-1 px-4 py-8 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => changeTab(item.id as ActiveTab)}
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
                  <InventoryDashboard receipts={receipts} userCurrency="RM" initialInventory={inventory ?? []} />
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