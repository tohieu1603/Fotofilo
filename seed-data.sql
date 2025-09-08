-- Seed data for Product Service Database
-- Run this file in your PostgreSQL database

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, image, active, "createdAt", "updatedAt") VALUES
('cat-001', 'Điện tử', 'dien-tu', 'https://via.placeholder.com/300x200?text=Electronics', true, NOW(), NOW()),
('cat-002', 'Thời trang', 'thoi-trang', 'https://via.placeholder.com/300x200?text=Fashion', true, NOW(), NOW()),
('cat-003', 'Nhà cửa & Đời sống', 'nha-cua-doi-song', 'https://via.placeholder.com/300x200?text=Home', true, NOW(), NOW()),
('cat-004', 'Sách & Văn phòng phẩm', 'sach-van-phong-pham', 'https://via.placeholder.com/300x200?text=Books', true, NOW(), NOW()),
('cat-005', 'Thể thao & Dã ngoại', 'the-thao-da-ngoai', 'https://via.placeholder.com/300x200?text=Sports', true, NOW(), NOW()),
('cat-006', 'Làm đẹp & Sức khỏe', 'lam-dep-suc-khoe', 'https://via.placeholder.com/300x200?text=Beauty', true, NOW(), NOW()),
('cat-007', 'Đồ chơi & Giải trí', 'do-choi-giai-tri', 'https://via.placeholder.com/300x200?text=Toys', true, NOW(), NOW()),
('cat-008', 'Ô tô & Xe máy', 'o-to-xe-may', 'https://via.placeholder.com/300x200?text=Automotive', true, NOW(), NOW());

-- 2. Insert Subcategories for Electronics
INSERT INTO categories (id, name, slug, image, active, "parentId", "createdAt", "updatedAt") VALUES
('cat-009', 'Điện thoại', 'dien-thoai', 'https://via.placeholder.com/300x200?text=Phones', true, 'cat-001', NOW(), NOW()),
('cat-010', 'Laptop', 'laptop', 'https://via.placeholder.com/300x200?text=Laptops', true, 'cat-001', NOW(), NOW()),
('cat-011', 'Máy tính bảng', 'may-tinh-bang', 'https://via.placeholder.com/300x200?text=Tablets', true, 'cat-001', NOW(), NOW()),
('cat-012', 'Phụ kiện điện tử', 'phu-kien-dien-tu', 'https://via.placeholder.com/300x200?text=Accessories', true, 'cat-001', NOW(), NOW());

-- 3. Insert Brands
INSERT INTO brands (id, name, active, "createdAt", "updatedAt") VALUES
('brand-001', 'Apple', true, NOW(), NOW()),
('brand-002', 'Samsung', true, NOW(), NOW()),
('brand-003', 'Nike', true, NOW(), NOW()),
('brand-004', 'Adidas', true, NOW(), NOW()),
('brand-005', 'IKEA', true, NOW(), NOW()),
('brand-006', 'Uniqlo', true, NOW(), NOW()),
('brand-007', 'Sony', true, NOW(), NOW()),
('brand-008', 'LG', true, NOW(), NOW());

-- 4. Insert Attributes
INSERT INTO attributes (id, name, description, "createdAt", "updatedAt") VALUES
('attr-001', 'Màu sắc', 'Màu sắc của sản phẩm', NOW(), NOW()),
('attr-002', 'Kích thước', 'Kích thước của sản phẩm', NOW(), NOW()),
('attr-003', 'Chất liệu', 'Chất liệu làm nên sản phẩm', NOW(), NOW()),
('attr-004', 'Dung lượng', 'Dung lượng lưu trữ', NOW(), NOW()),
('attr-005', 'Màn hình', 'Kích thước màn hình', NOW(), NOW());

-- 5. Insert Attribute Options
INSERT INTO attribute_options (id, "attributeId", value, "createdAt", "updatedAt") VALUES
-- Color options
('opt-001', 'attr-001', 'Đen', NOW(), NOW()),
('opt-002', 'attr-001', 'Trắng', NOW(), NOW()),
('opt-003', 'attr-001', 'Xanh dương', NOW(), NOW()),
('opt-004', 'attr-001', 'Đỏ', NOW(), NOW()),
('opt-005', 'attr-001', 'Vàng', NOW(), NOW()),

-- Size options
('opt-006', 'attr-002', 'S', NOW(), NOW()),
('opt-007', 'attr-002', 'M', NOW(), NOW()),
('opt-008', 'attr-002', 'L', NOW(), NOW()),
('opt-009', 'attr-002', 'XL', NOW(), NOW()),
('opt-010', 'attr-002', 'XXL', NOW(), NOW()),

-- Material options
('opt-011', 'attr-003', 'Cotton', NOW(), NOW()),
('opt-012', 'attr-003', 'Polyester', NOW(), NOW()),
('opt-013', 'attr-003', 'Leather', NOW(), NOW()),
('opt-014', 'attr-003', 'Metal', NOW(), NOW()),
('opt-015', 'attr-003', 'Plastic', NOW(), NOW()),

-- Storage options
('opt-016', 'attr-004', '64GB', NOW(), NOW()),
('opt-017', 'attr-004', '128GB', NOW(), NOW()),
('opt-018', 'attr-004', '256GB', NOW(), NOW()),
('opt-019', 'attr-004', '512GB', NOW(), NOW()),
('opt-020', 'attr-004', '1TB', NOW(), NOW()),

-- Screen options
('opt-021', 'attr-005', '5.5 inch', NOW(), NOW()),
('opt-022', 'attr-005', '6.1 inch', NOW(), NOW()),
('opt-023', 'attr-005', '6.7 inch', NOW(), NOW()),
('opt-024', 'attr-005', '13 inch', NOW(), NOW()),
('opt-025', 'attr-005', '15.6 inch', NOW(), NOW());

-- 6. Insert Products
INSERT INTO products (id, name, description, price, status, "categoryId", "brandId", "createdAt", "updatedAt") VALUES
('prod-001', 'iPhone 15 Pro', 'iPhone 15 Pro với chip A17 Pro mạnh mẽ', 25000000, 'active', 'cat-009', 'brand-001', NOW(), NOW()),
('prod-002', 'Samsung Galaxy S24', 'Galaxy S24 với AI tích hợp', 20000000, 'active', 'cat-009', 'brand-002', NOW(), NOW()),
('prod-003', 'MacBook Pro M3', 'MacBook Pro với chip M3 Pro', 45000000, 'active', 'cat-010', 'brand-001', NOW(), NOW()),
('prod-004', 'iPad Air', 'iPad Air mỏng nhẹ, hiệu năng cao', 18000000, 'active', 'cat-011', 'brand-001', NOW(), NOW()),
('prod-005', 'Nike Air Max', 'Giày thể thao Nike Air Max', 3500000, 'active', 'cat-005', 'brand-003', NOW(), NOW()),
('prod-006', 'Adidas Ultraboost', 'Giày chạy Adidas Ultraboost', 4200000, 'active', 'cat-005', 'brand-004', NOW(), NOW()),
('prod-007', 'Sony WH-1000XM5', 'Tai nghe chống ồn Sony', 8500000, 'active', 'cat-012', 'brand-007', NOW(), NOW()),
('prod-008', 'LG OLED TV', 'TV OLED LG 65 inch', 35000000, 'active', 'cat-001', 'brand-008', NOW(), NOW());

-- 7. Insert SKUs
INSERT INTO skus (id, "productId", "skuCode", price, stock, "createdAt", "updatedAt") VALUES
('sku-001', 'prod-001', 'IP15P-128-BLACK', 25000000, 50, NOW(), NOW()),
('sku-002', 'prod-001', 'IP15P-256-BLACK', 28000000, 30, NOW(), NOW()),
('sku-003', 'prod-001', 'IP15P-128-WHITE', 25000000, 45, NOW(), NOW()),
('sku-004', 'prod-002', 'SGS24-128-BLACK', 20000000, 60, NOW(), NOW()),
('sku-005', 'prod-002', 'SGS24-256-BLUE', 22000000, 40, NOW(), NOW()),
('sku-006', 'prod-003', 'MBPM3-512-SPACE', 45000000, 25, NOW(), NOW()),
('sku-007', 'prod-003', 'MBPM3-1TB-SPACE', 52000000, 15, NOW(), NOW()),
('sku-008', 'prod-004', 'IPAD-AIR-64-SPACE', 18000000, 35, NOW(), NOW()),
('sku-009', 'prod-004', 'IPAD-AIR-256-SPACE', 22000000, 20, NOW(), NOW()),
('sku-010', 'prod-005', 'NIKE-AM-42-BLACK', 3500000, 100, NOW(), NOW()),
('sku-011', 'prod-005', 'NIKE-AM-43-BLACK', 3500000, 80, NOW(), NOW()),
('sku-012', 'prod-006', 'ADIDAS-UB-42-BLUE', 4200000, 75, NOW(), NOW()),
('sku-013', 'prod-006', 'ADIDAS-UB-43-BLUE', 4200000, 65, NOW(), NOW()),
('sku-014', 'prod-007', 'SONY-WH-BLACK', 8500000, 30, NOW(), NOW()),
('sku-015', 'prod-007', 'SONY-WH-WHITE', 8500000, 25, NOW(), NOW()),
('sku-016', 'prod-008', 'LG-OLED-65-BLACK', 35000000, 10, NOW(), NOW());

-- 8. Insert SKU Attribute Options (linking SKUs with specific attributes)
INSERT INTO sku_attribute_options (id, "skuId", "attributeOptionId", "createdAt", "updatedAt") VALUES
-- iPhone 15 Pro SKUs
('sao-001', 'sku-001', 'opt-016', NOW(), NOW()), -- 128GB
('sao-002', 'sku-001', 'opt-001', NOW(), NOW()), -- Black
('sao-003', 'sku-002', 'opt-017', NOW(), NOW()), -- 256GB
('sao-004', 'sku-002', 'opt-001', NOW(), NOW()), -- Black
('sao-005', 'sku-003', 'opt-016', NOW(), NOW()), -- 128GB
('sao-006', 'sku-003', 'opt-002', NOW(), NOW()), -- White

-- Samsung Galaxy S24 SKUs
('sao-007', 'sku-004', 'opt-016', NOW(), NOW()), -- 128GB
('sao-008', 'sku-004', 'opt-001', NOW(), NOW()), -- Black
('sao-009', 'sku-005', 'opt-017', NOW(), NOW()), -- 256GB
('sao-010', 'sku-005', 'opt-003', NOW(), NOW()), -- Blue

-- MacBook Pro SKUs
('sao-011', 'sku-006', 'opt-018', NOW(), NOW()), -- 512GB
('sao-012', 'sku-007', 'opt-020', NOW(), NOW()), -- 1TB

-- iPad Air SKUs
('sao-013', 'sku-008', 'opt-016', NOW(), NOW()), -- 64GB
('sao-014', 'sku-009', 'opt-017', NOW(), NOW()), -- 256GB

-- Nike Shoes SKUs
('sao-015', 'sku-010', 'opt-008', NOW(), NOW()), -- Size 42
('sao-016', 'sku-010', 'opt-001', NOW(), NOW()), -- Black
('sao-017', 'sku-011', 'opt-009', NOW(), NOW()), -- Size 43
('sao-018', 'sku-011', 'opt-001', NOW(), NOW()), -- Black

-- Adidas Shoes SKUs
('sao-019', 'sku-012', 'opt-008', NOW(), NOW()), -- Size 42
('sao-020', 'sku-012', 'opt-003', NOW(), NOW()), -- Blue
('sao-021', 'sku-013', 'opt-009', NOW(), NOW()), -- Size 43
('sao-022', 'sku-013', 'opt-003', NOW(), NOW()), -- Blue

-- Sony Headphones SKUs
('sao-023', 'sku-014', 'opt-001', NOW(), NOW()), -- Black
('sao-024', 'sku-015', 'opt-002', NOW(), NOW()), -- White

-- LG TV SKU
('sao-025', 'sku-016', 'opt-001', NOW(), NOW()); -- Black

-- Display results
SELECT 'Categories created:' as info, COUNT(*) as count FROM categories;
SELECT 'Brands created:' as info, COUNT(*) as count FROM brands;
SELECT 'Attributes created:' as info, COUNT(*) as count FROM attributes;
SELECT 'Attribute options created:' as info, COUNT(*) as count FROM attribute_options;
SELECT 'Products created:' as info, COUNT(*) as count FROM products;
SELECT 'SKUs created:' as info, COUNT(*) as count FROM skus;
SELECT 'SKU attribute options created:' as info, COUNT(*) as count FROM sku_attribute_options;
