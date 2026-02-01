// fix-email-html.js - Полное исправление HTML в email
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Полное исправление грузинского HTML в email ===\n');

// Паттерны замены для HTML содержимого
const htmlReplacements = [
  // 2FA Email HTML
  ['გამარჯობა Beauty Pass', ' Beauty Pass'],
  ['გამარჯობა,', 'გამარჯობა,'],
  
  // Заменяем сломанный текст на грузинский  
  [/\?{10,}\s*\?+\s*\?+:/g, 'თქვენი დამადასტურებელი კოდი:'],
  [/\?+\s*\?+\s*5\s*\?+/g, 'კოდი მოქმედებს 5 წუთი'],
  [/Beauty Pass - \?+\s*\?+\s*\?+\s*\?+/g, 'Beauty Pass - სილამაზის პასპორტი'],
  
  // Booking email
  [/\?+\s*\?+\s*\?+:/g, 'თქვენი ჯავშანი დადასტურებულია:'],
  [/\?\?\s*\?+:/g, ' სალონი:'],
  [/\?+\s*\?+\s*\?+\s*\?+\s*\?+/g, 'მომსახურება'],
  
  // Password reset
  [/\?+\s*\?+\s*15\s*\?+\s*\?+/g, 'კოდი მოქმედებს 15 წუთის განმავლობაში'],
  [/\?+\s*\?+\s*\?+\s*\?+/g, 'პაროლის აღდგენა'],
  
  // Footers
  [/\?\?\s*2026 Beauty Pass\.\s*\?+\s*\?+\s*\?+\./g, ' 2026 Beauty Pass. ყველა უფლება დაცულია.'],
  
  // Common phrases
  [/\?+\s*\?+\s*\?+!\s*\?/g, 'მადლობა რომ გვირჩევთ! '],
  [/\?+\s*\?\?\s*QR\s*\?+\s*\?+:/g, 'წარადგინეთ ეს QR კოდი სალონში:'],
  [/\?\?\s*\?+\s*\?+:/g, ' ჯავშნის კოდი:'],
];

let fixCount = 0;
for (const [pattern, replacement] of htmlReplacements) {
  if (typeof pattern === 'string') {
    if (content.includes(pattern)) {
      content = content.split(pattern).join(replacement);
      fixCount++;
    }
  } else {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fixCount += matches.length;
    }
  }
}

console.log(` Applied ${fixCount} HTML replacements`);

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');
console.log(' Server.js HTML updated!');

// Проверяем результат
const updated = fs.readFileSync(serverPath, 'utf8');
const stillHasBroken = (updated.match(/\?{5,}/g) || []).length;
console.log(`\n Remaining broken text sequences (????+): ${stillHasBroken}`);
