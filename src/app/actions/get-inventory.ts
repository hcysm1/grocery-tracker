"use server";

import { createClient } from "@/utils/supabase/server";

export async function getInventoryAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }

  // Ensure numeric fields are numbers, not null
  return (data || []).map(item => ({
    ...item,
    quantity: item.quantity || 0,
    lastPrice: item.last_price || 0,
    frequency: item.frequency || 0,
  }));
}