<?php
/**
 * Food Express Contact Message API Endpoint
 * Handles customer contact submissions and stores directly in MySQL `contact_messages` table.
 * Supports both JSON AJAX requests and standard HTML form POST submissions.
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/../config/db.php';

$pdo = Database::getConnection();

// Helper to determine if request expects JSON
$acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
          || (strpos($acceptHeader, 'application/json') !== false)
          || (strpos($contentType, 'application/json') !== false);

if ($isAjax) {
    header('Content-Type: application/json; charset=utf-8');
}

if (!$pdo) {
    $errMsg = 'Database connection failed. Please ensure MySQL is running in XAMPP. Detail: ' . Database::getLastError();
    if ($isAjax) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $errMsg,
            'detail' => Database::getLastError()
        ]);
    } else {
        echo "<script>alert('Error: " . addslashes($errMsg) . "'); window.history.back();</script>";
    }
    exit;
}

// Ensure `contact_messages` table exists in MySQL database
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `contact_messages` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) NOT NULL,
        `phone` VARCHAR(50) DEFAULT NULL,
        `subject` VARCHAR(255) DEFAULT 'General Inquiry',
        `message` TEXT NOT NULL,
        `status` ENUM('unread', 'read', 'replied') DEFAULT 'unread',
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Exception $e) {
    // Continue if already exists
}

try {
    if ($method === 'POST') {
        // 1. Try reading JSON body
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        // 2. Fallback to $_POST if not JSON
        if (!is_array($data) || empty($data)) {
            $data = $_POST;
        }

        $name = trim((string)($data['name'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $phone = trim((string)($data['phone'] ?? ''));
        $subject = trim((string)($data['subject'] ?? ''));
        $message = trim((string)($data['message'] ?? ''));

        if (empty($subject)) {
            $subject = 'General Inquiry';
        }

        // Validate required fields
        if (empty($name) || empty($email) || empty($message)) {
            $msg = 'Please provide all required fields: Name, Email, and Message.';
            if ($isAjax) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $msg]);
            } else {
                echo "<script>alert('" . addslashes($msg) . "'); window.history.back();</script>";
            }
            exit;
        }

        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $msg = 'Please provide a valid email address.';
            if ($isAjax) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => $msg]);
            } else {
                echo "<script>alert('" . addslashes($msg) . "'); window.history.back();</script>";
            }
            exit;
        }

        // Check for duplicate submission within the last 5 seconds from the same email and message
        $dupStmt = $pdo->prepare("SELECT `id`, `created_at` FROM `contact_messages` 
                                  WHERE `email` = :email AND `message` = :message 
                                  AND `created_at` >= (NOW() - INTERVAL 5 SECOND) 
                                  ORDER BY `id` DESC LIMIT 1");
        $dupStmt->execute([
            ':email'   => mb_substr($email, 0, 150),
            ':message' => $message
        ]);
        $existing = $dupStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $insertId = (int)$existing['id'];
        } else {
            // Insert into `contact_messages` table
            $stmt = $pdo->prepare("INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`, `status`, `created_at`) 
                                   VALUES (:name, :email, :phone, :subject, :message, 'unread', NOW())");
            
            $stmt->execute([
                ':name'    => mb_substr($name, 0, 100),
                ':email'   => mb_substr($email, 0, 150),
                ':phone'   => !empty($phone) ? mb_substr($phone, 0, 50) : null,
                ':subject' => mb_substr($subject, 0, 255),
                ':message' => $message
            ]);

            $insertId = (int)$pdo->lastInsertId();
        }

        if ($isAjax) {
            http_response_code(201);
            echo json_encode([
                'status' => 'success',
                'message' => 'Thank you! Your message has been sent successfully. We will get back to you soon.',
                'id' => $insertId,
                'data' => [
                    'id' => $insertId,
                    'name' => $name,
                    'email' => $email,
                    'phone' => $phone,
                    'subject' => $subject,
                    'message' => $message,
                    'status' => 'unread',
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]);
            exit;
        } else {
            // Traditional form submission redirect
            $referer = $_SERVER['HTTP_REFERER'] ?? '../contact.html';
            $delimiter = (strpos($referer, '?') !== false) ? '&' : '?';
            header("Location: {$referer}{$delimiter}status=success&id={$insertId}");
            exit;
        }
    }

    if ($method === 'GET') {
        header('Content-Type: application/json; charset=utf-8');
        $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 50;
        $status = $_GET['status'] ?? null;

        if ($status && in_array($status, ['unread', 'read', 'replied'], true)) {
            $stmt = $pdo->prepare("SELECT * FROM `contact_messages` WHERE `status` = :status ORDER BY `created_at` DESC LIMIT :limit");
            $stmt->bindValue(':status', $status, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM `contact_messages` ORDER BY `created_at` DESC LIMIT :limit");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        }

        $stmt->execute();
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'count' => count($messages),
            'data' => $messages
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);

} catch (PDOException $e) {
    if ($isAjax) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error while processing message: ' . $e->getMessage()
        ]);
    } else {
        echo "<script>alert('Database Error: " . addslashes($e->getMessage()) . "'); window.history.back();</script>";
    }
} catch (Exception $e) {
    if ($isAjax) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'An unexpected error occurred: ' . $e->getMessage()
        ]);
    } else {
        echo "<script>alert('Error: " . addslashes($e->getMessage()) . "'); window.history.back();</script>";
    }
}
