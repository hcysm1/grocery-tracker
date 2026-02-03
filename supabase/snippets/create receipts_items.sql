CREATE TABLE public.receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name TEXT,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now()
);