"use server";

import { createClient } from "@/utils/supabase/server";

// Define the shape of the data coming back from Supabase Join
interface SupabaseInventoryJoin {
  id: string;
  total_quantity: number;
  total_value: number;
  last_bought_price: number;
  product_id: string;
  products: {
    name: string;
  } | null;
}

export async function getInventoryAction() {
  const supabase = await createClient();

  // We select the product name by "reaching into" the products table
  const { data, error } = await supabase
    .from("inventory")
    .select(`
      id,
      total_quantity,
      total_value,
      last_bought_price,
      product_id,
      products!inner (
        name
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }

  // Use type casting to tell TypeScript what the data looks like
  const typedData = (data as unknown) as SupabaseInventoryJoin[];

  // Map the nested 'products.name' to a flat 'name' property for your UI
  return typedData.map(item => ({
    id: item.id,
    // If the join fails for some reason, we provide a fallback
    name: item.products?.name || "Unknown Product", 
    quantity: Number(item.total_quantity) || 0,
    lastPrice: Number(item.last_bought_price) || 0,
    totalValue: Number(item.total_value) || 0,
  }));
}