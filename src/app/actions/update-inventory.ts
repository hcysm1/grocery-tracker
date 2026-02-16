"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInventoryAction(inventoryItems: any[]) {
  const supabase = await createClient();

  // Filter out discounts and ensure we have valid numbers
  const itemsToUpsert = inventoryItems
    .filter(item => item.name && !item.name.toLowerCase().includes('discount'))
    .map(item => ({
      ...(item.id ? { id: item.id } : {}),
      name: item.name.trim(),
      quantity: Number(item.quantity) || 0,
      last_price: Number(item.lastPrice) || 0,
      last_bought: item.lastBought || new Date().toISOString(),
      frequency: Number(item.frequency) || 1,
      updated_at: new Date().toISOString(),
    }));

  const { error } = await supabase
    .from("inventory")
    .upsert(itemsToUpsert, { 
      onConflict: 'name,last_price' // This is the key fix
    });

  if (error) {
    console.error("Inventory Upsert Error:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/");
  return { success: true };
}