// send-test-to-user.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendTest() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: '"Beauty Pass" <' + process.env.EMAIL_USER + '>',
    to: 'a.muradiani26@gmail.com',
    subject: '🌸 Тест Beauty Pass - ' + new Date().toLocaleTimeString(),
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #ff6b9d; text-align: center;">🌸 Beauty Pass</h1>
          <p style="font-size: 16px; color: #333;">გამარჯობა!</p>
          <p style="font-size: 16px; color: #333;">Это тестовое письмо от Beauty Pass.</p>
          <div style="background: #ffe0e8; padding: 15px; font-size: 32px; font-weight: bold; text-align: center; border-radius: 10px; margin: 20px 0; color: #ff6b9d; letter-spacing: 8px;">
            123456
          </div>
          <p style="font-size: 14px; color: #888;">თქვენი კოდი მოქმედებს 5 წუთი.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - სილამაზის პასპორტი</p>
        </div>
      </div>
    `
  });

  console.log('✅ Письмо отправлено на a.muradiani26@gmail.com');
  console.log('   Message ID:', info.messageId);
}

sendTest().catch(e => console.error('❌ Ошибка:', e.message));
