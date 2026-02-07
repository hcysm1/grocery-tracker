ALTER TABLE receipt_items
ADD CONSTRAINT fk_receipts
FOREIGN KEY (receipt_id) 
REFERENCES receipts(id)
ON DELETE CASCADE;