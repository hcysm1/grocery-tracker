-- This removes the extra constraint we added so only the default one remains
ALTER TABLE receipt_items DROP CONSTRAINT IF EXISTS fk_receipts;
