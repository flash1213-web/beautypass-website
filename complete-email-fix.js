// complete-email-fix.js - Полное исправление email с точными строками
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Полное исправление email текстов ===\n');

// Точные замены с правильным грузинским текстом
const exactReplacements = [
  // 2FA Email
  ['მომსახურება თქვენი დამადასტურებელი კოდი:', 'თქვენი დამადასტურებელი კოდი:'],
  ['მომსახურება, მომსახურება.', 'თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება.'],
  ['მომსახურება მომსახურება', 'თქვენ ვერ მოხერხდა'],
  ['მომსახურება. მომსახურება.', 'ელფოსტის გაგზავნა ვერ მოხერხდა. სცადეთ მოგვიანებით.'],
  
  // Booking email 
  ['მომსახურება ჯავშანი:', 'თქვენი ჯავშანი დადასტურებულია:'],
  
  // Console logs (можно оставить как есть или исправить)
  ['2FA თქვენი ჯავშანი დადასტურებულია:', '2FA კოდი გაგზავნილია:'],
  ['Email თქვენი ჯავშანი დადასტურებულია:', 'Email გაგზავნის შეცდომა:'],
  ['თქვენი ჯავშანი დადასტურებულია: email ?? გამარჯობა, მომსახურება', ' დეველოპმენტ რეჟიმი: email არ გაიგზავნა, კოდი კონსოლში'],
  
  // Password reset
  ['მომსახურება პაროლის აღსადგენად:', 'გამოიყენეთ ეს კოდი პაროლის აღსადგენად:'],
  
  // Rating validation
  ['მომსახურება 1-??? 5-??? / Rating must be 1-5', 'შეფასება უნდა იყოს 1-დან 5-მდე'],
  
  // Fix specialist reviews
  ['// მომსახურება dateTime ?? date ? time', '// თარიღი და დრო'],
  
  // Level bonus  
  ['50 BP კოდი მოქმედებს 5 წუთი, 100 BP ?? 10 ? ?.?.', '50 BP მე-5 დონეზე, 100 BP მე-10 დონეზე და ა.შ.'],
];

let fixCount = 0;
for (const [oldText, newText] of exactReplacements) {
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
