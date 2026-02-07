// lib/data.ts
import { createClient } from "@/utils/supabase/server";

export async function getReceipts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select(`
      id,
      store_name,
      total_amount,
      created_at,
      receipt_items(id)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }
  return data;
}