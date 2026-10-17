<?php
// Pure static frontend - no database connection required
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Our Menu - Food Express (PHP)</title>
  <meta name="description" content="Browse our delicious food menu online - Burgers, Pizza, Fried Chicken, Drinks & Desserts." />
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <link rel="stylesheet" href="../css/main.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
  <link rel="stylesheet" href="menu.css" />
</head>
<body>
  <div class="app-container">
    
    <!-- Site Header -->
    <header class="site-header">
      <div class="header-container">
        <a href="../home/index.php" class="brand-logo">
          <div class="brand-info">
            <div class="brand-name-row">
              <span class="brand-name-food">Food</span>
              <span class="brand-name-express">Express</span>
            </div>
          </div>
        </a>
        <nav class="nav-menu">
          <a href="../home/index.php" class="nav-link"><span><i class="fa-solid fa-house"></i></span> Home</a>
          <a href="index.php" class="nav-link active"><span><i class="fa-solid fa-utensils"></i></span> Menu</a>
          <a href="../index.html#offers" class="nav-link"><span><i class="fa-solid fa-tags"></i></span> Offers</a>
          <a href="../pages/contact.html" class="nav-link"><span><i class="fa-solid fa-envelope"></i></span> Contact</a>
        </nav>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="main-content" style="padding: 24px 20px;">
      <?php include __DIR__ . '/menu.html'; ?>
    </main>

    <!-- Site Footer -->
    <footer class="site-footer">
      <div class="footer-container">
        <p>&copy; <?php echo date('Y'); ?> Food Express. All rights reserved.</p>
      </div>
    </footer>
  </div>

  <script src="../js/data.js"></script>
  <script src="../js/cart.js"></script>
  <script src="menu.js"></script>
</body>
</html>
