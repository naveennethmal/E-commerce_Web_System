-- Food Express - Complete MySQL / MariaDB Schema DDL & Seed Script
-- Compatible with XAMPP MySQL / MariaDB 10.4+

CREATE DATABASE IF NOT EXISTS `food_express` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `food_express`;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if re-deploying
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `wishlists`;
DROP TABLE IF EXISTS `coupon_usages`;
DROP TABLE IF EXISTS `order_status_logs`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `special_offers`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `product_reviews`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `user_addresses`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ===================================================
-- 1. USERS TABLE
-- ===================================================
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` VARCHAR(20) DEFAULT 'customer',
    `avatar_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 2. USER ADDRESSES TABLE
-- ===================================================
CREATE TABLE `user_addresses` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `address_label` VARCHAR(50) DEFAULT 'Home',
    `address_line` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NULL,
    `phone` VARCHAR(20) NULL,
    `is_default` TINYINT(1) DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_user_addresses_user` (`user_id`),
    CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 3. CATEGORIES TABLE
-- ===================================================
CREATE TABLE `categories` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NOT NULL,
    `display_order` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 4. PRODUCTS TABLE
-- ===================================================
CREATE TABLE `products` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `category_id` VARCHAR(50) NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `original_price` DECIMAL(10, 2) NULL,
    `rating` DECIMAL(3, 2) DEFAULT 4.50,
    `reviews_count` INT DEFAULT 0,
    `spicy_level` INT DEFAULT 0,
    `image_url` TEXT NOT NULL,
    `is_featured` TINYINT(1) DEFAULT 0,
    `is_available` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_products_category` (`category_id`),
    KEY `idx_products_featured` (`is_featured`),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 5. PRODUCT IMAGES TABLE (Gallery Photos)
-- ===================================================
CREATE TABLE `product_images` (
    `id` BIGINT AUTO_INCREMENT NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `image_url` TEXT NOT NULL,
    `display_order` INT DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_product_images_product` (`product_id`),
    CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 6. PRODUCT REVIEWS TABLE
-- ===================================================
CREATE TABLE `product_reviews` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `rating` INT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
    `comment` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_reviews_product` (`product_id`),
    KEY `idx_product_reviews_user` (`user_id`),
    CONSTRAINT `fk_product_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_product_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 7. CART ITEMS TABLE (Persistent Shopping Carts)
-- ===================================================
CREATE TABLE `cart_items` (
    `user_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `quantity` INT DEFAULT 1 CHECK (`quantity` > 0),
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `product_id`),
    KEY `idx_cart_items_product` (`product_id`),
    CONSTRAINT `fk_cart_items_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 8. SPECIAL OFFERS TABLE (Promotions & Coupons)
-- ===================================================
CREATE TABLE `special_offers` (
    `id` VARCHAR(50) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `subtitle` VARCHAR(150) NULL,
    `badge` VARCHAR(50) NULL,
    `discount_type` VARCHAR(20) NOT NULL,
    `discount_value` DECIMAL(10, 2) DEFAULT 0.00,
    `min_order_amount` DECIMAL(10, 2) DEFAULT 0.00,
    `product_ids` TEXT NULL,
    `image_url` VARCHAR(255) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_special_offers_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 9. ORDERS TABLE
-- ===================================================
CREATE TABLE `orders` (
    `id` VARCHAR(30) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_phone` VARCHAR(20) NOT NULL,
    `customer_email` VARCHAR(150) NOT NULL,
    `delivery_address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NULL,
    `payment_method` VARCHAR(20) NOT NULL,
    `payment_status` VARCHAR(20) DEFAULT 'pending',
    `order_status` VARCHAR(20) DEFAULT 'pending',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `delivery_fee` DECIMAL(10, 2) DEFAULT 250.00,
    `discount_amount` DECIMAL(10, 2) DEFAULT 0.00,
    `promo_code` VARCHAR(30) NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `special_notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_orders_user` (`user_id`),
    KEY `idx_orders_status` (`order_status`),
    CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 10. ORDER ITEMS TABLE
-- ===================================================
CREATE TABLE `order_items` (
    `id` BIGINT AUTO_INCREMENT NOT NULL,
    `order_id` VARCHAR(30) NOT NULL,
    `product_id` VARCHAR(50) NULL,
    `product_name` VARCHAR(150) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_order_items_order` (`order_id`),
    KEY `idx_order_items_product` (`product_id`),
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 11. ORDER STATUS LOGS TABLE (Tracking Timeline)
-- ===================================================
CREATE TABLE `order_status_logs` (
    `id` BIGINT AUTO_INCREMENT NOT NULL,
    `order_id` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_order_status_logs_order` (`order_id`),
    CONSTRAINT `fk_order_status_logs_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 12. COUPON USAGES TABLE
-- ===================================================
CREATE TABLE `coupon_usages` (
    `id` VARCHAR(36) NOT NULL,
    `coupon_id` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(30) NOT NULL,
    `discount_applied` DECIMAL(10, 2) NOT NULL,
    `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_coupon_usages_coupon` (`coupon_id`),
    KEY `idx_coupon_usages_user` (`user_id`),
    KEY `idx_coupon_usages_order` (`order_id`),
    CONSTRAINT `fk_coupon_usages_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `special_offers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_coupon_usages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_coupon_usages_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 13. WISHLISTS TABLE
-- ===================================================
CREATE TABLE `wishlists` (
    `user_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `product_id`),
    KEY `idx_wishlists_product` (`product_id`),
    CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wishlists_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 14. NOTIFICATIONS TABLE
-- ===================================================
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notifications_user` (`user_id`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- SAMPLE DATA SEEDING
-- ===================================================

-- 1. Seed Users
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`, `avatar_url`) VALUES
('e04c86a1-3091-4e78-8314-72e92c286001', 'Admin User', 'admin@foodexpress.com', '$2y$10$CPTbcObsSUn58A5frHiuSOBLVAQAxTMaUXF6l2yQRllsLzqle935a', '+94 77 123 4567', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'),
('e04c86a1-3091-4e78-8314-72e92c286002', 'John Doe', 'customer@foodexpress.com', '$2y$10$QraD6W9u4T8hlrldFqrDJ.LriC4n6K/QAqLgecC8zP.zqbcO./ctO', '+94 71 987 6543', 'customer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `password_hash` = VALUES(`password_hash`);

-- 2. Seed User Addresses
INSERT INTO `user_addresses` (`id`, `user_id`, `address_label`, `address_line`, `city`, `postal_code`, `phone`, `is_default`) VALUES
('a01c86a1-3091-4e78-8314-72e92c286001', 'e04c86a1-3091-4e78-8314-72e92c286002', 'Home', 'No. 45, Galle Road, Bambalapitiya', 'Colombo', '00400', '+94 71 987 6543', 1),
('a01c86a1-3091-4e78-8314-72e92c286002', 'e04c86a1-3091-4e78-8314-72e92c286002', 'Work', 'Level 12, World Trade Center', 'Colombo', '00100', '+94 71 987 6543', 0)
ON DUPLICATE KEY UPDATE `address_line` = VALUES(`address_line`);

-- 3. Seed Categories
INSERT INTO `categories` (`id`, `name`, `icon`, `display_order`, `is_active`) VALUES
('burgers', 'Burgers', '🍔', 1, 1),
('pizza', 'Pizza', '🍕', 2, 1),
('chicken', 'Chicken', '🍗', 3, 1),
('rice', 'Rice', '🍚', 4, 1),
('sandwich', 'Sandwich', '🥪', 5, 1),
('drinks', 'Drinks', '🥤', 6, 1),
('desserts', 'Desserts', '🧁', 7, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `icon` = VALUES(`icon`);

-- 4. Seed Products
INSERT INTO `products` (`id`, `name`, `category_id`, `description`, `price`, `original_price`, `rating`, `reviews_count`, `spicy_level`, `image_url`, `is_featured`, `is_available`) VALUES
('chicken-burger', 'Chicken Burger', 'burgers', 'Juicy chicken patty with fresh vegetables', 1490.00, 1950.00, 4.50, 120, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 1, 1),
('beef-burger', 'Beef Burger', 'burgers', 'Grilled beef patty with cheese and special sauce', 1790.00, NULL, 4.60, 98, 2, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', 1, 1),
('double-beef-burger', 'Double Beef Burger', 'burgers', 'Double beef patties with extra cheese and veggies', 2250.00, NULL, 4.70, 76, 2, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80', 0, 1),
('spicy-chicken-burger', 'Spicy Chicken Burger', 'burgers', 'Spicy crispy chicken with lettuce and mayo', 1490.00, NULL, 4.40, 85, 3, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80', 0, 1),
('french-fries', 'French Fries', 'burgers', 'Crispy golden fries served hot and salted', 890.00, NULL, 4.40, 110, 0, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 1, 1),

('margherita-pizza', 'Margherita Pizza', 'pizza', 'Classic pizza with fresh tomato and cheese', 2690.00, 3290.00, 4.70, 98, 1, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80', 1, 1),
('pepperoni-pizza', 'Pepperoni Pizza', 'pizza', 'Cheese pizza topped with savory pepperoni', 2990.00, NULL, 4.60, 87, 1, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80', 1, 1),
('bbq-chicken-pizza', 'BBQ Chicken Pizza', 'pizza', 'Tender grill chicken with smoky BBQ sauce, red onions & mozzarella', 3290.00, NULL, 4.80, 112, 2, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', 1, 1),
('veggie-supreme-pizza', 'Veggie Supreme Pizza', 'pizza', 'Loaded with bell peppers, mushrooms, olives, onions & sweetcorn', 2790.00, NULL, 4.60, 94, 0, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 0, 1),
('four-cheese-pizza', 'Four Cheese Pizza', 'pizza', 'Rich blend of mozzarella, cheddar, parmesan & gorgonzola', 3490.00, NULL, 4.90, 130, 0, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', 1, 1),

('fried-chicken', 'Fried Chicken', 'chicken', 'Crispy and delicious chicken pieces', 2090.00, NULL, 4.60, 142, 2, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80', 1, 1),
('peri-peri-chicken', 'Grilled Peri Peri Chicken', 'chicken', 'Flame-grilled quarter chicken marinated in spicy African peri-peri herbs', 2490.00, NULL, 4.80, 156, 3, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80', 1, 1),
('chicken-tenders', 'Crispy Chicken Tenders', 'chicken', 'Golden fried boneless chicken strips served with honey mustard dip', 1890.00, NULL, 4.70, 118, 1, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80', 1, 1),
('buffalo-wings', 'Spicy Buffalo Wings', 'chicken', 'Crispy wings tossed in fiery tangy buffalo sauce with ranch dip', 2190.00, NULL, 4.90, 175, 3, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80', 0, 1),
('chicken-tikka', 'Chicken Tikka Skewers', 'chicken', 'Tandoori spiced juicy chicken breast cubes charred to perfection with mint chutney', 2290.00, NULL, 4.80, 104, 3, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80', 1, 1),

('coca-cola', 'Coca Cola', 'drinks', 'Chilled refreshing drink with ice', 590.00, NULL, 4.30, 89, 0, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', 1, 1),
('mango-smoothie', 'Fresh Mango Passion Smoothie', 'drinks', 'Blended real Alphonso mangoes, passion fruit juice & crushed ice', 890.00, NULL, 4.90, 145, 0, 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80', 1, 1),
('iced-latte', 'Iced Spanish Milk Coffee', 'drinks', 'Double shot espresso with condensed milk, fresh cold milk & ice', 990.00, NULL, 4.80, 162, 0, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80', 1, 1),
('berry-mojito', 'Berry Mint Mojito', 'drinks', 'Cooling crushed mint, fresh lime, mixed berries & sparkling soda', 790.00, NULL, 4.70, 108, 0, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 0, 1),
('chocolate-milkshake', 'Chocolate Fudge Milkshake', 'drinks', 'Decadent Belgian chocolate ice cream blended with whipped cream & chocolate drizzle', 1090.00, NULL, 4.90, 180, 0, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', 1, 1),

('chicken-rice', 'Special Fried Rice', 'rice', 'Flavorful fried rice with tender chicken & vegetables', 1950.00, NULL, 4.50, 64, 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 0, 1),
('chicken-biryani', 'Hyderabadi Chicken Biryani', 'rice', 'Aromatic basmati rice cooked with marinated spiced chicken, saffron & fried onions', 2390.00, NULL, 4.90, 188, 2, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', 1, 1),
('nasi-goreng', 'Seafood Nasi Goreng', 'rice', 'Indonesian style fried rice with prawns, squid, topped with a fried egg & prawn crackers', 2490.00, NULL, 4.80, 142, 2, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80', 1, 1),
('mongolian-rice', 'Mongolian Mixed Rice', 'rice', 'Spicy wok-tossed fried rice loaded with chicken, beef, egg & crisp veggies', 2250.00, NULL, 4.70, 98, 2, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', 0, 1),
('butter-chicken-rice', 'Butter Chicken Rice Bowl', 'rice', 'Rich creamy butter chicken served over steaming hot fragrant jasmine rice', 2190.00, NULL, 4.80, 125, 1, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80', 1, 1),

('club-sandwich', 'Club Sandwich', 'sandwich', 'Triple-decker sandwich with chicken, egg & cheese', 1350.00, NULL, 4.40, 52, 1, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 0, 1),
('bbq-beef-sub', 'Grilled BBQ Beef Sub', 'sandwich', 'Smoky grilled beef strips, melted cheddar cheese & caramelized onions in toasted baguette', 1690.00, NULL, 4.80, 114, 1, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', 1, 1),
('chicken-panini', 'Cheesy Chicken Panini', 'sandwich', 'Pressed ciabatta bread stuffed with herb grilled chicken, mozzarella & basil pesto', 1490.00, NULL, 4.70, 86, 1, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=800&q=80', 1, 1),
('avocado-veggie-sandwich', 'Avocado & Veggie Toastie', 'sandwich', 'Sourdough toast layered with fresh avocado mash, cucumber, tomatoes & feta cheese', 1290.00, NULL, 4.60, 72, 0, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', 0, 1),

('pink-cupcake', 'Strawberry Cupcake', 'desserts', 'Sweet frosted pink cupcake with a cherry on top', 1050.00, NULL, 4.80, 115, 0, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 0, 1),
('chocolate-lava-cake', 'Molten Chocolate Lava Cake', 'desserts', 'Warm dark chocolate cake with a rich oozing molten chocolate center', 1390.00, NULL, 4.90, 198, 0, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 1, 1),
('ny-cheesecake', 'New York Cheesecake', 'desserts', 'Classic dense & creamy baked cheesecake with a buttery graham cracker crust & berry compote', 1490.00, NULL, 4.90, 164, 0, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 1, 1),
('cinnamon-churros', 'Crispy Cinnamon Churros', 'desserts', 'Golden fried Spanish churros dusted with cinnamon sugar served with warm dark chocolate dip', 1190.00, NULL, 4.70, 122, 0, 'images/cinnamon_churros.png', 1, 1),
('tiramisu-slice', 'Classic Italian Tiramisu', 'desserts', 'Traditional espresso-soaked ladyfingers layered with creamy mascarpone & cocoa powder', 1290.00, NULL, 4.80, 140, 0, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 1, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

-- 5. Seed Special Offers
INSERT INTO `special_offers` (`id`, `code`, `title`, `subtitle`, `badge`, `discount_type`, `discount_value`, `min_order_amount`, `product_ids`, `image_url`, `is_active`) VALUES
('burger-combo', 'BURGER31', 'BURGER COMBO', 'Burger + Fries + Drink', 'BEST DEAL', 'percentage', 20.00, 0.00, '["chicken-burger","french-fries","coca-cola"]', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80', 1),
('pizza-fest', 'PIZZA25', 'PIZZA FEST', 'Any Medium Pizza Up to 25% OFF', 'HOT OFFER', 'percentage', 25.00, 2000.00, '["margherita-pizza","pepperoni-pizza"]', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80', 1),
('free-delivery', 'FREE15', 'FREE DELIVERY', 'On orders over Rs. 4,500', 'FREE DELIVERY', 'free_delivery', 250.00, 4500.00, '[]', 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&w=800&q=80', 1),
('dessert-special', 'SWEET20', 'DESSERT SPECIAL', 'Buy any dessert & get 20% OFF', 'SWEET DEAL', 'percentage', 20.00, 1000.00, '["chocolate-lava-cake","ny-cheesecake"]', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `code` = VALUES(`code`), `product_ids` = VALUES(`product_ids`), `image_url` = VALUES(`image_url`);

-- 6. Seed Cart Items (Demo Customer persistent cart)
INSERT INTO `cart_items` (`user_id`, `product_id`, `quantity`) VALUES
('e04c86a1-3091-4e78-8314-72e92c286002', 'chicken-burger', 1),
('e04c86a1-3091-4e78-8314-72e92c286002', 'french-fries', 1),
('e04c86a1-3091-4e78-8314-72e92c286002', 'coca-cola', 1)
ON DUPLICATE KEY UPDATE `quantity` = VALUES(`quantity`);

-- 7. Seed Wishlists
INSERT INTO `wishlists` (`user_id`, `product_id`) VALUES
('e04c86a1-3091-4e78-8314-72e92c286002', 'margherita-pizza'),
('e04c86a1-3091-4e78-8314-72e92c286002', 'chocolate-lava-cake')
ON DUPLICATE KEY UPDATE `created_at` = VALUES(`created_at`);

-- 8. Seed Sample Order
INSERT INTO `orders` (`id`, `user_id`, `customer_name`, `customer_phone`, `customer_email`, `delivery_address`, `city`, `postal_code`, `payment_method`, `payment_status`, `order_status`, `subtotal`, `delivery_fee`, `discount_amount`, `promo_code`, `total_amount`, `special_notes`) VALUES
('#FE-892401', 'e04c86a1-3091-4e78-8314-72e92c286002', 'John Doe', '+94 71 987 6543', 'customer@foodexpress.com', 'No. 45, Galle Road, Bambalapitiya', 'Colombo', '00400', 'cod', 'pending', 'preparing', 2970.00, 250.00, 0.00, NULL, 3220.00, 'Please add extra chili flakes.')
ON DUPLICATE KEY UPDATE `order_status` = VALUES(`order_status`);

-- 9. Seed Sample Order Items
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `total_price`) VALUES
('#FE-892401', 'chicken-burger', 'Chicken Burger', 1490.00, 1, 1490.00),
('#FE-892401', 'french-fries', 'French Fries', 890.00, 1, 890.00),
('#FE-892401', 'coca-cola', 'Coca Cola', 590.00, 1, 590.00);

-- 10. Seed Sample Order Status Log
INSERT INTO `order_status_logs` (`order_id`, `status`, `notes`) VALUES
('#FE-892401', 'pending', 'Order placed successfully by customer.'),
('#FE-892401', 'preparing', 'Kitchen accepted order and started preparing food.');

-- 11. Seed Sample Product Images (Gallery)
INSERT INTO `product_images` (`product_id`, `image_url`, `display_order`) VALUES
('chicken-burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 1),
('chicken-burger', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', 2),
('margherita-pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80', 1),
('margherita-pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80', 2);

-- 12. Seed Sample Notification
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`) VALUES
('n01c86a1-3091-4e78-8314-72e92c286001', 'e04c86a1-3091-4e78-8314-72e92c286002', 'Order Confirmed!', 'Your order #FE-892401 has been confirmed and is being prepared.', 0);

-- -------------------------------------------------------------
-- 13. Table Structure: `contact_messages`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `subject` VARCHAR(255) DEFAULT 'Customer Inquiry',
    `message` TEXT NOT NULL,
    `status` ENUM('unread', 'read', 'replied') DEFAULT 'unread',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Seed Sample Contact Messages
INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`, `status`) VALUES
('Kavindu Perera', 'kavindu@gmail.com', '+94 77 123 4567', 'Delivery Area Question', 'Do you deliver to Maharagama area late at night?', 'read'),
('Ayesha Fernando', 'ayesha.f@hotmail.com', '+94 71 987 6543', 'Bulk Catering Inquiry', 'We would like to order 50 burgers for a corporate event next Friday. How do we proceed?', 'unread');

