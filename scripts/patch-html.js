const fs = require('fs');
const path = require('path');

// Patch index.html
const file = path.join(__dirname, '../dist/index.html');
let html = fs.readFileSync(file, 'utf8');

const oldStyle = /<style id="expo-reset">[\s\S]*?<\/style>/;
const newStyle = `<style id="expo-reset">
      html, body {
        height: 100%;
        overflow: hidden;
        position: fixed;
        width: 100%;
        max-width: 100vw;
      }
      #root {
        display: flex;
        height: 100%;
        flex: 1;
        overflow: hidden;
        max-width: 100vw;
      }
    </style>`;

html = html.replace(oldStyle, newStyle);
fs.writeFileSync(file, html);
console.log('✓ dist/index.html patched');

// Copy qr-redirect.html to dist
const qrRedirectSrc = path.join(__dirname, '../web/qr-redirect.html');
const qrRedirectDest = path.join(__dirname, '../dist/qr-redirect.html');
if (fs.existsSync(qrRedirectSrc)) {
  fs.copyFileSync(qrRedirectSrc, qrRedirectDest);
  console.log('✓ dist/qr-redirect.html copied');
} else {
  console.warn('⚠ web/qr-redirect.html not found, skipping copy');
}
