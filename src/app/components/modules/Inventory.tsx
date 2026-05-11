"use client";

import { useState, useMemo } from "react";
import { StatsCard } from './StatsCard';
import { Plus, Minus, Edit2, Trash2, Package, Search, ChevronRight, ChevronLeft, AlertTriangle, DollarSign, TrendingUp} from "lucide-react";

export default function InventoryDashboard({ receipts, userCurrency }: any) {
  // 1. Setup your state
  const [inventory, setInventory] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(2026);

  // 2. Logic to process receipts into inventory 
  // Tip: Use useMemo or useEffect to group receipt_items by name
  const processedData = useMemo(() => {
    // Your logic here: 
    // Loop through receipts -> receipt_items -> sum quantities by name
    return []; 
  }, [receipts]);



  // Action Handlers (To be written by you)
  const handleAdd = () => { /* Logic to push a new object to inventory */ };
  const updateQty = (id: string, delta: number) => { /* Map and update qty */ };
  const handleDelete = (id: string) => { /* Filter out the id */ };

  // Format the date for the UI (e.g., "December 2023")
  const displayDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // handle previous buttons
  const handlePreviousMonth = () => {
      setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  //handle next buttons
  const handleNextMonth = () => {
      setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Track and manage your inventory</p>   
        </div>
         <button className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition">
          <Plus size={18} />
          Add Item
         </button>
      </div>

   
     

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          className="w-full pl-10 pr-4 py-2 border rounded-xl" 
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Inventory Table/List */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Item</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Map through your inventory state here */}
            <tr className="hover:bg-slate-50">
               {/* Example Row Cell:
                  <td className="px-6 py-4">Item Name</td>
                  <td className="px-6 py-4 flex gap-2">+/- buttons</td>
                  <td className="px-6 py-4 text-right">Edit/Delete buttons</td>
               */}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}