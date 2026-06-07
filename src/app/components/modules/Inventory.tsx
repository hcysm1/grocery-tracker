"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Search, Pencil, Trash2, Check, X,
  AlertTriangle, Package, DollarSign, ShieldAlert,
  ChevronDown, Loader2,
} from "lucide-react";
import {
  addInventoryItemAction,
  updateInventoryItemAction,
  deleteInventoryItemAction,
  type InventoryItem,
  type NewInventoryItem,
} from "@/app/actions/inventory";

interface InventoryDashboardProps {
  receipts:         any[];
  userCurrency:     string;
  initialInventory: InventoryItem[];
}

const CATEGORIES = [
  "Fruits", "Vegetables", "Meat & Poultry", "Seafood",
  "Dairy & Eggs", "Bakery", "Beverages", "Snacks",
  "Frozen Foods", "Pantry & Condiments", "Household",
  "Personal Care", "Baby Products", "Cleaning Product", "Other",
];

function KpiCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 hover:shadow-md transition-shadow"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight break-all">{value}</div>
        <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

interface ModalProps {
  open: boolean; onClose: () => void;
  onSave: (item: NewInventoryItem) => Promise<void>;
  initial?: Partial<NewInventoryItem>; title: string;
}

function ItemModal({ open, onClose, onSave, initial, title }: ModalProps) {
  const [name,      setName]      = useState(initial?.name      ?? "");
  const [emoji,     setEmoji]     = useState(initial?.emoji     ?? "📦");
  const [category,  setCategory]  = useState(initial?.category  ?? "Other");
  const [quantity,  setQuantity]  = useState<number>(initial?.quantity  ?? 1);
  const [unit,      setUnit]      = useState(initial?.unit      ?? "pcs");
  const [price,     setPrice]     = useState<number>(initial?.price     ?? 0);
  const [threshold, setThreshold] = useState<number>(initial?.low_stock_threshold ?? 5);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setEmoji(initial?.emoji ?? "📦");
      setCategory(initial?.category ?? "Other");
      setQuantity(initial?.quantity ?? 1);
      setUnit(initial?.unit ?? "pcs");
      setPrice(initial?.price ?? 0);
      setThreshold(initial?.low_stock_threshold ?? 5);
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) { setError("Item name is required."); return; }
    setSaving(true);
    setError("");
    await onSave({
      product_id:          initial?.product_id ?? null,
      name:                name.trim(),
      emoji, category, quantity, unit, price,
      low_stock_threshold: threshold,
    });
    setSaving(false);
    onClose();
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B14F]/40 focus:border-[#00B14F] transition bg-slate-50/50 placeholder:text-slate-400";
  const labelCls = "block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet slides up from bottom on mobile, centered modal on sm+ */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh]">

        {/* Header — fixed, never scrolls */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
          {/* Drag handle on mobile */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200 sm:hidden" />
          <h2 className="font-bold text-slate-800 text-base sm:text-lg mt-2 sm:mt-0">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition mt-2 sm:mt-0">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Body — scrollable middle */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <label className={labelCls}>Icon</label>
              <input
                className="w-14 h-[42px] border border-slate-200 rounded-xl text-center text-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#00B14F]/40"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Item Name <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Full Cream Milk" value={name}
                onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-8`} value={category}
                onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" min={0} className={inputCls} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <input className={inputCls} placeholder="pcs / kg / L" value={unit}
                onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Unit Price</label>
              <input type="number" min={0} step={0.01} className={inputCls} value={price}
                onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Low Stock Alert ⚠</label>
              <input type="number" min={0} className={inputCls} placeholder="5" value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))} />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertTriangle size={11} />
            A warning badge appears when quantity drops below your Low Stock Alert value.
          </p>
        </div>

        {/* Footer — fixed, never scrolls */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryDashboard({
  receipts, userCurrency, initialInventory,
}: InventoryDashboardProps) {
  const [inventory,       setInventory]       = useState<InventoryItem[]>(initialInventory);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [modalInitial,    setModalInitial]    = useState<Partial<NewInventoryItem>>({});
  const [modalTitle,      setModalTitle]      = useState("Add Item");
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [editName,        setEditName]        = useState("");
  const [editQty,         setEditQty]         = useState<number>(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategory,  setFilterCategory]  = useState("All");
  const [actionError,     setActionError]     = useState("");

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const productSuggestions = useMemo(() => {
    const map = new Map<string, {
      name: string; emoji: string; category: string;
      unit: string; lastPrice: number; product_id: string | null;
    }>();
    receipts.forEach((r) => {
      (r.receipt_items || []).forEach((it: any) => {
        const p = it.products;
        const name = p?.name;
        if (!name) return;
        map.set(name, {
          name,
          emoji:      p?.emoji    ?? "📦",
          category:   p?.category ?? "Other",
          unit:       it.unit     ?? "pcs",
          lastPrice:  Number(it.unit_price) || 0,
          product_id: p?.id       ?? null,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [receipts]);

  const inventoryNames = useMemo(
    () => new Set(inventory.map((i) => i.name.toLowerCase())),
    [inventory]
  );

  const filteredSuggestions = useMemo(() =>
    searchTerm.trim() === ""
      ? productSuggestions
      : productSuggestions.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [productSuggestions, searchTerm]
  );

  const allCategories = useMemo(() => {
    const cats = new Set(inventory.map((i) => i.category));
    return ["All", ...Array.from(cats).sort()];
  }, [inventory]);

  const filteredInventory = useMemo(() =>
    inventory.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat    = filterCategory === "All" || item.category === filterCategory;
      return matchSearch && matchCat;
    }),
    [inventory, searchTerm, filterCategory]
  );

  const totalValue    = inventory.reduce((s, i) => s + i.price * i.quantity, 0);
  const lowStockCount = inventory.filter((i) => i.quantity <= i.low_stock_threshold).length;

  const openAddModal = (prefill: Partial<NewInventoryItem> = {}) => {
    setModalInitial(prefill);
    setModalTitle("Add Item");
    setModalOpen(true);
    setShowDropdown(false);
    setSearchTerm("");
    setActionError("");
  };

  const handleSaveNew = async (item: NewInventoryItem) => {
    const { data, error } = await addInventoryItemAction(item);
    if (error || !data) { setActionError(error ?? "Failed to add item"); return; }
    setInventory((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity);
    setDeleteConfirmId(null);
    setActionError("");
  };

  const cancelEdit = () => setEditingId(null);

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

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track stock levels for your household items</p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 sm:gap-2 hover:bg-slate-700 transition text-sm font-semibold shadow-sm flex-shrink-0"
        >
          <Plus size={15} /> <span className="hidden xs:inline">Add</span> Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="Total Items"  value={inventory.length}
          sub="Unique products tracked"    icon={<Package size={15}/>}    accent="#00B14F" />
        <KpiCard label="Total Value"  value={`${userCurrency} ${totalValue.toFixed(2)}`}
          sub="Estimated stock value"      icon={<DollarSign size={15}/>} accent="#10B981" />
        <KpiCard label="Low Stock"    value={lowStockCount}
          sub={lowStockCount === 0 ? "All stocked up!" : "Items need restocking"}
          icon={<ShieldAlert size={15}/>}
          accent={lowStockCount > 0 ? "#EF4444" : "#10B981"} />
      </div>

      {/* Banners */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={15} className="flex-shrink-0 text-red-500" />
          <span>
            <b>{lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} running low</b> — consider restocking soon.
          </span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")}><X size={16}/></button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-2.5 text-slate-400 z-10" size={17} />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00B14F]/40 focus:border-[#00B14F] transition"
            placeholder="Search inventory or add from receipts…"
            value={searchTerm}
            autoComplete="off"
            onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden max-h-72 overflow-y-auto">
              {filteredSuggestions.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-slate-500 mb-2">
                    No matches for <b>"{searchTerm}"</b> in your receipts.
                  </p>
                  <button
                    onClick={() => openAddModal({ name: searchTerm })}
                    className="w-full flex items-center gap-2 text-sm font-semibold text-[#00B14F] hover:bg-green-50 px-3 py-2 rounded-lg transition"
                  >
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
                      <button
                        key={p.name}
                        disabled={inInventory}
                        onClick={() => openAddModal({
                          product_id: p.product_id, name: p.name, emoji: p.emoji,
                          category: p.category, unit: p.unit, price: p.lastPrice,
                        })}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-default text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{p.emoji}</span>
                          <div>
                            <div className="text-sm font-medium text-slate-700">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.category}</div>
                          </div>
                        </div>
                        {inInventory ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">In inventory</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-green-50 text-[#00B14F] px-2 py-0.5 rounded-full">+ Add</span>
                        )}
                      </button>
                    );
                  })}
                  {searchTerm.trim() && (
                    <div className="border-t border-slate-100 px-4 py-2.5">
                      <button
                        onClick={() => openAddModal({ name: searchTerm })}
                        className="flex items-center gap-2 text-sm font-semibold text-[#00B14F] hover:bg-green-50 w-full px-2 py-1.5 rounded-lg transition"
                      >
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── TABLE — desktop only ──────────────────────────────────────────────── */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Item", "Category", "Stock", "Unit Price", "Value", "Actions"].map((h, i) => (
                <th key={h}
                  className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${i === 5 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Package size={36} className="text-slate-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">No items yet</p>
                      <p className="text-xs mt-0.5">
                        Search above to add from your receipts, or{" "}
                        <button onClick={() => openAddModal()} className="text-[#00B14F] underline">add manually</button>
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const isLow      = item.quantity <= item.low_stock_threshold;
                const isEditing  = editingId === item.id;
                const isDeleting = deleteConfirmId === item.id;
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/80 transition ${isLow ? "bg-red-50/40" : ""}`}>
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input autoFocus
                          className="border border-[#00B14F]/50 rounded-lg px-2.5 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-[#00B14F]/30"
                          value={editName} onChange={(e) => setEditName(e.target.value)} />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                            {item.emoji}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                            {isLow && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <AlertTriangle size={10} className="text-red-500" />
                                <span className="text-[10px] font-semibold text-red-500">Low stock</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 text-[#00B14F] border border-green-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input type="number" min={0}
                          className="border border-[#00B14F]/50 rounded-lg px-2.5 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-[#00B14F]/30"
                          value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isLow ? "text-red-500" : "text-slate-800"}`}>{item.quantity}</span>
                          <span className="text-xs text-slate-400">{item.unit}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(100, (item.quantity / Math.max(item.low_stock_threshold * 3, 1)) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-700 font-mono">{userCurrency} {item.price.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-slate-800 font-mono">{userCurrency} {(item.price * item.quantity).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => saveEdit(item)} className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"><Check size={15}/></button>
                          <button onClick={cancelEdit} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition"><X size={15}/></button>
                        </div>
                      ) : isDeleting ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-red-500 font-medium mr-1">Delete?</span>
                          <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition">Yes</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => startEdit(item)} className="p-1.5 hover:bg-green-50 text-slate-400 hover:text-[#00B14F] rounded-lg transition"><Pencil size={15}/></button>
                          <button onClick={() => { setDeleteConfirmId(item.id); setEditingId(null); }} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"><Trash2 size={15}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {filteredInventory.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">{filteredInventory.length} of {inventory.length} item{inventory.length !== 1 ? "s" : ""}</span>
            <span className="text-xs text-slate-400 font-mono">
              Total value: <span className="font-semibold text-slate-600">{userCurrency} {totalValue.toFixed(2)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── CARD LIST — mobile only ───────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {filteredInventory.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-14 text-center px-4">
            <Package size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No items yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Search above or{" "}
              <button onClick={() => openAddModal()} className="text-[#00B14F] underline">add manually</button>
            </p>
          </div>
        ) : (
          filteredInventory.map((item) => {
            const isLow      = item.quantity <= item.low_stock_threshold;
            const isEditing  = editingId === item.id;
            const isDeleting = deleteConfirmId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${
                  isLow ? "border-red-200 bg-red-50/30" : "border-slate-200"
                }`}
              >
                {/* Card top row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input autoFocus
                        className="border border-[#00B14F]/50 rounded-lg px-2.5 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#00B14F]/30 mb-1"
                        value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      <div className="text-sm font-semibold text-slate-800 truncate">{item.name}</div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-50 text-[#00B14F] border border-green-100">
                        {item.category}
                      </span>
                      {isLow && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500">
                          <AlertTriangle size={9} /> Low stock
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => saveEdit(item)} className="p-2 bg-green-50 text-green-600 rounded-xl"><Check size={15}/></button>
                        <button onClick={cancelEdit} className="p-2 bg-slate-50 text-slate-500 rounded-xl"><X size={15}/></button>
                      </div>
                    ) : isDeleting ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-xl">Yes</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(item)} className="p-2 hover:bg-green-50 text-slate-400 hover:text-[#00B14F] rounded-xl transition"><Pencil size={15}/></button>
                        <button onClick={() => { setDeleteConfirmId(item.id); setEditingId(null); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition"><Trash2 size={15}/></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card bottom — stock / price info */}
                <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input type="number" min={0}
                        className="border border-[#00B14F]/50 rounded-lg px-2 py-1 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-[#00B14F]/30"
                        value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} />
                    ) : (
                      <span className={`text-sm font-bold ${isLow ? "text-red-500" : "text-slate-800"}`}>{item.quantity}</span>
                    )}
                    <span className="text-xs text-slate-400">{item.unit}</span>
                    <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isLow ? "bg-red-400" : "bg-green-400"}`}
                        style={{ width: `${Math.min(100, (item.quantity / Math.max(item.low_stock_threshold * 3, 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">
                      {userCurrency} {item.price.toFixed(2)} / {item.unit}
                    </div>
                    <div className="text-sm font-semibold text-slate-800 font-mono">
                      {userCurrency} {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {filteredInventory.length > 0 && (
          <div className="text-center text-xs text-slate-400 py-1">
            {filteredInventory.length} of {inventory.length} item{inventory.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
            Total: <span className="font-semibold text-slate-600">{userCurrency} {totalValue.toFixed(2)}</span>
          </div>
        )}
      </div>

      <ItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveNew}
        initial={modalInitial}
        title={modalTitle}
      />
    </div>
  );
}
