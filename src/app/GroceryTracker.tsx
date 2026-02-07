"use client";
import { useState } from "react";
import { uploadReceiptAction } from "./actions/upload-receipt";
import { Camera, Loader2, CheckCircle } from "lucide-react";
import imageCompression from 'browser-image-compression';

export default function GroceryTracker({ receipts }: { receipts: any[] }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setLoading(true);
    try {
      setStatus("Compressing image...");
      const compressedFile = await imageCompression(originalFile, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      setStatus("Uploading & Analyzing...");
      const formData = new FormData();
      formData.append("receipt", compressedFile);

      const result = await uploadReceiptAction(formData);

      if (result.error) {
        setStatus("Error: " + result.error);
      } else {
        setStatus("Receipt processed successfully!");
      }
    } catch (error) {
      setStatus("Error: Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center border-b pb-6">
        <h1 className="text-3xl font-bold text-slate-800">Smart Grocery Tracker</h1>
        <label className={`cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2 text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
          <span>{loading ? "Processing..." : "Scan Receipt"}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} disabled={loading} />
        </label>
      </header>

      {status && (
        <div className={`p-4 rounded-md flex items-center gap-3 border ${status.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
          {status.includes("successfully") ? <CheckCircle className="text-green-600" /> : <Loader2 className="animate-spin" />}
          <p className="text-sm font-medium">{status}</p>
        </div>
      )}

      <div className="space-y-10">
        {receipts?.map((receipt) => (
          <div key={receipt.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
            
            {/* RECEIPT HEADER DETAILS */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-wrap justify-between items-end gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store & Date</p>
                <h2 className="text-xl font-bold text-slate-800">{receipt.store_name}</h2>
                <p className="text-sm text-slate-500">
                  {new Date(receipt.created_at).toLocaleDateString('en-US', { 
                    month: 'long', day: 'numeric', year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
                <p className="text-3xl font-black text-blue-600">
                  ${receipt.total_amount?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* ITEM BREAKDOWN TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100 bg-white">
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold text-center">Quantity</th>
                    <th className="px-6 py-4 font-semibold">Price/Unit</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Item Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {receipt.receipt_items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-700 capitalize">
                        {item.products?.name}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        ${item.price?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {/* Logic: Price * Quantity */}
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {(!receipts || receipts.length === 0) && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
            No receipts found. Upload your first grocery bill to start tracking!
          </div>
        )}
      </div>
    </main>
  );
}