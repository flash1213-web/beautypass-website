// fix-georgian-v2.js - Простое исправление с точными строками
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

console.log('=== Исправление грузинских email ===\n');

// Найдём и заменим конкретные строки по номерам
const fixes = {
  // Line 273 - 2FA subject
  273: {
    pattern: /subject:\s*['"].*Beauty Pass['"]/,
    replace: `subject: ' Beauty Pass - დამადასტურებელი კოდი',`
  },
  // Line 328 - Booking QR subject
  328: {
    pattern: /subject:\s*\`.*\$\{booking\.serviceName\}\`/,
    replace: 'subject: ` ჯავშანი დადასტურებულია - ${booking.serviceName}`,'
  },
  // Line 1486 - Password reset
  1486: {
    pattern: /subject:\s*['"].*Beauty Pass.*['"]/,
    replace: `subject: ' Beauty Pass - პაროლის აღდგენა',`
  },
  // Line 1566 - Password changed
  1566: {
    pattern: /subject:\s*['"].*Beauty Pass.*['"]/,
    replace: `subject: ' Beauty Pass - პაროლი შეცვლილია',`
  },
  // Line 3318 - second Booking QR
  3318: {
    pattern: /subject:\s*\`.*\$\{booking\.serviceName\}\`/,
    replace: 'subject: ` ჯავშანი დადასტურებულია - ${booking.serviceName}`,'
  }
};

// Применяем исправления
for (const [lineNum, fix] of Object.entries(fixes)) {
  const idx = parseInt(lineNum) - 1;
  if (idx < lines.length) {
    const oldLine = lines[idx];
    if (fix.pattern.test(oldLine) || oldLine.includes('subject:')) {
      // Сохраняем отступ
      const indent = oldLine.match(/^\s*/)[0];
      lines[idx] = indent + fix.replace;
      console.log(` Line ${lineNum}: Fixed subject`);
    } else {
      console.log(` Line ${lineNum}: Pattern not matched - "${oldLine.substring(0, 50)}..."`);
    }
  }
}

// Теперь найдём и исправим HTML контент в email'ах
// Поиск по паттернам с ? знаками

let fixCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Исправляем заголовки email
  if (line.includes('<h2') && line.includes('Beauty Pass') && line.includes('????')) {
    lines[i] = line.replace(/\?+\s*Beauty Pass\s*-?\s*\?*/g, ' Beauty Pass');
    fixCount++;
  }
  
  // Исправляем приветствия
  if (line.includes('?????????,') || line.includes('გამარჯობა,')) {
    lines[i] = line.replace(/\?{5,},/g, 'გამარჯობა,');
    fixCount++;
  }
}

console.log(`\n Additional HTML fixes: ${fixCount}`);

// Записываем
content = lines.join('\n');
fs.writeFileSync(serverPath, content, 'utf8');
console.log('\n Server.js updated!');
