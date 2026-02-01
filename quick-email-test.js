// quick-email-test.js - Тест отправки на другой адрес
require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log('📧 Отправка тестового письма...');
  
  const info = await transporter.sendMail({
    from: '"Beauty Pass" <' + process.env.EMAIL_USER + '>',
    to: process.env.EMAIL_USER,
    subject: '🌸 Тест Beauty Pass - ' + new Date().toLocaleTimeString(),
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h1 style="color: #ff6b9d;">🌸 Beauty Pass</h1>
        <p>Это тестовое письмо. Если вы его видите - email работает!</p>
        <p style="background: #ffe0e8; padding: 15px; font-size: 24px; text-align: center; border-radius: 10px;">
          123456
        </p>
        <p>Время отправки: ${new Date().toLocaleString()}</p>
      </div>
    `
  });
  
  console.log('✅ Письмо отправлено!');
  console.log('   Message ID:', info.messageId);
  console.log('   Response:', info.response);
  console.log('\n📬 Проверьте почту:', process.env.EMAIL_USER);
  console.log('   Также проверьте папку СПАМ!');
}

test().catch(e => console.error('❌ Ошибка:', e.message));
