if (typeof window !== 'undefined' && typeof window.escapeHtml === 'undefined') {
  window.escapeHtml = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
}

const FOOD_CATEGORIES = [
  { id: 'all', name: 'All', icon: '<i class="fa-solid fa-utensils"></i>' },
  { id: 'burgers', name: 'Burgers', icon: '<i class="fa-solid fa-burger"></i>' },
  { id: 'pizza', name: 'Pizza', icon: '<i class="fa-solid fa-pizza-slice"></i>' },
  { id: 'chicken', name: 'Chicken', icon: '<i class="fa-solid fa-drumstick-bite"></i>' },
  { id: 'rice', name: 'Rice', icon: '<i class="fa-solid fa-bowl-rice"></i>' },
  { id: 'sandwich', name: 'Sandwich', icon: '<i class="fa-solid fa-bread-slice"></i>' },
  { id: 'drinks', name: 'Drinks', icon: '<i class="fa-solid fa-wine-glass"></i>' },
  { id: 'desserts', name: 'Desserts', icon: '<i class="fa-solid fa-cake-candles"></i>' }
];

const FOOD_ITEMS = [
  {
    id: 'chicken-burger',
    name: 'Chicken Burger',
    category: 'burgers',
    description: 'Juicy chicken patty with fresh vegetables',
    price: 1490,
    originalPrice: 1950,
    rating: 4.5,
    reviewsCount: 120,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    isPopular: true
  },
  {
    id: 'beef-burger',
    name: 'Beef Burger',
    category: 'burgers',
    description: 'Grilled beef patty with cheese and special sauce',
    price: 1790,
    rating: 4.6,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'double-beef-burger',
    name: 'Double Beef Burger',
    category: 'burgers',
    description: 'Double beef patties with extra cheese and veggies',
    price: 2250,
    rating: 4.7,
    reviewsCount: 76,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'spicy-chicken-burger',
    name: 'Spicy Chicken Burger',
    category: 'burgers',
    description: 'Spicy crispy chicken with lettuce and mayo',
    price: 1490,
    rating: 4.4,
    reviewsCount: 85,
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    category: 'pizza',
    description: 'Classic pizza with fresh tomato and cheese',
    price: 2690,
    originalPrice: 3290,
    rating: 4.7,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'pepperoni-pizza',
    name: 'Pepperoni Pizza',
    category: 'pizza',
    description: 'Cheese pizza topped with savory pepperoni',
    price: 2990,
    rating: 4.6,
    reviewsCount: 87,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'bbq-chicken-pizza',
    name: 'BBQ Chicken Pizza',
    category: 'pizza',
    description: 'Tender grill chicken with smoky BBQ sauce, red onions & mozzarella',
    price: 3290,
    rating: 4.8,
    reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'veggie-supreme-pizza',
    name: 'Veggie Supreme Pizza',
    category: 'pizza',
    description: 'Loaded with bell peppers, mushrooms, olives, onions & sweetcorn',
    price: 2790,
    rating: 4.6,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'four-cheese-pizza',
    name: 'Four Cheese Pizza',
    category: 'pizza',
    description: 'Rich blend of mozzarella, cheddar, parmesan & gorgonzola',
    price: 3490,
    rating: 4.9,
    reviewsCount: 130,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'fried-chicken',
    name: 'Fried Chicken',
    category: 'chicken',
    description: 'Crispy and delicious chicken pieces',
    price: 2090,
    rating: 4.6,
    reviewsCount: 142,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'peri-peri-chicken',
    name: 'Grilled Peri Peri Chicken',
    category: 'chicken',
    description: 'Flame-grilled quarter chicken marinated in spicy African peri-peri herbs',
    price: 2490,
    rating: 4.8,
    reviewsCount: 156,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'chicken-tenders',
    name: 'Crispy Chicken Tenders',
    category: 'chicken',
    description: 'Golden fried boneless chicken strips served with honey mustard dip',
    price: 1890,
    rating: 4.7,
    reviewsCount: 118,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'buffalo-wings',
    name: 'Spicy Buffalo Wings',
    category: 'chicken',
    description: 'Crispy wings tossed in fiery tangy buffalo sauce with ranch dip',
    price: 2190,
    rating: 4.9,
    reviewsCount: 175,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'chicken-tikka',
    name: 'Chicken Tikka Skewers',
    category: 'chicken',
    description: 'Tandoori spiced juicy chicken breast cubes charred to perfection with mint chutney',
    price: 2290,
    rating: 4.8,
    reviewsCount: 104,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'french-fries',
    name: 'French Fries',
    category: 'burgers',
    description: 'Crispy golden fries served hot and salted',
    price: 890,
    rating: 4.4,
    reviewsCount: 110,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'coca-cola',
    name: 'Coca Cola',
    category: 'drinks',
    description: 'Chilled refreshing drink with ice',
    price: 590,
    rating: 4.3,
    reviewsCount: 89,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'mango-smoothie',
    name: 'Fresh Mango Passion Smoothie',
    category: 'drinks',
    description: 'Blended real Alphonso mangoes, passion fruit juice & crushed ice',
    price: 890,
    rating: 4.9,
    reviewsCount: 145,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'iced-latte',
    name: 'Iced Spanish Milk Coffee',
    category: 'drinks',
    description: 'Double shot espresso with condensed milk, fresh cold milk & ice',
    price: 990,
    rating: 4.8,
    reviewsCount: 162,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'berry-mojito',
    name: 'Berry Mint Mojito',
    category: 'drinks',
    description: 'Cooling crushed mint, fresh lime, mixed berries & sparkling soda',
    price: 790,
    rating: 4.7,
    reviewsCount: 108,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'chocolate-milkshake',
    name: 'Chocolate Fudge Milkshake',
    category: 'drinks',
    description: 'Decadent Belgian chocolate ice cream blended with whipped cream & chocolate drizzle',
    price: 1090,
    rating: 4.9,
    reviewsCount: 180,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'chicken-rice',
    name: 'Special Fried Rice',
    category: 'rice',
    description: 'Flavorful fried rice with tender chicken & vegetables',
    price: 1950,
    rating: 4.5,
    reviewsCount: 64,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'chicken-biryani',
    name: 'Hyderabadi Chicken Biryani',
    category: 'rice',
    description: 'Aromatic basmati rice cooked with marinated spiced chicken, saffron & fried onions',
    price: 2390,
    rating: 4.9,
    reviewsCount: 188,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'nasi-goreng',
    name: 'Seafood Nasi Goreng',
    category: 'rice',
    description: 'Indonesian style fried rice with prawns, squid, topped with a fried egg & prawn crackers',
    price: 2490,
    rating: 4.8,
    reviewsCount: 142,
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'mongolian-rice',
    name: 'Mongolian Mixed Rice',
    category: 'rice',
    description: 'Spicy wok-tossed fried rice loaded with chicken, beef, egg & crisp veggies',
    price: 2250,
    rating: 4.7,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'butter-chicken-rice',
    name: 'Butter Chicken Rice Bowl',
    category: 'rice',
    description: 'Rich creamy butter chicken served over steaming hot fragrant jasmine rice',
    price: 2190,
    rating: 4.8,
    reviewsCount: 125,
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'club-sandwich',
    name: 'Club Sandwich',
    category: 'sandwich',
    description: 'Triple-decker sandwich with chicken, egg & cheese',
    price: 1350,
    rating: 4.4,
    reviewsCount: 52,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'bbq-beef-sub',
    name: 'Grilled BBQ Beef Sub',
    category: 'sandwich',
    description: 'Smoky grilled beef strips, melted cheddar cheese & caramelized onions in toasted baguette',
    price: 1690,
    rating: 4.8,
    reviewsCount: 114,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'chicken-panini',
    name: 'Cheesy Chicken Panini',
    category: 'sandwich',
    description: 'Pressed ciabatta bread stuffed with herb grilled chicken, mozzarella & basil pesto',
    price: 1490,
    rating: 4.7,
    reviewsCount: 86,
    image: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'avocado-veggie-sandwich',
    name: 'Avocado & Veggie Toastie',
    category: 'sandwich',
    description: 'Sourdough toast layered with fresh avocado mash, cucumber, tomatoes & feta cheese',
    price: 1290,
    rating: 4.6,
    reviewsCount: 72,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'pink-cupcake',
    name: 'Strawberry Cupcake',
    category: 'desserts',
    description: 'Sweet frosted pink cupcake with a cherry on top',
    price: 1050,
    rating: 4.8,
    reviewsCount: 115,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    isFeatured: false
  },
  {
    id: 'chocolate-lava-cake',
    name: 'Molten Chocolate Lava Cake',
    category: 'desserts',
    description: 'Warm dark chocolate cake with a rich oozing molten chocolate center',
    price: 1390,
    rating: 4.9,
    reviewsCount: 198,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'ny-cheesecake',
    name: 'New York Cheesecake',
    category: 'desserts',
    description: 'Classic dense & creamy baked cheesecake with a buttery graham cracker crust & berry compote',
    price: 1490,
    rating: 4.9,
    reviewsCount: 164,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  },
  {
    id: 'cinnamon-churros',
    name: 'Crispy Cinnamon Churros',
    category: 'desserts',
    description: 'Golden fried Spanish churros dusted with cinnamon sugar served with warm dark chocolate dip',
    price: 1190,
    rating: 4.7,
    reviewsCount: 122,
    image: 'images/cinnamon_churros.png',
    isFeatured: true
  },
  {
    id: 'tiramisu-slice',
    name: 'Classic Italian Tiramisu',
    category: 'desserts',
    description: 'Traditional espresso-soaked ladyfingers layered with creamy mascarpone & cocoa powder',
    price: 1290,
    rating: 4.8,
    reviewsCount: 140,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    isFeatured: true
  }
];

const SPECIAL_OFFERS = [
  {
    id: 'burger-combo',
    code: 'BURGER31',
    title: 'BURGER COMBO',
    subtitle: 'Burger + Fries + Drink',
    badge: 'BEST DEAL',
    discount_type: 'percentage',
    discount_value: 20.00,
    min_order_amount: 0.00,
    product_ids: ['chicken-burger', 'french-fries', 'coca-cola'],
    image_url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
    is_active: 1
  },
  {
    id: 'pizza-fest',
    code: 'PIZZA25',
    title: 'PIZZA FEST',
    subtitle: 'Any Medium Pizza Up to 25% OFF',
    badge: 'HOT OFFER',
    discount_type: 'percentage',
    discount_value: 25.00,
    min_order_amount: 2000.00,
    product_ids: ['margherita-pizza', 'pepperoni-pizza'],
    image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    is_active: 1
  },
  {
    id: 'free-delivery',
    code: 'FREE15',
    title: 'FREE DELIVERY',
    subtitle: 'On orders over Rs. 4,500',
    badge: 'FREE DELIVERY',
    discount_type: 'free_delivery',
    discount_value: 250.00,
    min_order_amount: 4500.00,
    product_ids: [],
    image_url: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&w=800&q=80',
    is_active: 1
  },
  {
    id: 'dessert-special',
    code: 'SWEET20',
    title: 'DESSERT SPECIAL',
    subtitle: 'Buy any dessert & get 20% OFF',
    badge: 'SWEET DEAL',
    discount_type: 'percentage',
    discount_value: 20.00,
    min_order_amount: 1000.00,
    product_ids: ['chocolate-lava-cake', 'ny-cheesecake'],
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    is_active: 1
  }
];

const INITIAL_CART = [
  { id: 'chicken-burger', quantity: 1 },
  { id: 'french-fries', quantity: 1 },
  { id: 'coca-cola', quantity: 1 }
];

const MILESTONES = [
  { year: '2021', text: 'Food Express was born in a small kitchen with a passionate team determined to deliver fresh, handcrafted meals fast.' },
  { year: '2022', text: 'Partnered with over 50 top-rated local kitchens and delivered over 100,000 hot meals to smiling customers.' },
  { year: '2023', text: 'Expanded our eco-friendly delivery fleet, introduced live tracking, and launched exclusive community combo deals.' },
  { year: '2024 & Beyond', text: 'Pioneering ultra-fast smart delivery, expanding culinary choices, and continuing to share happiness — one delicious bite at a time.' }
];

function getFoodSpicyLevel(food) {
  if (food.spicyLevel !== undefined) return food.spicyLevel;
  const lower = (food.name + ' ' + food.description).toLowerCase();
  if (lower.includes('spicy') || lower.includes('peri') || lower.includes('buffalo') || lower.includes('tikka')) return 3;
  if (lower.includes('burger') || lower.includes('bbq') || lower.includes('pepperoni') || lower.includes('biryani') || lower.includes('nasi')) return 2;
  if (lower.includes('pizza') || lower.includes('chicken') || lower.includes('sub') || lower.includes('panini') || lower.includes('rice')) return 1;
  return 0;
}

function getFoodGallery(food) {
  if (food.gallery && food.gallery.length >= 4) return food.gallery;
  const catGalleries = {
    burgers: [
      food.image,
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80'
    ],
    pizza: [
      food.image,
      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
    ],
    chicken: [
      food.image,
      'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80'
    ],
    rice: [
      food.image,
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80'
    ],
    sandwich: [
      food.image,
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=800&q=80'
    ],
    drinks: [
      food.image,
      'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80'
    ],
    desserts: [
      food.image,
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
    ]
  };
  return catGalleries[food.category] || [food.image, food.image, food.image, food.image];
}

// MySQL Database Integration Handler
window.isDatabaseConnected = false;

async function checkDatabaseConnection() {
  try {
    const res = await fetch('api/test_db.php');
    if (!res.ok) return false;
    const data = await res.json();
    window.isDatabaseConnected = data.connected === true;
    return data;
  } catch (err) {
    console.log('Database offline or static mode:', err.message);
    window.isDatabaseConnected = false;
    return null;
  }
}

async function syncWithMySQLDatabase() {
  try {
    const t = Date.now();
    const [catRes, prodRes, offerRes] = await Promise.all([
      fetch(`api/categories.php?t=${t}`),
      fetch(`api/products.php?t=${t}`),
      fetch(`api/offers.php?t=${t}`)
    ]);

    if (!catRes.ok || !prodRes.ok) return false;

    const catData = await catRes.json();
    const prodData = await prodRes.json();
    let offerData = null;
    try {
      if (offerRes && offerRes.ok) offerData = await offerRes.json();
    } catch(e){}

    const iconFallback = {
      all: '<i class="fa-solid fa-utensils"></i>',
      burgers: '<i class="fa-solid fa-burger"></i>',
      pizza: '<i class="fa-solid fa-pizza-slice"></i>',
      chicken: '<i class="fa-solid fa-drumstick-bite"></i>',
      rice: '<i class="fa-solid fa-bowl-rice"></i>',
      sandwich: '<i class="fa-solid fa-bread-slice"></i>',
      drinks: '<i class="fa-solid fa-wine-glass"></i>',
      desserts: '<i class="fa-solid fa-cake-candles"></i>'
    };

    if (catData.status === 'success' && Array.isArray(catData.data) && catData.data.length > 0) {
      FOOD_CATEGORIES.length = 0;
      FOOD_CATEGORIES.push({ id: 'all', name: 'All', icon: '<i class="fa-solid fa-utensils"></i>' });
      catData.data.forEach(cat => {
        const cleanIcon = (cat.icon && !cat.icon.includes('ƒ') && !cat.icon.includes('?')) ? cat.icon : (iconFallback[cat.id] || '<i class="fa-solid fa-utensils"></i>');
        FOOD_CATEGORIES.push({
          id: cat.id,
          name: cat.name,
          icon: cleanIcon
        });
      });
    }

    if (prodData.status === 'success' && Array.isArray(prodData.data) && prodData.data.length > 0) {
      FOOD_ITEMS.length = 0;
      prodData.data.forEach(prod => {
        FOOD_ITEMS.push(prod);
      });
    }

    if (offerData && offerData.status === 'success' && Array.isArray(offerData.data)) {
      SPECIAL_OFFERS.length = 0;
      offerData.data.forEach(o => SPECIAL_OFFERS.push(o));
      localStorage.setItem('food_express_offers', JSON.stringify(offerData.data));
    }

    window.isDatabaseConnected = true;
    console.log(`Synced with MySQL Database: ${FOOD_CATEGORIES.length - 1} categories, ${FOOD_ITEMS.length} products, ${SPECIAL_OFFERS.length} offers.`);
    return true;
  } catch (err) {
    console.warn('MySQL Database sync error, using default dataset:', err.message);
    return false;
  }
}


