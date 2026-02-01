const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Find lines around the duplicate issue and fix manually
const lines = c.split('\n');
let result = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip duplicate closing braces and return statements
  if (skipNext) {
    if (line.trim() === '}' || line.includes("return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' })")) {
      continue;
    }
    skipNext = false;
  }
  
  // Check for duplicate pattern
  if (line.includes("კოდის ვადა ამოიწურა' });") && 
      i + 1 < lines.length && 
      (lines[i+1].trim() === '}' || lines[i+1].includes("კოდის ვადა ამოიწურა"))) {
    result.push(line);
    skipNext = true;
    continue;
  }
  
  result.push(line);
}

fs.writeFileSync('server.js', result.join('\n'), 'utf8');
console.log('Fixed!');
