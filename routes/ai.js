// routes/ai.js - AI Bella с ChatGPT интеграцией
const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');

// База знаний Beauty Pass
const BEAUTY_PASS_KNOWLEDGE = `
Beauty Pass - это инновационная платформа для бронирования услуг красоты в Грузии.

ТАРИФЫ:
- BP Basic (35₾/месяц) - 100 Beauty Points, базовые услуги (ногти, брови)
- BP Plus (60₾/месяц) - 200 Beauty Points, + волосы, 5% кэшбек
- BP Pro (100₾/месяц) - 400 Beauty Points, все услуги, 10% кэшбек, VIP поддержка

BEAUTY POINTS (BP):
- 1 BP ≈ 1₾ стоимости услуги
- Маникюр = 45 BP, Педикюр = 55 BP
- Стрижка = 70 BP, Окрашивание = 120-200 BP
- Массаж 60мин = 110 BP

ПАРТНЕРЫ:
- 9+ салонов красоты в Тбилиси
- Вакe, Сабуртало, Марджанишвили, Авлабари
- Berberis Beauty Salon, Daphne, Pivot Beauty, Nailomania, Beauty Room

БРОНИРОВАНИЕ:
1. Выберите салон на главной странице или карте
2. Выберите услугу и специалиста
3. Выберите дату и время
4. Подтвердите бронирование
5. Получите QR-код на email

ОТМЕНА:
- За 3+ дня - полный возврат BP
- За 2-3 дня - можно перенести время
- Менее 24 часов - BP не возвращаются

РЕФЕРАЛЬНАЯ ПРОГРАММА:
- Вы получаете 20 BP за каждого приглашенного друга
- Друг получает 10 BP в подарок

ОПЛАТА:
- Bank of Georgia (BOG)
- TBC Bank
- Безопасные онлайн платежи
`;

// ChatGPT API запрос
async function askChatGPT(userMessage, conversationHistory = [], userContext = {}) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.log('⚠️ OpenAI API key not configured, using fallback');
    return null; // Вернем null чтобы использовать fallback
  }
  
  const systemPrompt = `Ты - Bella, умный и дружелюбный AI-ассистент платформы Beauty Pass в Грузии.
Твоя личность:
- Женственная, элегантная, профессиональная
- Говоришь на грузинском и русском языках
- Используешь эмодзи умеренно: 💅✨💎🌸
- Даешь краткие, но полезные ответы
- Знаешь все о красоте, уходе за собой, моде

ВАЖНАЯ ИНФОРМАЦИЯ О BEAUTY PASS:
${BEAUTY_PASS_KNOWLEDGE}

${userContext.userName ? `Пользователя зовут: ${userContext.userName}` : ''}
${userContext.balance ? `Баланс пользователя: ${userContext.balance} BP` : ''}
${userContext.plan ? `Активный план: ${userContext.plan}` : ''}

Правила:
1. Отвечай на вопросы о Beauty Pass используя знания выше
2. Если вопрос не о Beauty Pass - отвечай как эксперт по красоте
3. Будь полезной и предлагай решения
4. Если не знаешь ответ - предложи связаться с поддержкой
5. Используй форматирование: **жирный**, *курсив*`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    })),
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Быстрая и дешевая модель
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT error:', error);
    return null;
  }
}

// Fallback ответы на основе ключевых слов
function getFallbackResponse(message, lang = 'ka') {
  const lowerMsg = message.toLowerCase();
  
  const responses = {
    plans: {
      ka: `ჩვენ გვაქვს 3 ტარიფი:\n\n🥉 **BP Basic** - 35₾/თვე (100 BP)\n🥈 **BP Plus** - 60₾/თვე (200 BP)\n🥇 **BP Pro** - 100₾/თვე (400 BP)\n\nრომელი გაინტერესებთ?`,
      ru: `У нас 3 тарифа:\n\n🥉 **BP Basic** - 35₾/мес (100 BP)\n🥈 **BP Plus** - 60₾/мес (200 BP)\n🥇 **BP Pro** - 100₾/мес (400 BP)\n\nКакой вас интересует?`
    },
    booking: {
      ka: `ჯავშნისთვის:\n1️⃣ აირჩიეთ სალონი\n2️⃣ აირჩიეთ სერვისი\n3️⃣ აირჩიეთ დრო\n4️⃣ დაადასტურეთ\n\n💡 QR კოდი მოვა ელფოსტაზე!`,
      ru: `Для бронирования:\n1️⃣ Выберите салон\n2️⃣ Выберите услугу\n3️⃣ Выберите время\n4️⃣ Подтвердите\n\n💡 QR-код придет на email!`
    },
    salons: {
      ka: `📍 ჩვენი პარტნიორი სალონები თბილისში:\n• Berberis Beauty Salon (ვაკე)\n• Daphne (საბურთალო)\n• Nailomania (მარჯანიშვილი)\n• Beauty Room (ავლაბარი)\n\n🗺️ ნახეთ რუკაზე!`,
      ru: `📍 Наши партнеры в Тбилиси:\n• Berberis Beauty Salon (Ваке)\n• Daphne (Сабуртало)\n• Nailomania (Марджанишвили)\n• Beauty Room (Авлабари)\n\n🗺️ Смотрите на карте!`
    },
    default: {
      ka: `გმადლობთ შეკითხვისთვის! 💅\n\nშემიძლია დაგეხმაროთ:\n• ტარიფების არჩევაში\n• ჯავშნის გაფორმებაში\n• სალონების პოვნაში\n• ნებისმიერ შეკითხვაზე\n\nდაწერეთ თქვენი შეკითხვა!`,
      ru: `Спасибо за вопрос! 💅\n\nМогу помочь с:\n• Выбором тарифа\n• Бронированием\n• Поиском салона\n• Любыми вопросами\n\nНапишите свой вопрос!`
    }
  };
  
  // Определяем тему
  if (/тариф|plan|ფას|ტარიფ|price|cost/i.test(lowerMsg)) {
    return responses.plans[lang] || responses.plans.ka;
  }
  if (/book|ჯავშან|брон|reserv/i.test(lowerMsg)) {
    return responses.booking[lang] || responses.booking.ka;
  }
  if (/salon|სალონ|салон|where|სად/i.test(lowerMsg)) {
    return responses.salons[lang] || responses.salons.ka;
  }
  
  return responses.default[lang] || responses.default.ka;
}

// Главный endpoint для AI чата
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], language = 'ka' } = req.body;
    
    // Получаем контекст пользователя если авторизован
    let userContext = {};
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (user) {
          userContext = {
            userName: user.firstName,
            balance: user.beautyPoints,
            plan: user.activePlan?.name
          };
        }
      } catch (e) {}
    }
    
    // Пробуем ChatGPT
    let response = await askChatGPT(message, conversationHistory, userContext);
    
    // Если ChatGPT недоступен - используем fallback
    if (!response) {
      response = getFallbackResponse(message, language);
    }
    
    res.json({ 
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      response: 'უკაცრავად, დროებითი შეფერხებაა. სცადეთ თავიდან! 🙏',
      error: true 
    });
  }
});

// Endpoint для быстрых действий
router.post('/action', auth, async (req, res) => {
  try {
    const { action, params = {} } = req.body;
    
    switch(action) {
      case 'book_salon':
        res.json({ 
          action: 'navigate',
          target: 'salons',
          message: 'გადამისამართება სალონების გვერდზე...'
        });
        break;
        
      case 'view_plans':
        res.json({ 
          action: 'navigate',
          target: 'tariffs',
          message: 'გადამისამართება ტარიფებზე...'
        });
        break;
        
      case 'top_up':
        res.json({ 
          action: 'open_modal',
          target: 'topup',
          message: 'ბალანსის შევსების ფორმა...'
        });
        break;
        
      case 'contact_support':
        res.json({
          action: 'open_modal',
          target: 'support',
          message: 'დაკავშირება მხარდაჭერასთან...',
          email: 'info@beautypass.ge'
        });
        break;
        
      default:
        res.json({ 
          action: 'message',
          message: 'მოქმედება არ არის ხელმისაწვდომი'
        });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Советы дня
router.get('/tip-of-the-day', async (req, res) => {
  const tips = [
    { ka: '💅 ფრჩხილის ლაქი უფრო დიდხანს დარჩება თუ ბაზას გამოიყენებთ!', en: '💅 Nail polish lasts longer with a base coat!' },
    { ka: '✨ კანის გათეთრებისთვის C ვიტამინის სერუმი საუკეთესოა!', en: '✨ Vitamin C serum is best for skin brightening!' },
    { ka: '💆 თავის მასაჟი თმის ზრდას ასტიმულირებს!', en: '💆 Scalp massage stimulates hair growth!' },
    { ka: '🌸 ნიღაბი კვირაში 1-2 ჯერ საკმარისია!', en: '🌸 Face mask 1-2 times a week is enough!' },
    { ka: '💎 SPF ყოველდღიური გამოყენება კანს ახალგაზრდა ინახავს!', en: '💎 Daily SPF keeps skin youthful!' }
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  res.json(randomTip);
});

module.exports = router;
