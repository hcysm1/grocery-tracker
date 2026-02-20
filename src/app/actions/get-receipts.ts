"use server";

import { createClient } from "@/utils/supabase/server";

export async function getReceiptsAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select(`
      id,
      store_name,
      total_amount,
      scanned_at,
      receipt_items (
        id,
        unit_price,
        total_price,
        quantity,
        products (
          name
        )
      )
    `)
    .order("scanned_at", { ascending: false });

  if (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }

  return data || [];
}
