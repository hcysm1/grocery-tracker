"use client";

import { useState, useEffect, useCallback } from "react";
import ReceiptScanner from "./modules/ReceiptScanner";
import MonthlyDashboard from "./modules/MonthlyDashboard";
import PriceTracker from "./modules/PriceTracker";
import Inventory from "./modules/Inventory";
import { Sheet, Home, TrendingUp, Package, Settings, Loader2 } from "lucide-react";
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
  const [userProfile] = useState({
    name: "User",
    email: "user@example.com",
    currency: "MYR"
  });

  /**
   * REFRESH DATA
   * The "Source of Truth" logic.
   */
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [receiptsData, inventoryData] = await Promise.all([
        getReceiptsAction(),
        getInventoryAction()
      ]);
      
      setReceipts(receiptsData || []);

      // GATEKEEPER: Only generate from receipts if the Inventory table is COMPLETELY empty.
      // This prevents overwriting your manual edits/renames on refresh.
      if ((!inventoryData || inventoryData.length === 0) && receiptsData?.length > 0) {
        console.log("Database inventory is empty. Populating from history...");
        const itemMap = new Map<string, InventoryItem>();
        
        receiptsData.forEach((receipt: any) => {
          receipt.receipt_items?.forEach((item: any) => {
            const name = item.products?.name || "Unknown";
            const price = Number(item.price) || 0;
            
            // STRICT FILTER: Don't let non-items bloat the value
            if (
              name.toLowerCase().includes('discount') || 
              name.toLowerCase().includes('tax') ||
              name.toLowerCase().includes('service charge') ||
              price < 0
            ) return;

            if (itemMap.has(name)) {
              const existing = itemMap.get(name)!;
              existing.quantity += (item.quantity || 1);
              existing.frequency += 1;
              if (new Date(receipt.created_at) > new Date(existing.lastBought)) {
                existing.lastBought = receipt.created_at;
                existing.lastPrice = price;
              }
            } else {
              itemMap.set(name, {
                name,
                quantity: item.quantity || 1,
                lastPrice: price,
                lastBought: receipt.created_at || new Date().toISOString(),
                frequency: 1,
              });
            }
          });
        });
        
        const initialItems = Array.from(itemMap.values());
        await updateInventoryAction(initialItems);
        
        // Final fetch to get IDs from DB
        const syncedData = await getInventoryAction();
        setInventoryItems(syncedData || initialItems);
      } else {
        // Database has data! Use it exactly as is.
        setInventoryItems(inventoryData || []);
      }
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
    // When a new receipt is scanned, we sync everything to catch new products
    await refreshData();
    setActiveTab("inventory");
  };

  const handleInventoryUpdate = async (updatedItems: InventoryItem[]) => {
    // 1. Update UI immediately (Snappy)
    setInventoryItems(updatedItems);
    
    // 2. Sync to Supabase in background
    try {
      await updateInventoryAction(updatedItems);
    } catch (error) {
      console.error("Failed to persist inventory changes:", error);
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "receipts", label: "Scan Receipts", icon: Sheet },
    { id: "prices", label: "Price History", icon: TrendingUp },
    { id: "inventory", label: "Inventory", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <Sheet className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">GroceryTrack</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Authenticated Session</p>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <Loader2 className="animate-spin" size={16} /> Syncing DB...
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{userProfile.name}</p>
              <p className="text-xs text-slate-500">{userProfile.email}</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full transition">
              <Settings className="text-slate-600" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Lifetime Spend</span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {userProfile.currency} {receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto p-6 lg:p-10">
            {!loading || receipts.length > 0 || inventoryItems.length > 0 ? (
              <div className="animate-in fade-in duration-500">
                {activeTab === "dashboard" && (
                  <MonthlyDashboard receipts={receipts} userCurrency={userProfile.currency} />
                )}
                {activeTab === "receipts" && (
                  <ReceiptScanner onReceiptAdded={handleReceiptAdded} />
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium italic">Loading your profile...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}