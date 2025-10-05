-- Add originalPrice column to products table
ALTER TABLE products
ADD COLUMN "originalPrice" DECIMAL(10, 2) NULL;

-- Optional: Add comment to the column
COMMENT ON COLUMN products."originalPrice" IS 'Original price of the product before any discounts';
