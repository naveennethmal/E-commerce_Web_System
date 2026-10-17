<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? 'all';
$category = $_GET['category'] ?? null;
$search = $_GET['search'] ?? null;
$sort = $_GET['sort'] ?? 'popular';
$spicyOnly = isset($_GET['spicy']) ? (bool)$_GET['spicy'] : false;

$response = [
    'status' => 'success',
    'timestamp' => date('c'),
    'categories' => [],
    'products' => [],
    'data' => []
];

$dbFile = __DIR__ . '/../config/db.php';
$dbConnected = false;

if (file_exists($dbFile)) {
    require_once $dbFile;
    if (class_exists('Database')) {
        $pdo = Database::getConnection();
        if ($pdo) {
            try {
                // Fetch Categories
                if ($action === 'categories' || $action === 'all') {
                    $catStmt = $pdo->query("SELECT id, name, icon, display_order FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC");
                    $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

                    $iconMap = [
                        'burgers' => '🍔',
                        'pizza' => '🍕',
                        'chicken' => '🍗',
                        'drinks' => '🥤',
                        'desserts' => '🧁'
                    ];
                    foreach ($categories as &$c) {
                        if (isset($iconMap[$c['id']])) {
                            $c['icon'] = $iconMap[$c['id']];
                        }
                    }
                    unset($c);

                    $response['categories'] = $categories;
                }

                // Fetch Products with filters
                if ($action === 'products' || $action === 'all') {
                    $where = ["is_available = 1"];
                    $params = [];

                    if ($category && $category !== 'all') {
                        $where[] = "category_id = :category";
                        $params[':category'] = $category;
                    }

                    if ($search) {
                        $where[] = "(name LIKE :search OR description LIKE :search)";
                        $params[':search'] = '%' . $search . '%';
                    }

                    if ($spicyOnly) {
                        $where[] = "spicy_level > 0";
                    }

                    $orderBy = "is_featured DESC, name ASC";
                    if ($sort === 'rating-desc') {
                        $orderBy = "rating DESC, reviews_count DESC";
                    } elseif ($sort === 'price-asc') {
                        $orderBy = "price ASC";
                    } elseif ($sort === 'price-desc') {
                        $orderBy = "price DESC";
                    } elseif ($sort === 'name-asc') {
                        $orderBy = "name ASC";
                    }

                    $whereClause = implode(' AND ', $where);
                    $sql = "SELECT * FROM products WHERE {$whereClause} ORDER BY {$orderBy}";

                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    $products = array_map(function ($row) {
                        return [
                            'id' => $row['id'],
                            'name' => $row['name'],
                            'category' => $row['category_id'],
                            'category_id' => $row['category_id'],
                            'description' => $row['description'],
                            'price' => (float)$row['price'],
                            'originalPrice' => $row['original_price'] !== null ? (float)$row['original_price'] : null,
                            'rating' => (float)$row['rating'],
                            'reviewsCount' => (int)$row['reviews_count'],
                            'spicyLevel' => (int)$row['spicy_level'],
                            'image' => $row['image_url'],
                            'image_url' => $row['image_url'],
                            'isFeatured' => (bool)$row['is_featured'],
                            'is_available' => (bool)$row['is_available']
                        ];
                    }, $rows);

                    $response['products'] = $products;
                }

                $response['data'] = ($action === 'categories') ? $response['categories'] : $response['products'];
                echo json_encode($response);
                exit;
            } catch (Exception $e) {
                $response['error_detail'] = $e->getMessage();
            }
        }
    }
}

// Fallback sample dataset if database is offline
$response['categories'] = [
    ['id' => 'burgers', 'name' => 'Burgers', 'icon' => '🍔'],
    ['id' => 'pizza', 'name' => 'Pizza', 'icon' => '🍕'],
    ['id' => 'chicken', 'name' => 'Fried Chicken', 'icon' => '🍗'],
    ['id' => 'drinks', 'name' => 'Drinks & Beverages', 'icon' => '🥤'],
    ['id' => 'desserts', 'name' => 'Desserts', 'icon' => '🧁']
];

$response['products'] = [
    // Burgers
    [
        'id' => 'classic-double-cheeseburger',
        'name' => 'Classic Double Cheeseburger',
        'category' => 'burgers',
        'category_id' => 'burgers',
        'description' => 'Two juicy Angus beef patties, melted cheddar cheese, fresh lettuce, pickles, tomatoes, and house sauce on a toasted brioche bun.',
        'price' => 9.99,
        'originalPrice' => 11.99,
        'rating' => 4.9,
        'reviewsCount' => 140,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'smoky-bacon-bbq-burger',
        'name' => 'Smoky Bacon BBQ Burger',
        'category' => 'burgers',
        'category_id' => 'burgers',
        'description' => 'Grilled beef patty topped with crispy bacon, smoked cheddar, crispy onion rings, and tangy hickory BBQ sauce.',
        'price' => 11.50,
        'originalPrice' => 13.50,
        'rating' => 4.8,
        'reviewsCount' => 110,
        'spicyLevel' => 1,
        'image' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'spicy-jalapeno-crunch-burger',
        'name' => 'Spicy Jalapeño Crunch Burger',
        'category' => 'burgers',
        'category_id' => 'burgers',
        'description' => 'Crispy chicken breast patty topped with spicy jalapeños, pepper jack cheese, chipotle mayo, and fresh slaw.',
        'price' => 10.99,
        'rating' => 4.7,
        'reviewsCount' => 85,
        'spicyLevel' => 2,
        'image' => 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    [
        'id' => 'veggie-swiss-burger',
        'name' => 'Garden Veggie & Swiss Burger',
        'category' => 'burgers',
        'category_id' => 'burgers',
        'description' => 'Plant-based black bean patty served with sautéed mushrooms, melted Swiss cheese, avocado, and herb mayo.',
        'price' => 9.50,
        'rating' => 4.6,
        'reviewsCount' => 62,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    // Pizza
    [
        'id' => 'pepperoni-supreme-pizza',
        'name' => 'Pepperoni Supreme Pizza',
        'category' => 'pizza',
        'category_id' => 'pizza',
        'description' => 'Artisanal hand-tossed crust with loaded spicy pepperoni, whole milk mozzarella, and rich tomato marinara sauce.',
        'price' => 14.99,
        'originalPrice' => 17.50,
        'rating' => 4.9,
        'reviewsCount' => 210,
        'spicyLevel' => 1,
        'image' => 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'four-cheese-margherita',
        'name' => 'Four Cheese Margherita Pizza',
        'category' => 'pizza',
        'category_id' => 'pizza',
        'description' => 'Italian stone-baked pizza topped with fresh mozzarella, parmesan, gorgonzola, provolone, and fresh basil leaves.',
        'price' => 13.50,
        'rating' => 4.8,
        'reviewsCount' => 165,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'spicy-buffalo-chicken-pizza',
        'name' => 'Spicy Buffalo Chicken Pizza',
        'category' => 'pizza',
        'category_id' => 'pizza',
        'description' => 'Tender grilled chicken strips tossed in fiery buffalo sauce, drizzled with ranch dressing and green onions.',
        'price' => 15.99,
        'originalPrice' => 18.50,
        'rating' => 4.8,
        'reviewsCount' => 130,
        'spicyLevel' => 2,
        'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'bbq-pulled-pork-pizza',
        'name' => 'BBQ Pulled Pork Pizza',
        'category' => 'pizza',
        'category_id' => 'pizza',
        'description' => 'Slow-cooked tender pulled pork with red onions, cilantro, mozzarella, and sweet BBQ drizzle.',
        'price' => 16.49,
        'rating' => 4.7,
        'reviewsCount' => 95,
        'spicyLevel' => 1,
        'image' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    // Chicken
    [
        'id' => 'crispy-chicken-bucket',
        'name' => 'Crispy Fried Chicken Bucket',
        'category' => 'chicken',
        'category_id' => 'chicken',
        'description' => '8 pieces of golden crispy fried chicken seasoned with our secret blend of 11 herbs and spices.',
        'price' => 13.99,
        'originalPrice' => 16.99,
        'rating' => 4.9,
        'reviewsCount' => 240,
        'spicyLevel' => 1,
        'image' => 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'fiery-buffalo-wings',
        'name' => 'Fiery Buffalo Chicken Wings',
        'category' => 'chicken',
        'category_id' => 'chicken',
        'description' => '10 jumbo chicken wings glazed in spicy hot sauce, served with blue cheese dip and celery sticks.',
        'price' => 11.99,
        'rating' => 4.8,
        'reviewsCount' => 195,
        'spicyLevel' => 3,
        'image' => 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'honey-mustard-tenders',
        'name' => 'Honey Mustard Chicken Tenders',
        'category' => 'chicken',
        'category_id' => 'chicken',
        'description' => '6 hand-breaded crispy tenders served with honey mustard sauce and golden waffle fries.',
        'price' => 10.49,
        'rating' => 4.7,
        'reviewsCount' => 115,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    [
        'id' => 'crunchy-chicken-sandwich',
        'name' => 'Crunchy Chicken Sandwich & Fries',
        'category' => 'chicken',
        'category_id' => 'chicken',
        'description' => 'Extra crispy chicken breast fillet with pickles and garlic mayo on a sesame bun with cajun fries.',
        'price' => 11.50,
        'originalPrice' => 13.00,
        'rating' => 4.8,
        'reviewsCount' => 105,
        'spicyLevel' => 1,
        'image' => 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    // Drinks
    [
        'id' => 'caramel-iced-latte',
        'name' => 'Creamy Caramel Iced Latte',
        'category' => 'drinks',
        'category_id' => 'drinks',
        'description' => 'Rich espresso combined with chilled whole milk, sweet caramel syrup, and a fluffy whipped cream crown.',
        'price' => 4.99,
        'originalPrice' => 5.99,
        'rating' => 4.8,
        'reviewsCount' => 180,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'mango-passionfruit-smoothie',
        'name' => 'Tropical Mango Passionfruit Smoothie',
        'category' => 'drinks',
        'category_id' => 'drinks',
        'description' => 'Freshly blended mango chunks, passionfruit nectar, Greek yogurt, and crushed ice.',
        'price' => 5.49,
        'rating' => 4.9,
        'reviewsCount' => 150,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'classic-cold-brew',
        'name' => 'Classic Cold Brew Coffee',
        'category' => 'drinks',
        'category_id' => 'drinks',
        'description' => 'Smooth 16-hour slow-steeped cold brew coffee served over ice with optional vanilla cream.',
        'price' => 4.25,
        'rating' => 4.7,
        'reviewsCount' => 90,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    [
        'id' => 'lemon-mint-soda',
        'name' => 'Sparkling Lemon Mint Soda',
        'category' => 'drinks',
        'category_id' => 'drinks',
        'description' => 'Refreshing sparkling water infused with fresh lemon juice, crushed mint leaves, and cane sugar.',
        'price' => 3.50,
        'rating' => 4.6,
        'reviewsCount' => 70,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    // Desserts
    [
        'id' => 'chocolate-lava-cake',
        'name' => 'Triple Chocolate Lava Cake',
        'category' => 'desserts',
        'category_id' => 'desserts',
        'description' => 'Decadent dark chocolate cake with a molten warm chocolate center, served with vanilla ice cream.',
        'price' => 6.99,
        'originalPrice' => 8.50,
        'rating' => 4.9,
        'reviewsCount' => 190,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'warm-apple-pie',
        'name' => 'Warm Cinnamon Apple Pie',
        'category' => 'desserts',
        'category_id' => 'desserts',
        'description' => 'Flaky pastry crust filled with spiced apples, cinnamon, and warm brown sugar crumble.',
        'price' => 5.50,
        'rating' => 4.8,
        'reviewsCount' => 125,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ],
    [
        'id' => 'vanilla-bean-sundae',
        'name' => 'Vanilla Bean Sundae',
        'category' => 'desserts',
        'category_id' => 'desserts',
        'description' => 'Artisanal vanilla bean gelato topped with warm salted caramel sauce, toasted pecans, and a cherry.',
        'price' => 5.99,
        'originalPrice' => 6.99,
        'rating' => 4.7,
        'reviewsCount' => 140,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => true
    ],
    [
        'id' => 'strawberry-cheesecake',
        'name' => 'New York Strawberry Cheesecake',
        'category' => 'desserts',
        'category_id' => 'desserts',
        'description' => 'Rich and creamy cheesecake on a Graham cracker crust, topped with fresh strawberry compote.',
        'price' => 6.50,
        'rating' => 4.9,
        'reviewsCount' => 160,
        'spicyLevel' => 0,
        'image' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
        'isFeatured' => false
    ]
];

$response['data'] = ($action === 'categories') ? $response['categories'] : $response['products'];
echo json_encode($response);
