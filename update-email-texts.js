// update-email-texts.js - Обновление текстов email
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('📧 Обновление текстов email...\n');

// 1. Заменяем "სილამაზის პასპორტი" на "სილამაზის აბონემენტი"
content = content.replace(/სილამაზის პასპორტი/g, 'სილამაზის აბონემენტი');
console.log('✅ Заменено: სილამაზის პასპორტი → სილამაზის აბონემენტი');

// 2. Заменяем "მადლობა რომ გვირჩევთ" на "მადლობა ნდობისთვის"
content = content.replace(/მადლობა რომ გვირჩევთ/g, 'მადლობა ნდობისთვის');
console.log('✅ Заменено: მადლობა რომ გვირჩევთ → მადლობა ნდობისთვის');

// 3. Исправляем email о смене пароля (строка 1586-1587)
content = content.replace(
  /<h2 style="color: #155724; margin-bottom: 20px;">მომსახურება<\/h2>\s*<p style="color: #155724;">მომსახურება\.<\/p>/g,
  `<h2 style="color: #155724; margin-bottom: 20px;">✅ პაროლი წარმატებით შეიცვალა</h2>
                <p style="color: #155724;">თქვენი ანგარიშის პაროლი წარმატებით განახლდა.</p>
                <p style="color: #155724; margin-top: 10px;">თუ ეს თქვენ არ გაკეთებულხართ, დაუყოვნებლივ დაგვიკავშირდით.</p>`
);
console.log('✅ Исправлено: Email о смене пароля');

// 4. Добавляем email при пополнении баланса
const balanceAddOld = `user.balance += amount;
    await user.save();
    res.json({ message: 'მომსახურება!', user: user });`;

const balanceAddNew = `user.balance += amount;
    await user.save();

    // 📧 Отправляем email о пополнении
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      
      await transporter.sendMail({
        from: '"Beauty Pass" <' + process.env.EMAIL_USER + '>',
        to: user.email,
        subject: '💰 Beauty Pass - ბალანსი შეივსო',
        html: \`
          <meta charset="UTF-8">
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #ff6b9d; text-align: center;">🌸 Beauty Pass</h2>
              <p style="font-size: 16px; color: #333;">გამარჯობა, \${user.firstName || user.login}!</p>
              <p style="font-size: 16px; color: #333;">თქვენი ბალანსი წარმატებით შეივსო!</p>
              
              <div style="background-color: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                <p style="font-size: 14px; color: #155724; margin: 0;">შევსებული თანხა:</p>
                <p style="font-size: 32px; font-weight: bold; color: #155724; margin: 10px 0;">\${amount} BP</p>
              </div>
              
              <div style="background-color: #ffe0e8; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="font-size: 14px; color: #ff6b9d; margin: 0;">მიმდინარე ბალანსი:</p>
                <p style="font-size: 24px; font-weight: bold; color: #ff6b9d; margin: 10px 0;">\${user.balance} BP</p>
              </div>
              
              <p style="font-size: 14px; color: #888; margin-top: 20px;">თარიღი: \${new Date().toLocaleString('ka-GE')}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - სილამაზის აბონემენტი</p>
            </div>
          </div>
        \`
      });
      console.log('💰 Balance email sent to:', user.email);
    } catch (emailError) {
      console.error('Balance email error:', emailError);
    }

    res.json({ message: 'მომსახურება!', user: user });`;

if (content.includes(balanceAddOld)) {
  content = content.replace(balanceAddOld, balanceAddNew);
  console.log('✅ Добавлено: Email при пополнении баланса');
} else {
  console.log('⚠️  Не найден код пополнения баланса для добавления email');
}

// 5. Добавляем email-чек при подтверждении услуги салоном
const confirmBookingOld = `console.log(\`? თქვენი ჯავშნის დეტალები: \${bookingCode}\`);

    res.json({
      success: true,
      message: \`მომსახურება \${bpPrice} BP მომსახურება\`,`;

const confirmBookingNew = `console.log(\`? თქვენი ჯავშნის დეტალები: \${bookingCode}\`);

    // 📧 Отправляем чек клиенту
    try {
      const client = await User.findById(booking.userId);
      if (client && client.email) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        await transporter.sendMail({
          from: '"Beauty Pass" <' + process.env.EMAIL_USER + '>',
          to: client.email,
          subject: '✅ Beauty Pass - ვიზიტი დასრულდა | ჩეკი',
          html: \`
            <meta charset="UTF-8">
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <h2 style="color: #ff6b9d; text-align: center;">🌸 Beauty Pass</h2>
                <h3 style="color: #155724; text-align: center;">✅ ვიზიტი წარმატებით დასრულდა!</h3>
                
                <p style="font-size: 16px; color: #333;">გამარჯობა, \${client.firstName || 'მომხმარებელო'}!</p>
                <p style="font-size: 16px; color: #333;">მადლობა რომ ისარგებლეთ Beauty Pass-ით!</p>
                
                <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); color: white; padding: 25px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; text-align: center;">🧾 ჩეკი / Receipt</h3>
                  <table style="width: 100%; color: white;">
                    <tr><td style="padding: 8px 0;">📍 სალონი:</td><td style="text-align: right;">\${booking.salonName}</td></tr>
                    <tr><td style="padding: 8px 0;">💅 მომსახურება:</td><td style="text-align: right;">\${booking.serviceName}</td></tr>
                    <tr><td style="padding: 8px 0;">📅 თარიღი:</td><td style="text-align: right;">\${booking.date}</td></tr>
                    <tr><td style="padding: 8px 0;">🕐 დრო:</td><td style="text-align: right;">\${booking.time}</td></tr>
                    <tr style="border-top: 1px solid rgba(255,255,255,0.3);"><td style="padding: 12px 0; font-size: 18px; font-weight: bold;">💰 გადახდილი:</td><td style="text-align: right; font-size: 20px; font-weight: bold;">\${bpPrice} BP</td></tr>
                  </table>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center;">
                  <p style="font-size: 14px; color: #666; margin: 0;">ჯავშნის კოდი:</p>
                  <p style="font-size: 20px; font-weight: bold; color: #ff6b9d; margin: 5px 0;">\${booking.bookingCode}</p>
                  <p style="font-size: 12px; color: #999; margin: 5px 0;">დადასტურდა: \${new Date().toLocaleString('ka-GE')}</p>
                </div>
                
                <p style="font-size: 14px; color: #888; margin-top: 20px; text-align: center;">მადლობა ნდობისთვის! 💕</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - სილამაზის აბონემენტი</p>
                <p style="font-size: 10px; color: #ccc; text-align: center;">© 2026 Beauty Pass. ყველა უფლება დაცულია.</p>
              </div>
            </div>
          \`
        });
        console.log('🧾 Receipt email sent to:', client.email);
      }
    } catch (emailError) {
      console.error('Receipt email error:', emailError);
    }

    res.json({
      success: true,
      message: \`მომსახურება \${bpPrice} BP მომსახურება\`,`;

if (content.includes(confirmBookingOld)) {
  content = content.replace(confirmBookingOld, confirmBookingNew);
  console.log('✅ Добавлено: Email-чек при подтверждении услуги');
} else {
  console.log('⚠️  Не найден код подтверждения для добавления чека');
}

// Записываем изменённый файл
fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n✅ Все тексты email обновлены!');
console.log('⚠️  Перезапустите сервер: pm2 restart beautypass');
