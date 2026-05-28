// Employee credentials — change these to your actual staff usernames/passwords
export const EMPLOYEES = [
  { username: 'admin',   password: 'BOW@admin1',  name: 'Admin',    role: 'admin'  },
  { username: 'cart1',   password: 'BOW@cart1',   name: 'Cart 1',   role: 'vendor' },
  { username: 'cart2',   password: 'BOW@cart2',   name: 'Cart 2',   role: 'vendor' },
  { username: 'cart3',   password: 'BOW@cart3',   name: 'Cart 3',   role: 'vendor' },
  { username: 'cart4',   password: 'BOW@cart4',   name: 'Cart 4',   role: 'vendor' },
  { username: 'cart5',   password: 'BOW@cart5',   name: 'Cart 5',   role: 'vendor' },
];

export const MENU_ITEMS = [
  // ── Breakfast ──────────────────────────────────────────────────────────────
  { id: 'b1',  name: 'Idly (3 pcs)',                     emoji: '🫓', price: 40,  category: 'Breakfast', description: 'Soft steamed rice cakes with sambar & chutney' },
  { id: 'b2',  name: 'Medu Vada (2 pcs)',                emoji: '🍩', price: 40,  category: 'Breakfast', description: 'Crispy lentil donuts with pepper and curry leaves' },
  { id: 'b3',  name: 'Upma',                             emoji: '🥣', price: 40,  category: 'Breakfast', description: 'Savory semolina porridge with mustard tempering' },
  { id: 'b4',  name: 'Rava Idly (3 pcs)',                emoji: '🫓', price: 40,  category: 'Breakfast', description: 'Fluffy semolina idlies with cashews' },
  { id: 'b5',  name: 'Aval Upma (Poha)',                 emoji: '🥣', price: 40,  category: 'Breakfast', description: 'Flattened rice stir-fried with onion and peanuts' },
  { id: 'b6',  name: 'Semiya Upma',                      emoji: '🥣', price: 40,  category: 'Breakfast', description: 'Vermicelli with vegetables, South Indian style' },
  { id: 'b7',  name: 'Vangibath',                        emoji: '🍚', price: 65,  category: 'Breakfast', description: 'Karnataka-style spiced brinjal rice' },
  { id: 'b8',  name: 'Ven Pongal',                       emoji: '🍚', price: 65,  category: 'Breakfast', description: 'Creamy rice and moong dal with pepper and ghee' },
  { id: 'b9',  name: 'Bisi Bele Bath',                   emoji: '🍚', price: 65,  category: 'Breakfast', description: 'Karnataka rice with lentils and special masala' },
  { id: 'b10', name: 'Puri Bhaji (4 pcs + sabzi)',       emoji: '🫓', price: 70,  category: 'Breakfast', description: 'Puffed wheat puris with spiced aloo bhaji' },
  { id: 'b11', name: 'Aloo Paratha (2 pcs + raita)',     emoji: '🥙', price: 80,  category: 'Breakfast', description: 'Potato-stuffed whole wheat flatbread with raita' },
  { id: 'b12', name: 'Gobi Paratha (2 pcs + raita)',     emoji: '🥙', price: 80,  category: 'Breakfast', description: 'Cauliflower-stuffed whole wheat flatbread with raita' },
  { id: 'b13', name: 'Mixed Veg Paratha (2 pcs + raita)',emoji: '🥙', price: 80,  category: 'Breakfast', description: 'Mixed vegetable stuffed flatbread with raita' },
  { id: 'b14', name: 'Club Sandwich (2 pcs)',            emoji: '🥪', price: 70,  category: 'Breakfast', description: 'Toasted triple-layer sandwich with veg and cheese' },

  // ── Lunch ──────────────────────────────────────────────────────────────────
  { id: 'l1',  name: 'Mocktail of the Day',               emoji: '🥤', price: 40,  category: 'Lunch', description: 'Chilled welcome mocktail, flavour of the day' },
  { id: 'l2',  name: 'Green Salad',                      emoji: '🥗', price: 30,  category: 'Lunch', description: 'Fresh cucumber, tomato, carrot, onion with lemon dressing' },
  { id: 'l3',  name: 'Starter — Half',                   emoji: '🍽️', price: 80,  category: 'Lunch', description: 'Any starter half portion — see day menu' },
  { id: 'l4',  name: 'Starter — Full',                   emoji: '🍽️', price: 150, category: 'Lunch', description: 'Any starter full portion — see day menu' },
  { id: 'l5',  name: 'Chapati (per piece)',               emoji: '🫓', price: 15,  category: 'Lunch', description: 'Flavored chapati — variety rotates daily, min 3 pcs' },
  { id: 'l6',  name: 'Rice',                              emoji: '🍚', price: 60,  category: 'Lunch', description: 'Rice of the day — Pulao / Fried Rice / Biryani etc.' },
  { id: 'l7',  name: 'Dal — Half',                        emoji: '🫕', price: 80,  category: 'Lunch', description: 'Dal of the day, half portion' },
  { id: 'l8',  name: 'Dal — Full',                        emoji: '🫕', price: 150, category: 'Lunch', description: 'Dal of the day, full portion' },
  { id: 'l9',  name: 'Dry Sabzi — Half',                  emoji: '🥬', price: 80,  category: 'Lunch', description: 'Seasonal dry vegetable sabzi, half portion' },
  { id: 'l10', name: 'Dry Sabzi — Full',                  emoji: '🥬', price: 150, category: 'Lunch', description: 'Seasonal dry vegetable sabzi, full portion' },
  { id: 'l11', name: 'Paneer Gravy — Half',               emoji: '🧀', price: 80,  category: 'Lunch', description: 'Paneer gravy of the day, half portion' },
  { id: 'l12', name: 'Paneer Gravy — Full',               emoji: '🧀', price: 150, category: 'Lunch', description: 'Paneer gravy of the day, full portion' },
  { id: 'l13', name: 'Raita',                             emoji: '🥣', price: 30,  category: 'Lunch', description: 'Chilled yogurt raita — served with Biryani' },
  { id: 'l14', name: 'Dessert',                           emoji: '🍮', price: 40,  category: 'Lunch', description: 'Sweet of the day — Kheer / Halwa / Gulab Jamun etc.' },

  // ── Dinner ─────────────────────────────────────────────────────────────────
  { id: 'd1',  name: 'Mocktail of the Day',               emoji: '🥤', price: 40,  category: 'Dinner', description: 'Chilled welcome mocktail, flavour of the day' },
  { id: 'd2',  name: 'Green Salad',                      emoji: '🥗', price: 30,  category: 'Dinner', description: 'Fresh cucumber, tomato, carrot, onion with lemon dressing' },
  { id: 'd3',  name: 'Starter — Half',                   emoji: '🍽️', price: 80,  category: 'Dinner', description: 'Any starter half portion — see day menu' },
  { id: 'd4',  name: 'Starter — Full',                   emoji: '🍽️', price: 150, category: 'Dinner', description: 'Any starter full portion — see day menu' },
  { id: 'd5',  name: 'Chapati (per piece)',               emoji: '🫓', price: 15,  category: 'Dinner', description: 'Flavored chapati — variety rotates daily, min 3 pcs' },
  { id: 'd6',  name: 'Rice',                              emoji: '🍚', price: 55,  category: 'Dinner', description: 'Rice of the day — Pulao / Fried Rice / Steamed etc.' },
  { id: 'd7',  name: 'Dal — Half',                        emoji: '🫕', price: 80,  category: 'Dinner', description: 'Dal of the day, half portion' },
  { id: 'd8',  name: 'Dal — Full',                        emoji: '🫕', price: 150, category: 'Dinner', description: 'Dal of the day, full portion' },
  { id: 'd9',  name: 'Paneer Gravy — Half',               emoji: '🧀', price: 80,  category: 'Dinner', description: 'Paneer gravy of the day, half portion' },
  { id: 'd10', name: 'Paneer Gravy — Full',               emoji: '🧀', price: 150, category: 'Dinner', description: 'Paneer gravy of the day, full portion' },

  // ── Beverages ──────────────────────────────────────────────────────────────
  { id: 'v1', name: 'Chai',          emoji: '☕', price: 15, category: 'Beverages', description: 'Freshly brewed tea with milk' },
  { id: 'v2', name: 'Filter Coffee', emoji: '☕', price: 15, category: 'Beverages', description: 'South Indian decoction with frothy milk' },
  { id: 'v3', name: 'Ginger Tea',    emoji: '🍵', price: 15, category: 'Beverages', description: 'Tea brewed with fresh crushed ginger' },
  { id: 'v4', name: 'Badam Milk',    emoji: '🥛', price: 15, category: 'Beverages', description: 'Warm milk with almonds and cardamom' },
  { id: 'v5', name: 'Jaggery Tea',   emoji: '🍵', price: 15, category: 'Beverages', description: 'Tea sweetened with natural jaggery' },
  { id: 'v6', name: 'Mocktail of the Day', emoji: '🥤', price: 40, category: 'Beverages', description: 'Chilled welcome mocktail, flavour of the day' },
  { id: 'v7', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Beverages', description: 'Chilled 1L mineral water' },
];

// Razorpay configuration
// Get these from https://dashboard.razorpay.com → Settings → API Keys
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || '';

// Web URL where customers scan QR to self-order
// Update this after running: npx expo export --platform web && firebase deploy --only hosting
export const GUEST_ORDER_BASE = 'https://buffet-on-wheels-ba58b.web.app';
export const RESTAURANT_NAME = 'Buffet on Wheels';
export const RESTAURANT_ADDRESS = '123 Food Street, City - 000000';
export const RESTAURANT_PHONE = '+91 98765 43210';
export const RESTAURANT_GSTIN = '27XXXXX0000X1ZX'; // optional, set to '' to hide
