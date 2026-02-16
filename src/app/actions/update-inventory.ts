"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInventoryAction(inventoryItems: any[]) {
  const supabase = await createClient();

  // Update or insert each item
  for (const item of inventoryItems) {
    if (item.id) {
      // Update existing item
      const { error } = await supabase
        .from("inventory")
        .update({
          name: item.name,
          quantity: item.quantity || 0,
          last_price: item.lastPrice || 0,
          last_bought: item.lastBought,
          frequency: item.frequency || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        console.error("Error updating inventory item:", error);
        throw new Error(`Failed to update inventory item: ${error.message}`);
      }
    } else {
      // Insert new item
      const { error } = await supabase
        .from("inventory")
        .insert({
          name: item.name,
          quantity: item.quantity || 0,
          last_price: item.lastPrice || 0,
          last_bought: item.lastBought,
          frequency: item.frequency || 0,
        });

      if (error) {
        console.error("Error inserting inventory item:", error);
        throw new Error(`Failed to insert inventory item: ${error.message}`);
      }
    }
  }

  revalidatePath("/");
  return { success: true };
}