-- Simple migration: Add originalPrice column only
ALTER TABLE products ADD COLUMN IF NOT EXISTS "originalPrice" NUMERIC(10,2);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'originalPrice';
