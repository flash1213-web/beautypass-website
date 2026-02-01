// fix-2fa-email.js - Исправление 2FA email
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Исправление 2FA email ===\n');

const fixes = [
  // 2FA email - fix header (should have emoji)
  ['<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>', '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>'],
  
  // 2FA email - fix text "your code"
  ['თქვენი ჯავშნის დეტალები:</p>', 'თქვენი დამადასტურებელი კოდი:</p>'],
  
  // Password reset header
  ['<h1 style="color: #667eea;"> Beauty Pass</h1>', '<h1 style="color: #667eea;"> Beauty Pass</h1>'],
  
  // Console logs - fix emojis showing as ?
  ['console.log(`? 2FA', 'console.log(` 2FA'],
  ['console.log(`? QR', 'console.log(` QR'],
  ['console.error(\'? Email', "console.error(' Email"],
  ['console.error(\'? QR', "console.error(' QR"],
  
  // Fix console box characters
  ['console.log(\'  ??', "console.log('  "],
  ['console.log(\'-----', "console.log('"],
  ['console.log(\'+-----', "console.log('"],
];

let fixCount = 0;
for (const [oldText, newText] of fixes) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    fixCount++;
    console.log(` Fixed: "${oldText.substring(0, 40)}..."`);
  }
}

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\nApplied ${fixCount} fixes`);
console.log(' Server.js updated!');
