"use server";

import { createClient } from "@/utils/supabase/server";

export async function getInventoryAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("name", { ascending: true }); // Alphabetical is easier to read

  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity || 0,
    lastPrice: item.last_price || 0,
    lastBought: item.last_bought,
    frequency: item.frequency || 0,
  }));
}