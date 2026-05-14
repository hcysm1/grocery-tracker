"use server";

/**
 * app/actions/inventory.ts
 *
 * Server actions for the Inventory table.
 * Mirrors the pattern used in your upload-receipt action.
 *
 * Categories must match the CHECK constraint in your DB:
 *   Fruits | Vegetables | Meat & Poultry | Seafood | Dairy & Eggs |
 *   Bakery | Beverages | Snacks | Frozen Foods | Pantry & Condiments |
 *   Household | Personal Care | Baby Products | Cleaning Product | Other
 */

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  product_id:          string | null;
  name:                string;
  emoji:               string;
  category:            string;
  quantity:            number;
  unit:                string;
  price:               number;
  low_stock_threshold: number;
  created_at:          string;
  updated_at:          string;
}

export type NewInventoryItem = Omit<InventoryItem, "id" | "created_at" | "updated_at">;

interface ActionResult<T = void> {
  data?: T;
  error?: string;
}

// ─── FETCH ALL ────────────────────────────────────────────────────────────────

/**
 * Fetch every inventory row, ordered by name.
 * Call this in your page/layout to seed initial state.
 *
 * Usage:
 *   const { data: inventory, error } = await fetchInventoryAction();
 */
export async function fetchInventoryAction(): Promise<ActionResult<InventoryItem[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return { data: data as InventoryItem[] };
  } catch (err: any) {
    console.error("[fetchInventoryAction]", err.message);
    return { error: err.message ?? "Failed to fetch inventory" };
  }
}

// ─── ADD ITEM ─────────────────────────────────────────────────────────────────

/**
 * Insert a new inventory item.
 *
 * If the item originated from a receipt product, pass product_id so
 * the row is linked. For hand-typed custom items, leave product_id null.
 *
 * Usage:
 *   const { data: newItem, error } = await addInventoryItemAction({
 *     product_id: "uuid-or-null",
 *     name: "Full Cream Milk",
 *     emoji: "🥛",
 *     category: "Dairy & Eggs",
 *     quantity: 4,
 *     unit: "L",
 *     price: 9.50,
 *     low_stock_threshold: 2,
 *   });
 */
export async function addInventoryItemAction(
  item: NewInventoryItem
): Promise<ActionResult<InventoryItem>> {
  try {
    const supabase = await createClient();

    const payload = {
      product_id:          item.product_id ?? null,
      name:                item.name.trim(),
      emoji:               item.emoji || "📦",
      category:            item.category || "Other",
      quantity:            Number(item.quantity) || 0,
      unit:                item.unit || "pcs",
      price:               Number(item.price) || 0,
      low_stock_threshold: Number(item.low_stock_threshold) ?? 5,
    };

    const { data, error } = await supabase
      .from("inventory")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/");
    return { data: data as InventoryItem };
  } catch (err: any) {
    console.error("[addInventoryItemAction]", err.message);
    return { error: err.message ?? "Failed to add inventory item" };
  }
}

// ─── UPDATE ITEM ──────────────────────────────────────────────────────────────

/**
 * Update any field(s) on an existing inventory row.
 * Only passes columns you actually want to change — safe for partial updates.
 *
 * Editable from the UI: name, quantity.
 * Editable via modal: all fields.
 *
 * Usage:
 *   const { error } = await updateInventoryItemAction("item-uuid", {
 *     quantity: 10,
 *   });
 */
export async function updateInventoryItemAction(
  id: string,
  patch: Partial<Omit<InventoryItem, "id" | "created_at" | "updated_at">>
): Promise<ActionResult> {
  try {
    if (!id) throw new Error("Missing inventory item id");

    const supabase = await createClient();

    // Sanitise numeric fields if present
    const sanitised: Record<string, any> = { ...patch };
    if ("quantity"            in patch) sanitised.quantity            = Number(patch.quantity);
    if ("price"               in patch) sanitised.price               = Number(patch.price);
    if ("low_stock_threshold" in patch) sanitised.low_stock_threshold = Number(patch.low_stock_threshold);
    if ("name"                in patch) sanitised.name                = String(patch.name).trim();

    const { error } = await supabase
      .from("inventory")
      .update(sanitised)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/");
    return {};
  } catch (err: any) {
    console.error("[updateInventoryItemAction]", err.message);
    return { error: err.message ?? "Failed to update inventory item" };
  }
}

// ─── DELETE ITEM ──────────────────────────────────────────────────────────────

/**
 * Permanently delete an inventory row by id.
 * Does NOT delete the linked product or any receipts.
 *
 * Usage:
 *   const { error } = await deleteInventoryItemAction("item-uuid");
 */
export async function deleteInventoryItemAction(id: string): Promise<ActionResult> {
  try {
    if (!id) throw new Error("Missing inventory item id");

    const supabase = await createClient();

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/");
    return {};
  } catch (err: any) {
    console.error("[deleteInventoryItemAction]", err.message);
    return { error: err.message ?? "Failed to delete inventory item" };
  }
}

// ─── BULK UPSERT (optional helper) ───────────────────────────────────────────

/**
 * Upsert multiple items at once — useful if you want to auto-populate
 * inventory from a scanned receipt in the future.
 *
 * Matches on (name) — updates quantity & price if the row already exists.
 *
 * Usage:
 *   await bulkUpsertInventoryAction([
 *     { name: "Eggs", quantity: 30, price: 0.50, ... },
 *   ]);
 */
export async function bulkUpsertInventoryAction(
  items: NewInventoryItem[]
): Promise<ActionResult<InventoryItem[]>> {
  try {
    const supabase = await createClient();

    const payload = items.map((item) => ({
      product_id:          item.product_id ?? null,
      name:                item.name.trim(),
      emoji:               item.emoji || "📦",
      category:            item.category || "Other",
      quantity:            Number(item.quantity) || 0,
      unit:                item.unit || "pcs",
      price:               Number(item.price) || 0,
      low_stock_threshold: Number(item.low_stock_threshold) ?? 5,
    }));

    const { data, error } = await supabase
      .from("inventory")
      .upsert(payload, { onConflict: "name" })
      .select();

    if (error) throw error;

    revalidatePath("/");
    return { data: data as InventoryItem[] };
  } catch (err: any) {
    console.error("[bulkUpsertInventoryAction]", err.message);
    return { error: err.message ?? "Failed to bulk upsert inventory" };
  }
}
