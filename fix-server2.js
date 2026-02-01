const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Remove duplicate lines that were added by mistake
const badPattern = /    if \(Date\.now\(\) > user\.twoFACodeExpires\) \{[\s\S]*?return res\.status\(400\)\.json\(\{ message: 'კოდის ვადა ამოიწურა' \}\);[\s\S]*?\}[\s\S]*?return res\.status\(400\)\.json\(\{ message: 'კოდის ვადა ამოიწურა' \}\);[\s\S]*?\}/g;

const goodCode = `    if (Date.now() > user.twoFACodeExpires) {
      // If user not verified and code expired - delete user
      if (!user.isEmailVerified) {
        await User.deleteOne({ _id: user._id });
        return res.status(400).json({ message: 'კოდის ვადა ამოიწურა. გაიარეთ რეგისტრაცია თავიდან.' });
      }
      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });
    }`;

c = c.replace(badPattern, goodCode);
fs.writeFileSync('server.js', c, 'utf8');
console.log('Fixed duplicates!');
