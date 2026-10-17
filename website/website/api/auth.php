<?php
/**
 * FoodExpress Authentication API Endpoint
 * Handles Login and Registration requests strictly with MySQL PDO and Local Sync Backup
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? 'login';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($action === 'profile' || isset($_GET['user_id']) || isset($_GET['email']) || isset($_GET['id']))) {
    $pdo = Database::getConnection();
    $userId = $_GET['user_id'] ?? $_GET['id'] ?? null;
    $email = $_GET['email'] ?? null;
    
    $user = null;
    if ($pdo && ($userId || $email)) {
        try {
            $stmt = $pdo->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE (id IS NOT NULL AND id = :uid) OR (email IS NOT NULL AND email = :email) LIMIT 1");
            $stmt->execute([':uid' => $userId, ':email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $addrStmt = $pdo->prepare("SELECT address_line, city, postal_code, phone FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC LIMIT 1");
                $addrStmt->execute([$user['id']]);
                $addrRow = $addrStmt->fetch(PDO::FETCH_ASSOC);
                if ($addrRow) {
                    if (isset($addrRow['city']) && strtolower(trim($addrRow['city'])) === 'colombo') {
                        $addrRow['city'] = '';
                    }
                }
                $user['address'] = $addrRow ?: null;

                $orderStmt = $pdo->prepare("SELECT COUNT(*) as total_orders, MAX(created_at) as last_order FROM orders WHERE user_id = ? OR customer_email = ?");
                $orderStmt->execute([$user['id'], $user['email']]);
                $stats = $orderStmt->fetch(PDO::FETCH_ASSOC);
                $user['total_orders'] = $stats['total_orders'] ?? 0;
                $user['last_order'] = $stats['last_order'] ?? null;
            }
        } catch (Exception $e) {}
    }

    if (!$user) {
        $dataDir = __DIR__ . '/../data';
        $usersFile = $dataDir . '/users.json';
        $localUsers = getLocalUsers($usersFile);
        foreach ($localUsers as $lu) {
            if (($userId && isset($lu['id']) && $lu['id'] === $userId) || ($email && strtolower($lu['email'] ?? '') === strtolower($email))) {
                $user = [
                    'id' => $lu['id'] ?? '',
                    'name' => $lu['name'] ?? '',
                    'email' => $lu['email'] ?? '',
                    'phone' => $lu['phone'] ?? '',
                    'role' => $lu['role'] ?? 'customer',
                    'created_at' => $lu['created_at'] ?? date('Y-m-d H:i:s'),
                    'address' => !empty($lu['address']) ? (is_string($lu['address']) ? ['address_line' => $lu['address'], 'city' => ''] : $lu['address']) : null,
                    'total_orders' => 0
                ];
                break;
            }
        }
    }

    if ($user) {
        if (empty($user['address'])) {
            $dataDir = __DIR__ . '/../data';
            $usersFile = $dataDir . '/users.json';
            $localUsers = getLocalUsers($usersFile);
            foreach ($localUsers as $lu) {
                if (strtolower($lu['email'] ?? '') === strtolower($user['email'] ?? '')) {
                    if (!empty($lu['address'])) {
                        $user['address'] = is_string($lu['address']) ? ['address_line' => $lu['address'], 'city' => ''] : $lu['address'];
                    }
                    if (empty($user['phone']) && !empty($lu['phone'])) {
                        $user['phone'] = $lu['phone'];
                    }
                    break;
                }
            }
        }

        echo json_encode(['status' => 'success', 'user' => $user]);
        exit;
    }
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request payload.']);
    exit;
}

// Data directory & users file for sync fallback
$dataDir = __DIR__ . '/../data';
$usersFile = $dataDir . '/users.json';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}

function getLocalUsers(string $file): array {
    if (!file_exists($file)) {
        // Default initial registered seed users
        $initial = [
            [
                'id' => 'usr_admin_default',
                'name' => 'Admin Manager',
                'email' => 'admin@foodexpress.com',
                'password_hash' => password_hash('admin123', PASSWORD_BCRYPT),
                'role' => 'admin'
            ],
            [
                'id' => 'usr_customer_default',
                'name' => 'Food Express Customer',
                'email' => 'customer@foodexpress.com',
                'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
                'role' => 'customer'
            ]
        ];
        file_put_contents($file, json_encode($initial, JSON_PRETTY_PRINT));
        return $initial;
    }
    $content = file_get_contents($file);
    $arr = json_decode($content, true);
    return is_array($arr) ? $arr : [];
}

function saveLocalUser(string $file, array $newUser): void {
    $users = getLocalUsers($file);
    $email = strtolower(trim($newUser['email']));
    $exists = false;
    foreach ($users as &$u) {
        if (strtolower($u['email']) === $email) {
            $u = $newUser;
            $exists = true;
            break;
        }
    }
    if (!$exists) {
        $users[] = $newUser;
    }
    file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT));
}

$pdo = Database::getConnection();

// Ensure users table exists in DB if connected
if ($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `users` (
                `id` VARCHAR(36) NOT NULL,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(150) NOT NULL,
                `password_hash` VARCHAR(255) NOT NULL,
                `phone` VARCHAR(20) NULL,
                `role` VARCHAR(20) DEFAULT 'customer',
                `avatar_url` VARCHAR(255) NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_users_email` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    } catch (Exception $e) {
        // Ignore table creation error if already exists
    }
}

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $phone = trim($input['phone'] ?? '');
    $address = trim($input['address'] ?? '');
    $password = $input['password'] ?? '';
    $role = in_array(($input['role'] ?? ''), ['customer', 'admin']) ? $input['role'] : 'customer';

    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please fill in Name, Email, and Password.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address.']);
        exit;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Password must be at least 6 characters.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $userId = 'usr_' . bin2hex(random_bytes(8));

    // 1. Check if user already exists in MySQL database
    if ($pdo) {
        try {
            $checkStmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
            $checkStmt->execute([$email]);
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'An account with this email already exists. Please log in.'
                ]);
                exit;
            }

            $insertStmt = $pdo->prepare("INSERT INTO users (id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)");
            $insertStmt->execute([$userId, $name, $email, $hash, $phone, $role]);

            if (!empty($address)) {
                try {
                    $addrId = 'addr_' . bin2hex(random_bytes(8));
                    $addrStmt = $pdo->prepare("INSERT INTO user_addresses (id, user_id, address_label, address_line, city, phone, is_default) VALUES (?, ?, 'Home', ?, '', ?, 1)");
                    $addrStmt->execute([$addrId, $userId, $address, $phone]);
                } catch (Exception $e) {}
            }
        } catch (Exception $e) {
            // If duplicate key error caught
            if (strpos($e->getMessage(), 'Duplicate') !== false || $e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'An account with this email already exists. Please log in.'
                ]);
                exit;
            }
        }
    }

    // 2. Also check and save to local sync backup
    $localUsers = getLocalUsers($usersFile);
    foreach ($localUsers as $lu) {
        if (strtolower($lu['email']) === $email) {
            http_response_code(409);
            echo json_encode([
                'status' => 'error',
                'message' => 'An account with this email already exists. Please log in.'
            ]);
            exit;
        }
    }

    $newUserObj = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'address' => $address,
        'password_hash' => $hash,
        'role' => $role
    ];
    saveLocalUser($usersFile, $newUserObj);

    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Account created successfully! You can now log in.',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'address' => $address,
            'role' => $role
        ]
    ]);
    exit;

} else {
    // ==========================================
    // LOGIN ACTION - STRICT AUTHENTICATION
    // ==========================================
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $role = in_array(($input['role'] ?? ''), ['customer', 'admin']) ? $input['role'] : 'customer';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please enter both Email and Password.']);
        exit;
    }

    $foundUser = null;

    // 1. Check in MySQL Database `users` table
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = ?");
            $stmt->execute([$email]);
            $dbUser = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($dbUser) {
                $foundUser = $dbUser;
            } else {
                // User is NOT in the database `users` table -> Strictly deny login
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'error_code' => 'ACCOUNT_NOT_FOUND',
                    'message' => 'No account found with this email in the users database. Please click "Register Here" below to create an account.'
                ]);
                exit;
            }
        } catch (Exception $e) {
            // DB Query error handling
        }
    }

    // 2. Check in Local Users sync file only if DB connection unavailable
    if (!$foundUser) {
        $localUsers = getLocalUsers($usersFile);
        foreach ($localUsers as $lu) {
            if (strtolower($lu['email']) === $email) {
                $foundUser = $lu;
                break;
            }
        }
    }

    // 3. User does NOT exist in users table -> Deny access
    if (!$foundUser) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'error_code' => 'ACCOUNT_NOT_FOUND',
            'message' => 'No account found with this email. Please click "Register Here" below to create an account.'
        ]);
        exit;
    }

    // 4. User exists in users table -> Verify password strictly with password_verify
    $passwordMatches = false;
    if (!empty($foundUser['password_hash'])) {
        if (password_verify($password, $foundUser['password_hash'])) {
            $passwordMatches = true;
        }
    }

    // 5. Password is WRONG -> Deny access
    if (!$passwordMatches) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'error_code' => 'INVALID_PASSWORD',
            'message' => 'Incorrect password. Please verify your password or reset it.'
        ]);
        exit;
    }

    // 6. Credentials correct -> Grant access
    $userRole = $foundUser['role'] ?? $role;
    $savedAddr = null;
    if ($pdo && !empty($foundUser['id'])) {
        try {
            $addrStmt = $pdo->prepare("SELECT address_line, city, postal_code, phone FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC LIMIT 1");
            $addrStmt->execute([$foundUser['id']]);
            $savedAddr = $addrStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (Exception $e) {}
    }

    $localAddress = $foundUser['address'] ?? '';
    if (!$savedAddr) {
        $localUsers = getLocalUsers($usersFile);
        foreach ($localUsers as $lu) {
            if (strtolower($lu['email'] ?? '') === strtolower($foundUser['email'] ?? '')) {
                if (!empty($lu['address'])) {
                    $localAddress = $lu['address'];
                    $savedAddr = ['address_line' => $lu['address'], 'city' => '', 'phone' => $lu['phone'] ?? ''];
                }
                break;
            }
        }
    }

    $finalAddressStr = $savedAddr ? ($savedAddr['address_line'] . (!empty($savedAddr['city']) ? ', ' . $savedAddr['city'] : '')) : (is_string($localAddress) ? $localAddress : '');
    $finalAddressStr = trim(preg_replace('/^[\s,]+|[\s,]+$/', '', $finalAddressStr));

    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful!',
        'user' => [
            'id' => $foundUser['id'],
            'name' => $foundUser['name'],
            'email' => $foundUser['email'],
            'phone' => $foundUser['phone'] ?? ($savedAddr['phone'] ?? ''),
            'address' => $finalAddressStr,
            'role' => $userRole,
            'saved_address' => $savedAddr
        ]
    ]);
    exit;
}
