create table "public"."inventory" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "quantity" integer default 0,
    "last_price" numeric(10,2) default 0,
    "last_bought" timestamp with time zone default now(),
    "frequency" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

CREATE UNIQUE INDEX inventory_name_key ON public.inventory USING btree (name);

CREATE UNIQUE INDEX inventory_pkey ON public.inventory USING btree (id);

alter table "public"."inventory" add constraint "inventory_pkey" PRIMARY KEY using index "inventory_pkey";

alter table "public"."inventory" add constraint "inventory_name_key" UNIQUE using index "inventory_name_key";

grant delete on table "public"."inventory" to "anon";

grant insert on table "public"."inventory" to "anon";

grant references on table "public"."inventory" to "anon";

grant select on table "public"."inventory" to "anon";

grant trigger on table "public"."inventory" to "anon";

grant truncate on table "public"."inventory" to "anon";

grant update on table "public"."inventory" to "anon";

grant delete on table "public"."inventory" to "authenticated";

grant insert on table "public"."inventory" to "authenticated";

grant references on table "public"."inventory" to "authenticated";

grant select on table "public"."inventory" to "authenticated";

grant trigger on table "public"."inventory" to "authenticated";

grant truncate on table "public"."inventory" to "authenticated";

grant update on table "public"."inventory" to "authenticated";

grant delete on table "public"."inventory" to "postgres";

grant insert on table "public"."inventory" to "postgres";

grant references on table "public"."inventory" to "postgres";

grant select on table "public"."inventory" to "postgres";

grant trigger on table "public"."inventory" to "postgres";

grant truncate on table "public"."inventory" to "postgres";

grant update on table "public"."inventory" to "postgres";

grant delete on table "public"."inventory" to "service_role";

grant insert on table "public"."inventory" to "service_role";

grant references on table "public"."inventory" to "service_role";

grant select on table "public"."inventory" to "service_role";

grant trigger on table "public"."inventory" to "service_role";

grant truncate on table "public"."inventory" to "service_role";

grant update on table "public"."inventory" to "service_role";