// final-fix-emails-v2.js
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Финальное исправление email функций v2 ===\n');

// Сначала заменим строки построчно для email HTML
const lines = content.split('\n');
let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let newLine = line;
  
  // Email headers
  if (line.includes('<h2') && line.includes('Beauty Pass')) {
    newLine = newLine.replace(/\?\? Beauty Pass/g, ' Beauty Pass');
    newLine = newLine.replace(/\?\? Beauty Pass - \?+/g, ' Beauty Pass - ჯავშანი');
  }
  
  // Greetings
  if (line.includes('<p') && line.includes(',') && /\?\?\?\?\?\?\?\?\?,/.test(line)) {
    newLine = newLine.replace(/\?\?\?\?\?\?\?\?\?,/g, 'გამარჯობა,');
  }
  if (line.includes('<p') && /\?\?\?\?\?\?\?\?,/.test(line)) {
    newLine = newLine.replace(/\?\?\?\?\?\?\?\?,/g, 'გამარჯობა,');
  }
  
  // Code valid text
  if (line.includes('5') && /\?\?+\s+\?\?+\s+5\s+\?\?+/.test(line)) {
    newLine = newLine.replace(/\?\?+\s+\?\?+\s+5\s+\?\?+/g, 'კოდი მოქმედებს 5 წუთი');
  }
  
  // 15 minutes
  if (line.includes('15') && /\?\?+\s+\?\?+\s+15\s+\?\?+\s+\?\?+/.test(line)) {
    newLine = newLine.replace(/\?\?+\s+\?\?+\s+15\s+\?\?+\s+\?\?+/g, 'კოდი მოქმედებს 15 წუთის განმავლობაში');
  }
  
  // Password reset headers  
  if (line.includes('<h1') && line.includes('Beauty Pass')) {
    newLine = newLine.replace(/\?\? Beauty Pass/g, ' Beauty Pass');
  }
  
  // Footer
  if (line.includes('2026 Beauty Pass')) {
    newLine = newLine.replace(/\?\?\s+\?\?\s+\?\?+\./g, 'ყველა უფლება დაცულია.');
  }
  
  // Generic patterns in email HTML
  if (line.includes('<p') && line.includes('strong')) {
    // Salon
    if (line.includes('salonName')) {
      newLine = newLine.replace(/<strong>\?\?\s+\?\?+:<\/strong>/g, '<strong> სალონი:</strong>');
    }
    // Service
    if (line.includes('serviceName')) {
      newLine = newLine.replace(/<strong>\?\?\s+\?\?+:<\/strong>/g, '<strong> მომსახურება:</strong>');
    }
    // Date
    if (line.includes('date}')) {
      newLine = newLine.replace(/<strong>\?\?\s+\?\?+:<\/strong>/g, '<strong> თარიღი:</strong>');
    }
    // Time
    if (line.includes('time}')) {
      newLine = newLine.replace(/<strong>\?\?\s+\?\?+:<\/strong>/g, '<strong> დრო:</strong>');
    }
    // Price
    if (line.includes('bpPrice')) {
      newLine = newLine.replace(/<strong>\?\?\s+\?\?+:<\/strong>/g, '<strong> ფასი:</strong>');
    }
    // Code
    if (line.includes('bookingCode')) {
      newLine = newLine.replace(/<strong>\?\?\s+\?\?+:<\/strong>/g, '<strong> კოდი:</strong>');
    }
  }
  
  // QR code text
  if (line.includes('QR') && /\?\?+\s+\?\?\s+QR/.test(line)) {
    newLine = newLine.replace(/\?\?+\s+\?\?\s+QR\s+\?\?+\s+\?\?+:/g, 'წარადგინეთ ეს QR კოდი სალონში:');
  }
  
  // Thank you
  if (line.includes('</p>') && /\?\?+\s+\?\?+\s+\?\?+!\s+\?/.test(line)) {
    newLine = newLine.replace(/\?\?+\s+\?\?+\s+\?\?+!\s+\?/g, 'მადლობა რომ გვირჩევთ! ');
  }
  
  // Password changed
  if (line.includes('<h2') && line.includes('155724')) {
    newLine = newLine.replace(/\?\s+\?\?+\s+\?\?+\s+\?\?+/g, ' პაროლი წარმატებით შეიცვალა');
  }
  
  if (newLine !== line) {
    lines[i] = newLine;
    fixCount++;
  }
}

content = lines.join('\n');
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`Applied ${fixCount} line fixes`);

// Подсчёт оставшихся 
const remaining = (content.match(/\?\?\?\?\?/g) || []).length;
console.log(`Remaining ????? sequences: ${remaining}`);

console.log('\n Server.js updated!');
