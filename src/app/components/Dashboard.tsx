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

interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  lastPrice: number;
  lastBought: string;
  frequency: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [userProfile] = useState({ name: "User", email: "user@example.com", currency: "MYR" });

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [receiptsData, inventoryData] = await Promise.all([
        getReceiptsAction(),
        getInventoryAction()
      ]);
      
      setReceipts(receiptsData || []);

      // If DB is empty, populate using Name + Price logic
      if ((!inventoryData || inventoryData.length === 0) && receiptsData?.length > 0) {
        const itemMap = new Map<string, InventoryItem>();
        
        receiptsData.forEach((receipt: any) => {
          receipt.receipt_items?.forEach((item: any) => {
            const name = (item.products?.name || "Unknown").trim();
            const price = Number(item.price) || 0;
            
            if (name.toLowerCase().includes('discount') || price <= 0) return;

            // Create a key that combines Name and Price
            const lotKey = `${name.toLowerCase()}_${price}`;

            if (itemMap.has(lotKey)) {
              const existing = itemMap.get(lotKey)!;
              existing.quantity += (item.quantity || 1);
              existing.frequency += 1;
            } else {
              itemMap.set(lotKey, {
                name,
                quantity: item.quantity || 1,
                lastPrice: price,
                lastBought: receipt.created_at,
                frequency: 1,
              });
            }
          });
        });

        const initialItems = Array.from(itemMap.values());
        await updateInventoryAction(initialItems);
        const synced = await getInventoryAction();
        setInventoryItems(synced || initialItems);
      } else {
        setInventoryItems(inventoryData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleInventoryUpdate = async (items: InventoryItem[]) => {
    setInventoryItems(items);
    await updateInventoryAction(items);
  };

  const handleReceiptAdded = async () => {
    await refreshData();
    setActiveTab("inventory");
  };

  // ... (Keep the sidebar and return UI from previous version) ...
  return (
    <div className="min-h-screen bg-slate-50">
       {/* (Header same as before) */}
       <div className="flex">
         {/* (Sidebar same as before) */}
         <main className="flex-1 p-6 lg:p-10">
           {activeTab === "inventory" && (
             <Inventory 
               receipts={receipts} 
               userCurrency={userProfile.currency}
               inventoryItems={inventoryItems}
               onUpdateInventory={handleInventoryUpdate}
             />
           )}
           {/* (Other tabs same as before) */}
         </main>
       </div>
    </div>
  );
}