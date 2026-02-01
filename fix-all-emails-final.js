// fix-all-emails-final.js
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Полное исправление всех email текстов ===\n');

// 2FA Email - исправляем заголовок и текст
content = content.replace(
  /<h2 style="color: #ff6b9d; text-align: center;">\s*Beauty Pass - ჯავშანი<\/h2>/g,
  '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>'
);

content = content.replace(
  /<p style="font-size: 16px; color: #333;">თქვენი ჯავშნის დეტალები:<\/p>/g,
  '<p style="font-size: 16px; color: #333;">თქვენი დამადასტურებელი კოდი:</p>'
);

// Password reset - исправляем дублированный текст
content = content.replace(
  /გამოიყენეთ ეს კოდი პაროლის აღსადგენადს კოდი:/g,
  'გამოიყენეთ ეს კოდი პაროლის აღსადგენად:'
);

content = content.replace(
  /კოდი მოქმედებს 15 წუთის განმავლობაშიება\./g,
  'კოდი მოქმედებს 15 წუთის განმავლობაში.'
);

content = content.replace(
  /უგულებელყავით შეტყობინება მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება\./g,
  'უგულებელყავით ეს შეტყობინება.'
);

// Добавляем эмодзи к заголовкам если их нет
content = content.replace(
  /<h2 style="color: #ff6b9d; text-align: center;">\s+Beauty Pass - ჯავშანი<\/h2>/g,
  '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass - ჯავშანი</h2>'
);

content = content.replace(
  /<h1 style="color: #667eea;">\s+Beauty Pass<\/h1>/g,
  '<h1 style="color: #667eea;"> Beauty Pass</h1>'
);

// Subject lines - добавляем эмодзи
content = content.replace(
  /subject: ' Beauty Pass - დამადასტურებელი კოდი'/g,
  "subject: ' Beauty Pass - დამადასტურებელი კოდი'"
);

content = content.replace(
  /subject: ` ჯავშანი დადასტურებულია/g,
  "subject: ` ჯავშანი დადასტურებულია"
);

content = content.replace(
  /subject: ' Beauty Pass - პაროლის აღდგენა'/g,
  "subject: ' Beauty Pass - პაროლის აღდგენა'"
);

content = content.replace(
  /subject: ' Beauty Pass - პაროლი შეცვლილია'/g,
  "subject: ' Beauty Pass - პაროლი შეცვლილია'"
);

// Исправляем лейблы в booking email
content = content.replace(
  /<p><strong> სალონი:<\/strong>/g,
  '<p><strong> სალონი:</strong>'
);

content = content.replace(
  /<p><strong> სპეციალისტი:<\/strong>/g,
  '<p><strong> სპეციალისტი:</strong>'
);

content = content.replace(
  /<p><strong> მომსახურება:<\/strong>/g,
  '<p><strong> მომსახურება:</strong>'
);

content = content.replace(
  /<p><strong> თარიღი:<\/strong>/g,
  '<p><strong> თარიღი:</strong>'
);

content = content.replace(
  /<p><strong> დრო:<\/strong>/g,
  '<p><strong> დრო:</strong>'
);

content = content.replace(
  /<p><strong> ფასი:<\/strong>/g,
  '<p><strong> ფასი:</strong>'
);

content = content.replace(
  /<p><strong> კოდი:<\/strong>/g,
  '<p><strong> კოდი:</strong>'
);

content = content.replace(
  /<p style="font-size: 14px; color: #666; margin-top: 15px;"> ჯავშნის კოდი:<\/p>/g,
  '<p style="font-size: 14px; color: #666; margin-top: 15px;"> ჯავშნის კოდი:</p>'
);

content = content.replace(
  /მადლობა რომ გვირჩევთ! <\/p>/g,
  'მადლობა რომ გვირჩევთ! </p>'
);

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');
console.log(' Все email тексты исправлены!');
