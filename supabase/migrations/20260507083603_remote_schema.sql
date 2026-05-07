alter table "public"."products" drop column "category";

alter table "public"."receipts" alter column "scanned_at" drop default;

alter table "public"."receipts" alter column "scanned_at" set data type date using "scanned_at"::date;


