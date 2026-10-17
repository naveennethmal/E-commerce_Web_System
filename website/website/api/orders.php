<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['items'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid order payload']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $orderId = 'ORD-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
        $rawUserId = $input['user_id'] ?? null;
        
        // Verify if user_id exists in users table, otherwise set NULL
        $userId = null;
        if ($rawUserId) {
            $userCheck = $pdo->prepare("SELECT id FROM users WHERE id = :uid");
            $userCheck->execute([':uid' => $rawUserId]);
            if ($userCheck->fetch()) {
                $userId = $rawUserId;
            }
        }

        $customerName = $input['customer_name'] ?? 'Naveen Nethmal';
        $customerPhone = $input['customer_phone'] ?? '0771234567';
        $customerEmail = $input['customer_email'] ?? 'naveen@example.com';
        $subtotal = (float)($input['subtotal'] ?? 0);
        $deliveryFee = (float)($input['delivery_fee'] ?? 250);
        $discount = (float)($input['discount'] ?? 0);
        $totalAmount = (float)($input['total'] ?? ($subtotal + $deliveryFee - $discount));
        $deliveryAddress = $input['address'] ?? 'Default Delivery Address';
        $city = $input['city'] ?? 'Colombo';
        $paymentMethod = $input['payment_method'] ?? 'cash_on_delivery';
        $promoCode = $input['promo_code'] ?? ($discount > 0 ? 'SPECIAL' : null);

        $stmt = $pdo->prepare("INSERT INTO orders (id, user_id, customer_name, customer_phone, customer_email, delivery_address, city, payment_method, payment_status, order_status, subtotal, delivery_fee, discount_amount, promo_code, total_amount) VALUES (:id, :user_id, :name, :phone, :email, :address, :city, :payment_method, 'pending', 'pending', :subtotal, :delivery_fee, :discount, :promo_code, :total)");
        
        $stmt->execute([
            ':id' => $orderId,
            ':user_id' => $userId,
            ':name' => $customerName,
            ':phone' => $customerPhone,
            ':email' => $customerEmail,
            ':address' => $deliveryAddress,
            ':city' => $city,
            ':payment_method' => $paymentMethod,
            ':subtotal' => $subtotal,
            ':delivery_fee' => $deliveryFee,
            ':discount' => $discount,
            ':promo_code' => $promoCode,
            ':total' => $totalAmount
        ]);

        $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price) VALUES (:order_id, :product_id, :product_name, :price, :qty, :total_price)");

        foreach ($input['items'] as $item) {
            $prodId = $item['id'];
            $prodName = $item['name'] ?? $item['id'];
            $qty = (int)$item['quantity'];
            $unitPrice = (float)$item['price'];
            $itemSubtotal = $qty * $unitPrice;

            $itemStmt->execute([
                ':order_id' => $orderId,
                ':product_id' => $prodId,
                ':product_name' => $prodName,
                ':price' => $unitPrice,
                ':qty' => $qty,
                ':total_price' => $itemSubtotal
            ]);
        }


        // Auto-save user address & phone number for future instant checkouts
        if ($userId) {
            try {
                if (!empty($customerPhone)) {
                    $uStmt = $pdo->prepare("UPDATE users SET phone = ? WHERE id = ?");
                    $uStmt->execute([$customerPhone, $userId]);
                }
                $addrId = 'addr_' . substr(md5($userId), 0, 16);
                $addrStmt = $pdo->prepare("INSERT INTO user_addresses (id, user_id, address_label, address_line, city, phone, is_default) VALUES (?, ?, 'Home', ?, ?, ?, 1) ON DUPLICATE KEY UPDATE address_line = VALUES(address_line), city = VALUES(city), phone = VALUES(phone)");
                $addrStmt->execute([$addrId, $userId, $deliveryAddress, $city, $customerPhone]);
            } catch (Exception $e) {
                // Non-fatal error during address sync
            }
        }

        // Add order status log
        $logStmt = $pdo->prepare("INSERT INTO order_status_logs (order_id, status, notes) VALUES (:order_id, 'pending', 'Order placed via Web Application')");
        $logStmt->execute([':order_id' => $orderId]);

        $pdo->commit();

        echo json_encode([
            'status' => 'success',
            'order_id' => $orderId,
            'message' => 'Order placed successfully and recorded in MySQL database!'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// GET orders
try {
    $userId = $_GET['user_id'] ?? null;
    $email = $_GET['email'] ?? null;

    if ($userId || $email) {
        $stmt = $pdo->prepare("
            SELECT o.* 
            FROM orders o 
            WHERE (o.user_id IS NOT NULL AND o.user_id = :uid) 
               OR (o.customer_email IS NOT NULL AND o.customer_email = :email)
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([':uid' => $userId, ':email' => $email]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($orders as &$order) {
            $itemStmt = $pdo->prepare("
                SELECT oi.*, oi.unit_price as price, p.name as product_name, p.image_url 
                FROM order_items oi 
                LEFT JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            ");
            $itemStmt->execute([$order['id']]);
            $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } else {
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['status' => 'success', 'data' => $orders]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
