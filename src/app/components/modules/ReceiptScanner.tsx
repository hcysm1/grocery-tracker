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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
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
        const fileInput = e.target;
        fileInput.value = "";
        if (result.receipt) onReceiptAdded(result.receipt);
      }
    } catch {
      setStatusType("error");
      setStatus("Error: Something went wrong processing the receipt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Scan Receipt</h2>
        <p className="text-slate-500 text-sm">Upload a photo of your grocery receipt.</p>
      </div>

      {/* Upload + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Upload area */}
        <div className="lg:col-span-2 space-y-3">
          <label className="block">
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 hover:border-[#00B14F] hover:bg-green-50 transition cursor-pointer bg-white">
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
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-[260px] sm:max-w-xs max-h-60 sm:max-h-64 rounded-xl mb-4 shadow-sm"
                    />
                    <button
                      onClick={() => setPreview(null)}
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition"
                    >
                      <X size={15} /> Change Image
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                      <Camera className="text-slate-400" size={28} />
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Upload Receipt</p>
                    <p className="text-sm text-slate-500">Tap to select or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1.5">JPG, PNG up to 5 MB</p>
                  </>
                )}
              </div>
            </div>
          </label>

          {/* Action buttons */}
          {!preview && (
            <div className="grid grid-cols-2 gap-3">
              <label>
                <div className="bg-[#00B14F] hover:bg-[#009944] active:bg-[#007a3a] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition text-sm">
                  <Upload size={18} /> Upload File
                </div>
                <input type="file" accept="image/*" onChange={handleUpload} disabled={loading} className="hidden" />
              </label>
              <label>
                <div className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition text-sm">
                  <Camera size={18} /> Take Photo
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

        {/* Tips card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm">📊 Quick Tips</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            {[
              "Take photos in good lighting",
              "Keep receipt flat and straight",
              "Capture all items clearly",
              "Include store name and date",
            ].map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-[#00B14F] flex-shrink-0">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm ${
            statusType === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : statusType === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-[#00B14F]"
          }`}
        >
          {statusType === "success" ? (
            <CheckCircle className="flex-shrink-0" size={18} />
          ) : statusType === "error" ? (
            <AlertCircle className="flex-shrink-0" size={18} />
          ) : (
            <Loader2 className="animate-spin flex-shrink-0" size={18} />
          )}
          <p className="font-medium">{status}</p>
        </div>
      )}
    </div>
  );
}
