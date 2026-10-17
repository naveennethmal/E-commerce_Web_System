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
    $category = $_GET['category'] ?? null;
    $featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : null;
    $search = $_GET['search'] ?? null;
    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = :id AND is_available = 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Product not found']);
            exit;
        }

        // Also fetch gallery images if available
        $imgStmt = $pdo->prepare("SELECT image_url FROM product_images WHERE product_id = :id ORDER BY display_order ASC");
        $imgStmt->execute([':id' => $id]);
        $images = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

        $product = formatProductRow($row, $images);
        echo json_encode(['status' => 'success', 'data' => $product]);
        exit;
    }

    $where = ["is_available = 1"];
    $params = [];

    if ($category && $category !== 'all') {
        $where[] = "category_id = :category";
        $params[':category'] = $category;
    }

    if ($featured) {
        $where[] = "is_featured = 1";
    }

    if ($search) {
        $where[] = "(name LIKE :search OR description LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $whereClause = implode(' AND ', $where);
    $sql = "SELECT * FROM products WHERE {$whereClause} ORDER BY is_featured DESC, name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $products = array_map(function($row) {
        return formatProductRow($row);
    }, $rows);

    echo json_encode([
        'status' => 'success',
        'count' => count($products),
        'data' => $products
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

function formatProductRow(array $row, array $galleryImages = []): array {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'category' => $row['category_id'],
        'category_id' => $row['category_id'],
        'description' => $row['description'],
        'price' => (float)$row['price'],
        'originalPrice' => $row['original_price'] !== null ? (float)$row['original_price'] : null,
        'original_price' => $row['original_price'] !== null ? (float)$row['original_price'] : null,
        'rating' => (float)$row['rating'],
        'reviewsCount' => (int)$row['reviews_count'],
        'reviews_count' => (int)$row['reviews_count'],
        'spicyLevel' => (int)$row['spicy_level'],
        'spicy_level' => (int)$row['spicy_level'],
        'image' => $row['image_url'],
        'image_url' => $row['image_url'],
        'isFeatured' => (bool)$row['is_featured'],
        'is_featured' => (bool)$row['is_featured'],
        'isPopular' => (bool)$row['is_featured'],
        'is_available' => (bool)$row['is_available'],
        'gallery' => $galleryImages
    ];
}
