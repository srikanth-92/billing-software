// June 2026 daily menu — sourced from june_full_menu.py
// Pricing from finalized à la carte pricing (june_alacarte_menu.py)

// ── Pricing ────────────────────────────────────────────────────────────────────
// Single price items
const P = {
  hotDrink:       15,
  fruit:          30,
  karnatakaRice:  65,
  siSide:         40,
  niBf:           { puri: 70, sandwich: 70, paratha: 80 },
  mapro:          40,
  salad:          30,
  chapati:        15,   // per piece
  rice: {
    'Steamed Rice': 40, 'Jeera Rice': 50, 'Veg Pulao': 60,
    'Matar Pulao': 60,  'Mushroom Pulao': 65, 'Corn Pulao': 60,
    'Masala Rice': 55,  'Veg Fried Rice': 65, 'Veg Biryani': 80,
    'Veg Tehri': 60,    'Kashmiri Pulao': 75,
  },
  raita:          30,
  dessert:        40,
};

// Half / Full price items
const HF = { half: 80, full: 150 };

function ricePrice(name) { return P.rice[name] || 60; }

// ── Item helpers ───────────────────────────────────────────────────────────────
function drink(_name)   { return { course: 'Welcome ♦', item: 'Mocktail of the Day', price: P.mapro, note: '' }; }
function salad()        { return { course: 'Salad',     item: 'Green Salad', price: P.salad, note: '' }; }
function starter(name, style)  { return { course: 'Starter',   item: name, half: HF.half, full: HF.full, note: style }; }
function chapati(name)  { return { course: 'Chapati',   item: name,  price: P.chapati, note: 'per piece' }; }
function rice(name, style)     { return { course: 'Rice',      item: name, price: ricePrice(name), note: style }; }
function raita(name)    { return { course: 'Raita',     item: name,  price: P.raita,  note: '' }; }
function dal(name, style)      { return { course: 'Dal',       item: name, half: HF.half, full: HF.full, note: style }; }
function chineseGravy(name)    { return { course: 'Chinese Gravy', item: name, half: HF.half, full: HF.full, note: 'Indian Chinese' }; }
function dry(name, style)      { return { course: 'Dry Sabzi',  item: name, half: HF.half, full: HF.full, note: style }; }
function paneer(name)   { return { course: 'Gravy ★',  item: name, half: HF.half, full: HF.full, note: 'Paneer', isPaneer: true }; }
function dessert(name)  { return { course: 'Dessert',   item: name,  price: P.dessert, note: '' }; }

function hotDrink(name) { return { course: 'Hot Drink', item: name, price: P.hotDrink, note: '' }; }
function fruit(name)    { return { course: 'Fruit',     item: name, price: P.fruit, note: 'Seasonal' }; }
function idly()         { return { course: 'Fixed',     item: 'Idly (3 pcs)', price: 40, note: 'with Sambar & Chutney' }; }
function kRice(name)    { return { course: 'Rice Item', item: name, price: P.karnatakaRice, note: 'Karnataka' }; }
function floatItem(name, note) { return { course: 'Floating', item: name, price: P.siSide, note: note || '' }; }

// North-Indian breakfast helpers
function bfPuri(drinkName, fruitName) {
  return [
    hotDrink(drinkName), fruit(fruitName),
    { course: 'Main',  item: 'Puri (8 pcs)',   price: 70, note: 'North Indian' },
    { course: 'Sabzi', item: 'Aloo Bhaji',      price: 40, note: 'North Indian' },
    { course: 'Side',  item: 'Pickle & Papad',  price: 10, note: '' },
  ];
}
function bfSandwich(drinkName, fruitName) {
  return [
    hotDrink(drinkName), fruit(fruitName),
    { course: 'Main', item: 'Club Sandwich (2 pcs)',         price: 70, note: '' },
    { course: 'Dip',  item: 'Tomato Ketchup & Green Chutney', price: 10, note: '' },
    { course: 'Side', item: 'Banana Chips',                  price: 15, note: '' },
  ];
}
function bfParatha(type, drinkName, fruitName) {
  const items = {
    aloo: { item: 'Aloo Paratha (2 pcs)', raita: 'Mixed Raita' },
    gobi: { item: 'Gobi Paratha (2 pcs)', raita: 'Boondi Raita' },
    mix:  { item: 'Mixed Veg Paratha (2 pcs)', raita: 'Cucumber Raita' },
  };
  const p = items[type];
  return [
    hotDrink(drinkName), fruit(fruitName),
    { course: 'Main',  item: p.item,    price: 80, note: 'North Indian' },
    { course: 'Raita', item: p.raita,   price: P.raita, note: '' },
    { course: 'Side',  item: 'Pickle',  price: 10, note: '' },
  ];
}
function kBf(drinkName, fruitName, riceName, floatName, floatNote) {
  return [
    hotDrink(drinkName), fruit(fruitName),
    idly(),
    kRice(riceName),
    floatItem(floatName, floatNote),
  ];
}

const HD = ['Chai','Filter Coffee','Ginger Tea','Badam Milk','Jaggery Tea',
            'Chai','Filter Coffee','Ginger Tea','Badam Milk','Jaggery Tea',
            'Chai','Filter Coffee','Ginger Tea','Badam Milk','Jaggery Tea',
            'Chai','Filter Coffee','Ginger Tea','Badam Milk','Jaggery Tea',
            'Chai','Filter Coffee'];
const FR = ['Banana','Papaya (slice)','Watermelon (slice)','Guava','Muskmelon (slice)',
            'Banana','Papaya (slice)','Watermelon (slice)','Guava','Muskmelon (slice)',
            'Banana','Papaya (slice)','Watermelon (slice)','Guava','Muskmelon (slice)',
            'Banana','Papaya (slice)','Watermelon (slice)','Guava','Muskmelon (slice)',
            'Banana','Papaya (slice)'];

function lunchRows(starterName, starterStyle, paneerName, dryName, dryStyle,
                   riceName, riceStyle, dalName, dalStyle, dessertName,
                   chapatiName, drinkName, birRaita) {
  const rows = [
    drink(drinkName), salad(),
    starter(starterName, starterStyle),
    chapati(chapatiName),
    rice(riceName, riceStyle),
  ];
  if (birRaita) rows.push(raita(birRaita));
  const dalFn = ['Veg Manchurian Balls Gravy','Baby Corn in Schezwan Sauce','Veg in Chilli Garlic Sauce'].includes(dalName)
    ? chineseGravy : (n, s) => dal(n, s);
  rows.push(dalFn(dalName, dalStyle));
  rows.push(dry(dryName, dryStyle));
  rows.push(paneer(paneerName));
  rows.push(dessert(dessertName));
  return rows;
}

function dinnerRows(starterName, starterStyle, paneerName, riceName, riceStyle,
                    dalName, dalStyle, chapatiName, drinkName, birRaita) {
  const rows = [
    drink(drinkName), salad(),
    starter(starterName, starterStyle),
    chapati(chapatiName),
    rice(riceName, riceStyle),
  ];
  if (birRaita) rows.push(raita(birRaita));
  const dalFn = ['Veg Manchurian Balls Gravy','Baby Corn in Schezwan Sauce','Veg in Chilli Garlic Sauce'].includes(dalName)
    ? chineseGravy : (n, s) => dal(n, s);
  rows.push(dalFn(dalName, dalStyle));
  rows.push(paneer(paneerName));
  return rows;
}

// ── Full June 2026 menu ────────────────────────────────────────────────────────
export const JUNE_MENU = [
  // WEEK 1
  {
    date: 'Monday, June 1', dateKey: '2026-06-01', week: 1,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[0], FR[0], 'Vangibath', 'Medu Vada'),
    lunch: lunchRows('Gobi Manchurian','Indian Chinese','Paneer Butter Masala',
                     'Aloo Jeera','North Indian','Veg Fried Rice','Indian Chinese',
                     'Veg Manchurian Balls Gravy','Indian Chinese','Suji Halwa',
                     'Beetroot Chapati','Mapro Rose Sharbat'),
    dinner: dinnerRows('Veg Spring Rolls','Indian Chinese','Shahi Paneer',
                       'Jeera Rice','North Indian','Masoor Dal','North Indian',
                       'Methi Chapati','Mapro Mango Drink'),
  },
  {
    date: 'Tuesday, June 2', dateKey: '2026-06-02', week: 1,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[1], FR[1], 'Ven Pongal', 'Upma'),
    lunch: lunchRows('Baby Corn Chilli','Indian Chinese','Palak Paneer',
                     'Bhindi Masala','North Indian','Jeera Rice','North Indian',
                     'Dal Fry','North Indian','Gulab Jamun',
                     'Carrot Chapati','Mapro Strawberry Crush'),
    dinner: dinnerRows('Crispy Corn','Indian Chinese','Matar Paneer',
                       'Veg Pulao','North Indian','Chana Dal','North Indian',
                       'Palak Chapati','Mapro Pineapple Drink'),
  },
  {
    date: 'Wednesday, June 3', dateKey: '2026-06-03', week: 1,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[2], FR[2], 'Tomato Rice', 'Rava Idly'),
    lunch: lunchRows('Veg Lollipop','Indian Chinese','Kadai Paneer',
                     'Gobhi Masala','North Indian','Matar Pulao','North Indian',
                     'Panchmel Dal','North Indian','Sewaiyan Kheer',
                     'Ajwain Chapati','Mapro Lychee Drink'),
    dinner: dinnerRows('Mushroom Chilli','Indian Chinese','Paneer Tikka Masala',
                       'Veg Fried Rice','Indian Chinese','Baby Corn in Schezwan Sauce','Indian Chinese',
                       'Pudina Chapati','Mapro Guava Drink'),
  },
  {
    date: 'Thursday, June 4', dateKey: '2026-06-04', week: 1,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[3], FR[3], 'Hesarubele Bath', 'Aval Upma (Poha)'),
    lunch: lunchRows('Veg Cutlet','North Indian','Paneer Do Pyaza',
                     'Aloo Gobhi','North Indian','Steamed Rice','',
                     'Dal Makhani','North Indian','Fruit Custard',
                     'Pudina Chapati','Mapro Green Apple Drink'),
    dinner: dinnerRows('Baby Corn Manchurian','Indian Chinese','Paneer Makhani',
                       'Matar Pulao','North Indian','Dal Fry','North Indian',
                       'Haldi Chapati','Mapro Kokum Sharbat'),
  },
  {
    date: 'Friday, June 5', dateKey: '2026-06-05', week: 1,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[4], FR[4], 'Bisi Bele Bath', 'Semiya Upma'),
    lunch: lunchRows('Fried Momos','Indian Chinese','Paneer Pasanda',
                     'Mushroom Masala','North Indian','Veg Biryani','North Indian',
                     'Moong Dal','North Indian','Rice Kheer',
                     'Haldi Chapati','Mapro Passion Fruit Drink', 'Boondi Raita'),
    dinner: dinnerRows('Corn Chilli','Indian Chinese','Paneer Lababdar',
                       'Steamed Rice','','Dal Tadka','North Indian',
                       'Carrot Chapati','Mapro Watermelon Drink'),
  },
  {
    date: 'Saturday, June 6', dateKey: '2026-06-06', week: 1,
    bfTag: 'North Indian ✦',
    breakfast: bfPuri(HD[5], FR[5]),
    lunch: lunchRows('Gobi 65','Indian Chinese','Paneer Korma',
                     'Baingan Bharta','North Indian','Veg Pulao','North Indian',
                     'Chana Dal','North Indian','Rasgulla',
                     'Masala Chapati','Mapro Lemon Drink'),
    dinner: dinnerRows('Aloo Tikki','North Indian','Methi Paneer',
                       'Jeera Rice','North Indian','Panchmel Dal','North Indian',
                       'Methi Chapati','Mapro Kiwi Drink'),
  },
  // WEEK 2
  {
    date: 'Monday, June 8', dateKey: '2026-06-08', week: 2,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[6], FR[6], 'Capsicum Bath', 'Nuchinunde', 'Karnataka'),
    lunch: lunchRows('Chilli Potato','Indian Chinese','Shahi Paneer',
                     'Aloo Matar','North Indian','Mushroom Pulao','North Indian',
                     'Masoor Dal','North Indian','Rava Kesari',
                     'Carrot Chapati','Mapro Guava Drink'),
    dinner: dinnerRows('Veg Spring Rolls','Indian Chinese','Paneer Butter Masala',
                       'Mushroom Pulao','North Indian','Lasooni Dal','North Indian',
                       'Ajwain Chapati','Mapro Rose Sharbat'),
  },
  {
    date: 'Tuesday, June 9', dateKey: '2026-06-09', week: 2,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[7], FR[7], 'Tomato Rice', 'Akki Rotti', 'Karnataka'),
    lunch: lunchRows('Hara Bhara Kabab','North Indian','Paneer Tikka Masala',
                     'Mix Veg','North Indian','Veg Fried Rice','Indian Chinese',
                     'Veg in Chilli Garlic Sauce','Indian Chinese','Phirni',
                     'Palak Chapati','Mapro Kokum Sharbat'),
    dinner: dinnerRows('Veg Kabab','North Indian','Palak Paneer',
                       'Corn Pulao','North Indian','Arhar Dal','North Indian',
                       'Ajwain Chapati','Mapro Lychee Drink'),
  },
  {
    date: 'Wednesday, June 10', dateKey: '2026-06-10', week: 2,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[8], FR[8], 'Sabsige Soppu Anna', 'Bread Upma'),
    lunch: lunchRows('Baby Corn Manchurian','Indian Chinese','Paneer Jalfrezi',
                     'Methi Aloo','North Indian','Corn Pulao','North Indian',
                     'Dal Fry','North Indian','Mango Shrikhand',
                     'Methi Chapati','Mapro Watermelon Drink'),
    dinner: dinnerRows('Hara Bhara Kabab','North Indian','Kadai Paneer',
                       'Veg Tehri','North Indian','Masoor Dal','North Indian',
                       'Haldi Chapati','Mapro Green Apple Drink'),
  },
  {
    date: 'Thursday, June 11', dateKey: '2026-06-11', week: 2,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[9], FR[9], 'Methi Rice', 'Mini Idly', 'with extra Sambar'),
    lunch: lunchRows('Aloo Tikki','North Indian','Paneer Kofta',
                     'Aloo Palak','North Indian','Veg Tehri','North Indian',
                     'Lasooni Dal','North Indian','Sabudana Kheer',
                     'Pudina Chapati','Mapro Kiwi Drink'),
    dinner: dinnerRows('Bread Pakora','North Indian','Paneer Do Pyaza',
                       'Masala Rice','North Indian','Chana Dal','North Indian',
                       'Haldi Chapati','Mapro Passion Fruit Drink'),
  },
  {
    date: 'Friday, June 12', dateKey: '2026-06-12', week: 2,
    bfTag: 'Continental ✦',
    breakfast: bfSandwich(HD[10], FR[10]),
    lunch: lunchRows('Corn Chilli','Indian Chinese','Achari Paneer',
                     'Arbi Masala','North Indian','Kashmiri Pulao','North Indian',
                     'Panchmel Dal','North Indian','Jalebi',
                     'Pudina Chapati','Mapro Pineapple Drink'),
    dinner: dinnerRows('Onion Bhaji','North Indian','Paneer Pasanda',
                       'Veg Biryani','North Indian','Moong Dal','North Indian',
                       'Beetroot Chapati','Mapro Lemon Drink', 'Boondi Raita'),
  },
  {
    date: 'Saturday, June 13', dateKey: '2026-06-13', week: 2,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[11], FR[11], 'Gojju Anna', 'Aval Upma (Poha)'),
    lunch: lunchRows('Samosa','North Indian','Paneer Hara Masala',
                     'Tinda Masala','North Indian','Masala Rice','North Indian',
                     'Chana Dal','North Indian','Banana Sheera',
                     'Carrot Chapati','Mapro Mango Drink'),
    dinner: dinnerRows('Veg Manchurian','Indian Chinese','Paneer Korma',
                       'Veg Fried Rice','Indian Chinese','Veg Manchurian Balls Gravy','Indian Chinese',
                       'Masala Chapati','Mapro Strawberry Crush'),
  },
  // WEEK 3
  {
    date: 'Monday, June 15', dateKey: '2026-06-15', week: 3,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[12], FR[12], 'Bisi Bele Bath', 'Rava Idly'),
    lunch: lunchRows('Veg Manchurian','Indian Chinese','Paneer Butter Masala',
                     'Bhindi Masala','North Indian','Jeera Rice','North Indian',
                     'Dal Makhani','North Indian','Suji Halwa',
                     'Beetroot Chapati','Mapro Rose Sharbat'),
    dinner: dinnerRows('Gobi Manchurian','Indian Chinese','Shahi Paneer',
                       'Jeera Rice','North Indian','Panchmel Dal','North Indian',
                       'Methi Chapati','Mapro Kokum Sharbat'),
  },
  {
    date: 'Tuesday, June 16', dateKey: '2026-06-16', week: 3,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[13], FR[13], 'Puliyodarai', 'Medu Vada'),
    lunch: lunchRows('Dahi Vada','North Indian','Methi Paneer',
                     'Gobhi Masala','North Indian','Veg Biryani','North Indian',
                     'Masoor Dal','North Indian','Gulab Jamun',
                     'Carrot Chapati','Mapro Lychee Drink', 'Boondi Raita'),
    dinner: dinnerRows('Baby Corn Chilli','Indian Chinese','Paneer Jalfrezi',
                       'Veg Pulao','North Indian','Lasooni Dal','North Indian',
                       'Palak Chapati','Mapro Watermelon Drink'),
  },
  {
    date: 'Wednesday, June 17', dateKey: '2026-06-17', week: 3,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[14], FR[14], 'Vangibath', 'Upma'),
    lunch: lunchRows('Chilli Mushroom','Indian Chinese','Paneer Makhani',
                     'Aloo Gobhi','North Indian','Matar Pulao','North Indian',
                     'Dal Tadka','North Indian','Sewaiyan Kheer',
                     'Haldi Chapati','Mapro Green Apple Drink'),
    dinner: dinnerRows('Crispy Corn','Indian Chinese','Matar Paneer',
                       'Steamed Rice','','Arhar Dal','North Indian',
                       'Ajwain Chapati','Mapro Kiwi Drink'),
  },
  {
    date: 'Thursday, June 18', dateKey: '2026-06-18', week: 3,
    bfTag: 'North Indian ✦',
    breakfast: bfParatha('gobi', HD[15], FR[15]),
    lunch: lunchRows('Gobi Manchurian','Indian Chinese','Palak Paneer',
                     'Lauki Sabzi','North Indian','Steamed Rice','',
                     'Arhar Dal','North Indian','Fruit Custard',
                     'Pudina Chapati','Mapro Passion Fruit Drink'),
    dinner: dinnerRows('Samosa','North Indian','Paneer Kofta',
                       'Matar Pulao','North Indian','Dal Fry','North Indian',
                       'Pudina Chapati','Mapro Pineapple Drink'),
  },
  {
    date: 'Friday, June 19', dateKey: '2026-06-19', week: 3,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[16], FR[16], 'Tomato Rice', 'Khara Bath', 'Karnataka'),
    lunch: lunchRows('Veg Cutlet','North Indian','Paneer Lababdar',
                     'Mushroom Masala','North Indian','Veg Pulao','North Indian',
                     'Moong Dal','North Indian','Rice Kheer',
                     'Masala Chapati','Mapro Lemon Drink'),
    dinner: dinnerRows('Veg Spring Rolls','Indian Chinese','Paneer Tikka Masala',
                       'Mushroom Pulao','North Indian','Dal Tadka','North Indian',
                       'Haldi Chapati','Mapro Mango Drink'),
  },
  {
    date: 'Saturday, June 20', dateKey: '2026-06-20', week: 3,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[17], FR[17], 'Capsicum Bath', 'Bread Upma'),
    lunch: lunchRows('Baby Corn Chilli','Indian Chinese','Kadai Paneer',
                     'Sem Aloo','North Indian','Mushroom Pulao','North Indian',
                     'Lasooni Dal','North Indian','Rasgulla',
                     'Ajwain Chapati','Mapro Strawberry Crush'),
    dinner: dinnerRows('Corn Chilli','Indian Chinese','Achari Paneer',
                       'Corn Pulao','North Indian','Masoor Dal','North Indian',
                       'Carrot Chapati','Mapro Guava Drink'),
  },
  // WEEK 4
  {
    date: 'Monday, June 22', dateKey: '2026-06-22', week: 4,
    bfTag: 'North Indian ✦',
    breakfast: bfParatha('aloo', HD[18], FR[18]),
    lunch: lunchRows('Veg Lollipop','Indian Chinese','Paneer Do Pyaza',
                     'Aloo Jeera','North Indian','Veg Fried Rice','Indian Chinese',
                     'Baby Corn in Schezwan Sauce','Indian Chinese','Rava Kesari',
                     'Methi Chapati','Mapro Kokum Sharbat'),
    dinner: dinnerRows('Mushroom Chilli','Indian Chinese','Paneer Makhani',
                       'Veg Tehri','North Indian','Chana Dal','North Indian',
                       'Carrot Chapati','Mapro Rose Sharbat'),
  },
  {
    date: 'Tuesday, June 23', dateKey: '2026-06-23', week: 4,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[19], FR[19], 'Coriander Rice', 'Mini Idly', 'with extra Sambar'),
    lunch: lunchRows('Hara Bhara Kabab','North Indian','Shahi Paneer',
                     'Aloo Matar','North Indian','Corn Pulao','North Indian',
                     'Dal Fry','North Indian','Phirni',
                     'Palak Chapati','Mapro Watermelon Drink'),
    dinner: dinnerRows('Chilli Potato','Indian Chinese','Paneer Butter Masala',
                       'Masala Rice','North Indian','Moong Dal','North Indian',
                       'Methi Chapati','Mapro Lychee Drink'),
  },
  {
    date: 'Wednesday, June 24', dateKey: '2026-06-24', week: 4,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[20], FR[20], 'Gojju Anna', 'Aval Upma (Poha)'),
    lunch: lunchRows('Gobi 65','Indian Chinese','Paneer Pasanda',
                     'Baingan Bharta','North Indian','Jeera Rice','North Indian',
                     'Panchmel Dal','North Indian','Mango Shrikhand',
                     'Pudina Chapati','Mapro Kiwi Drink'),
    dinner: dinnerRows('Baby Corn Manchurian','Indian Chinese','Paneer Hara Masala',
                       'Veg Biryani','North Indian','Dal Makhani','North Indian',
                       'Haldi Chapati','Mapro Green Apple Drink', 'Cucumber Raita'),
  },
  {
    date: 'Thursday, June 25', dateKey: '2026-06-25', week: 4,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[21], FR[21], 'Bisi Bele Bath', 'Rava Idly'),
    lunch: lunchRows('Fried Momos','Indian Chinese','Paneer Tikka Masala',
                     'Mix Veg','North Indian','Veg Tehri','North Indian',
                     'Dal Makhani','North Indian','Sabudana Kheer',
                     'Beetroot Chapati','Mapro Pineapple Drink'),
    dinner: dinnerRows('Bread Pakora','North Indian','Palak Paneer',
                       'Jeera Rice','North Indian','Panchmel Dal','North Indian',
                       'Pudina Chapati','Mapro Passion Fruit Drink'),
  },
  {
    date: 'Friday, June 26', dateKey: '2026-06-26', week: 4,
    bfTag: 'Karnataka',
    breakfast: kBf(HD[0], FR[0], 'Methi Rice', 'Medu Vada'),
    lunch: lunchRows('Veg Cutlet','North Indian','Paneer Korma',
                     'Methi Aloo','North Indian','Kashmiri Pulao','North Indian',
                     'Masoor Dal','North Indian','Jalebi',
                     'Haldi Chapati','Mapro Mango Drink'),
    dinner: dinnerRows('Hara Bhara Kabab','North Indian','Paneer Lababdar',
                       'Veg Fried Rice','Indian Chinese','Veg in Chilli Garlic Sauce','Indian Chinese',
                       'Masala Chapati','Mapro Lemon Drink'),
  },
  {
    date: 'Saturday, June 27', dateKey: '2026-06-27', week: 4,
    bfTag: 'North Indian ✦',
    breakfast: bfParatha('mix', HD[1], FR[1]),
    lunch: lunchRows('Samosa','North Indian','Paneer Jalfrezi',
                     'Arbi Masala','North Indian','Veg Biryani','North Indian',
                     'Dal Tadka','North Indian','Banana Sheera',
                     'Ajwain Chapati','Mapro Guava Drink', 'Boondi Raita'),
    dinner: dinnerRows('Aloo Tikki','North Indian','Kadai Paneer',
                       'Veg Pulao','North Indian','Arhar Dal','North Indian',
                       'Ajwain Chapati','Mapro Strawberry Crush'),
  },
];

// Sundays (closed)
export const JUNE_SUNDAYS = []; // Now open on Sundays

// Quick lookup by dateKey
export const JUNE_MENU_MAP = Object.fromEntries(JUNE_MENU.map((d) => [d.dateKey, d]));
