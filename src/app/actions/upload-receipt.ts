"use server";

import { createClient } from "@/utils/supabase/server"; // Standard Supabase SSR helper
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function uploadReceiptAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("receipt") as File;

  if (!file) {
    return { error: "No image provided." };
  }

  try {
    // 1. Convert File to Buffer for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Prepare Gemini Model (using 1.5-flash for speed/cost)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze this grocery receipt. 
      1. Extract all items and their prices.
      2. Translate item names to English.
      3. Return ONLY a valid JSON object with this structure:
         {
           "store": "Store Name",
           "total": 0.00,
           "items": [
             {"name": "Item Name", "price": 0.00, "quantity": 1}
           ]
         }
      Do not include markdown formatting or extra text.
    `;

    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type,
      },
    };

    // 3. Call Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const extractedData = JSON.parse(responseText);

    // 4. Database Transaction Logic
    // Create the receipt record first
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        store_name: extractedData.store,
        total_amount: extractedData.total,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // 5. Match or Create Products & Add Items
    for (const item of extractedData.items) {
      // Check if product already exists (Case-insensitive)
      let { data: product } = await supabase
        .from("products")
        .select("id")
        .ilike("name", item.name)
        .single();

      // If it doesn't exist, create it
      if (!product) {
        const { data: newProduct, error: pError } = await supabase
          .from("products")
          .insert({ name: item.name })
          .select()
          .single();
        
        if (pError) console.error("Error creating product:", pError);
        product = newProduct;
      }

      // Record the specific price entry for this receipt
      if (product) {
        await supabase.from("receipt_items").insert({
          receipt_id: receipt.id,
          product_id: product.id,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }

    // Refresh the UI cache
    revalidatePath("/");
    
    return { 
      success: true, 
      extractedItems: extractedData.items 
    };

  } catch (error: any) {
    console.error("Action Error:", error);
    return { error: error.message || "Failed to process receipt." };
  }
}