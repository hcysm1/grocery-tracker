ALTER TABLE receipt_items
ADD CONSTRAINT fk_products
FOREIGN KEY (product_id) 
REFERENCES products(id)
ON DELETE CASCADE;