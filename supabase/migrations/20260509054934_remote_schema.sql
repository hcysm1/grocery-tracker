alter table "public"."products" add column "brand" text;

alter table "public"."products" add column "category" text;

alter table "public"."products" add column "emoji" text;

alter table "public"."receipt_items" add column "unit" text default 'pc'::text;

alter table "public"."products" add constraint "valid_category" CHECK ((category = ANY (ARRAY['Fruits'::text, 'Vegetables'::text, 'Meat & Poultry'::text, 'Seafood'::text, 'Dairy & Eggs'::text, 'Bakery'::text, 'Beverages'::text, 'Snacks'::text, 'Frozen Foods'::text, 'Pantry & Condiments'::text, 'Household'::text, 'Personal Care'::text, 'Baby Products'::text, 'Cleaning Product'::text, 'Other'::text]))) not valid;

alter table "public"."products" validate constraint "valid_category";


