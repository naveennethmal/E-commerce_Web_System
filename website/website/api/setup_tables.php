<?php
/**
 * Food Express Database Table Initializer & Seeder
 * Reads database_mysql.sql and creates all tables in MySQL database
 */

header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbname = 'food_express';

try {
    // 1. Connect to MySQL Server (without selecting DB first)
    $pdo = new PDO("mysql:host={$host};port=3306;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 2. Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbname}`");

    // 3. Read SQL schema file
    $sqlFile = __DIR__ . '/../database_mysql.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL schema file not found at: {$sqlFile}");
    }

    $sql = file_get_contents($sqlFile);

    // Disable foreign key checks before running schema queries
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    
    // Execute SQL script
    $pdo->exec($sql);
    
    // Re-enable foreign key checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Fetch created tables summary
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'status' => 'success',
        'message' => 'Database tables created and seeded successfully!',
        'database' => $dbname,
        'table_count' => count($tables),
        'tables' => $tables
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
