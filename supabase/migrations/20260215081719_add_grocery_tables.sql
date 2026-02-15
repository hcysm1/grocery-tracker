


  create table "public"."price_history" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid,
    "store_name" text,
    "price" numeric(10,2),
    "quantity" integer,
    "purchase_date" date default CURRENT_DATE
      );



  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "category" text
      );



  create table "public"."receipt_items" (
    "id" uuid not null default gen_random_uuid(),
    "receipt_id" uuid,
    "product_id" uuid,
    "price" numeric(10,2) not null,
    "quantity" integer default 1
      );



  create table "public"."receipts" (
    "id" uuid not null default gen_random_uuid(),
    "store_name" text,
    "total_amount" numeric(10,2),
    "created_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id);

CREATE UNIQUE INDEX products_name_key ON public.products USING btree (name);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX receipt_items_pkey ON public.receipt_items USING btree (id);

CREATE UNIQUE INDEX receipts_pkey ON public.receipts USING btree (id);

alter table "public"."price_history" add constraint "price_history_pkey" PRIMARY KEY using index "price_history_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."receipt_items" add constraint "receipt_items_pkey" PRIMARY KEY using index "receipt_items_pkey";

alter table "public"."receipts" add constraint "receipts_pkey" PRIMARY KEY using index "receipts_pkey";

alter table "public"."price_history" add constraint "price_history_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) not valid;

alter table "public"."price_history" validate constraint "price_history_product_id_fkey";

alter table "public"."products" add constraint "products_name_key" UNIQUE using index "products_name_key";

alter table "public"."receipt_items" add constraint "fk_products" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."receipt_items" validate constraint "fk_products";

alter table "public"."receipt_items" add constraint "receipt_items_receipt_id_fkey" FOREIGN KEY (receipt_id) REFERENCES public.receipts(id) ON DELETE CASCADE not valid;

alter table "public"."receipt_items" validate constraint "receipt_items_receipt_id_fkey";

grant delete on table "public"."price_history" to "anon";

grant insert on table "public"."price_history" to "anon";

grant references on table "public"."price_history" to "anon";

grant select on table "public"."price_history" to "anon";

grant trigger on table "public"."price_history" to "anon";

grant truncate on table "public"."price_history" to "anon";

grant update on table "public"."price_history" to "anon";

grant delete on table "public"."price_history" to "authenticated";

grant insert on table "public"."price_history" to "authenticated";

grant references on table "public"."price_history" to "authenticated";

grant select on table "public"."price_history" to "authenticated";

grant trigger on table "public"."price_history" to "authenticated";

grant truncate on table "public"."price_history" to "authenticated";

grant update on table "public"."price_history" to "authenticated";

grant delete on table "public"."price_history" to "postgres";

grant insert on table "public"."price_history" to "postgres";

grant references on table "public"."price_history" to "postgres";

grant select on table "public"."price_history" to "postgres";

grant trigger on table "public"."price_history" to "postgres";

grant truncate on table "public"."price_history" to "postgres";

grant update on table "public"."price_history" to "postgres";

grant delete on table "public"."price_history" to "service_role";

grant insert on table "public"."price_history" to "service_role";

grant references on table "public"."price_history" to "service_role";

grant select on table "public"."price_history" to "service_role";

grant trigger on table "public"."price_history" to "service_role";

grant truncate on table "public"."price_history" to "service_role";

grant update on table "public"."price_history" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "postgres";

grant insert on table "public"."products" to "postgres";

grant references on table "public"."products" to "postgres";

grant select on table "public"."products" to "postgres";

grant trigger on table "public"."products" to "postgres";

grant truncate on table "public"."products" to "postgres";

grant update on table "public"."products" to "postgres";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."receipt_items" to "anon";

grant insert on table "public"."receipt_items" to "anon";

grant references on table "public"."receipt_items" to "anon";

grant select on table "public"."receipt_items" to "anon";

grant trigger on table "public"."receipt_items" to "anon";

grant truncate on table "public"."receipt_items" to "anon";

grant update on table "public"."receipt_items" to "anon";

grant delete on table "public"."receipt_items" to "authenticated";

grant insert on table "public"."receipt_items" to "authenticated";

grant references on table "public"."receipt_items" to "authenticated";

grant select on table "public"."receipt_items" to "authenticated";

grant trigger on table "public"."receipt_items" to "authenticated";

grant truncate on table "public"."receipt_items" to "authenticated";

grant update on table "public"."receipt_items" to "authenticated";

grant delete on table "public"."receipt_items" to "postgres";

grant insert on table "public"."receipt_items" to "postgres";

grant references on table "public"."receipt_items" to "postgres";

grant select on table "public"."receipt_items" to "postgres";

grant trigger on table "public"."receipt_items" to "postgres";

grant truncate on table "public"."receipt_items" to "postgres";

grant update on table "public"."receipt_items" to "postgres";

grant delete on table "public"."receipt_items" to "service_role";

grant insert on table "public"."receipt_items" to "service_role";

grant references on table "public"."receipt_items" to "service_role";

grant select on table "public"."receipt_items" to "service_role";

grant trigger on table "public"."receipt_items" to "service_role";

grant truncate on table "public"."receipt_items" to "service_role";

grant update on table "public"."receipt_items" to "service_role";

grant delete on table "public"."receipts" to "anon";

grant insert on table "public"."receipts" to "anon";

grant references on table "public"."receipts" to "anon";

grant select on table "public"."receipts" to "anon";

grant trigger on table "public"."receipts" to "anon";

grant truncate on table "public"."receipts" to "anon";

grant update on table "public"."receipts" to "anon";

grant delete on table "public"."receipts" to "authenticated";

grant insert on table "public"."receipts" to "authenticated";

grant references on table "public"."receipts" to "authenticated";

grant select on table "public"."receipts" to "authenticated";

grant trigger on table "public"."receipts" to "authenticated";

grant truncate on table "public"."receipts" to "authenticated";

grant update on table "public"."receipts" to "authenticated";

grant delete on table "public"."receipts" to "postgres";

grant insert on table "public"."receipts" to "postgres";

grant references on table "public"."receipts" to "postgres";

grant select on table "public"."receipts" to "postgres";

grant trigger on table "public"."receipts" to "postgres";

grant truncate on table "public"."receipts" to "postgres";

grant update on table "public"."receipts" to "postgres";

grant delete on table "public"."receipts" to "service_role";

grant insert on table "public"."receipts" to "service_role";

grant references on table "public"."receipts" to "service_role";

grant select on table "public"."receipts" to "service_role";

grant trigger on table "public"."receipts" to "service_role";

grant truncate on table "public"."receipts" to "service_role";

grant update on table "public"."receipts" to "service_role";



