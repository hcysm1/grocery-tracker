CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);ALTER TABLE Products ADD CONSTRAINT unique_product_name UNIQUE (name);