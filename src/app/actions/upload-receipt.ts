"use server";

import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function uploadReceiptAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("receipt") as File;

  if (!file) return { error: "No image provided." };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Enable JSON Mode for faster AI response
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-001",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `
      Analyze this grocery receipt. 
      Extract store name, total, and the DATE on the receipt (YYYY-MM-DD).
      Extract all items and prices. Standardize names (e.g., "Whole Milk").
      Return JSON:
      {"store": "string", "date": "string", "total": number, "items": [{"name": "string", "price": number, "quantity": number}]}
    `;

    const imagePart = {
      inlineData: { data: buffer.toString("base64"), mimeType: file.type },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const extractedData = JSON.parse(result.response.text());

    // 1. Insert Receipt (One trip)
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        store_name: extractedData.store,
        total_amount: extractedData.total,
        created_at: extractedData.date || new Date().toISOString(),
      })
      .select().single();

    if (receiptError) throw receiptError;

    // 2. BULK UPSERT PRODUCTS (One trip for ALL items)
    const productNames = extractedData.items.map((item: any) => ({
      name: item.name.trim()
    }));

    const { data: products, error: productError } = await supabase
      .from("products")
      .upsert(productNames, { onConflict: 'name' }) 
      .select();

    if (productError) throw productError;

    // 3. BULK INSERT ITEMS (One trip for ALL items)
    const receiptItemsEntries = extractedData.items.map((item: any) => {
      const matchedProduct = products.find(
        (p) => p.name.toLowerCase() === item.name.toLowerCase().trim()
      );
      return {
        receipt_id: receipt.id,
        product_id: matchedProduct?.id,
        price: item.price,
        quantity: item.quantity || 1,
      };
    });

    await supabase.from("receipt_items").insert(receiptItemsEntries);

    revalidatePath("/");
    return { success: true };

  } catch (error: any) {
    console.error("Action Error:", error);
    return { error: "Failed to process receipt." };
  }
}