const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Find and replace the expired code handling
const lines = c.split('\n');
let newLines = [];
let i = 0;

while (i < lines.length) {
  if (lines[i].includes('Date.now() > user.twoFACodeExpires')) {
    // Found the line, replace the whole block
    newLines.push('    if (Date.now() > user.twoFACodeExpires) {');
    newLines.push('      // If user not verified and code expired - delete user');
    newLines.push('      if (!user.isEmailVerified) {');
    newLines.push('        await User.deleteOne({ _id: user._id });');
    newLines.push("        return res.status(400).json({ message: 'კოდის ვადა ამოიწურა. გაიარეთ რეგისტრაცია თავიდან.' });");
    newLines.push('      }');
    newLines.push("      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });");
    newLines.push('    }');
    
    // Skip original lines until closing brace
    i++;
    while (i < lines.length && !lines[i].trim().startsWith('}')) {
      i++;
    }
    i++; // skip the closing brace
  } else {
    newLines.push(lines[i]);
    i++;
  }
}

fs.writeFileSync('server.js', newLines.join('\n'), 'utf8');
console.log('Done!');
