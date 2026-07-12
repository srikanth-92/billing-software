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

  // ── Main Menu Items ──────────────────────────────────────────────────────────────
  { id: 'l1', name: 'Roti Combo',      emoji: '🫓', price: 99,  category: 'Menu', description: '4 Roti · Paneer Sabzi (1 bowl) · Dry Sabzi (1 bowl)' },
  { id: 'l2', name: 'Rice Combo',      emoji: '🍚', price: 99,  category: 'Menu', description: 'Rice of the Day (Jeera Rice / Pulao / Biryani) · Dal (1 bowl) · Dry Sabzi (1 bowl)' },
  { id: 'l3', name: 'Mini Thali',      emoji: '🍽️', price: 149, category: 'Menu', description: '2 Chapati · Rice of the Day · Dal · Dry Sabzi · Salad · Papad' },
  { id: 'l4', name: 'Thali',           emoji: '🍛', price: 199, category: 'Menu', description: '3 Chapati · Rice of the Day · Dal · Paneer Sabzi · Dry Sabzi · Salad · Papad · Pickle' },
  { id: 'l5', name: 'Supreme Thali',   emoji: '👑', price: 249, category: 'Menu', description: '3 Chapati · Rice of the Day · Dal · Paneer Sabzi · Dry Sabzi · Starter · Sweet · Salad · Papad · Pickle' },
  { id: 'l6', name: 'Buffet',          emoji: '🥘', price: 299, category: 'Menu', description: 'Welcome Drink · Soup · Starter · 2 Gravies · Dal · Rice · Chapati · Salad · Sweet · Papad · Pickle · Raita' },
  { id: 'l7', name: 'Sweet of the Day',    emoji: '🍮', price: 40, category: 'Menu', description: 'Dessert of the day — Gulab Jamun / Kheer / Halwa etc.' },
  { id: 'l8', name: 'Mocktail of the Day', emoji: '🥤', price: 40, category: 'Menu', description: 'Chilled mocktail, flavour of the day' },
  { id: 'l9', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Menu', description: '200 ml mineral water' },
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
