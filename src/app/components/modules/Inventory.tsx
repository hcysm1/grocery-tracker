"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Minus, Trash2, Edit, Check, X, Info } from "lucide-react";

interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  lastPrice: number;
  lastBought: string;
  frequency: number;
}

interface InventoryProps {
  receipts: any[];
  userCurrency: string;
  inventoryItems: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
}

export default function Inventory({ 
  receipts, 
  userCurrency, 
  inventoryItems, 
  onUpdateInventory 
}: InventoryProps) {
  // Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  
  // Editing State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  /**
   * 1. SUGGESTED ITEMS LOGIC
   * Groups receipt items by product name, filtering out discounts and service charges.
   */
  const suggestedItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; frequency: number; lastPrice: number; lastDate: string }>();

    receipts.forEach((receipt) => {
      receipt.receipt_items?.forEach((item: any) => {
        const name = item.products?.name || "Unknown";
        
        // Filter out non-inventory entries
        if (
          name.toLowerCase().includes('discount') || 
          name.toLowerCase().includes('service charge') ||
          (item.price || 0) < 0
        ) return;

        if (!itemMap.has(name)) {
          itemMap.set(name, {
            name,
            frequency: 1,
            lastPrice: item.price || 0,
            lastDate: receipt.created_at,
          });
        } else {
          const current = itemMap.get(name)!;
          current.frequency += 1;
          current.lastPrice = item.price || current.lastPrice;
          current.lastDate = receipt.created_at;
        }
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);
  }, [receipts]);

  /**
   * 2. INVENTORY CALCULATIONS
   * Total value is derived from actual stock (Qty * Last Price).
   */
  const stats = useMemo(() => {
    return {
      totalItems: inventoryItems.length,
      totalQty: inventoryItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
      totalValue: inventoryItems.reduce((sum, i) => sum + ((i.quantity || 0) * (i.lastPrice || 0)), 0)
    };
  }, [inventoryItems]);

  /**
   * 3. ACTION HANDLERS
   */
  const handleAddItem = (name: string = newItemName, qty: number = parseInt(newItemQty)) => {
    if (!name.trim()) return;

    const existing = inventoryItems.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());
    
    if (existing) {
      onUpdateInventory(
        inventoryItems.map((i) =>
          i.name.toLowerCase() === name.trim().toLowerCase() 
            ? { ...i, quantity: i.quantity + qty } 
            : i
        )
      );
    } else {
      const suggested = suggestedItems.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
      onUpdateInventory([
        ...inventoryItems,
        {
          name: name.trim(),
          quantity: qty,
          lastPrice: suggested?.lastPrice || 0,
          lastBought: suggested?.lastDate || new Date().toISOString(),
          frequency: suggested?.frequency || 0,
        },
      ]);
    }

    setNewItemName("");
    setNewItemQty("1");
  };

  const handleUpdateQty = (idOrName: string, delta: number) => {
    onUpdateInventory(
      inventoryItems
        .map((i) => {
          const isMatch = i.id ? i.id === idOrName : i.name === idOrName;
          return isMatch ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (idOrName: string) => {
    onUpdateInventory(inventoryItems.filter((i) => (i.id ? i.id !== idOrName : i.name !== idOrName)));
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItemId(item.id || item.name); // Fallback to name if ID isn't synced yet
    setEditingName(item.name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim() || !editingItemId) return;
    
    onUpdateInventory(
      inventoryItems.map((item) => {
        const isMatch = item.id ? item.id === editingItemId : item.name === editingItemId;
        return isMatch ? { ...item, name: editingName.trim() } : item;
      })
    );
    
    setEditingItemId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Inventory</h2>
        <p className="text-slate-600">Items currently in your kitchen</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Unique Items</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalItems}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Quantity</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalQty}</p>
        </div>
        <div className="bg-blue-600 border border-blue-700 rounded-xl p-5 shadow-sm shadow-blue-100">
          <p className="text-sm text-blue-100 font-medium">Estimated Stock Value</p>
          <p className="text-3xl font-bold text-white mt-1">
            {userCurrency} {stats.totalValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ADD ITEM SECTION */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex gap-3 flex-col md:flex-row items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Fresh Milk"
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-sm font-medium text-slate-700 mb-1">Qty</label>
            <input
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              min="1"
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none"
            />
          </div>
          <button
            onClick={() => handleAddItem()}
            className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Item</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Quantity</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Price ({userCurrency})</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryItems.map((item) => {
                const isEditing = editingItemId === (item.id || item.name);
                return (
                  <tr key={item.id || item.name} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 border border-blue-400 rounded outline-none w-full"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <button onClick={handleSaveEdit} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={18}/></button>
                          <button onClick={() => setEditingItemId(null)} className="text-red-600 p-1 hover:bg-red-50 rounded"><X size={18}/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="font-medium text-slate-900 capitalize">{item.name}</span>
                          <button 
                            onClick={() => handleEditItem(item)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleUpdateQty(item.id || item.name, -1)}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-100 text-slate-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id || item.name, 1)}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-100 text-slate-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {(item.lastPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {((item.quantity || 0) * (item.lastPrice || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleRemoveItem(item.id || item.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      {/* SUGGESTED ITEMS */}
      {suggestedItems.length > 0 && (
        <div className="pt-4">
          <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
            <Info size={18} className="text-blue-500" />
            From Your Recent Purchases
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {suggestedItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleAddItem(item.name, 1)}
                className="p-3 text-left border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <p className="font-semibold text-slate-800 text-sm capitalize group-hover:text-blue-700">{item.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Last: {userCurrency}{item.lastPrice.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}