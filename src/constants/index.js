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
  { id: 'b1', name: 'Idly',        emoji: '🫓', price: 30,  category: 'Breakfast', description: '2 pieces with sambar & chutney' },
  { id: 'b2', name: 'Dosa',        emoji: '🥞', price: 50,  category: 'Breakfast', description: 'Crispy plain dosa with chutney' },
  { id: 'b3', name: 'Masala Dosa', emoji: '🌯', price: 70,  category: 'Breakfast', description: 'Dosa stuffed with spiced potato' },
  { id: 'b4', name: 'Vada',        emoji: '🍩', price: 30,  category: 'Breakfast', description: '2 medu vadas with sambar & chutney' },
  { id: 'b5', name: 'Pongal',      emoji: '🍚', price: 60,  category: 'Breakfast', description: 'Ven pongal with ghee & pepper' },
  { id: 'b6', name: 'Upma',        emoji: '🥣', price: 40,  category: 'Breakfast', description: 'Semolina upma with vegetables' },

  // ── Lunch ──────────────────────────────────────────────────────────────────
  { id: 'l1', name: 'Meals',       emoji: '🍛', price: 120, category: 'Lunch', description: 'Rice, sambar, rasam, 2 curries, papad & curd' },
  { id: 'l2', name: 'Chapati',     emoji: '🫓', price: 20,  category: 'Lunch', description: 'Per piece with dal' },
  { id: 'l3', name: 'Curd Rice',   emoji: '🍚', price: 60,  category: 'Lunch', description: 'Tempered curd rice with pickle' },
  { id: 'l4', name: 'Lemon Rice',  emoji: '🍋', price: 60,  category: 'Lunch', description: 'Tangy lemon rice with peanuts' },
  { id: 'l5', name: 'Sambar Rice', emoji: '🥘', price: 70,  category: 'Lunch', description: 'Rice mixed with sambar & ghee' },

  // ── Dinner ─────────────────────────────────────────────────────────────────
  { id: 'd1', name: 'Chapati + Dal',    emoji: '🫓', price: 80,  category: 'Dinner', description: '3 chapatis with dal fry' },
  { id: 'd2', name: 'Paratha',          emoji: '🥙', price: 50,  category: 'Dinner', description: 'Stuffed paratha with curd' },
  { id: 'd3', name: 'Paneer Curry',     emoji: '🧀', price: 130, category: 'Dinner', description: 'Paneer in rich tomato gravy' },
  { id: 'd4', name: 'Dal Makhani',      emoji: '🫕', price: 100, category: 'Dinner', description: 'Slow-cooked black lentils with butter' },
  { id: 'd5', name: 'Fried Rice',       emoji: '🍳', price: 90,  category: 'Dinner', description: 'Vegetable fried rice' },
  { id: 'd6', name: 'Roti + Veg Curry', emoji: '🍽️', price: 90,  category: 'Dinner', description: '3 rotis with seasonal vegetable curry' },

  // ── Beverages ──────────────────────────────────────────────────────────────
  { id: 'v1', name: 'Filter Coffee',  emoji: '☕', price: 25, category: 'Beverages', description: 'South Indian filter coffee' },
  { id: 'v2', name: 'Tea',            emoji: '🍵', price: 15, category: 'Beverages', description: 'Ginger or masala chai' },
  { id: 'v3', name: 'Lassi',          emoji: '🥛', price: 50, category: 'Beverages', description: 'Sweet or salted lassi' },
  { id: 'v4', name: 'Water Bottle',   emoji: '💧', price: 20, category: 'Beverages', description: 'Chilled 1L mineral water' },
  { id: 'v5', name: 'Cold Coffee',    emoji: '🧋', price: 60, category: 'Beverages', description: 'Chilled coffee with milk & ice' },
  { id: 'v6', name: 'Lime Soda',      emoji: '🥤', price: 40, category: 'Beverages', description: 'Fresh lime with soda, sweet or salted' },
  { id: 'v7', name: 'Soft Drink',     emoji: '🫧', price: 35, category: 'Beverages', description: 'Pepsi / 7Up / Mirinda (330ml can)' },
  { id: 'v8', name: 'Fresh Juice',    emoji: '🍊', price: 55, category: 'Beverages', description: 'Seasonal fresh fruit juice' },
  { id: 'v9', name: 'Buttermilk',     emoji: '🥣', price: 20, category: 'Beverages', description: 'Spiced salted buttermilk' },
];

// Razorpay configuration
// Get these from https://dashboard.razorpay.com → Settings → API Keys
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || '';

// Web URL where customers scan QR to self-order
// Update this after running: npx expo export --platform web && firebase deploy --only hosting
export const GUEST_ORDER_URL = 'https://buffet-on-wheels-ba58b.web.app/guest';
export const RESTAURANT_NAME = 'Buffet on Wheels';
export const RESTAURANT_ADDRESS = '123 Food Street, City - 000000';
export const RESTAURANT_PHONE = '+91 98765 43210';
export const RESTAURANT_GSTIN = '27XXXXX0000X1ZX'; // optional, set to '' to hide
