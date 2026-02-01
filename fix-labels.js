// fix-labels.js - Исправление лейблов в booking email
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Исправление лейблов email ===\n');

// Исправляем неправильные лейблы в booking email
const labelFixes = [
  // Fallback для пользователя
  ["|| 'მომსახურება'}", "|| 'მომხმარებელი'}"],
  
  // Salon label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> ${booking.salonName}', '<strong> სალონი:</strong> ${booking.salonName}'],
  
  // Specialist label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> ${booking.specialistName}', '<strong> სპეციალისტი:</strong> ${booking.specialistName}'],
  
  // Service label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> ${booking.serviceName}', '<strong> მომსახურება:</strong> ${booking.serviceName}'],
  
  // Date label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> ${booking.date}', '<strong> თარიღი:</strong> ${booking.date}'],
  
  // Time label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> ${booking.time}', '<strong> დრო:</strong> ${booking.time}'],
  
  // Price label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> ${booking.bpPrice}', '<strong> ფასი:</strong> ${booking.bpPrice}'],
  
  // Code label
  ['<strong>თქვენი ჯავშანი დადასტურებულია:</strong> <span', '<strong> კოდი:</strong> <span'],
  
  // Comment for function
  ['// მომსახურება QR მომსახურება email მომსახურება', '// ფუნქცია QR კოდის email-ის გასაგზავნად'],
  
  // "Your code" text
  ['თქვენი დამადასტურებელი კოდი:', 'თქვენი ჯავშნის დეტალები:'],
  
  // Add header before details
  ['<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>', '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>'],
  
  // Password emails headers
  ['<h1 style="color: #667eea;"> Beauty Pass</h1>', '<h1 style="color: #667eea;"> Beauty Pass</h1>'],
];

let fixCount = 0;
for (const [oldText, newText] of labelFixes) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    fixCount++;
    console.log(` Fixed: "${oldText.substring(0, 50)}..."`);
  }
}

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\nApplied ${fixCount} label fixes`);
console.log(' Server.js updated!');
