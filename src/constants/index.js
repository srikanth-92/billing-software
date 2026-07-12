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
  // ── Breakfast Items ──────────────────────────────────────────────────────────────
  { id: 'b1', name: 'Idly Sambar Chutney',     emoji: '🫓', price: 50, category: 'Menu', description: 'Soft steamed rice cakes with sambar & coconut chutney' },
  { id: 'b2', name: 'Upma',                    emoji: '🥣', price: 40, category: 'Menu', description: 'Semolina cooked with vegetables and spices' },
  { id: 'b3', name: 'Sheera (Kesri Bhath)',    emoji: '🍮', price: 40, category: 'Menu', description: 'Sweet semolina pudding with dry fruits' },
  { id: 'b4', name: 'Rice Item of the Day',    emoji: '🍚', price: 60, category: 'Menu', description: 'Rice-based breakfast item — rotates daily' },
  { id: 'b5', name: 'Tea',                     emoji: '☕', price: 15, category: 'Menu', description: 'Freshly brewed tea with milk' },
  { id: 'b6', name: 'Coffee',                  emoji: '☕', price: 15, category: 'Menu', description: 'South Indian filter coffee with frothy milk' },
  { id: 'b7', name: 'Badam Milk',              emoji: '🥛', price: 25, category: 'Menu', description: 'Creamy almond milk with saffron' },

  // ── Veg Thalis ──────────────────────────────────────────────────────────────────
  { id: 't1', name: 'Veg Roti Thali',      emoji: '🫓', price: 129, category: 'Menu', description: '3 Roti · Dal · Paneer Sabzi · Dry Sabzi · Papad · Salad · Raita · Pickle' },
  { id: 't2', name: 'Veg Rice Thali',      emoji: '🍚', price: 129, category: 'Menu', description: 'Rice · Dal · Paneer Sabzi · Dry Sabzi · Salad · Raita · Pickle' },
  { id: 't3', name: 'Veg Combo Thali',     emoji: '🍽️', price: 159, category: 'Menu', description: '2 Roti · Half Rice · Dal · Paneer Sabzi · Dry Sabzi · Salad · Raita · Pickle' },

  // ── Non-Veg Thalis ──────────────────────────────────────────────────────────────
  { id: 't4', name: 'Non-Veg Roti Thali',  emoji: '🍗', price: 149, category: 'Menu', description: '3 Roti · Dal · Chicken Sabzi · Dry Sabzi · Papad · Salad · Raita · Pickle' },
  { id: 't5', name: 'Non-Veg Rice Thali',  emoji: '🍛', price: 149, category: 'Menu', description: 'Rice · Dal · Chicken Sabzi · Salad · Raita · Pickle' },
  { id: 't6', name: 'Non-Veg Combo Thali', emoji: '👑', price: 179, category: 'Menu', description: '2 Roti · Half Rice · Dal · Chicken Sabzi · Dry Sabzi · Salad · Raita · Pickle' },

  // ── À La Carte ──────────────────────────────────────────────────────────────────
  { id: 'a1', name: 'Paneer Sabzi (Half)',    emoji: '🧈', price: 95,  category: 'Menu', description: '4 pieces paneer in gravy' },
  { id: 'a2', name: 'Paneer Sabzi (Full)',    emoji: '🧈', price: 180, category: 'Menu', description: '8 pieces paneer in gravy' },
  { id: 'a3', name: 'Chicken Sabzi (Half)',   emoji: '🍗', price: 100, category: 'Menu', description: '3 pieces chicken in gravy' },
  { id: 'a4', name: 'Chicken Sabzi (Full)',   emoji: '🍗', price: 190, category: 'Menu', description: '6 pieces chicken in gravy' },
  { id: 'a5', name: 'Rice (Full Portion)',    emoji: '🍚', price: 100, category: 'Menu', description: 'Steamed basmati rice' },
  { id: 'a6', name: 'Roti (Single)',          emoji: '🫓', price: 20,  category: 'Menu', description: 'Freshly made wheat roti' },

  // ── Extras ──────────────────────────────────────────────────────────────────────
  { id: 'e1', name: 'Sweet of the Day',    emoji: '🍮', price: 40, category: 'Menu', description: 'Dessert — Gulab Jamun / Kheer / Halwa' },
  { id: 'e2', name: 'Mocktail of the Day', emoji: '🥤', price: 40, category: 'Menu', description: 'Chilled mocktail, flavour of the day' },
  { id: 'e3', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Menu', description: '200 ml mineral water' },
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
