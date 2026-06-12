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
  { id: 'b1', name: 'Idly (2 pcs)',            emoji: '🫓', price: 50, category: 'Breakfast', description: 'Soft steamed rice cakes with sambar & chutney' },
  { id: 'b2', name: 'Floater 1',               emoji: '🥣', price: 50, category: 'Breakfast', description: 'Breakfast floater item of the day' },
  { id: 'b3', name: 'Rice Item of the Day',    emoji: '🍚', price: 60, category: 'Breakfast', description: 'Rice-based breakfast item — rotates daily' },
  { id: 'b4', name: 'Tea',                    emoji: '☕', price: 15, category: 'Breakfast', description: 'Freshly brewed tea with milk' },
  { id: 'b5', name: 'Coffee',                 emoji: '☕', price: 15, category: 'Breakfast', description: 'South Indian filter coffee with frothy milk' },
  { id: 'b6', name: 'Water Bottle',           emoji: '💧', price: 6,  category: 'Breakfast', description: '200 ml mineral water' },

  // ── Lunch ──────────────────────────────────────────────────────────────────
  { id: 'l1', name: 'Roti Combo',      emoji: '🫓', price: 99,  category: 'Lunch', description: '4 Roti · Paneer Sabzi (1 bowl) · Dry Sabzi (1 bowl)' },
  { id: 'l2', name: 'Rice Combo',      emoji: '🍚', price: 99,  category: 'Lunch', description: 'Rice of the Day (Jeera Rice / Pulao / Biryani) · Dal (1 bowl) · Dry Sabzi (1 bowl)' },
  { id: 'l3', name: 'Mini Thali',      emoji: '🍽️', price: 149, category: 'Lunch', description: '2 Chapati · Rice of the Day · Dal · Dry Sabzi · Salad · Papad' },
  { id: 'l4', name: 'Thali',           emoji: '🍛', price: 199, category: 'Lunch', description: '3 Chapati · Rice of the Day · Dal · Paneer Sabzi · Dry Sabzi · Salad · Papad · Pickle' },
  { id: 'l5', name: 'Supreme Thali',   emoji: '👑', price: 249, category: 'Lunch', description: '3 Chapati · Rice of the Day · Dal · Paneer Sabzi · Dry Sabzi · Starter · Sweet · Salad · Papad · Pickle' },
  { id: 'l6', name: 'Lunch Buffet',    emoji: '🥘', price: 299, category: 'Lunch', description: 'Welcome Drink · Soup · Starter · 2 Gravies · Dal · Rice · Chapati · Salad · Sweet · Papad · Pickle · Raita' },
  { id: 'l7', name: 'Sweet of the Day',    emoji: '🍮', price: 40, category: 'Lunch', description: 'Dessert of the day — Gulab Jamun / Kheer / Halwa etc.' },
  { id: 'l8', name: 'Mocktail of the Day', emoji: '🥤', price: 40, category: 'Lunch', description: 'Chilled mocktail, flavour of the day' },
  { id: 'l9', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Lunch', description: '200 ml mineral water' },

  // ── Dinner ─────────────────────────────────────────────────────────────────
  { id: 'd1', name: 'Roti Combo',      emoji: '🫓', price: 99,  category: 'Dinner', description: '4 Roti · Paneer Sabzi (1 bowl) · Dry Sabzi (1 bowl)' },
  { id: 'd2', name: 'Rice Combo',      emoji: '🍚', price: 99,  category: 'Dinner', description: 'Rice of the Day (Jeera Rice / Pulao / Biryani) · Dal (1 bowl) · Dry Sabzi (1 bowl)' },
  { id: 'd3', name: 'Mini Thali',      emoji: '🍽️', price: 149, category: 'Dinner', description: '2 Chapati · Rice of the Day · Dal · Dry Sabzi · Salad · Papad' },
  { id: 'd4', name: 'Thali',           emoji: '🍛', price: 199, category: 'Dinner', description: '3 Chapati · Rice of the Day · Dal · Paneer Sabzi · Dry Sabzi · Salad · Papad · Pickle' },
  { id: 'd5', name: 'Supreme Thali',   emoji: '👑', price: 249, category: 'Dinner', description: '3 Chapati · Rice of the Day · Dal · Paneer Sabzi · Dry Sabzi · Starter · Sweet · Salad · Papad · Pickle' },
  { id: 'd6', name: 'Dinner Buffet',   emoji: '🥘', price: 299, category: 'Dinner', description: 'Welcome Drink · Soup · Starter · 2 Gravies · Dal · Rice · Chapati · Salad · Sweet · Papad · Pickle · Raita' },
  { id: 'd7', name: 'Sweet of the Day',    emoji: '🍮', price: 40, category: 'Dinner', description: 'Dessert of the day — Gulab Jamun / Kheer / Halwa etc.' },
  { id: 'd8', name: 'Mocktail of the Day', emoji: '🥤', price: 40, category: 'Dinner', description: 'Chilled mocktail, flavour of the day' },
  { id: 'd9', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Dinner', description: '200 ml mineral water' },

  // ── Beverages ──────────────────────────────────────────────────────────────
  { id: 'v1', name: 'Tea',                 emoji: '☕', price: 15, category: 'Beverages', description: 'Freshly brewed tea with milk' },
  { id: 'v2', name: 'Coffee',              emoji: '☕', price: 15, category: 'Beverages', description: 'South Indian filter coffee with frothy milk' },
  { id: 'v3', name: 'Mocktail of the Day', emoji: '🥤', price: 40, category: 'Beverages', description: 'Chilled mocktail, flavour of the day' },
  { id: 'v4', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Beverages', description: '200 ml mineral water' },
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
