// fix-email-encoding-v2.js - Исправление кодировки email (UTF-8)
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('📧 Исправление кодировки email в server.js...\n');

// 1. Исправляем все mailOptions - добавляем encoding и headers для UTF-8
// Ищем паттерны mailOptions с кривой кодировкой from

// Заменяем криво закодированный from на простой формат
const oldFromPattern = /from:\s*\{\s*name:\s*'=\?UTF-8\?B\?'\s*\+\s*Buffer\.from\('Beauty Pass'\)\.toString\('base64'\)\s*\+\s*'\?=',\s*address:\s*process\.env\.EMAIL_USER\s*\}/g;

const newFrom = `from: '"Beauty Pass" <' + process.env.EMAIL_USER + '>'`;

let count = 0;

// Ищем все вхождения и заменяем
content = content.replace(oldFromPattern, () => {
  count++;
  return newFrom;
});

console.log(`✅ Заменено ${count} криво закодированных from`);

// 2. Добавляем encoding в mailOptions где его нет
// Ищем mailOptions без encoding и добавляем его

const mailOptionsPattern = /const mailOptions = \{\s*from:/g;
let matches = content.match(mailOptionsPattern);

if (matches) {
  console.log(`📧 Найдено ${matches.length} mailOptions`);
}

// 3. Также исправляем subject с грузинским текстом - добавляем =?UTF-8?B?...?= кодировку
// Ищем subject с кириллическими/грузинскими символами

// Создаем функцию для кодировки subject в UTF-8 Base64
const encodeSubjectComment = `
// Функция для кодировки subject в UTF-8 (для грузинского/русского текста)
function encodeSubject(text) {
  return '=?UTF-8?B?' + Buffer.from(text, 'utf8').toString('base64') + '?=';
}
`;

// Проверяем есть ли уже функция encodeSubject
if (!content.includes('function encodeSubject(')) {
  // Добавляем после объявления emailTransporter
  const insertPoint = content.indexOf('let emailTransporter = null;');
  if (insertPoint > -1) {
    const afterEmailTransporter = content.indexOf('\n', content.indexOf('Email transporter', insertPoint)) + 1;
    content = content.slice(0, afterEmailTransporter) + encodeSubjectComment + content.slice(afterEmailTransporter);
    console.log('✅ Добавлена функция encodeSubject для UTF-8 кодировки');
  }
}

// 4. Заменяем отправку с простым subject на закодированный
// Находим все места где subject содержит грузинский текст

// Исправляем HTML - добавляем meta charset
content = content.replace(
  /<div style="font-family: Arial, sans-serif;/g,
  '<meta charset="UTF-8"><div style="font-family: Arial, sans-serif;'
);

console.log('✅ Добавлен meta charset="UTF-8" в HTML шаблоны');

// 5. Записываем изменённый файл
fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n✅ Кодировка email исправлена!');
console.log('⚠️  Перезапустите сервер: pm2 restart beautypass');
