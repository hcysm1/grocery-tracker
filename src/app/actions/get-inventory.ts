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

  return data || [];
}