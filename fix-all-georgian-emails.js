// fix-all-georgian-emails.js
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Исправление грузинских email в server.js ===\n');

// Замены для исправления кодировки
const replacements = [
  // 1. Subject для 2FA кода
  {
    find: /subject:\s*['"].*?(?:2FA|???|კოდი|დადასტურება|Beauty Pass.*?კოდი).*?['"]/g,
    replaceWith: (match, lineNum) => {
      if (match.includes('273') || lineNum < 300) {
        return `subject: ' Beauty Pass - დამადასტურებელი კოდი'`;
      }
      return match;
    }
  },
  
  // Замена строки 273 - 2FA subject
  {
    find: "subject: '?? ??? ??? ????????????? Beauty Pass'",
    replace: "subject: ' Beauty Pass - დამადასტურებელი კოდი'"
  },
  
  // Замена строки 328 - Booking QR subject
  {
    find: "subject: `?? ??????? ?????????????? - ${booking.serviceName}`",
    replace: "subject: ` ჯავშანი დადასტურებულია - ${booking.serviceName}`"
  },
  
  // Замена строки 1486 - Password reset subject
  {
    find: "subject: '?? Beauty Pass - ??????? ???????'",
    replace: "subject: ' Beauty Pass - პაროლის აღდგენა'"
  },
  
  // Замена строки 1566 - Password changed subject  
  {
    find: "subject: '? Beauty Pass - ?????? ????????'",
    replace: "subject: ' Beauty Pass - პაროლი შეცვლილია'"
  },
  
  // Замена строки 3318 - второй Booking QR subject
  {
    find: "subject: `?? ??????? ?????????????? - ${booking.serviceName}`",
    replace: "subject: ` ჯავშანი დადასტურებულია - ${booking.serviceName}`"
  }
];

// Применяем простые замены
let newContent = content;

// 2FA email subject и HTML
newContent = newContent.replace(
  /subject:\s*['`"].*?(?:\?\?|\?{3,}).*?Beauty Pass['`"]/g,
  "subject: ' Beauty Pass - დამადასტურებელი კოდი'"
);

// Booking confirmation subjects
newContent = newContent.replace(
  /subject:\s*`\?\?\s*\?+\s*\?+\s*-\s*\$\{booking\.serviceName\}`/g,
  "subject: ` ჯავშანი დადასტურებულია - ${booking.serviceName}`"
);

// Password reset subject
newContent = newContent.replace(
  /subject:\s*['`"]\?\?\s*Beauty Pass\s*-\s*\?+\s*\?+['`"]/g,
  "subject: ' Beauty Pass - პაროლის აღდგენა'"
);

// Password changed subject
newContent = newContent.replace(
  /subject:\s*['`"]\?\s*Beauty Pass\s*-\s*\?+\s*\?+['`"]/g,
  "subject: ' Beauty Pass - პაროლი შეცვლილია'"
);

// Теперь заменяем HTML содержимое emails
// 2FA email HTML content
newContent = newContent.replace(
  /<h2 style="color: #ff6b9d; text-align: center;">\?\?\s*Beauty Pass<\/h2>/g,
  '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>'
);

newContent = newContent.replace(
  /<p style="font-size: 16px; color: #333;">\?+,\s*\$\{user\.firstName \|\| user\.login\}!<\/p>/g,
  '<p style="font-size: 16px; color: #333;">გამარჯობა, ${user.firstName || user.login}!</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 16px; color: #333;">\?+\s*\?+\s*\?+:<\/p>/g,
  '<p style="font-size: 16px; color: #333;">თქვენი დამადასტურებელი კოდი:</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 14px; color: #888;">\?+\s*\?+\s*5\s*\?+\.<\/p>/g,
  '<p style="font-size: 14px; color: #888;">კოდი მოქმედებს 5 წუთი.</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 14px; color: #888;">\?\?\s*\?+\s*\?\?\s*\?+\s*\?+,\s*\?+\s*\?+\s*\?\?\s*\?+\.<\/p>/g,
  '<p style="font-size: 14px; color: #888;">თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება.</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - \?+\s*\?+\s*\?+\s*\?\?<\/p>/g,
  '<p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - სილამაზის პასპორტი</p>'
);

// Booking confirmation HTML
newContent = newContent.replace(
  /<h2 style="color: #ff6b9d; text-align: center;">\?\?\s*Beauty Pass - \?+<\/h2>/g,
  '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass - ჯავშანი</h2>'
);

newContent = newContent.replace(
  /<p style="font-size: 16px; color: #333;">\?+,\s*\$\{user\.firstName \|\| '\?+'\}!<\/p>/g,
  '<p style="font-size: 16px; color: #333;">გამარჯობა, ${user.firstName || \'მომხმარებელი\'}!</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 16px; color: #333;">\?+\s*\?+\s*\?+:<\/p>/g,
  '<p style="font-size: 16px; color: #333;">თქვენი ჯავშანი დადასტურებულია:</p>'
);

newContent = newContent.replace(
  /<p><strong>\?\?\s*\?+:<\/strong>\s*\$\{booking\.salonName\}<\/p>/g,
  '<p><strong> სალონი:</strong> ${booking.salonName}</p>'
);

newContent = newContent.replace(
  /<p><strong>\?\?\s*\?+:<\/strong>\s*\$\{booking\.serviceName\}<\/p>/g,
  '<p><strong> მომსახურება:</strong> ${booking.serviceName}</p>'
);

newContent = newContent.replace(
  /<p><strong>\?\?\s*\?+:<\/strong>\s*\$\{booking\.date\}<\/p>/g,
  '<p><strong> თარიღი:</strong> ${booking.date}</p>'
);

newContent = newContent.replace(
  /<p><strong>\?\?\s*\?+:<\/strong>\s*\$\{booking\.time\}<\/p>/g,
  '<p><strong> დრო:</strong> ${booking.time}</p>'
);

newContent = newContent.replace(
  /<p><strong>\?\?\s*\?+:<\/strong>\s*\$\{booking\.bpPrice\}\s*BP<\/p>/g,
  '<p><strong> ფასი:</strong> ${booking.bpPrice} BP</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 14px; color: #666; margin-bottom: 15px;">\?+\s*\?\?\s*QR\s*\?+\s*\?+:<\/p>/g,
  '<p style="font-size: 14px; color: #666; margin-bottom: 15px;">წარადგინეთ ეს QR კოდი სალონში:</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 14px; color: #666; margin-top: 15px;">\?\?\s*\?+\s*\?+:<\/p>/g,
  '<p style="font-size: 14px; color: #666; margin-top: 15px;"> ჯავშნის კოდი:</p>'
);

newContent = newContent.replace(
  /<p style="font-size: 14px; color: #888;">\?+\s*\?+\s*\?+!\s*\?<\/p>/g,
  '<p style="font-size: 14px; color: #888;">მადლობა რომ გვირჩევთ! </p>'
);

// Password reset HTML
newContent = newContent.replace(
  /<h1 style="color: #667eea;">\?\?\s*Beauty Pass<\/h1>/g,
  '<h1 style="color: #667eea;"> Beauty Pass</h1>'
);

newContent = newContent.replace(
  /<h2 style="color: #333; margin-bottom: 20px;">\?+\s*\?+<\/h2>/g,
  '<h2 style="color: #333; margin-bottom: 20px;">პაროლის აღდგენა</h2>'
);

newContent = newContent.replace(
  /<p style="color: #666; margin-bottom: 20px;">\?+\s*\?+\s*\?+\s*\?+:<\/p>/g,
  '<p style="color: #666; margin-bottom: 20px;">გამოიყენეთ ეს კოდი პაროლის აღსადგენად:</p>'
);

newContent = newContent.replace(
  /<p style="color: #999; font-size: 14px;">\?+\s*\?+\s*15\s*\?+\s*\?+\.<\/p>/g,
  '<p style="color: #999; font-size: 14px;">კოდი მოქმედებს 15 წუთის განმავლობაში.</p>'
);

newContent = newContent.replace(
  /<p style="color: #999; font-size: 14px;">\?\?\s*\?+\s*\?\?\s*\?+\s*\?+\s*\?+,\s*\?+\s*\?\?\s*\?+\.<\/p>/g,
  '<p style="color: #999; font-size: 14px;">თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება.</p>'
);

// Password changed HTML
newContent = newContent.replace(
  /<h2 style="color: #155724; margin-bottom: 20px;">\?\s*\?+\s*\?+\s*\?+<\/h2>/g,
  '<h2 style="color: #155724; margin-bottom: 20px;"> პაროლი წარმატებით შეიცვალა</h2>'
);

newContent = newContent.replace(
  /<p style="color: #155724;">\?+\s*\?+\s*\?+\s*\?+\s*\?+\.<\/p>/g,
  '<p style="color: #155724;">თქვენი პაროლი წარმატებით შეიცვალა.</p>'
);

newContent = newContent.replace(
  /<p style="color: #856404; margin-top: 20px;">\?\?\s*\?+\s*\?\?\s*\?+\s*\?+,\s*\?+\s*\?+\.<\/p>/g,
  '<p style="color: #856404; margin-top: 20px;">თუ ეს თქვენ არ გაგიკეთებიათ, დაგვიკავშირდით.</p>'
);

// Footer
newContent = newContent.replace(
  / 2026 Beauty Pass\. \?+\s*\?+\s*\?+\./g,
  ' 2026 Beauty Pass. ყველა უფლება დაცულია.'
);

// Записываем результат
fs.writeFileSync(serverPath, newContent, 'utf8');
console.log(' Файл server.js обновлён!\n');

// Проверяем результат
const updatedContent = fs.readFileSync(serverPath, 'utf8');
const lines = updatedContent.split('\n');
console.log('=== Проверка обновлённых subject строк ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('subject:') && (lines[i].includes('Beauty Pass') || lines[i].includes('booking'))) {
    if (lines[i].includes('email') || lines[i].includes('mail')) continue;
    console.log(`Line ${i+1}: ${lines[i].trim().substring(0, 80)}`);
  }
}
