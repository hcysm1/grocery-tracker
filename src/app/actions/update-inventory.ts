"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInventoryAction(inventoryItems: any[]) {
  const supabase = await createClient();

  for (const item of inventoryItems) {
    if (!item.name || item.name.toLowerCase().includes('discount')) continue;

    // 1. Find or Create the Product ID for this name
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("name", item.name.trim())
      .single();

    if (!product) continue; // Skip if product doesn't exist in products table

    const qty = Number(item.quantity) || 0;
    const price = Number(item.lastPrice) || 0;
    const totalCost = qty * price;

    // 2. Check if this product is already in inventory
    const { data: existing } = await supabase
      .from("inventory")
      .select("id, total_quantity, total_value")
      .eq("product_id", product.id)
      .single();

    if (existing) {
      
      await supabase
        .from("inventory")
        .update({
          total_quantity:qty,
          total_value: totalCost,
          last_bought_price: price,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      // 4. Insert new inventory record
      await supabase
        .from("inventory")
        .insert({
          product_id: product.id,
          total_quantity: qty,
          total_value: totalCost,
          last_bought_price: price
        });
    }
  }

  revalidatePath("/inventory");
  return { success: true };
}