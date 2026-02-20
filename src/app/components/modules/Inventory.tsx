"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Minus, Trash2, Edit, Check, X, Info } from "lucide-react";

interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  lastPrice: number;
  totalValue: number;
  lastBought: string;
  frequency: number;
}

interface InventoryProps {
  receipts: any[];
  userCurrency: string;
  inventoryItems: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
}

export default function Inventory({ receipts, userCurrency, inventoryItems, onUpdateInventory }: InventoryProps) {
  
  // 1. STATS CALCULATION
  const stats = useMemo(() => {
    return {
      totalItems: inventoryItems.length,
      totalQty: inventoryItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
      totalValue: inventoryItems.reduce((sum, i) => sum + (Number(i.totalValue) || 0), 0)
    };
  }, [inventoryItems]);

  // 2. HANDLE QUANTITY UPDATE (The "Minus" button logic)
  const handleUpdateQty = (idOrName: string, delta: number) => {
    const updatedItems = inventoryItems.map((item) => {
      const isMatch = item.id ? item.id === idOrName : item.name === idOrName;
      if (isMatch) {
        const newQty = Math.max(0, item.quantity + delta);
        
        // Use Weighted Average to decrease value
        // If we have 3 chickens at $120 total, removing 1 chicken removes $40.
        const avgPrice = item.totalValue / (item.quantity || 1);
        const newValue = delta < 0 
          ? Math.max(0, item.totalValue - (avgPrice * Math.abs(delta)))
          : item.totalValue + (item.lastPrice * delta);

        return { ...item, quantity: newQty, totalValue: newValue };
      }
      return item;
    }).filter(i => i.quantity > 0); // Automatically remove if qty reaches 0

    onUpdateInventory(updatedItems);
  };

  // 3. THE MISSING REMOVE FUNCTION (Full Delete)
  const handleRemoveItem = (idOrName: string) => {
    if (confirm("Are you sure you want to remove this item from your inventory?")) {
      const filteredItems = inventoryItems.filter((item) => 
        item.id ? item.id !== idOrName : item.name !== idOrName
      );
      onUpdateInventory(filteredItems);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Items in Stock</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalQty}</p>
        </div>
        <div className="bg-blue-600 border border-blue-700 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-blue-100 font-medium">Total Inventory Value</p>
          <p className="text-3xl font-bold text-white mt-1">
            {userCurrency} {stats.totalValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Quantity</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Value ({userCurrency})</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryItems.map((item,index) => (
                <tr key={item.id || `item-${index}`} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 capitalize">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => handleUpdateQty(item.id || item.name, -1)}
                        className="p-1 hover:bg-slate-200 rounded-full transition"
                      >
                        <Minus size={16} className="text-slate-600" />
                      </button>
                      <span className="font-semibold min-w-[20px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.id || item.name, 1)}
                        className="p-1 hover:bg-slate-200 rounded-full transition"
                      >
                        <Plus size={16} className="text-slate-600" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {item.totalValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRemoveItem(item.id || item.name)}
                      className="p-2 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {inventoryItems.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">Your inventory is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}