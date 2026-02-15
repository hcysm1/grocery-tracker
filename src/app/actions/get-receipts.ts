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
      created_at,
      receipt_items (
        id,
        price,
        quantity,
        products (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }

  return data || [];
}
