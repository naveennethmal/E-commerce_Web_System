<?php
/**
 * Food Express Image Upload API Endpoint
 * Handles file uploads from admin panel and saves into images/uploads/
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit(0);
}

$uploadDir = __DIR__ . '/../images/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

try {
    $imageUrl = '';

    // Handle Multipart Form File Upload ($_FILES)
    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['image_file']['tmp_name'];
        $fileName = $_FILES['image_file']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid file format. Only JPG, PNG, WEBP, GIF allowed.']);
            exit;
        }

        $newFileName = 'food_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $imageUrl = 'images/uploads/' . $newFileName;
        } else {
            throw new Exception('Failed to save uploaded file to disk.');
        }
    }
    // Handle JSON Base64 Data URL Payload
    else {
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input && !empty($input['base64_data'])) {
            $base64Data = $input['base64_data'];
            
            // Extract extension and data
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, etc.
                if ($type === 'jpeg') $type = 'jpg';
                
                $data = base64_decode($base64Data);
                if ($data === false) {
                    throw new Exception('Base64 decode failed.');
                }
                
                $newFileName = 'food_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $type;
                $destPath = $uploadDir . $newFileName;
                file_put_contents($destPath, $data);
                $imageUrl = 'images/uploads/' . $newFileName;
            } else {
                throw new Exception('Invalid base64 image data.');
            }
        }
    }

    if ($imageUrl) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Image uploaded successfully!',
            'image_url' => $imageUrl
        ]);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'No image file uploaded.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
