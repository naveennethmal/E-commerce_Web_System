<?php
/**
 * Food Express Database Connection Handler
 * MySQL / MariaDB PDO Connection Script with Robust Multi-Host Fallback
 */

class Database {
    private static string $host = '127.0.0.1';
    private static string $db_name = 'food_express';
    private static string $username = 'root';
    private static string $password = '';
    private static int $port = 3306;
    private static ?PDO $instance = null;
    public static string $lastError = '';

    public static function getConnection(): ?PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $configs = [
            ['host' => '127.0.0.1', 'port' => 3306],
            ['host' => 'localhost', 'port' => 3306],
            ['host' => '127.0.0.1', 'port' => 3307],
            ['host' => 'localhost', 'port' => 3307]
        ];

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        foreach ($configs as $cfg) {
            $h = $cfg['host'];
            $p = $cfg['port'];
            try {
                // First try connecting with database selected
                $dsn = "mysql:host={$h};port={$p};dbname=" . self::$db_name . ";charset=utf8mb4";
                $pdo = new PDO($dsn, self::$username, self::$password, $options);
                self::$instance = $pdo;
                self::$lastError = '';
                return self::$instance;
            } catch (PDOException $e) {
                // If database doesn't exist, try connecting to MySQL server and create it
                if ($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
                    try {
                        $serverDsn = "mysql:host={$h};port={$p};charset=utf8mb4";
                        $serverPdo = new PDO($serverDsn, self::$username, self::$password, $options);
                        $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `" . self::$db_name . "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                        
                        $dsn = "mysql:host={$h};port={$p};dbname=" . self::$db_name . ";charset=utf8mb4";
                        $pdo = new PDO($dsn, self::$username, self::$password, $options);
                        self::$instance = $pdo;
                        self::$lastError = '';
                        return self::$instance;
                    } catch (PDOException $createEx) {
                        self::$lastError = $createEx->getMessage();
                    }
                } else {
                    self::$lastError = $e->getMessage();
                }
            }
        }

        error_log("Database Connection Error: " . self::$lastError);
        return null;
    }

    public function connect(): ?PDO {
        return self::getConnection();
    }

    public static function getLastError(): string {
        return self::$lastError;
    }
}
