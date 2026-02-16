"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Minus, AlertCircle, Trash2, Edit, Check, X } from "lucide-react";

interface InventoryItem {
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

export default function Inventory({ receipts, userCurrency, inventoryItems, onUpdateInventory }: InventoryProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const suggestedItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; frequency: number; lastPrice: number; lastDate: string }>();

    receipts.forEach((receipt) => {
      receipt.receipt_items?.forEach((item: any) => {
        const name = item.products?.name || "Unknown";
        if (!itemMap.has(name)) {
          itemMap.set(name, {
            name,
            frequency: 0,
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
      .slice(0, 10);
  }, [receipts]);

  const handleAddItem = (name: string = newItemName, qty: number = parseInt(newItemQty)) => {
    if (!name.trim()) return;

    const existing = inventoryItems.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onUpdateInventory(
        inventoryItems.map((i) =>
          i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
        )
      );
    } else {
      const suggested = suggestedItems.find((s) => s.name.toLowerCase() === name.toLowerCase());
      onUpdateInventory([
        ...inventoryItems,
        {
          name,
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

  const handleUpdateQty = (name: string, delta: number) => {
    onUpdateInventory(
      inventoryItems
        .map((i) => (i.name === name ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (name: string) => {
    onUpdateInventory(inventoryItems.filter((i) => i.name !== name));
  };

  const handleEditItem = (name: string) => {
    setEditingItem(name);
    setEditingName(name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim() || !editingItem) return;
    const trimmedName = editingName.trim();
    // Check if name already exists (excluding the current item)
    const nameExists = inventoryItems.some(item => item.name.toLowerCase() === trimmedName.toLowerCase() && item.name !== editingItem);
    if (nameExists) {
      alert("An item with this name already exists.");
      return;
    }
    onUpdateInventory(
      inventoryItems.map(item =>
        item.name === editingItem ? { ...item, name: trimmedName } : item
      )
    );
    setEditingItem(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingName("");
  };

  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.lastPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h2>
        <p className="text-slate-600">Track items at home and plan your shopping</p>
      </div>

      {/* ADD ITEM SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-bold text-slate-900 mb-4">Add Item to Inventory</h3>
        <div className="flex gap-3 flex-col md:flex-row">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Item name..."
            onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            placeholder="Qty"
            min="1"
            onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
            className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleAddItem()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {/* INVENTORY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-semibold">Total Items</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{inventoryItems.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-semibold">Total Quantity</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{inventoryItems.reduce((sum, i) => sum + i.quantity, 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-semibold">Estimated Value</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{userCurrency} {totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* CURRENT INVENTORY */}
      {inventoryItems.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Item</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Quantity</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Last Price</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Total Value</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventoryItems.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {editingItem === item.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 hover:bg-green-100 text-green-600 rounded transition"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{item.name}</span>
                        <button
                          onClick={() => handleEditItem(item.name)}
                          className="p-1 hover:bg-blue-100 text-blue-600 rounded transition"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleUpdateQty(item.name, -1)}
                        className="p-1 hover:bg-slate-200 rounded transition"
                      >
                        <Minus size={16} className="text-slate-600" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.name, 1)}
                        className="p-1 hover:bg-slate-200 rounded transition"
                      >
                        <Plus size={16} className="text-slate-600" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700">
                    {userCurrency} {(item.lastPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">
                    {userCurrency} {((item.quantity || 0) * (item.lastPrice || 0)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleRemoveItem(item.name)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-lg">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No items in inventory. Add your first item above.</p>
        </div>
      )}

      {/* SUGGESTED ITEMS */}
      {suggestedItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">💡 Suggested Items Based on History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleAddItem(item.name, 1)}
                className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
              >
                <p className="font-medium text-slate-900 capitalize">{item.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Bought {item.frequency || 0} times • {userCurrency} {(item.lastPrice || 0).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
