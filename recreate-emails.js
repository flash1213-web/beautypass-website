// recreate-emails.js - Пересоздание email функций с UTF-8
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Пересоздание email функций ===\n');

// Новая 2FA email функция с правильным грузинским
const new2FAEmail = `
  const mailOptions = {
    from: {
      name: 'Beauty Pass',
      address: process.env.EMAIL_USER
    },
    to: user.email,
    subject: ' Beauty Pass - დამადასტურებელი კოდი',
    html: \`
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>
          <p style="font-size: 16px; color: #333;">გამარჯობა, \${user.firstName || user.login}!</p>
          <p style="font-size: 16px; color: #333;">თქვენი დამადასტურებელი კოდი:</p>
          <div style="background-color: #ffe0e8; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 10px; margin: 20px 0; color: #ff6b9d;">
            \${code}
          </div>
          <p style="font-size: 14px; color: #888;">კოდი მოქმედებს 5 წუთი.</p>
          <p style="font-size: 14px; color: #888;">თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - სილამაზის პასპორტი</p>
        </div>
      </div>
    \`,
  };`;

// Записываем обратно UTF-8 BOM для правильной кодировки
const BOM = '\uFEFF';
if (!content.startsWith(BOM)) {
  content = BOM + content;
}

fs.writeFileSync(serverPath, content, { encoding: 'utf8' });
console.log(' BOM добавлен для UTF-8!');
