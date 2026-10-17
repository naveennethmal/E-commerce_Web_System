<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed'
    ]);
    exit;
}

try {
    $stmt = $pdo->query("SELECT id, name, icon, display_order FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $iconMap = [
        'burgers' => '🍔',
        'pizza' => '🍕',
        'chicken' => '🍗',
        'rice' => '🍚',
        'sandwich' => '🥪',
        'drinks' => '🥤',
        'desserts' => '🧁'
    ];

    foreach ($categories as &$cat) {
        if (isset($iconMap[$cat['id']])) {
            $cat['icon'] = $iconMap[$cat['id']];
        }
    }
    unset($cat);

    echo json_encode([
        'status' => 'success',
        'count' => count($categories),
        'data' => $categories
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
