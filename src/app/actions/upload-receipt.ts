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
      model: "gemini-3-flash-preview", 
    }, { apiVersion: 'v1beta' });

    const prompt = `
Analyze this grocery receipt carefully.
Extract store name, total, and the DATE on the receipt in this format = (YYYY-MM-DD).

Extract all items following these rules:

1. **Unit Price**: Capture the price AFTER '@' if present; otherwise use the listed item price.

2. **Name Identification**: Read each item name slowly and carefully. Do NOT confuse similar-sounding products.
   - Standardize names: e.g., "CHICK BONELESS" → "Boneless Chicken", "CHIK FILLET" → "Chicken Fillet", "P/APPLE CHUNKS" → "Pineapple Chunks", "RED ONION - KG" → "Red Onion".
   - Remove weights, brand codes from the name but EXTRACT brand into the brand field.
   - Keep distinctly different products in SEPARATE rows (e.g., "Yogurt" and "Greek Yogurt" are different items).

3. **Quantity**: Express as a number only (e.g., 1, 2, 0.5). Do not include units here.

4. **Unit**: The unit of measurement for the quantity. Examples:
   - "kg", "g", "liter", "ml"
   - "pc", "pcs", "packet", "bottle", "box", "can", "bunch"
   - If no unit is shown, default to "pc".

5. **Brand**: Extract the brand name if visible on the receipt (e.g., "Nestle", "Heinz", "Farm Fresh").
   - If no brand is identifiable, return null.

6. **Category**: Assign a logical grocery category based on the product name. Use one of:
   - "Fruits", "Vegetables", "Meat & Poultry", "Seafood", "Dairy & Eggs",
     "Bakery", "Beverages", "Snacks", "Frozen Foods", "Pantry & Condiments",
     "Household", "Personal Care", "Baby Products", "Other"

7. **Emoji**: Assign a single relevant emoji based on the product name.
   - Examples: Chicken → 🍗, Milk → 🥛, Apple → 🍎, Rice → 🍚, Eggs → 🥚, Water → 💧

8. **Duplicate Prevention**: Before adding an entry, check if the EXACT same name AND price already exists.
   - If yes → combine by ADDING quantities.
   - If same name but DIFFERENT price → list as a SEPARATE entry.

9. **Exclude**: Discounts, Savings, Tax, Subtotal, and any non-product line items.

Return JSON ONLY — no markdown, no explanation:
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
        scanned_at: extractedData.date,
      })
      .select().single();

    if (receiptError) {
      console.error(" [DB ERROR]: Receipts Table:", receiptError.message);
      throw new Error(`Receipt Insert Failed: ${receiptError.message}`);
    }
    console.log("Receipt Saved. ID:", receipt.id);

    // 2. BULK UPSERT PRODUCTS
    console.log(" [STEP 6]: Upserting Products...");
    const uniqueProductNames = [...new Set(extractedData.items.map((item: any) => item.name.trim()))];
    const productNames = uniqueProductNames.map(name => ({ name }));

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
        unit_price: item.price,
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
    
    // Fetch the complete receipt with all relations
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
          products (
            name
          )
        )
      `)
      .eq("id", receipt.id)
      .single();

    if (fetchError) {
      console.error(" [WARNING]: Could not fetch complete receipt:", fetchError.message);
      return { success: true, receipt: null };
    }

    return { success: true, receipt: completeReceipt };

  } catch (error: any) {
    // This is the most important log
    console.error("[FATAL ERROR]:", error.stack || error.message || error);
    return { error: error.message || "Failed to process receipt." };
  }
}