"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInventoryAction(inventoryItems: any[]) {
  const supabase = await createClient();

  // Upsert all inventory items
  const { error } = await supabase
    .from("inventory")
    .upsert(
      inventoryItems.map(item => ({
        name: item.name,
        quantity: item.quantity || 0,
        last_price: item.lastPrice || 0,
        last_bought: item.lastBought,
        frequency: item.frequency || 0,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'name' }
    );

  if (error) {
    console.error("Error updating inventory:", error);
    throw new Error(`Failed to update inventory: ${error.message}`);
  }

  revalidatePath("/");
  return { success: true };
}