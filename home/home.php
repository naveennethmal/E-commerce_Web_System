<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit(0);
}

$response = [
    'status' => 'success',
    'timestamp' => date('c'),
    'hero' => [
        'title' => 'Order Your Favorite Food',
        'subtitle' => 'Delicious meals from the best restaurants, delivered to your doorstep fast and fresh.',
        'image' => '../images/hero_banner.jpg',
        'cta_text' => 'Order Now →',
        'cta_link' => '#menu'
    ],
    'categories' => [],
    'featured_products' => []
];

$dbFile = __DIR__ . '/../config/db.php';
if (file_exists($dbFile)) {
    require_once $dbFile;
    if (class_exists('Database')) {
        $pdo = Database::getConnection();
        if ($pdo) {
            try {
                $catStmt = $pdo->query("SELECT id, name, icon, display_order FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC");
                $response['categories'] = $catStmt->fetchAll(PDO::FETCH_ASSOC);

                $prodStmt = $pdo->query("SELECT * FROM products WHERE is_available = 1 AND is_featured = 1 ORDER BY rating DESC, name ASC LIMIT 6");
                $response['featured_products'] = $prodStmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode($response);
                exit;
            } catch (Exception $e) {
                $response['error_detail'] = $e->getMessage();
            }
        }
    }
}

$response['categories'] = [
    ['id' => 'burgers', 'name' => 'Burgers', 'icon' => '🍔'],
    ['id' => 'pizza', 'name' => 'Pizza', 'icon' => '🍕'],
    ['id' => 'chicken', 'name' => 'Chicken', 'icon' => '🍗'],
    ['id' => 'rice', 'name' => 'Rice Dishes', 'icon' => '🍚'],
    ['id' => 'drinks', 'name' => 'Drinks', 'icon' => '🥤'],
    ['id' => 'desserts', 'name' => 'Desserts', 'icon' => '🧁']
];

$response['featured_products'] = [
    [
        'id' => 1,
        'name' => 'Classic Cheeseburger',
        'category' => 'burgers',
        'description' => 'Juicy beef patty with cheddar, lettuce, tomato, and signature sauce.',
        'price' => 8.99,
        'rating' => 4.8,
        'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        'is_featured' => true
    ],
    [
        'id' => 2,
        'name' => 'Pepperoni Supreme Pizza',
        'category' => 'pizza',
        'description' => 'Loaded with premium pepperoni, mozzarella cheese, and tangy tomato sauce.',
        'price' => 14.50,
        'rating' => 4.9,
        'image' => 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
        'is_featured' => true
    ],
    [
        'id' => 3,
        'name' => 'Crispy Fried Chicken Bucket',
        'category' => 'chicken',
        'description' => 'Golden fried chicken pieces with secret herbs and spices.',
        'price' => 12.99,
        'rating' => 4.7,
        'image' => 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
        'is_featured' => true
    ]
];

echo json_encode($response);
