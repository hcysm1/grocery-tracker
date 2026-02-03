"use client";
import { useState } from "react";
import { uploadReceiptAction } from "./actions/upload-receipt";
import { Camera, Loader2, CheckCircle, UploadCloud, BrainCircuit } from "lucide-react";
import imageCompression from 'browser-image-compression';

export default function GroceryTracker() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;
    
    setLoading(true);
    
    try {
      setStatus("Compressing image...");
      const compressedFile = await imageCompression(originalFile, {
        maxSizeMB: 0.8, // Aim for under 1MB
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
        <label className={`cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2 text-white ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}>
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
      
      {/* Table goes here */}
    </main>
  );
}