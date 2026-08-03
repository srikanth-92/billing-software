const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const doc = new PDFDocument({
  size: 'A4',
  margin: 0,
  autoFirstPage: false
});
const outputPath = path.join(outputDir, 'buffet-on-wheels-menu.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const colors = {
  primary: '#1a1a2e',
  gold: '#c9a840',
  darkGold: '#8b7830',
  orange: '#ea580c',
  green: '#16a34a',
  red: '#dc2626',
  lightBg: '#fef9f0',
  gray: '#64748b',
};

let yPos = 140;

// Helper function to draw header
function drawHeader() {
  doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
  doc.fontSize(36).fillColor(colors.gold).font('Helvetica-Bold')
     .text('Buffet on Wheels', 0, 35, { align: 'center' });
  doc.fontSize(14).fillColor('#ffffff')
     .text('Fresh • Authentic • Delicious', 0, 75, { align: 'center' });
  doc.fontSize(12).fillColor(colors.gold)
     .text('+91 91875 75078  •  Open 7 Days a Week', 0, 95, { align: 'center' });
}

// Helper function to draw footer
function drawFooter() {
  const footerY = doc.page.height - 85;
  doc.rect(0, footerY, doc.page.width, 85).fill(colors.lightBg);
  doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
     .text('All prices are inclusive of taxes  •  We accept UPI & Cash', 0, footerY + 15, { align: 'center' });
  doc.fontSize(11).fillColor(colors.orange).font('Helvetica-Bold')
     .text('Packaging Charges: Rs.10 per box (Extra)', 0, footerY + 35, { align: 'center' });
  doc.fontSize(9).fillColor(colors.gray).font('Helvetica')
     .text('Self-order available via QR code at your cart  •  Scan & Pay instantly', 0, footerY + 58, { align: 'center' });
}

// Helper function to draw section header
function drawSectionHeader(title, color, timing = null) {
  const headerHeight = timing ? 55 : 40;
  doc.roundedRect(40, yPos, doc.page.width - 80, headerHeight, 5).fill(color);
  doc.fontSize(20).fillColor('#ffffff').font('Helvetica-Bold')
     .text(title, 40, yPos + 8, { width: doc.page.width - 80, align: 'center' });
  if (timing) {
    doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Oblique')
       .text(timing, 40, yPos + 33, { width: doc.page.width - 80, align: 'center' });
  }
  yPos += headerHeight + 10;
}

// Helper function to draw menu item
function drawMenuItem(name, price, description = null) {
  doc.fontSize(13).fillColor(colors.primary).font('Helvetica-Bold')
     .text(name, 50, yPos, { width: doc.page.width - 150, continued: false });
  doc.fontSize(13).fillColor(colors.orange).font('Helvetica-Bold')
     .text(price, doc.page.width - 80, yPos, { align: 'right', width: 60 });
  yPos += 20;
  if (description) {
    doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
       .text(description, 50, yPos, { width: doc.page.width - 150 });
    yPos += 18;
  }
  yPos += 5;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 - BREAKFAST
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
drawHeader();
yPos = 140;

drawSectionHeader('Breakfast', colors.orange, '7:00 AM - 10:00 AM');

drawMenuItem('Idly Sambar Chutney', 'Rs.50', 'Soft steamed rice cakes with sambar & coconut chutney');
drawMenuItem('Upma', 'Rs.40', 'Semolina cooked with vegetables and spices');
drawMenuItem('Sheera (Kesri Bhath)', 'Rs.40', 'Sweet semolina pudding with dry fruits');
drawMenuItem('Rice Item of the Day', 'Rs.60', 'Rice-based breakfast item — rotates daily');
drawMenuItem('Floating Item of the Day', 'As per request', 'Ask your server for today\'s special');
drawMenuItem('Tea', 'Rs.15', 'Freshly brewed tea with milk');
drawMenuItem('Coffee', 'Rs.15', 'South Indian filter coffee');
drawMenuItem('Badam Milk', 'Rs.25', 'Creamy almond milk with saffron');
drawMenuItem('Water Bottle', 'Rs.6', '200 ml mineral water');

drawFooter();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 - LUNCH & DINNER THALIS
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
drawHeader();
yPos = 140;

drawSectionHeader('Veg Thalis', colors.green, 'Lunch: 12:30 PM - 3:30 PM  •  Dinner: 7:00 PM - 10:00 PM');

drawMenuItem('Veg Roti Thali', 'Rs.129');
doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
   .text('3 Roti · Dal · Paneer Sabzi · Dry Sabzi · Papad · Salad · Raita · Pickle', 60, yPos, { width: doc.page.width - 140 });
yPos += 25;

drawMenuItem('Veg Rice Thali', 'Rs.129');
doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
   .text('Rice · Dal · Paneer Sabzi · Dry Sabzi · Salad · Raita · Pickle', 60, yPos, { width: doc.page.width - 140 });
yPos += 25;

drawMenuItem('Veg Combo Thali', 'Rs.159');
doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
   .text('2 Roti · Half Rice · Dal · Paneer Sabzi · Dry Sabzi · Salad · Raita · Pickle', 60, yPos, { width: doc.page.width - 140 });
yPos += 25;

drawSectionHeader('Non-Veg Thalis', colors.red, 'Lunch: 12:30 PM - 3:30 PM  •  Dinner: 7:00 PM - 10:00 PM');

drawMenuItem('Non-Veg Roti Thali', 'Rs.149');
doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
   .text('3 Roti · Dal · Chicken Sabzi · Dry Sabzi · Papad · Salad · Raita · Pickle', 60, yPos, { width: doc.page.width - 140 });
yPos += 25;

drawMenuItem('Non-Veg Rice Thali', 'Rs.149');
doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
   .text('Rice · Dal · Chicken Sabzi · Salad · Raita · Pickle', 60, yPos, { width: doc.page.width - 140 });
yPos += 25;

drawMenuItem('Non-Veg Combo Thali', 'Rs.179');
doc.fontSize(10).fillColor(colors.gray).font('Helvetica')
   .text('2 Roti · Half Rice · Dal · Chicken Sabzi · Dry Sabzi · Salad · Raita · Pickle', 60, yPos, { width: doc.page.width - 140 });
yPos += 25;

drawFooter();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3 - À LA CARTE
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
drawHeader();
yPos = 140;

drawSectionHeader('À La Carte', colors.darkGold);
yPos += 10;

drawMenuItem('Paneer Sabzi (Half - 4 pcs)', 'Rs.95', '4 pieces paneer in gravy');
drawMenuItem('Paneer Sabzi (Full - 8 pcs)', 'Rs.180', '8 pieces paneer in gravy');
drawMenuItem('Chicken Sabzi (Half - 3 pcs)', 'Rs.100', '3 pieces chicken in gravy');
drawMenuItem('Chicken Sabzi (Full - 6 pcs)', 'Rs.190', '6 pieces chicken in gravy');
drawMenuItem('Rice (Full Portion)', 'Rs.100', 'Steamed basmati rice');
drawMenuItem('Roti (Single)', 'Rs.20', 'Freshly made wheat roti');
drawMenuItem('Water Bottle', 'Rs.6', '200 ml mineral water');

drawFooter();

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 4 - BEVERAGES
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
drawHeader();
yPos = 140;

drawSectionHeader('Beverages', colors.orange);

drawMenuItem('Tea', 'Rs.15', 'Freshly brewed tea with milk');
drawMenuItem('Coffee', 'Rs.15', 'South Indian filter coffee');
drawMenuItem('Badam Milk', 'Rs.25', 'Creamy almond milk with saffron');
drawMenuItem('Water Bottle', 'Rs.6', '200 ml mineral water');

drawFooter();

doc.end();

console.log(`✅ Menu PDF created successfully at: ${outputPath}`);
