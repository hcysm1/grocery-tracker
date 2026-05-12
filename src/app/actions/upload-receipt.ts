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
    
    // Model name set to 1.5-flash for 2026 stability
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
    }, { apiVersion: 'v1beta' });

    const prompt = `
Analyze the following grocery receipt image carefully and extract the data into the specified JSON format.

Extract all items following these rules:

1. Layout Logic: This is a multi-column receipt. Read from top-to-bottom, left-to-right across the columns.

2. Store & Date: Extract the store name and the date. Format the date as YYYY-MM-DD.

3. Name Identification: Translate names to English (e.g., "Limau Nipis" → "Lime", "Lada Hitam" → "Black Pepper"). Remove weights, brand codes, or SKU numbers from the name.

4. Discount Handling: If a "Discount" line follows an item, subtract that discount from the item's price to provide the final net price per item.

5. Quantity & Unit: Express quantity as a number. Extract units (kg, g, pc, packet, etc.). Default to "pc" if none is specified.

6. Duplicate Prevention: Combine entries with the exact same name and price by summing their quantities.

Categories: You MUST use exactly one of these: "Fruits", "Vegetables", "Meat & Poultry", "Dairy & Eggs", "Bakery", "Beverages", "Snacks", "Frozen Foods", "Pantry & Condiments", "Household", "Personal Care", "Cleaning Product", "Other".

8. Data Integrity: Ensure the "total" matches the final amount paid on the receipt after all discounts and rounding.

return the data in this JSON format:

{
  "store": "string",
  "date": "string",
  "total": number,
  "items": [
    {
      "name": "string",
      "brand": "string | null",
      "category": "string",
      "emoji": "string",
      "price": number,
      "quantity": number,
      "unit": "string"
    }
  ]
}
    `;

    const imagePart = {
      inlineData: { data: buffer.toString("base64"), mimeType: file.type },
    };

    console.log("[STEP 3]: Sending to Gemini...");
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json|```/g, "").trim();
    
    let extractedData;
    try {
      extractedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error(" [ERROR]: JSON Parsing Failed.");
      return { error: "AI returned invalid data format." };
    }

    // 1. Insert Receipt
    console.log(" [STEP 5]: Inserting Receipt...");
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        store_name: extractedData.store,
        total_amount: extractedData.total,
        scanned_at: extractedData.date,
      })
      .select().single();

    if (receiptError) throw new Error(`Receipt Insert Failed: ${receiptError.message}`);

    // 2. BULK UPSERT PRODUCTS (Now including metadata)
    console.log(" [STEP 6]: Upserting Products with metadata...");
    const productEntries = extractedData.items.reduce((acc: any[], item: any) => {
      const trimmedName = item.name.trim();
      if (!acc.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        acc.push({
          name: trimmedName,
          brand: item.brand,
          category: item.category,
          emoji: item.emoji
        });
      }
      return acc;
    }, []);

    const { data: products, error: productError } = await supabase
      .from("products")
      .upsert(productEntries, { onConflict: 'name' }) 
      .select();

    if (productError) throw new Error(`Product Upsert Failed: ${productError.message}`);

    // 3. BULK INSERT ITEMS (Including units)
    console.log(" [STEP 7]: Linking Items to Receipt...");
    const receiptItemsEntries = extractedData.items.map((item: any) => {
      const matchedProduct = products.find(
        (p) => p.name.toLowerCase() === item.name.trim().toLowerCase()
      );
      return {
        receipt_id: receipt.id,
        product_id: matchedProduct?.id,
        unit_price: item.price,
        quantity: item.quantity || 1,
        unit: item.unit || 'pc' // Mapping the extracted unit
      };
    });

    const { error: itemsError } = await supabase
      .from("receipt_items")
      .insert(receiptItemsEntries);

    if (itemsError) throw new Error(`Items Insert Failed: ${itemsError.message}`);

    console.log(" [SUCCESS]: All data saved.");
    revalidatePath("/");
    
    // Fetch complete receipt with relations
    const { data: completeReceipt, error: fetchError } = await supabase
      .from("receipts")
      .select(`
        id,
        store_name,
        total_amount,
        scanned_at,
        receipt_items (
          id,
          unit_price,
          total_price,
          quantity,
          unit,
          products (
            name,
            brand,
            category,
            emoji
          )
        )
      `)
      .eq("id", receipt.id)
      .single();

    return { success: true, receipt: completeReceipt || null };

  } catch (error: any) {
    console.error("[FATAL ERROR]:", error.message);
    return { error: error.message || "Failed to process receipt." };
  }
}