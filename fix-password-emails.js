// fix-password-emails.js - Исправление password emails
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Исправление password emails ===\n');

const fixes = [
  // Password reset email
  ['<h2 style="color: #333; margin-bottom: 20px;">მომსახურება</h2>', '<h2 style="color: #333; margin-bottom: 20px;">პაროლის აღდგენა</h2>'],
  ['<p style="color: #666; margin-bottom: 20px;">მომსახურება  ჯავშნი', '<p style="color: #666; margin-bottom: 20px;">გამოიყენეთ ეს კოდი პაროლის აღსადგენად'],
  ['<p style="color: #999; font-size: 14px;">მომსახურება 15 მომსახურ', '<p style="color: #999; font-size: 14px;">კოდი მოქმედებს 15 წუთის განმავლობაში'],
  ['<p style="color: #999; font-size: 14px;">მომსახურება თუ თქვენ არ', '<p style="color: #999; font-size: 14px;">თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით შეტყობინება'],
  [' 2026 Beauty Pass. მომსახურება.', ' 2026 Beauty Pass. ყველა უფლება დაცულია.'],
  
  // Success message
  ["message: 'მომსახურება'", "message: 'კოდი გაგზავნილია თქვენს ელფოსტაზე'"],
  
  // Error messages  
  ["res.status(500).json({ message: 'მომსახურება' })", "res.status(500).json({ message: 'სერვერის შეცდომა' })"],
  ["return res.status(400).json({ message: 'მომსახურება' })", "return res.status(400).json({ message: 'შეავსეთ ყველა ველი' })"],
  
  // Comments
  ['// ??? 2: თქვენ ვერ მოხერხდა', '// ეტაპი 2: კოდის შემოწმება და პაროლის შეცვლა'],
  
  // Console log
  ["console.log('? Password reset", "console.log(' Password reset"],
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
