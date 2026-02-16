"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInventoryAction(inventoryItems: any[]) {
  const supabase = await createClient();

  // Filter out any "Discount" or empty items before they even touch the DB
  const cleanItems = inventoryItems.filter(item => 
    item.name && 
    !item.name.toLowerCase().includes('discount') &&
    !item.name.toLowerCase().includes('tax')
  );

  const itemsToUpsert = cleanItems.map(item => ({
    // Use the ID if it exists, otherwise Supabase uses 'name' for the conflict check
    ...(item.id ? { id: item.id } : {}), 
    name: item.name.trim(),
    quantity: Number(item.quantity) || 0,
    last_price: Number(item.lastPrice) || 0, // MAP CAMELCASE TO SNAKE_CASE
    last_bought: item.lastBought || new Date().toISOString(),
    frequency: Number(item.frequency) || 0,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("inventory")
    .upsert(itemsToUpsert, { onConflict: 'name' });

  if (error) {
    console.error("UPSERT ERROR:", error.message);
    throw error;
  }

  revalidatePath("/");
  return { success: true };
}