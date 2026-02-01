// add-email-v2.js - Добавление email уведомлений (исправленный)
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('📧 Добавление email уведомлений...\n');

// 1. Добавляем email при пополнении баланса
const balanceOld = `user.balance += amount;
    await user.save();
    res.json({ message: 'მომსახურება!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'კოდი გაგზავნილია თქვენს ელფოსტაზე' });
  }
});

app.post('/api/bookings',`;

const balanceNew = `user.balance += amount;
    await user.save();

    // 📧 Email о пополнении баланса
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
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
                <p style="font-size: 32px; font-weight: bold; color: #155724; margin: 10px 0;">+\${amount} BP</p>
              </div>
              
              <div style="background-color: #ffe0e8; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="font-size: 14px; color: #ff6b9d; margin: 0;">მიმდინარე ბალანსი:</p>
                <p style="font-size: 24px; font-weight: bold; color: #ff6b9d; margin: 10px 0;">\${user.balance} BP</p>
              </div>
              
              <p style="font-size: 14px; color: #888; margin-top: 20px; text-align: center;">თარიღი: \${new Date().toLocaleString('ka-GE')}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #aaa; text-align: center;">Beauty Pass - სილამაზის აბონემენტი</p>
            </div>
          </div>
        \`
      });
      console.log('💰 Balance top-up email sent to:', user.email);
    } catch (emailError) {
      console.error('Balance email error:', emailError.message);
    }

    res.json({ message: 'მომსახურება!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'კოდი გაგზავნილია თქვენს ელფოსტაზე' });
  }
});

app.post('/api/bookings',`;

if (content.includes(balanceOld)) {
  content = content.replace(balanceOld, balanceNew);
  console.log('✅ Добавлено: Email при пополнении баланса');
} else {
  console.log('⚠️  Код пополнения баланса не найден');
}

fs.writeFileSync(serverPath, content, 'utf8');
console.log('\n✅ Готово!');
