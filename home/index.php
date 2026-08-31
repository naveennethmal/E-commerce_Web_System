<?php
$dbFile = __DIR__ . '/../config/db.php';
$categories = [];
$featuredProducts = [];

if (file_exists($dbFile)) {
    require_once $dbFile;
    if (class_exists('Database')) {
        $pdo = Database::getConnection();
        if ($pdo) {
            try {
                $catStmt = $pdo->query("SELECT id, name, icon FROM categories WHERE is_active = 1 ORDER BY display_order ASC");
                $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

                $prodStmt = $pdo->query("SELECT * FROM products WHERE is_available = 1 AND is_featured = 1 LIMIT 6");
                $featuredProducts = $prodStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Home - Food Express (PHP)</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <link rel="stylesheet" href="../css/main.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <link rel="stylesheet" href="home.css" />
</head>
<body>
  <div class="app-container">
    
    <header class="site-header">
      <div class="header-container">
        <a href="index.php" class="brand-logo">
          <div class="brand-info">
            <div class="brand-name-row">
              <span class="brand-name-food">Food</span>
              <span class="brand-name-express">Express</span>
            </div>
          </div>
        </a>
        <nav class="nav-menu">
          <a href="index.php" class="nav-link active"><span><i class="fa-solid fa-house"></i></span> Home</a>
          <a href="../index.html#menu" class="nav-link"><span><i class="fa-solid fa-utensils"></i></span> Menu</a>
          <a href="../index.html#offers" class="nav-link"><span><i class="fa-solid fa-tags"></i></span> Offers</a>
          <a href="../pages/contact.html" class="nav-link"><span><i class="fa-solid fa-envelope"></i></span> Contact</a>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <?php include __DIR__ . '/home.html'; ?>
    </main>

    <footer class="site-footer">
      <div class="footer-container">
        <p>&copy; <?php echo date('Y'); ?> Food Express. All rights reserved.</p>
      </div>
    </footer>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/cart.js"></script>
  <script src="home.js"></script>
</body>
</html>
