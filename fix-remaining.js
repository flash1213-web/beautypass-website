// fix-remaining.js - Исправление оставшихся проблем
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Исправление оставшихся проблем ===\n');

const fixes = [
  // QR code text
  ['მომსახურება QR თქვენი ჯავშანი დადასტურებულია:', 'წარადგინეთ ეს QR კოდი სალონში:'],
  
  // Booking code label  
  ['თქვენი ჯავშანი დადასტურებულია:</p>', ' ჯავშნის კოდი:</p>'],
  
  // Thank you
  ['მომსახურება! ?</p>', 'მადლობა რომ გვირჩევთ! </p>'],
  
  // Console QR log
  ['QR email თქვენი ჯავშანი დადასტურებულია:', 'QR email გაგზავნილია:'],
  
  // First booking email labels
  ["<p><strong> სალონი:</strong>", "<p><strong> სალონი:</strong>"],
  ["<p><strong> მომსახურება:</strong>", "<p><strong> მომსახურება:</strong>"],
  ["<p><strong> თარიღი:</strong>", "<p><strong> თარიღი:</strong>"],
  ["<p><strong> დრო:</strong>", "<p><strong> დრო:</strong>"],
  ["<p><strong> ფასი:</strong>", "<p><strong> ფასი:</strong>"],
  ["<p><strong> კოდი:</strong>", "<p><strong> კოდი:</strong>"],
  ["<p><strong> სპეციალისტი:</strong>", "<p><strong> სპეციალისტი:</strong>"],
  
  // Fallback user name
  ["|| 'მომხმარებელი'}", "|| 'მომხმარებელი'}"],
];

let fixCount = 0;
for (const [oldText, newText] of fixes) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    fixCount++;
    console.log(` Fixed: "${oldText.substring(0, 50)}..."`);
  }
}

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\nApplied ${fixCount} fixes`);
console.log(' Server.js updated!');
