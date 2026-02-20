


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "total_quantity" numeric(10,2) DEFAULT 0,
    "total_value" numeric(10,2) DEFAULT 0,
    "last_bought_price" numeric(10,2),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "price" numeric(10,2),
    "store_name" "text",
    "purchase_date" "date" DEFAULT CURRENT_DATE
);


ALTER TABLE "public"."price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipt_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "receipt_id" "uuid",
    "product_id" "uuid",
    "quantity" numeric(10,2) DEFAULT 1.0,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED
);


ALTER TABLE "public"."receipt_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_name" "text",
    "total_amount" numeric(10,2),
    "scanned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipt_items"
    ADD CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipt_items"
    ADD CONSTRAINT "receipt_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipt_items"
    ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."price_history" TO "anon";
GRANT ALL ON TABLE "public"."price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."price_history" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."receipt_items" TO "anon";
GRANT ALL ON TABLE "public"."receipt_items" TO "authenticated";
GRANT ALL ON TABLE "public"."receipt_items" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


  create policy "Give anon users access to JPG images in folder 13hfyy5_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'receipt-images'::text) AND (storage.extension(name) = 'jpg'::text) AND (lower((storage.foldername(name))[1]) = 'public'::text) AND (auth.role() = 'anon'::text)));



