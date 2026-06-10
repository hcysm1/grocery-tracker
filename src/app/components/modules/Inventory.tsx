"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Search, Pencil, Trash2, Check, X,
  AlertTriangle, Package, ShieldAlert, ChevronDown,
} from "lucide-react";
import {
  addInventoryItemAction,
  updateInventoryItemAction,
  deleteInventoryItemAction,
  type InventoryItem,
  type NewInventoryItem,
} from "@/app/actions/inventory";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

interface Props {
  receipts: any[];
  initialInventory: InventoryItem[];
}

const CATEGORIES = [
  "Fruits", "Vegetables", "Meat & Poultry", "Seafood",
  "Dairy & Eggs", "Bakery", "Beverages", "Snacks",
  "Frozen Foods", "Pantry & Condiments", "Household",
  "Personal Care", "Baby Products", "Cleaning Product", "Other",
];

const MODAL_DEFAULTS = { name: "", category: "Other", quantity: 1, unit: "pcs", low_stock_threshold: 5 };

const INPUT_CLS = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B14F]/40 focus:border-[#00B14F] transition bg-slate-50/50 placeholder:text-slate-400";
const LABEL_CLS = "block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5";
const EDIT_INPUT_CLS = "border border-[#00B14F]/50 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B14F]/30";

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-14 text-center px-4">
      <Package size={32} className="text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-600">No items yet</p>
      <p className="text-xs text-slate-400 mt-1">
        Search above or{" "}
        <button onClick={onAdd} className="text-[#00B14F] underline font-medium">add manually</button>
      </p>
    </div>
  );
}

function RowActions({ isEditing, isDeleting, onEdit, onSave, onCancel, onDeleteIntent, onDeleteConfirm }: {
  isEditing: boolean; isDeleting: boolean;
  onEdit: () => void; onSave: () => void; onCancel: () => void;
  onDeleteIntent: () => void; onDeleteConfirm: () => void;
}) {
  if (isEditing) return (
    <div className="flex items-center gap-1.5">
      <button onClick={onSave} className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"><Check size={15} /></button>
      <button onClick={onCancel} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition"><X size={15} /></button>
    </div>
  );
  if (isDeleting) return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-red-500 font-medium">Delete?</span>
      <button onClick={onDeleteConfirm} className="px-2.5 py-1 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition">Yes</button>
      <button onClick={onCancel} className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition">No</button>
    </div>
  );
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-1.5 hover:bg-green-50 text-slate-400 hover:text-[#00B14F] rounded-lg transition"><Pencil size={15} /></button>
      <button onClick={onDeleteIntent} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"><Trash2 size={15} /></button>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function ItemModal({ open, onClose, onSave, initial = {} }: {
  open: boolean; onClose: () => void;
  onSave: (item: NewInventoryItem) => Promise<void>;
  initial?: Partial<NewInventoryItem>;
}) {
  const [fields, setFields] = useState({ ...MODAL_DEFAULTS, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setFields({ ...MODAL_DEFAULTS, ...initial }); setError(""); }
  }, [open, initial]);

  if (!open) return null;

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));

  const handleSave = async () => {
    if (!fields.name.trim()) { setError("Item name is required."); return; }
    setSaving(true);
    await onSave({ ...fields, name: fields.name.trim(), emoji: "📦", price: 0, product_id: initial?.product_id ?? null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-16 flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl sm:max-w-md sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full"
        style={{ maxHeight: "calc(100svh - 80px)" }}
      >
        <div className="flex-shrink-0 flex justify-center pt-2.5 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-slate-300" />
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">Add Item</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
          <div>
            <label className={LABEL_CLS}>Name <span className="text-red-400">*</span></label>
            <input className={INPUT_CLS} placeholder="e.g. Full Cream Milk" value={fields.name} onChange={set("name")} />
          </div>
          <div>
            <label className={LABEL_CLS}>Category</label>
            <div className="relative">
              <select className={`${INPUT_CLS} appearance-none pr-8`} value={fields.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>Quantity</label>
              <input type="number" min={0} className={INPUT_CLS} value={fields.quantity} onChange={set("quantity")} />
            </div>
            <div>
              <label className={LABEL_CLS}>Unit</label>
              <input className={INPUT_CLS} placeholder="pcs / kg / L" value={fields.unit} onChange={set("unit")} />
            </div>
            <div className="col-span-2">
              <label className={LABEL_CLS}>Low Stock ⚠</label>
              <input type="number" min={0} className={INPUT_CLS} value={fields.low_stock_threshold} onChange={set("low_stock_threshold")} />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button onClick={onClose} className="py-2.5 px-5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
          <button
            onClick={handleSave} disabled={saving || !fields.name.trim()}
            className="py-2.5 px-5 text-sm font-semibold bg-[#00B14F] hover:bg-[#009944] text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function InventoryDashboard({ receipts, initialInventory }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<Partial<NewInventoryItem>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [actionError, setActionError] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── DERIVED DATA ─────────────────────────────────────────────────────────────

  const productSuggestions = useMemo(() => {
    const map = new Map<string, { name: string; category: string; unit: string; product_id: string | null }>();
    receipts.forEach((r) =>
      (r.receipt_items || []).forEach((it: any) => {
        const p = it.products;
        if (!p?.name) return;
        map.set(p.name, {
          name: p.name, category: p.category ?? "Other",
          unit: it.unit ?? "pcs", product_id: p.id ?? null,
        });
      })
    );
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [receipts]);

  const inventoryNames = useMemo(() => new Set(inventory.map((i) => i.name.toLowerCase())), [inventory]);
  const allCategories = useMemo(() => ["All", ...Array.from(new Set(inventory.map((i) => i.category))).sort()], [inventory]);
  const filteredSuggestions = useMemo(() =>
    productSuggestions.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [productSuggestions, searchTerm]);
  const filteredInventory = useMemo(() =>
    inventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === "All" || item.category === filterCategory)
    ), [inventory, searchTerm, filterCategory]);

  const lowStockCount = inventory.filter((i) => i.quantity <= i.low_stock_threshold).length;

  // ── HANDLERS ─────────────────────────────────────────────────────────────────

  const openAddModal = (prefill: Partial<NewInventoryItem> = {}) => {
    setModalInitial(prefill);
    setModalOpen(true);
    setShowDropdown(false);
    setSearchTerm("");
    setActionError("");
  };

  const cancelEdit = () => { setEditingId(null); setDeleteConfirmId(null); };

  const handleSaveNew = async (item: NewInventoryItem) => {
    const { data, error } = await addInventoryItemAction(item);
    if (error || !data) { setActionError(error ?? "Failed to add item"); return; }
    setInventory((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id); setEditName(item.name); setEditQty(item.quantity); setDeleteConfirmId(null);
  };

  const saveEdit = async (item: InventoryItem) => {
    const patch = { name: editName.trim() || item.name, quantity: editQty };
    const { error } = await updateInventoryItemAction(item.id, patch);
    if (error) { setActionError(error); return; }
    setInventory((prev) => prev.map((i) => i.id === item.id ? { ...i, ...patch } : i));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteInventoryItemAction(id);
    if (error) { setActionError(error); return; }
    setInventory((prev) => prev.filter((i) => i.id !== id));
    setDeleteConfirmId(null);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track stock levels for your household items</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold">
              <ShieldAlert size={14} className="text-red-500" />
              {lowStockCount} low stock
            </div>
          )}
          <button onClick={() => openAddModal()} className="bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-slate-700 transition text-sm font-semibold shadow-sm">
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2"><AlertTriangle size={15} className="flex-shrink-0" />{actionError}</div>
          <button onClick={() => setActionError("")}><X size={16} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-2.5 text-slate-400 z-10" size={17} />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00B14F]/40 focus:border-[#00B14F] transition"
            placeholder="Search inventory or add from receipts…"
            value={searchTerm} autoComplete="off"
            onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden max-h-72 overflow-y-auto">
              {filteredSuggestions.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-slate-500 mb-2">No matches for <b>"{searchTerm}"</b> in your receipts.</p>
                  <button onClick={() => openAddModal({ name: searchTerm })} className="w-full flex items-center gap-2 text-sm font-semibold text-[#00B14F] hover:bg-green-50 px-3 py-2 rounded-lg transition">
                    <Plus size={14} /> Create "{searchTerm}" as new item
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From your receipts</p>
                  </div>
                  {filteredSuggestions.map((p) => {
                    const inInventory = inventoryNames.has(p.name.toLowerCase());
                    return (
                      <button key={p.name} disabled={inInventory}
                        onClick={() => openAddModal({ product_id: p.product_id, name: p.name, category: p.category, unit: p.unit })}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition disabled:opacity-40 text-left">
                        <div>
                          <div className="text-sm font-medium text-slate-700">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.category}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inInventory ? "bg-slate-100 text-slate-400" : "bg-green-50 text-[#00B14F]"}`}>
                          {inInventory ? "In inventory" : "+ Add"}
                        </span>
                      </button>
                    );
                  })}
                  {searchTerm.trim() && (
                    <div className="border-t border-slate-100 px-4 py-2.5">
                      <button onClick={() => openAddModal({ name: searchTerm })} className="flex items-center gap-2 text-sm font-semibold text-[#00B14F] hover:bg-green-50 w-full px-2 py-1.5 rounded-lg transition">
                        <Plus size={13} /> Create "{searchTerm}" as new item
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <select
            className="appearance-none border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00B14F]/40 focus:border-[#00B14F] transition text-slate-700 w-full sm:w-auto"
            value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 sm:px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Item</th>
              <th className="px-4 sm:px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Stock</th>
              <th className="px-4 sm:px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-12"><EmptyState onAdd={() => openAddModal()} /></td></tr>
            ) : filteredInventory.map((item) => {
              const isLow = item.quantity <= item.low_stock_threshold;
              const isEditing = editingId === item.id;
              const isDeleting = deleteConfirmId === item.id;
              return (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition ${isLow ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 sm:px-5 py-3.5">
                    {isEditing
                      ? <input autoFocus className={`${EDIT_INPUT_CLS} w-32 sm:w-40`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                      : (
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                          {isLow && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={10} className="text-red-500" />
                              <span className="text-[10px] font-semibold text-red-500">Low stock</span>
                            </div>
                          )}
                        </div>
                      )
                    }
                  </td>
                  <td className="px-4 sm:px-5 py-3.5">
                    {isEditing
                      ? <input type="number" min={0} className={`${EDIT_INPUT_CLS} w-16 sm:w-20`} value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} />
                      : (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isLow ? "text-red-500" : "text-slate-800"}`}>{item.quantity}</span>
                          <span className="text-xs text-slate-400">{item.unit}</span>
                        </div>
                      )
                    }
                  </td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="flex justify-end">
                      <RowActions
                        isEditing={isEditing} isDeleting={isDeleting}
                        onEdit={() => startEdit(item)} onSave={() => saveEdit(item)} onCancel={cancelEdit}
                        onDeleteIntent={() => { setDeleteConfirmId(item.id); setEditingId(null); }}
                        onDeleteConfirm={() => handleDelete(item.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ItemModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveNew} initial={modalInitial} />
    </div>
  );
}
