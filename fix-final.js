const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

const lines = c.split('\n');
let result = [];

for (let i = 0; i < lines.length; i++) {
  result.push(lines[i]);
  
  // After this line add closing brace for outer if
  if (lines[i].includes("კოდის ვადა ამოიწურა' });") && 
      !lines[i].includes("თავიდან")) {
    result.push('    }');
    result.push('');
  }
}

fs.writeFileSync('server.js', result.join('\n'), 'utf8');
console.log('Added closing brace!');
