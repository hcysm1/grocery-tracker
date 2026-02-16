"use client";

import { useMemo, useState } from "react";
import { 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";

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
  // --- State for Manual Adding ---
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");

  // --- State for Inline Editing ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // --- Calculations ---
  const stats = useMemo(() => {
    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + (Number(item.quantity) * Number(item.lastPrice)), 
      0
    );
    return {
      totalLots: inventoryItems.length,
      totalUnits: inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue
    };
  }, [inventoryItems]);

  // --- Handlers ---
  const handleUpdateQty = (item: InventoryItem, delta: number) => {
    const updated = inventoryItems.map((i) => {
      // Since we now use Name + Price as a unique pair, 
      // we match by ID or the Name+Price combo
      const isMatch = i.id ? i.id === item.id : (i.name === item.name && i.lastPrice === item.lastPrice);
      if (isMatch) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0);
    
    onUpdateInventory(updated);
  };

  const handleManualAdd = () => {
    if (!newItemName || !newItemPrice) return;

    const priceNum = Number(newItemPrice);
    const qtyNum = Number(newItemQty);

    // Check if this specific Name + Price combo already exists
    const existingIndex = inventoryItems.findIndex(
      (i) => i.name.toLowerCase() === newItemName.toLowerCase() && i.lastPrice === priceNum
    );

    if (existingIndex > -1) {
      const updated = [...inventoryItems];
      updated[existingIndex].quantity += qtyNum;
      onUpdateInventory(updated);
    } else {
      onUpdateInventory([
        ...inventoryItems,
        {
          name: newItemName.trim(),
          quantity: qtyNum,
          lastPrice: priceNum,
          lastBought: new Date().toISOString(),
          frequency: 1,
        },
      ]);
    }

    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const startEditing = (item: InventoryItem) => {
    setEditingId(item.id || `${item.name}-${item.lastPrice}`);
    setEditingName(item.name);
  };

  const saveEdit = (item: InventoryItem) => {
    const updated = inventoryItems.map((i) => {
      const isMatch = i.id ? i.id === item.id : (i.name === item.name && i.lastPrice === item.lastPrice);
      return isMatch ? { ...i, name: editingName.trim() } : i;
    });
    onUpdateInventory(updated);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kitchen Inventory</h2>
          <p className="text-slate-500 text-sm">Tracking items by name and purchase price batch.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Value</p>
            <p className="text-xl font-bold text-blue-600">
              {userCurrency} {stats.totalValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Unique Lots</p>
            <p className="text-xl font-bold text-slate-800">{stats.totalLots}</p>
          </div>
        </div>
      </div>

      {/* QUICK ADD TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Name</label>
          <input 
            type="text" 
            placeholder="e.g. Boneless Chicken"
            className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
        </div>
        <div className="w-24">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price</label>
          <input 
            type="number" 
            placeholder="0.00"
            className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
          />
        </div>
        <div className="w-20">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
          <input 
            type="number" 
            className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
          />
        </div>
        <button 
          onClick={handleManualAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition shadow-md shadow-blue-100"
        >
          <Plus size={20} />
        </button>
      </div>

      

      {/* INVENTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Batch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">In Stock</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Unit Price</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Total Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryItems.map((item) => {
                const currentId = item.id || `${item.name}-${item.lastPrice}`;
                const isEditing = editingId === currentId;

                return (
                  <tr key={currentId} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input 
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="border-b-2 border-blue-500 outline-none text-sm font-medium py-1 w-full"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(item)} className="text-green-600"><Check size={18}/></button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400"><X size={18}/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <button 
                            onClick={() => startEditing(item)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-500 transition"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <TrendingUp size={10} /> Bought {item.frequency} times
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => handleUpdateQty(item, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(item, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                      {item.lastPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">
                        {(item.quantity * item.lastPrice).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleUpdateQty(item, -item.quantity)}
                        className="text-slate-200 hover:text-red-500 transition p-2"
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
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Package size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-sm">No items in stock. Start by scanning a receipt.</p>
          </div>
        )}
      </div>

      {/* MATH EXPLANATION FOOTER */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Batch Logic Active:</strong> This list tracks items by their purchase price. 
          If you bought "Boneless Chicken" at {userCurrency}10.00 and later at {userCurrency}12.00, they are listed 
          separately to ensure your <strong>Total Stock Value</strong> exactly matches your receipt history.
        </p>
      </div>
    </div>
  );
}