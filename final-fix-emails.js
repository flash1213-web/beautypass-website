// final-fix-emails.js - Полное исправление всех email функций
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Финальное исправление email функций ===\n');

// Полные замены для email HTML
// 2FA email HTML block
const twoFAEmailOld = `<h2 style="color: #ff6b9d; text-align: center;">?? Beauty Pass</h2>`;
const twoFAEmailNew = `<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>`;

content = content.replace(twoFAEmailOld, twoFAEmailNew);

// Заменяем все ???? паттерны контекстно
const replacements = [
  // Console logs - можно оставить с эмодзи
  [/console\.log\(`\?\?\s*\[/g, "console.log(` ["],
  
  // Email не настроен
  [/EMAIL_USER ??? EMAIL_PASS \?+/g, "EMAIL_USER или EMAIL_PASS не настроены в"],
  [/\?+ email config/g, "Нет email config"],
  
  // 2FA fallback messages
  [/2FA CODE \(no email config/g, "2FA CODE (no email config"],
  [/2FA CODE \(email failed/g, "2FA CODE (email failed"],
  
  // HTML заголовки
  [/<h2 style="color: #ff6b9d; text-align: center;">\?\? Beauty Pass<\/h2>/g, 
   '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>'],
  
  [/<h2 style="color: #ff6b9d; text-align: center;">\?\? Beauty Pass - \?+<\/h2>/g,
   '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass - ჯავშანი</h2>'],
  
  // Приветствия в email
  [/<p style="font-size: 16px; color: #333;">\?+,/g,
   '<p style="font-size: 16px; color: #333;">გამარჯობა,'],
  
  // Текст про код
  [/\?+ \?+ \?+:<\/p>/g, 'თქვენი დამადასტურებელი კოდი:</p>'],
  
  // Код действует 5 минут
  [/\?+ \?+ 5 \?+\.<\/p>/g, 'კოდი მოქმედებს 5 წუთი.</p>'],
  
  // Если вы не запрашивали
  [/\?\? \?+ \?\? \?+ \?+, \?+ \?+ \?\? \?+\.<\/p>/g, 
   'თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება.</p>'],
  
  // Footer Beauty Pass
  [/Beauty Pass - \?+ \?+ \?+ \?\?<\/p>/g, 'Beauty Pass - სილამაზის პასპორტი</p>'],
  
  // Booking confirmation
  [/\?+ \?+ \?+:<\/p>/g, 'თქვენი ჯავშანი:</p>'],
  
  // Salon label
  [/<p><strong>\?\? \?+:<\/strong>/g, '<p><strong> სალონი:</strong>'],
  
  // Service label  
  [/<p><strong>\?\? \?+:<\/strong> \${booking\.serviceName}/g, 
   '<p><strong> მომსახურება:</strong> ${booking.serviceName}'],
  
  // Date label
  [/<p><strong>\?\? \?+:<\/strong> \${booking\.date}/g,
   '<p><strong> თარიღი:</strong> ${booking.date}'],
  
  // Time label
  [/<p><strong>\?\? \?+:<\/strong> \${booking\.time}/g,
   '<p><strong> დრო:</strong> ${booking.time}'],
  
  // Price label
  [/<p><strong>\?\? \?+:<\/strong> \${booking\.bpPrice}/g,
   '<p><strong> ფასი:</strong> ${booking.bpPrice}'],
  
  // Code label
  [/<p><strong>\?\? \?+:<\/strong> <span/g,
   '<p><strong> კოდი:</strong> <span'],
  
  // QR code instructions
  [/\?+ \?\? QR \?+ \?+:<\/p>/g, 'წარადგინეთ ეს QR კოდი სალონში:</p>'],
  
  // Booking code label
  [/\?\? \?+ \?+:<\/p>/g, ' ჯავშნის კოდი:</p>'],
  
  // Thank you message
  [/\?+ \?+ \?+! \?<\/p>/g, 'მადლობა რომ გვირჩევთ! </p>'],
  
  // Password reset title
  [/<h1 style="color: #667eea;">\?\? Beauty Pass<\/h1>/g,
   '<h1 style="color: #667eea;"> Beauty Pass</h1>'],
  
  // Password reset header
  [/<h2 style="color: #333; margin-bottom: 20px;">\?+ \?+<\/h2>/g,
   '<h2 style="color: #333; margin-bottom: 20px;">პაროლის აღდგენა</h2>'],
  
  // Use this code
  [/\?+ \?+ \?+ \?+:<\/p>/g, 'გამოიყენეთ ეს კოდი:</p>'],
  
  // Code valid 15 min
  [/\?+ \?+ 15 \?+ \?+\.<\/p>/g, 'კოდი მოქმედებს 15 წუთის განმავლობაში.</p>'],
  
  // Password changed header
  [/<h2 style="color: #155724; margin-bottom: 20px;">\? \?+ \?+ \?+<\/h2>/g,
   '<h2 style="color: #155724; margin-bottom: 20px;"> პაროლი შეიცვალა</h2>'],
  
  // Password changed success
  [/<p style="color: #155724;">\?+ \?+ \?+ \?+ \?+\.<\/p>/g,
   '<p style="color: #155724;">თქვენი პაროლი წარმატებით შეიცვალა.</p>'],
  
  // If not you warning
  [/<p style="color: #856404; margin-top: 20px;">\?\? \?+ \?\? \?+ \?+, \?+ \?+\.<\/p>/g,
   '<p style="color: #856404; margin-top: 20px;">თუ ეს თქვენ არ გაგიკეთებიათ, დაგვიკავშირდით.</p>'],
  
  // Copyright footer
  [/ 2026 Beauty Pass\. \?+ \?+ \?+\./g, ' 2026 Beauty Pass. ყველა უფლება დაცულია.'],
];

let fixCount = 0;
for (const [pattern, replacement] of replacements) {
  const before = content;
  content = content.replace(pattern, replacement);
  if (content !== before) {
    fixCount++;
  }
}

console.log(`Applied ${fixCount} replacements`);

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');
console.log(' Server.js updated!');

// Подсчёт оставшихся проблем
const remaining = (content.match(/\?\?/g) || []).length;
console.log(`\nRemaining ?? patterns: ${remaining}`);
