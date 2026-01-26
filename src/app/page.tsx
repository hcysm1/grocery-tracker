"use client";
import { useState } from "react";
import { uploadReceiptAction } from "./actions/upload-receipt";
import { Camera, Loader2, CheckCircle } from "lucide-react";

export default function GroceryTracker() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    
    setLoading(true);
    setStatus("Reading receipt with AI...");
    
    const formData = new FormData();
    formData.append("receipt", e.target.files[0]);

    const result = await uploadReceiptAction(formData);

    if (result.error) {
      setStatus("Error: " + result.error);
    } else {
      setStatus("Receipt processed successfully!");
    }
    setLoading(false);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center border-b pb-6">
        <h1 className="text-3xl font-bold text-slate-800">Smart Grocery Tracker</h1>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
          <span>{loading ? "Processing..." : "Scan Receipt"}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
        </label>
      </header>

      {status && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${status.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {status.includes("successfully") && <CheckCircle size={18} />}
          <p className="text-sm font-medium">{status}</p>
        </div>
      )}

      {/* Table section would go here, fetching data from Supabase */}
      <section className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b font-semibold text-slate-700">Recent Price Tracking</div>
        <div className="p-12 text-center text-slate-400">
           Scan a receipt to start tracking price trends.
        </div>
      </section>
    </main>
  );
}