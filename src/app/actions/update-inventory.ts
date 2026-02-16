"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInventoryAction(inventoryItems: any[]) {
  const supabase = await createClient();

  // 1. Filter out Discounts and empty names
  const cleanItems = inventoryItems.filter(item => 
    item.name && 
    !item.name.toLowerCase().includes('discount') &&
    item.quantity >= 0
  );

  // 2. Map fields to match DB column names (snake_case)
  const itemsToUpsert = cleanItems.map(item => ({
    ...(item.id ? { id: item.id } : {}), // Keep ID if it exists to prevent duplicates
    name: item.name.trim(),
    quantity: Number(item.quantity) || 0,
    last_price: Number(item.lastPrice) || 0,
    last_bought: item.lastBought,
    frequency: Number(item.frequency) || 0,
    updated_at: new Date().toISOString(),
  }));

  // 3. One-shot Upsert
  const { error } = await supabase
    .from("inventory")
    .upsert(itemsToUpsert, { 
      onConflict: 'name', // If name matches, UPDATE instead of INSERT
    });

  if (error) {
    console.error("Error syncing inventory:", error);
    throw new Error(`Sync Failed: ${error.message}`);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// 4. NEW: Delete Action
export async function deleteInventoryAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
  return { success: true };
}