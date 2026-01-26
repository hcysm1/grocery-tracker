"use client";
import { useState } from 'react';


export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    console.log("Processing receipt...");
    
    // 1. We will add Gemini AI logic here next!
    // 2. We will add Supabase saving logic here next!
    
    setLoading(false);
    alert("Receipt processed!");
  };

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">AI Grocery Tracker</h1>
      
      <div className="border-2 border-dashed border-gray-300 p-10 rounded-lg">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleUpload}
          className="block w-full text-sm"
        />
        <p className="mt-2 text-gray-500">Snap a photo of your receipt</p>
      </div>

      {loading && <p className="mt-4 animate-pulse text-blue-600">Gemini is thinking...</p>}
    </main>
  );
}