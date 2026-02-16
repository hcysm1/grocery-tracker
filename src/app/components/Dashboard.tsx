"use client";

import { useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import ReceiptScanner from "./modules/ReceiptScanner";
import MonthlyDashboard from "./modules/MonthlyDashboard";
import PriceTracker from "./modules/PriceTracker";
import Inventory from "./modules/Inventory";
import { Sheet, Home, TrendingUp, Package, Settings } from "lucide-react";
import { getReceiptsAction } from "@/app/actions/get-receipts";
import { getInventoryAction } from "@/app/actions/get-inventory";
import { updateInventoryAction } from "@/app/actions/update-inventory";

type ActiveTab = "dashboard" | "receipts" | "monthly" | "prices" | "inventory";

interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  lastPrice: number;
  lastBought: string;
  frequency: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "user@example.com",
    currency: "MYR"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [receiptsData, inventoryData] = await Promise.all([
          getReceiptsAction(),
          getInventoryAction()
        ]);
        setReceipts(receiptsData || []);
        
        let finalInventory = inventoryData || [];
        
        // If inventory is empty but we have receipts, populate from receipts
        if (finalInventory.length === 0 && receiptsData && receiptsData.length > 0) {
          const itemMap = new Map<string, InventoryItem>();
          receiptsData.forEach((receipt: any) => {
            receipt.receipt_items?.forEach((item: any) => {
              const name = item.products?.name || "Unknown";
              const quantity = item.quantity || 1;
              const price = item.price || 0;
              if (itemMap.has(name)) {
                const existing = itemMap.get(name)!;
                existing.quantity += quantity;
                existing.frequency += 1;
                if (new Date(receipt.created_at) > new Date(existing.lastBought)) {
                  existing.lastBought = receipt.created_at;
                  existing.lastPrice = price;
                }
              } else {
                itemMap.set(name, {
                  name,
                  quantity,
                  lastPrice: price,
                  lastBought: receipt.created_at,
                  frequency: 1,
                });
              }
            });
          });
          finalInventory = Array.from(itemMap.values());
          // Save to database
          await updateInventoryAction(finalInventory);
        }
        
        setInventoryItems(finalInventory);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReceiptAdded = async (newReceipt: any) => {
    const oldReceiptIds = new Set(receipts.map(r => r.id));
    // Refresh receipts from server to get fresh data with all relations
    try {
      const data = await getReceiptsAction();
      setReceipts(data || []);

      // Find new receipts
      const newReceipts = data.filter((r: any) => !oldReceiptIds.has(r.id));

      // Add items from new receipts to inventory
      const updatedInventory = [...inventoryItems];
      newReceipts.forEach((receipt: any) => {
        receipt.receipt_items?.forEach((item: any) => {
          const name = item.products?.name || "Unknown";
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const existing = updatedInventory.find(i => i.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            existing.quantity += quantity;
            existing.frequency += 1;
            if (new Date(receipt.created_at) > new Date(existing.lastBought)) {
              existing.lastBought = receipt.created_at;
              existing.lastPrice = price;
            }
          } else {
            updatedInventory.push({
              name,
              quantity,
              lastPrice: price,
              lastBought: receipt.created_at,
              frequency: 1,
            });
          }
        });
      });

      setInventoryItems(updatedInventory);
      // Save to database
      await updateInventoryAction(updatedInventory);
    } catch (error) {
      console.error("Failed to refresh receipts after upload:", error);
      // Fallback: at least add to local state
      setReceipts([...receipts, newReceipt]);
    }
  };

  const handleInventoryUpdate = async (updatedItems: InventoryItem[]) => {
    setInventoryItems(updatedItems);
    try {
      await updateInventoryAction(updatedItems);
    } catch (error) {
      console.error("Failed to save inventory:", error);
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "receipts", label: "Scan Receipts", icon: Sheet },
    { id: "monthly", label: "Monthly View", icon: TrendingUp },
    { id: "prices", label: "Price History", icon: TrendingUp },
    { id: "inventory", label: "Inventory", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sheet className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">GroceryTrack</h1>
              <p className="text-xs text-slate-500">Smart Receipt & Inventory Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{userProfile.name}</p>
              <p className="text-xs text-slate-500">{userProfile.email}</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition">
              <Settings className="text-slate-600" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR NAVIGATION */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Quick Stats</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Spent:</span>
                <span className="font-semibold text-slate-900">
                  {userProfile.currency} {receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Receipts:</span>
                <span className="font-semibold text-slate-900">{receipts.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE NAVIGATION - Hidden on desktop */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
          <div className="flex overflow-x-auto">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex-1 flex flex-col items-center gap-1 px-3 py-2 text-xs transition ${
                    isActive ? "text-blue-600" : "text-slate-600"
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 mb-20 md:mb-0">
          <div className="max-w-6xl mx-auto p-6">
            {!loading ? (
              <>
                {activeTab === "dashboard" && (
                  <MonthlyDashboard receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "receipts" && (
                  <ReceiptScanner onReceiptAdded={handleReceiptAdded} />
                )}
                {activeTab === "monthly" && (
                  <MonthlyDashboard receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "prices" && (
                  <PriceTracker receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "inventory" && (
                  <Inventory 
                    receipts={receipts} 
                    userCurrency={userProfile.currency}
                    inventoryItems={inventoryItems}
                    onUpdateInventory={handleInventoryUpdate}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading your dashboard...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
