const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Fix - add the missing closing brace for the if block
const badCode = `      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });
    // Подтверждаем email`;

const fixedCode = `      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });
    }

    // Подтверждаем email`;

if (c.includes(badCode)) {
  c = c.replace(badCode, fixedCode);
  fs.writeFileSync('server.js', c, 'utf8');
  console.log('Fixed!');
} else {
  console.log('Pattern not found, checking for newlines...');
  
  // Try line by line
  const lines = c.split('\n');
  let fixed = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("კოდის ვადა ამოიწურა' });") && 
        !lines[i].includes("თავიდან") &&
        lines[i+1] && lines[i+1].includes("// Подтверждаем email")) {
      // Insert closing brace
      lines.splice(i+1, 0, '    }', '');
      fixed = true;
      break;
    }
  }
  
  if (fixed) {
    fs.writeFileSync('server.js', lines.join('\n'), 'utf8');
    console.log('Fixed with line method!');
  } else {
    console.log('Could not fix automatically');
  }
}
