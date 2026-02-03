CREATE TABLE public.receipt_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1
);