// fix-html-encoding.js - Добавление правильных headers для HTML
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('📧 Добавление HTML charset headers...\n');

// 1. Исправляем все mailOptions - заменяем html: ` на версию с headers
// Паттерн: найти html: ` и добавить перед ней headers

// Заменяем все конструкции типа:
// to: user.email,
// subject: ...,
// html: `
// На:
// to: user.email,
// subject: ...,
// headers: { 'Content-Type': 'text/html; charset=UTF-8' },
// html: `

// Более простой подход - обернуть HTML в правильную структуру с DOCTYPE и meta

// Заменяем <meta charset="UTF-8"> на полную HTML структуру
const oldMeta = '<meta charset="UTF-8">';
const newMeta = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body>';

let count = 0;
while (content.includes(oldMeta)) {
  content = content.replace(oldMeta, newMeta);
  count++;
}
console.log(`✅ Заменено ${count} meta tags на полную HTML структуру`);

// Также заменяем закрывающий </div>\n    ` на </div></body></html>\n    `
// Это сложнее, поэтому добавляем закрывающие теги в конец каждого html

// Ищем все места где html заканчивается на </div>\n    `, и добавляем </body></html>
// Паттерн: </div>\n      </div>\n    `,

const closePatterns = [
  {
    old: `      </div>
    \`,`,
    new: `      </div></body></html>
    \`,`
  },
  {
    old: `        </div>
      </div>
    \`,`,
    new: `        </div>
      </div></body></html>
    \`,`
  }
];

closePatterns.forEach(p => {
  if (content.includes(p.old)) {
    content = content.split(p.old).join(p.new);
    console.log('✅ Добавлены закрывающие теги </body></html>');
  }
});

fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n✅ HTML структура исправлена!');
console.log('⚠️  Перезапустите сервер: pm2 restart beautypass');
