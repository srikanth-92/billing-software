const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Configuration
const CARTS = ['Cart 1', 'Cart 2', 'Cart 3', 'Cart 4', 'Cart 5'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const KITCHEN_STAFF = {
  northIndian: ['Rohit', 'Pankaj'],
  southIndian: ['Harish', 'Suraj']
};

const SERVING_STAFF = {
  female: ['Joshmita', 'Claudia', 'Seiko', 'Aparna'],
  male: ['Ram']
};

// Helper functions
function generateServingStaffRoster() {
  const allServingStaff = [
    ...SERVING_STAFF.female.map(name => ({ name, gender: 'F' })),
    ...SERVING_STAFF.male.map(name => ({ name, gender: 'M' }))
  ];

  const roster = {};
  DAYS.forEach(day => {
    roster[day] = {};
  });

  // Simple rotation: each staff member gets one day off per week
  const staffOffDays = {};
  allServingStaff.forEach((staff, idx) => {
    staffOffDays[staff.name] = DAYS[idx % DAYS.length];
  });

  DAYS.forEach((day) => {
    const availableStaff = allServingStaff.filter(s => staffOffDays[s.name] !== day);
    const availableFemales = availableStaff.filter(s => s.gender === 'F');
    const availableMales = availableStaff.filter(s => s.gender === 'M');

    let femaleIdx = 0;
    let maleIdx = 0;

    CARTS.forEach((cart) => {
      const assignment = [];

      if (femaleIdx < availableFemales.length) {
        assignment.push(availableFemales[femaleIdx].name);
        femaleIdx++;
      }

      if (maleIdx < availableMales.length) {
        assignment.push(availableMales[maleIdx].name);
        maleIdx++;
      }

      if (assignment.length < 2) {
        for (let i = Math.max(femaleIdx, 0); i < availableFemales.length && assignment.length < 2; i++) {
          if (!assignment.includes(availableFemales[i].name)) {
            assignment.push(availableFemales[i].name);
          }
        }
      }

      roster[day][cart] = assignment;
    });
  });

  return roster;
}

function generateKitchenStaffRoster() {
  const allKitchenStaff = [
    ...KITCHEN_STAFF.northIndian,
    ...KITCHEN_STAFF.southIndian
  ];

  const roster = {};

  // Each kitchen staff gets one day off per week
  const staffOffDays = {};
  allKitchenStaff.forEach((staff, idx) => {
    staffOffDays[staff] = DAYS[idx % DAYS.length];
  });

  DAYS.forEach((day) => {
    roster[day] = allKitchenStaff.map(staff => ({
      name: staff,
      status: staffOffDays[staff] === day ? 'OFF' : 'Working'
    }));
  });

  return { roster, allStaff: allKitchenStaff };
}

// Function to draw a table in the format shown in the image
function drawScheduleTable(doc, title, numRows = 31) {
  const pageWidth = doc.page.width;
  const margin = 40;
  const tableWidth = pageWidth - (2 * margin);

  const dateColWidth = tableWidth * 0.15;
  const mealColWidth = (tableWidth - dateColWidth) / 4;

  const rowHeight = 24;
  const headerHeight = 35;

  let startX = margin;
  let startY = doc.y;

  // Draw title header
  doc.rect(startX, startY, tableWidth, headerHeight)
    .fillAndStroke('#ffffff', '#000000')
    .lineWidth(1.5);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
    .text(title, startX, startY + 10, {
      width: tableWidth,
      align: 'center'
    });

  startY += headerHeight;

  // Draw column headers
  doc.fontSize(11).font('Helvetica-Bold');

  // Date header
  doc.rect(startX, startY, dateColWidth, rowHeight)
    .fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').text('Date', startX + 5, startY + 6, {
    width: dateColWidth - 10,
    align: 'left'
  });

  // Meal headers
  const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  meals.forEach((meal, index) => {
    const x = startX + dateColWidth + (index * mealColWidth);
    doc.rect(x, startY, mealColWidth, rowHeight)
      .fillAndStroke('#f0f0f0', '#000000');
    doc.fillColor('#000000').text(meal, x + 5, startY + 6, {
      width: mealColWidth - 10,
      align: 'left'
    });
  });

  startY += rowHeight;

  // Draw empty rows
  for (let i = 0; i < numRows; i++) {
    // Date cell
    doc.rect(startX, startY, dateColWidth, rowHeight)
      .stroke('#000000');

    // Meal cells
    for (let j = 0; j < 4; j++) {
      const x = startX + dateColWidth + (j * mealColWidth);
      doc.rect(x, startY, mealColWidth, rowHeight)
        .stroke('#000000');
    }

    startY += rowHeight;
  }

  doc.y = startY + 20;
}

// Function to draw sales tracking table
function drawSalesTable(doc, title, numRows = 31) {
  const pageWidth = doc.page.width;
  const margin = 40;
  const tableWidth = pageWidth - (2 * margin);

  const dateColWidth = tableWidth * 0.12;
  const mealColWidth = (tableWidth - dateColWidth) / 4;

  const rowHeight = 24;
  const headerHeight = 35;

  let startX = margin;
  let startY = doc.y;

  // Draw title header
  doc.rect(startX, startY, tableWidth, headerHeight)
    .fillAndStroke('#ffffff', '#000000')
    .lineWidth(1.5);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
    .text(title, startX, startY + 10, {
      width: tableWidth,
      align: 'center'
    });

  startY += headerHeight;

  // Draw column headers
  doc.fontSize(11).font('Helvetica-Bold');

  // Date header
  doc.rect(startX, startY, dateColWidth, rowHeight)
    .fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').text('Date', startX + 5, startY + 6, {
    width: dateColWidth - 10,
    align: 'left'
  });

  // Meal headers
  const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
  meals.forEach((meal, index) => {
    const x = startX + dateColWidth + (index * mealColWidth);
    doc.rect(x, startY, mealColWidth, rowHeight)
      .fillAndStroke('#f0f0f0', '#000000');
    doc.fillColor('#000000').text(meal, x + 5, startY + 6, {
      width: mealColWidth - 10,
      align: 'left'
    });
  });

  startY += rowHeight;

  // Draw empty rows with sales amount format
  for (let i = 0; i < numRows; i++) {
    // Date cell
    doc.rect(startX, startY, dateColWidth, rowHeight)
      .stroke('#000000');

    // Meal cells (for sales tracking)
    for (let j = 0; j < 4; j++) {
      const x = startX + dateColWidth + (j * mealColWidth);
      doc.rect(x, startY, mealColWidth, rowHeight)
        .stroke('#000000');
    }

    startY += rowHeight;
  }

  doc.y = startY + 20;
}

// Function to draw serving staff roster table
function drawServingStaffRosterTable(doc) {
  const pageWidth = doc.page.width;
  const margin = 40;
  const tableWidth = pageWidth - (2 * margin);

  const dayColWidth = tableWidth * 0.15;
  const cartColWidth = (tableWidth - dayColWidth) / 5;

  const rowHeight = 24;
  const headerHeight = 35;

  let startX = margin;
  let startY = doc.y;

  // Draw title header
  doc.rect(startX, startY, tableWidth, headerHeight)
    .fillAndStroke('#ffffff', '#000000')
    .lineWidth(1.5);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
    .text('Weekly Serving Staff Roster', startX, startY + 10, {
      width: tableWidth,
      align: 'center'
    });

  startY += headerHeight;

  // Draw column headers
  doc.fontSize(10).font('Helvetica-Bold');

  // Day header
  doc.rect(startX, startY, dayColWidth, rowHeight)
    .fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').text('Day', startX + 5, startY + 6, {
    width: dayColWidth - 10,
    align: 'left'
  });

  // Cart headers
  CARTS.forEach((cart, index) => {
    const x = startX + dayColWidth + (index * cartColWidth);
    doc.rect(x, startY, cartColWidth, rowHeight)
      .fillAndStroke('#f0f0f0', '#000000');
    doc.fillColor('#000000').text(cart, x + 5, startY + 6, {
      width: cartColWidth - 10,
      align: 'center'
    });
  });

  startY += rowHeight;

  // Generate and draw roster data
  const roster = generateServingStaffRoster();

  DAYS.forEach(day => {
    // Day cell
    doc.rect(startX, startY, dayColWidth, rowHeight)
      .fillAndStroke('#f0f0f0', '#000000');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
      .text(day, startX + 5, startY + 7, {
        width: dayColWidth - 10,
        align: 'left'
      });

    // Cart assignments
    CARTS.forEach((cart, index) => {
      const x = startX + dayColWidth + (index * cartColWidth);
      doc.rect(x, startY, cartColWidth, rowHeight)
        .stroke('#000000');

      const staff = roster[day][cart] || [];
      doc.fontSize(8).font('Helvetica')
        .text(staff.join(' + ') || 'OFF', x + 3, startY + 7, {
          width: cartColWidth - 6,
          align: 'center'
        });
    });

    startY += rowHeight;
  });

  doc.y = startY + 20;
}

// Function to draw kitchen staff roster table
function drawKitchenStaffRosterTable(doc) {
  const pageWidth = doc.page.width;
  const margin = 40;
  const tableWidth = pageWidth - (2 * margin);

  const dayColWidth = tableWidth * 0.2;
  const staffColWidth = (tableWidth - dayColWidth) / 4; // 4 kitchen staff members

  const rowHeight = 28;
  const headerHeight = 35;

  let startX = margin;
  let startY = doc.y;

  // Draw title header
  doc.rect(startX, startY, tableWidth, headerHeight)
    .fillAndStroke('#ffffff', '#000000')
    .lineWidth(1.5);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
    .text('Weekly Kitchen Staff Roster', startX, startY + 10, {
      width: tableWidth,
      align: 'center'
    });

  startY += headerHeight;

  // Generate roster data
  const { roster, allStaff } = generateKitchenStaffRoster();

  // Draw column headers
  doc.fontSize(10).font('Helvetica-Bold');

  // Day header
  doc.rect(startX, startY, dayColWidth, rowHeight)
    .fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').text('Day', startX + 5, startY + 8, {
    width: dayColWidth - 10,
    align: 'left'
  });

  // Staff name headers
  allStaff.forEach((staff, index) => {
    const x = startX + dayColWidth + (index * staffColWidth);
    doc.rect(x, startY, staffColWidth, rowHeight)
      .fillAndStroke('#f0f0f0', '#000000');
    doc.fillColor('#000000').text(staff, x + 5, startY + 8, {
      width: staffColWidth - 10,
      align: 'center'
    });
  });

  startY += rowHeight;

  // Draw rows for each day
  DAYS.forEach(day => {
    // Day cell
    doc.rect(startX, startY, dayColWidth, rowHeight)
      .fillAndStroke('#f0f0f0', '#000000');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
      .text(day, startX + 5, startY + 9, {
        width: dayColWidth - 10,
        align: 'left'
      });

    // Staff status for each day
    roster[day].forEach((staffInfo, index) => {
      const x = startX + dayColWidth + (index * staffColWidth);
      const isOff = staffInfo.status === 'OFF';

      doc.rect(x, startY, staffColWidth, rowHeight)
        .fillAndStroke(isOff ? '#fee2e2' : '#dcfce7', '#000000');

      doc.fontSize(9).font('Helvetica-Bold')
        .fillColor(isOff ? '#dc2626' : '#16a34a')
        .text(staffInfo.status, x + 5, startY + 9, {
          width: staffColWidth - 10,
          align: 'center'
        });
    });

    startY += rowHeight;
  });

  doc.y = startY + 20;
}

// PDF Generation
function createOperationsPDF() {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    layout: 'landscape'
  });

  const outputPath = path.join(outputDir, 'cart-operations-schedule.pdf');
  doc.pipe(fs.createWriteStream(outputPath));

  // 1. Kitchen
  const allKitchenStaff = [...KITCHEN_STAFF.northIndian, ...KITCHEN_STAFF.southIndian];
  doc.fontSize(12).font('Helvetica')
    .text(`Kitchen Staff: ${allKitchenStaff.join(', ')}`, 40, 30);
  doc.moveDown(0.5);
  drawScheduleTable(doc, 'Kitchen');

  // 3. Delivery Truck Loading
  doc.addPage();
  drawScheduleTable(doc, 'Delivery Truck Loading');

  // 4. Kitchen Cleaning
  doc.addPage();
  drawScheduleTable(doc, 'Kitchen Cleaning');

  // 5. Food Carts Ready to Serve - One page per cart
  CARTS.forEach(cart => {
    doc.addPage();
    drawScheduleTable(doc, `${cart} - Ready to Serve`);
  });

  // 6. Daily Sales Tracker - One page per cart
  CARTS.forEach(cart => {
    doc.addPage();
    drawSalesTable(doc, `${cart} - Daily Sales (₹)`);
  });

  // 7. Weekly Kitchen Staff Roster
  doc.addPage();
  const kitchenStaffList = [...KITCHEN_STAFF.northIndian, ...KITCHEN_STAFF.southIndian];
  doc.fontSize(12).font('Helvetica')
    .text(`Kitchen Staff: ${kitchenStaffList.join(', ')}`, 40, 30);
  doc.fontSize(10).font('Helvetica-Oblique')
    .text('(Each staff member gets one day off per week)', 40, 45);
  doc.moveDown(1.5);
  drawKitchenStaffRosterTable(doc);

  // 8. Weekly Serving Staff Roster
  doc.addPage();
  doc.fontSize(12).font('Helvetica')
    .text(`Serving Staff: ${[...SERVING_STAFF.female, ...SERVING_STAFF.male].join(', ')}`, 40, 30);
  doc.fontSize(10).font('Helvetica-Oblique')
    .text('(Each cart assigned 1 female + 1 male staff member with weekly rotation)', 40, 45);
  doc.moveDown(1.5);
  drawServingStaffRosterTable(doc);

  // Finalize PDF
  doc.end();

  console.log(`PDF generated successfully: ${outputPath}`);
  return outputPath;
}

// Generate the PDF
try {
  const pdfPath = createOperationsPDF();
  console.log('\n✅ Operations PDF created successfully!');
  console.log(`📄 Location: ${pdfPath}`);
  console.log('\n📋 PDF includes tables for:');
  console.log('  1. Kitchen (Rohit, Pankaj, Harish, Suraj)');
  console.log('  2. Delivery Truck Loading');
  console.log('  3. Kitchen Cleaning');
  console.log('  4. Cart 1-5 Ready to Serve (5 separate tables)');
  console.log('  5. Cart 1-5 Daily Sales (5 separate tables)');
  console.log('  6. Weekly Kitchen Staff Roster (with OFF days)');
  console.log('  7. Weekly Serving Staff Roster (cart assignments)');
  console.log('\nAll schedule tables have Date | breakfast | lunch | snacks | dinner format');
  console.log('Ready to print!');
} catch (error) {
  console.error('❌ Error generating PDF:', error);
  process.exit(1);
}
