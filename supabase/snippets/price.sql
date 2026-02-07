CREATE TABLE price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    store_name TEXT,
    price NUMERIC(10, 2),
    quantity INTEGER,
    purchase_date DATE DEFAULT CURRENT_DATE
);