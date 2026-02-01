// add-utf8-encoding.js
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Добавление UTF-8 кодировки в email ===\n');

// Заменяем from строку на объект с правильной кодировкой для всех mailOptions
// Pattern 1: from: `"Beauty Pass" <${process.env.EMAIL_USER}>`
content = content.replace(
  /from: `"Beauty Pass" <\$\{process\.env\.EMAIL_USER\}>`/g,
  `from: {
      name: '=?UTF-8?B?' + Buffer.from('Beauty Pass').toString('base64') + '?=',
      address: process.env.EMAIL_USER
    }`
);

// Pattern 2: from: process.env.EMAIL_USER (для emailTransporter)
content = content.replace(
  /from: process\.env\.EMAIL_USER,\s*\n\s*to:/g,
  `from: {
          name: '=?UTF-8?B?' + Buffer.from('Beauty Pass').toString('base64') + '?=',
          address: process.env.EMAIL_USER
        },
        to:`
);

// Добавляем textEncoding в transporter options
content = content.replace(
  /const transporter = nodemailer\.createTransport\(\{\s*\n\s*service: 'gmail',/g,
  `const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    secure: true,`
);

fs.writeFileSync(serverPath, content, 'utf8');
console.log(' UTF-8 encoding добавлен!');
