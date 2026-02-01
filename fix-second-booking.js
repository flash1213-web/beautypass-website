// fix-second-booking.js - Исправление второго booking email и comments
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('=== Исправление второго booking email ===\n');

const fixes = [
  // Fix header with emoji
  ['<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass</h2>', '<h2 style="color: #ff6b9d; text-align: center;"> Beauty Pass - ჯავშანი</h2>'],
  
  // Fix subject with emoji
  ['subject: ` ჯავშანი დადასტურებულია -', 'subject: ` ჯავშანი დადასტურებულია -'],
  ['subject: \' Beauty Pass - დამადასტურებელი კოდი\'', "subject: ' Beauty Pass - დამადასტურებელი კოდი'"],
  ['subject: \' Beauty Pass - პაროლის აღდგენა\'', "subject: ' Beauty Pass - პაროლის აღდგენა'"],
  ['subject: \' Beauty Pass - პაროლი შეცვლილია\'', "subject: ' Beauty Pass - პაროლი შეცვლილია'"],
  
  // Comments
  ['// მომსახურება (მომსახურება)', '// სალონები მფლობელებთან ერთად (კომბინირებული)'],
  ['// მომსახურება salon', '// ვპოულობთ ყველა სალონის მფლობელს'],
  ['// მომსახურება Salon', '// ასევე ვიღებთ სალონებს Salon მოდელიდან'],
  ['// მომსახურება', '// აერთიანებთ'],
  
  // Second email text fix
  ['თქვენი დამადასტურებელი კოდი:</p>', 'თქვენი ჯავშნის დეტალები:</p>'],
];

let fixCount = 0;
for (const [oldText, newText] of fixes) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    fixCount++;
    console.log(` Fixed: "${oldText.substring(0, 45)}..."`);
  }
}

// Записываем
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\nApplied ${fixCount} fixes`);
console.log(' Server.js updated!');
