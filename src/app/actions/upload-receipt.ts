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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Added instruction to extract the date for monthly categorization
    const prompt = `
      Analyze this grocery receipt. 
      1. Extract store name, total, and the DATE on the receipt (YYYY-MM-DD).
      2. Extract all items and prices. Translate to English.
      3. Standardize names (e.g., "Whole Milk" instead of "Milk 1L").
      4. Return ONLY valid JSON:
         {
           "store": "Store Name",
           "date": "2024-05-15", 
           "total": 0.00,
           "items": [{"name": "Item Name", "price": 0.00, "quantity": 1}]
         }
    `;

    const imagePart = {
      inlineData: { data: buffer.toString("base64"), mimeType: file.type },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const extractedData = JSON.parse(responseText);

    // 1. Insert Receipt (Using the date FROM the receipt for monthly tracking)
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        store_name: extractedData.store,
        total_amount: extractedData.total,
        created_at: extractedData.date, // Use the extracted date here!
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // 2. Process Items
    for (const item of extractedData.items) {
      // Check if product exists (Case-insensitive)
      let { data: product } = await supabase
        .from("products")
        .select("id")
        .ilike("name", item.name)
        .single();

      // Create product if missing
      if (!product) {
        const { data: newProduct } = await supabase
          .from("products")
          .insert({ name: item.name }) // No user_id needed if nullable
          .select()
          .single();
        product = newProduct;
      }

      if (product) {
        await supabase.from("receipt_items").insert({
          receipt_id: receipt.id,
          product_id: product.id,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }

    revalidatePath("/");
    return { success: true };

  } catch (error: any) {
    console.error("Action Error:", error);
    return { error: "Failed to process receipt." };
  }
}