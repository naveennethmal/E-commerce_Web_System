<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'connected' => false,
        'message' => 'Unable to connect to MySQL database food_express'
    ]);
    exit;
}

try {
    // Get table stats
    $stmt = $pdo->query("SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'food_express'");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get count of products & categories
    $prodStmt = $pdo->query("SELECT COUNT(*) as total_products FROM products");
    $totalProducts = $prodStmt->fetch()['total_products'] ?? 0;

    $catStmt = $pdo->query("SELECT COUNT(*) as total_categories FROM categories");
    $totalCategories = $catStmt->fetch()['total_categories'] ?? 0;

    echo json_encode([
        'status' => 'success',
        'connected' => true,
        'database' => 'food_express',
        'server_time' => date('Y-m-d H:i:s'),
        'total_categories' => (int)$totalCategories,
        'total_products' => (int)$totalProducts,
        'tables' => $tables
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'connected' => false,
        'message' => $e->getMessage()
    ]);
}
