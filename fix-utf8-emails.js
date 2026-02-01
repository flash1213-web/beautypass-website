// fix-utf8-emails.js - Исправление кодировки UTF-8 в email
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('📧 Исправление UTF-8 кодировки в email...\n');

// Находим все места где создается transporter и добавляем правильные настройки
// Проблема: nodemailer по умолчанию может неправильно кодировать не-ASCII символы

// 1. Исправляем sendBookingQREmail функции - добавляем encoding в mailOptions
// Ищем все mailOptions и добавляем encoding: 'utf-8' и textEncoding: 'base64'

// Заменяем все конструкции sendMail чтобы добавить правильную кодировку

// Находим паттерн: const mailOptions = { ... subject: ...
// и добавляем encoding настройки

const fixes = [
  // Исправляем headers для правильной кодировки
  {
    find: /const mailOptions = \{\s*from:/g,
    replace: `const mailOptions = {
    encoding: 'utf-8',
    textEncoding: 'base64',
    from:`
  }
];

// Применяем исправления
let count = 0;
fixes.forEach(fix => {
  if (content.match(fix.find)) {
    content = content.replace(fix.find, fix.replace);
    count++;
  }
});

console.log(`✅ Исправлено ${count} mailOptions`);

// Теперь исправляем subject - кодируем его в base64 для UTF-8
// Заменяем все subject с грузинскими символами на правильно закодированные

// Функция для кодирования в MIME encoded-word
function encodeMIME(text) {
  return '=?UTF-8?B?' + Buffer.from(text, 'utf8').toString('base64') + '?=';
}

// Добавляем функцию encodeUTF8Subject в начало server.js после nodemailer require
const encodeFunction = `
// Функция для кодировки UTF-8 в email subject
function encodeUTF8Subject(text) {
  // Кодируем в MIME encoded-word формат для UTF-8
  return '=?UTF-8?B?' + Buffer.from(text, 'utf8').toString('base64') + '?=';
}

`;

// Проверяем есть ли уже функция
if (!content.includes('function encodeUTF8Subject')) {
  // Добавляем после require nodemailer
  const nodemailerPos = content.indexOf("const nodemailer = require('nodemailer');");
  if (nodemailerPos > -1) {
    const insertPos = content.indexOf('\n', nodemailerPos) + 1;
    content = content.slice(0, insertPos) + encodeFunction + content.slice(insertPos);
    console.log('✅ Добавлена функция encodeUTF8Subject');
  }
}

// Теперь заменяем все subject с грузинским текстом на использование encodeUTF8Subject
// subject: `...грузинский текст...` -> subject: encodeUTF8Subject(`...`)

// Паттерн для замены subject
const subjectPatterns = [
  {
    old: "subject: ` ჯავშანი დადასტურებულია - ${booking.serviceName}`,",
    new: "subject: encodeUTF8Subject(`ჯავშანი დადასტურებულია - ${booking.serviceName}`),"
  },
  {
    old: "subject: ' Beauty Pass - დამადასტურებელი კოდი',",
    new: "subject: encodeUTF8Subject('Beauty Pass - დამადასტურებელი კოდი'),"
  },
  {
    old: "subject: ' Beauty Pass - პაროლის აღდგენა',",
    new: "subject: encodeUTF8Subject('Beauty Pass - პაროლის აღდგენა'),"
  },
  {
    old: "subject: ' Beauty Pass - პაროლი შეცვლილია',",
    new: "subject: encodeUTF8Subject('Beauty Pass - პაროლი შეცვლილია'),"
  },
  {
    old: "subject: 'Beauty Pass - ბალანსი შეივსო',",
    new: "subject: encodeUTF8Subject('Beauty Pass - ბალანსი შეივსო'),"
  },
  {
    old: "subject: 'Beauty Pass - ვიზიტი დასრულდა | ჩეკი',",
    new: "subject: encodeUTF8Subject('Beauty Pass - ვიზიტი დასრულდა | ჩეკი'),"
  }
];

subjectPatterns.forEach(p => {
  if (content.includes(p.old)) {
    content = content.split(p.old).join(p.new);
    console.log(`✅ Исправлен subject: ${p.old.substring(0, 40)}...`);
  }
});

// Записываем файл
fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n✅ Кодировка исправлена!');
console.log('⚠️  Перезапустите сервер: pm2 restart beautypass');
