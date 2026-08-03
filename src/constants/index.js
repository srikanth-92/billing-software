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
  // Breakfast food paused until further notice (skipped from 2026-07-21). Beverages remain.
  { id: 'b5', name: 'Tea',                        emoji: '☕', price: 15, category: 'Menu', description: 'Freshly brewed tea with milk' },
  { id: 'b6', name: 'Coffee',                  emoji: '☕', price: 15, category: 'Menu', description: 'South Indian filter coffee with frothy milk' },
  { id: 'b7', name: 'Badam Milk',              emoji: '🥛', price: 25, category: 'Menu', description: 'Creamy almond milk with saffron' },

  // ── Thalis ────────────────────────────────────────────────────────────────────
  { id: 't1', name: 'Veg Thali',      emoji: '🍽️', price: 150, category: 'Menu', description: 'Paneer Sabzi · Dal · Rice · 2 Ghee Roti' },
  { id: 't4', name: 'Non-Veg Thali',  emoji: '👑', price: 170, category: 'Menu', description: 'Chicken Sabzi · Dal · Rice · 2 Ghee Roti' },

  // ── À La Carte ──────────────────────────────────────────────────────────────────
  { id: 'a1', name: 'Paneer Sabzi (Half)',    emoji: '🧈', price: 95,  category: 'Menu', description: '4 pieces paneer in gravy' },
  { id: 'a2', name: 'Paneer Sabzi (Full)',    emoji: '🧈', price: 180, category: 'Menu', description: '8 pieces paneer in gravy' },
  { id: 'a3', name: 'Chicken Sabzi (Half)',   emoji: '🍗', price: 110, category: 'Menu', description: '3 pieces chicken in gravy' },
  { id: 'a4', name: 'Chicken Sabzi (Full)',   emoji: '🍗', price: 210, category: 'Menu', description: '6 pieces chicken in gravy' },
  { id: 'a9',  name: 'Dal (Half)',            emoji: '🍲', price: 60,  category: 'Menu', description: 'Home-style dal — half portion' },
  { id: 'a10', name: 'Dal (Full)',            emoji: '🍲', price: 120, category: 'Menu', description: 'Home-style dal — full portion' },
  { id: 'a5', name: 'Rice Item of the Day (Half)', emoji: '🍚', price: 80,  category: 'Menu', description: 'Rice-based item — rotates daily' },
  { id: 'a8', name: 'Rice Item of the Day (Full)', emoji: '🍚', price: 150, category: 'Menu', description: 'Rice-based item — rotates daily' },
  { id: 'a7', name: 'Ghee Roti (Single)',     emoji: '🫓', price: 15,  category: 'Menu', description: 'Freshly made wheat roti brushed with ghee' },

  // ── Extras ──────────────────────────────────────────────────────────────────────
  // Sweet of the Day & Mocktail of the Day removed (2026-07-21).
  { id: 'e3', name: 'Water Bottle',        emoji: '💧', price: 6,  category: 'Menu', description: '200 ml mineral water' },
];

// Preset combo items for the manual/counter Daily Sales log (Log Sale screen).
// Staff tap +/- to record how many of each they sold; custom items can be added too.
export const PRESET_SALE_ITEMS = [
  { name: 'Roti Dal Veg Curry', price: 100 },
  { name: 'Roti Dal Non-Veg Curry', price: 120 },
  { name: 'Rice Dal Veg Curry', price: 100 },
  { name: 'Rice Dal Non-Veg Curry', price: 120 },
];

// Razorpay configuration
// Get these from https://dashboard.razorpay.com → Settings → API Keys
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || '';

// Web URL where customers scan QR to self-order
// Update this after running: npx expo export --platform web && firebase deploy --only hosting
export const GUEST_ORDER_BASE = 'https://buffet-on-wheels-ba58b.web.app';
// Weekly closure — days the restaurant is closed (0=Sun, 1=Mon … 6=Sat).
// Closed on Mondays until further notice (leave day, from 2026-07-21).
export const CLOSED_WEEKDAYS = [1];
export function isClosedOn(date = new Date()) {
  return CLOSED_WEEKDAYS.includes(date.getDay());
}

export const RESTAURANT_NAME = 'Buffet on Wheels';
export const RESTAURANT_ADDRESS = '123 Food Street, City - 000000';
export const RESTAURANT_PHONE = '+91 98765 43210';
export const RESTAURANT_GSTIN = '27XXXXX0000X1ZX'; // optional, set to '' to hide

// Kids menu for special events
export {
  KIDS_MENU_ITEMS,
  KIDS_EVENT_COMBOS,
  KIDS_EVENT_INFO,
  KIDS_MENU_STANDARDS,
  getKidsMenuByCategory,
  getKidsMenuCategories,
  hasAllergen,
  getAllergenFreeItems,
} from './kidsMenu';
