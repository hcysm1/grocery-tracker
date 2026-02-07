import { createClient } from "@/utils/supabase/server";

export async function getReceipts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select(`
      *,
      receipt_items (
        id,
        price,
        quantity,
        products (name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }
  return data;
}