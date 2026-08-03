// Kids-Friendly Menu for Friday Event (July 18, 2026)
// McDonald's-inspired fun menu that kids will love!

const KIDS_PRICES = {
  happyBox: 159,
  burger: 99,
  funSnack: 99,
  sweetTreat: 46,
  shake: 39,
  addonItem: 26,
};

// Kids menu items with fun names and descriptions
export const KIDS_MENU_ITEMS = [];

// Pre-set combo packages for the event
export const KIDS_EVENT_COMBOS = [
  {
    id: 'kc1',
    name: 'Combo 1',
    price: 159,
    items: [
      'Mini veggie burger',
      'Small fries',
      '4 nuggets',
      'Choice of drink',
    ],
    description: 'Veggie burger with nuggets & fries',
    emoji: '📦',
    allergens: ['Gluten', 'Dairy'],
  },
  {
    id: 'kc2',
    name: 'Combo 2',
    price: 159,
    items: [
      'Mini cheeseburger',
      'Small fries',
      'Choice of drink',
    ],
    description: 'Classic cheeseburger meal',
    emoji: '🍔',
    allergens: ['Gluten', 'Dairy'],
  },
  {
    id: 'kc3',
    name: 'Combo 3',
    price: 149,
    items: [
      '6 crispy nuggets',
      'Small fries',
      'Choice of drink',
    ],
    description: 'All-time favorite nuggets',
    emoji: '🍗',
    allergens: ['Gluten'],
  },
  {
    id: 'kc4',
    name: 'Combo 4',
    price: 159,
    items: [
      'Aloo Tikki burger',
      'Smile fries',
      'Choice of drink',
    ],
    description: 'Potato burger with smiley fries',
    emoji: '🎉',
    allergens: ['Gluten', 'Dairy'],
  },
  {
    id: 'kc5',
    name: 'Combo 5',
    price: 179,
    items: [
      'Veggie Supreme burger',
      '4 nuggets',
      'Small fries',
      'Choice of drink',
    ],
    description: 'Supreme burger with nuggets',
    emoji: '🌟',
    allergens: ['Gluten', 'Dairy'],
  },
  {
    id: 'kc6',
    name: 'Combo 6',
    price: 169,
    items: [
      '8 crispy nuggets',
      'Smile fries',
      'Golden fries',
      'Choice of drink',
    ],
    description: 'Double fries & nuggets feast',
    emoji: '🎊',
    allergens: ['Gluten', 'Dairy'],
  },
];

// Event details
export const KIDS_EVENT_INFO = {
  date: 'Friday, July 18, 2026',
  dateKey: '2026-07-18',
  eventName: 'Kids Friday Fun Fest',
  timings: '04:30 PM - 9:30 PM',
  notes: [
    'All dishes are prepared with mild spices suitable for kids',
    'Separate kids dining area with colorful decor',
    'High chairs available for toddlers',
    'Special dietary requirements? Let us know!',
  ],
};

// Nutritional guidelines followed
export const KIDS_MENU_STANDARDS = {
  spiceLevel: 'Mild - suitable for ages 3-12',
  portionSize: 'Child-appropriate servings',
  hygiene: 'Extra sanitization protocols',
  ingredients: 'Fresh, high-quality, kid-safe ingredients',
  prepTime: 'Quick service - meals ready in 10-15 minutes',
};

// Filter kids menu by category
export function getKidsMenuByCategory(category) {
  return KIDS_MENU_ITEMS.filter(item => item.category === category);
}

// Get all categories
export function getKidsMenuCategories() {
  const categories = [...new Set(KIDS_MENU_ITEMS.map(item => item.category))];
  return categories;
}

// Check if item contains specific allergen
export function hasAllergen(itemId, allergen) {
  const item = KIDS_MENU_ITEMS.find(i => i.id === itemId);
  return item ? item.allergens.includes(allergen) : false;
}

// Get allergen-free items
export function getAllergenFreeItems(allergen) {
  return KIDS_MENU_ITEMS.filter(item => !item.allergens.includes(allergen));
}

export default {
  KIDS_MENU_ITEMS,
  KIDS_EVENT_COMBOS,
  KIDS_EVENT_INFO,
  KIDS_MENU_STANDARDS,
  getKidsMenuByCategory,
  getKidsMenuCategories,
  hasAllergen,
  getAllergenFreeItems,
};
