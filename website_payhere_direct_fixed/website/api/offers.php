<?php
/**
 * Food Express Public Special Offers API Endpoint
 * Serves active promo deals and coupon codes to customer frontend
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit(0);
}

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbname = 'food_express';

try {
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};port=3306;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $action = $_GET['action'] ?? 'active';

    if ($action === 'validate_coupon') {
        $input = json_decode(file_get_contents('php://input'), true);
        $code = strtoupper(trim($input['code'] ?? $_GET['code'] ?? ''));
        $subtotal = (float)($input['subtotal'] ?? $_GET['subtotal'] ?? 0);

        if (empty($code)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Promo code is required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM special_offers WHERE UPPER(code) = ? AND is_active = 1");
        $stmt->execute([$code]);
        $offer = $stmt->fetch();

        if (!$offer) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Invalid or expired promo code']);
            exit;
        }

        $minOrder = (float)$offer['min_order_amount'];
        if ($minOrder > 0 && $subtotal < $minOrder) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error', 
                'message' => "Minimum order of Rs. " . number_format($minOrder, 2) . " required for code '{$code}'"
            ]);
            exit;
        }

        // Calculate discount
        $discountAmount = 0;
        if ($offer['discount_type'] === 'percentage') {
            $discountAmount = ($subtotal * (float)$offer['discount_value']) / 100;
        } elseif ($offer['discount_type'] === 'fixed') {
            $discountAmount = (float)$offer['discount_value'];
        } elseif ($offer['discount_type'] === 'free_delivery') {
            $discountAmount = (float)$offer['discount_value']; // delivery fee waiver
        }

        echo json_encode([
            'status' => 'success',
            'message' => "Promo code '{$code}' applied successfully!",
            'offer' => [
                'id' => $offer['id'],
                'code' => $offer['code'],
                'title' => $offer['title'],
                'badge' => $offer['badge'],
                'discount_type' => $offer['discount_type'],
                'discount_value' => (float)$offer['discount_value'],
                'discount_amount' => round($discountAmount, 2)
            ]
        ]);
    } else {
        // Return active offers list for banners / homepage grid
        $stmt = $pdo->query("SELECT * FROM special_offers WHERE is_active = 1 ORDER BY id ASC");
        $offers = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'data' => $offers
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
