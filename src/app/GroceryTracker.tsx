"use client";
import { useState } from "react";
import { uploadReceiptAction } from "./actions/upload-receipt";
import { Camera, Loader2, CheckCircle} from "lucide-react";
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
        // Note: revalidatePath("/") in your action will update the 'receipts' prop automatically
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
        <label className={`cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2 text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
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
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700">Recent History</h2>
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Store</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Items</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts?.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 text-slate-500">
                    {new Date(receipt.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {receipt.store_name}
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                       {receipt.receipt_items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-blue-600">
                    ${receipt.total_amount?.toFixed(2)}
                  </td>
                </tr>
              ))}
              {(!receipts || receipts.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    No receipts found. Start by scanning one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}