-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create inventory table
-- Run this in your Supabase SQL editor or save as a new migration file
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id"                  uuid DEFAULT gen_random_uuid() NOT NULL,
    "product_id"          uuid,                          -- nullable: links to products table if the item came from a receipt
    "name"                text NOT NULL,                 -- denormalised for fast reads & custom items
    "emoji"               text DEFAULT '📦',
    "category"            text DEFAULT 'Other',
    "quantity"            numeric(10,2) DEFAULT 0 NOT NULL,
    "unit"                text DEFAULT 'pcs',
    "price"               numeric(10,2) DEFAULT 0,      -- last known unit price
    "low_stock_threshold" numeric(10,2) DEFAULT 5,      -- triggers low-stock warning
    "created_at"          timestamp with time zone DEFAULT now(),
    "updated_at"          timestamp with time zone DEFAULT now(),

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id"),

    -- Optional FK: if product_id is set it must exist in products
    CONSTRAINT "inventory_product_id_fkey"
        FOREIGN KEY ("product_id")
        REFERENCES "public"."products"("id")
        ON DELETE SET NULL,

    -- Enforce same category values as products table (allow NULL for custom items)
    CONSTRAINT "inventory_valid_category" CHECK (
        category IS NULL OR
        category = ANY (ARRAY[
            'Fruits', 'Vegetables', 'Meat & Poultry', 'Seafood',
            'Dairy & Eggs', 'Bakery', 'Beverages', 'Snacks',
            'Frozen Foods', 'Pantry & Condiments', 'Household',
            'Personal Care', 'Baby Products', 'Cleaning Product', 'Other'
        ])
    )
);

-- ── Grants (match your existing tables) ──────────────────────────────────────
GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";

-- ── Auto-update updated_at on every row change ────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "inventory_updated_at"
    BEFORE UPDATE ON "public"."inventory"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- ── Index for fast product lookups ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "inventory_product_id_idx"
    ON "public"."inventory" ("product_id")
    WHERE product_id IS NOT NULL;
