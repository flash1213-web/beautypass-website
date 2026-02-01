const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Fix the missing closing brace
const oldCode = `      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });
    // Подтверждаем email`;

const newCode = `      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });
    }

    // Подтверждаем email`;

c = c.replace(oldCode, newCode);
fs.writeFileSync('server.js', c, 'utf8');
console.log('Fixed closing brace!');
