"use server";

import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function uploadReceiptAction(formData: FormData) {
  console.log(" [STEP 1]: Action Triggered");
  const supabase = await createClient();
  const file = formData.get("receipt") as File;

  if (!file) {
    console.error(" [ERROR]: No file found in FormData");
    return { error: "No image provided." };
  }

  console.log(`(i) Received file: ${file.name} (${file.size} bytes)`);

  try {
    console.log(" [STEP 2]: Converting image to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Using v1 for stability and 1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
    }, { apiVersion: '001' });

    const prompt = `
      Analyze this grocery receipt. 
      Extract store name, total, and the DATE on the receipt (YYYY-MM-DD).
      Extract all items and prices. Standardize names (e.g., "Whole Milk").
      Return JSON ONLY:
      {"store": "string", "date": "string", "total": number, "items": [{"name": "string", "price": number, "quantity": number}]}
    `;

    const imagePart = {
      inlineData: { data: buffer.toString("base64"), mimeType: file.type },
    };

    console.log("[STEP 3]: Sending to Gemini...");
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    console.log(" [DEBUG]: Gemini Raw Response:", responseText);

    // Safety: Strip markdown backticks if AI ignores JSON mode
    const cleanedText = responseText.replace(/```json|```/g, "").trim();
    
    let extractedData;
    try {
      extractedData = JSON.parse(cleanedText);
      console.log(" [STEP 4]: JSON Parsed. Store:", extractedData.store);
    } catch (parseErr) {
      console.error(" [ERROR]: JSON Parsing Failed. Cleaned Text:", cleanedText);
      return { error: "AI returned invalid data format." };
    }

    // 1. Insert Receipt
    console.log(" [STEP 5]: Inserting Receipt into Supabase...");
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        store_name: extractedData.store,
        total_amount: extractedData.total,
        created_at: extractedData.date || new Date().toISOString(),
      })
      .select().single();

    if (receiptError) {
      console.error(" [DB ERROR]: Receipts Table:", receiptError.message);
      throw new Error(`Receipt Insert Failed: ${receiptError.message}`);
    }
    console.log("Receipt Saved. ID:", receipt.id);

    // 2. BULK UPSERT PRODUCTS
    console.log(" [STEP 6]: Upserting Products...");
    const productNames = extractedData.items.map((item: any) => ({
      name: item.name.trim()
    }));

    const { data: products, error: productError } = await supabase
      .from("products")
      .upsert(productNames, { onConflict: 'name' }) 
      .select();

    if (productError) {
      console.error(" [DB ERROR]: Products Table:", productError.message);
      throw new Error(`Product Upsert Failed: ${productError.message}`);
    }
    console.log(` ${products.length} Products synchronized.`);

    // 3. BULK INSERT ITEMS
    console.log(" [STEP 7]: Linking Items to Receipt...");
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

    const { error: itemsError } = await supabase
      .from("receipt_items")
      .insert(receiptItemsEntries);

    if (itemsError) {
      console.error(" [DB ERROR]: ReceiptItems Table:", itemsError.message);
      throw new Error(`Items Insert Failed: ${itemsError.message}`);
    }

    console.log(" [SUCCESS]: All data saved.");
    revalidatePath("/");
    return { success: true };

  } catch (error: any) {
    // This is the most important log
    console.error("[FATAL ERROR]:", error.stack || error.message || error);
    return { error: error.message || "Failed to process receipt." };
  }
}