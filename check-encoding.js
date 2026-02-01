// fix-georgian-emails.js - Скрипт для исправления грузинских email
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Функция для поиска и замены email опций
// Добавляем в каждый mailOptions заголовки для UTF-8

// 1. Исправляем функцию send2FACode
const send2FA_old = `const mailOptions = {
    from: \`"Beauty Pass" <\${process.env.EMAIL_USER}>\`,
    to: user.email,
    subject: ' კოდი თქვენი დადასტურება Beauty Pass',`;

const send2FA_new = `const mailOptions = {
    from: {
      name: 'Beauty Pass',
      address: process.env.EMAIL_USER
    },
    to: user.email,
    subject: ' Beauty Pass - დამადასტურებელი კოდი',
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    },`;

// 2. Исправляем 2FA email HTML
const twoFA_html_old = `<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>
          <p style="font-size: 16px; color: #333;">გამარჯობა, \${user.firstName || user.login}!</p>
          <p style="font-size: 16px; color: #333;">თქვენი დადასტურების კოდი:</p>`;

const twoFA_html_new = `<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>
          <p style="font-size: 16px; color: #333;">გამარჯობა, \${user.firstName || user.login}!</p>
          <p style="font-size: 16px; color: #333;">თქვენი დამადასტურებელი კოდი:</p>`;

// Применяем замены
let newContent = content;

// Заменяем текст с учётом что файл может быть в сломаной кодировке
// Сначала проверим какой там текст

console.log('=== Проверка содержимого server.js ===');

// Находим строку с subject для 2FA
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('subject') && (lines[i].includes('2FA') || lines[i].includes('დადასტურება') || lines[i].includes('??????'))) {
    console.log(`Line ${i+1}: ${lines[i].substring(0, 100)}`);
  }
}

// Проверяем, есть ли проблемы с кодировкой (символы ?)
const hasEncodingIssue = content.includes('???????') || content.includes('??????');
console.log(`\nПроблема с кодировкой: ${hasEncodingIssue ? 'ДА' : 'НЕТ'}`);

if (hasEncodingIssue) {
  console.log('\nФайл имеет проблемы с кодировкой. Нужно пересоздать email функции с правильным грузинским текстом.');
}
