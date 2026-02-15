"use client";

import { useState } from "react";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { uploadReceiptAction } from "@/app/actions/upload-receipt";
import imageCompression from "browser-image-compression";

interface ReceiptScannerProps {
  onReceiptAdded: (receipt: any) => void;
}

export default function ReceiptScanner({ onReceiptAdded }: ReceiptScannerProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [preview, setPreview] = useState<string | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    setStatusType("info");
    setStatus("Processing receipt...");

    try {
      setStatus("Compressing image...");
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      setStatus("Extracting data with AI...");
      const formData = new FormData();
      formData.append("receipt", compressedFile);

      const result = await uploadReceiptAction(formData);

      if (result.error) {
        setStatusType("error");
        setStatus("Error: " + result.error);
      } else {
        setStatusType("success");
        setStatus("✓ Receipt processed successfully!");
        setPreview(null);
        // Reset file input
        const fileInput = e.target;
        fileInput.value = "";
        // Call callback to notify parent of new receipt
        if (result.receipt) {
          onReceiptAdded(result.receipt);
        }
      }
    } catch (error) {
      setStatusType("error");
      setStatus("Error: Something went wrong processing the receipt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Scan Receipt</h2>
        <p className="text-slate-600">Upload a photo of your grocery receipt. Our AI will extract all items and prices automatically.</p>
      </div>

      {/* UPLOAD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UPLOAD AREA */}
        <div className="lg:col-span-2">
          <label className="block">
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer bg-white">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleUpload}
                disabled={loading}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center text-center">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="max-w-xs max-h-64 rounded-lg mb-4" />
                    <button
                      onClick={() => setPreview(null)}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 mb-4"
                    >
                      <X size={16} /> Change Image
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="text-lg font-semibold text-slate-900 mb-1">Upload Receipt</p>
                    <p className="text-sm text-slate-600">Drag and drop or click to select</p>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </label>

          {/* ALTERNATIVE BUTTON */}
          {!preview && (
            <div className="mt-4 flex gap-3">
              <label className="flex-1">
                <div className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload size={20} />
                  Upload File
                </div>
                <input type="file" accept="image/*" onChange={handleUpload} disabled={loading} className="hidden" />
              </label>
              <label className="flex-1">
                <div className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition">
                  <Camera size={20} />
                  Take Photo
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUpload}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* STATS CARD */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">📊 Quick Tips</h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span>Take photos in good lighting</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span>Keep receipt flat and straight</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span>Capture all items clearly</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span>Include store name and date</span>
            </li>
          </ul>
        </div>
      </div>

      {/* STATUS MESSAGE */}
      {status && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 border ${
            statusType === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : statusType === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {statusType === "success" ? (
            <CheckCircle className="flex-shrink-0" size={20} />
          ) : statusType === "error" ? (
            <AlertCircle className="flex-shrink-0" size={20} />
          ) : (
            <Loader2 className="animate-spin flex-shrink-0" size={20} />
          )}
          <p className="font-medium">{status}</p>
        </div>
      )}
    </div>
  );
}
