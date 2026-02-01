// ======================================
// ПОДКЛЮЧЕНИЕ МОДУЛЕЙ
// ======================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// ======================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================================

// Генерация уникального реферального кода на основе email
function generateReferralCode(email) {
  let hash = 0;
  const str = email.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  return `BP-${code.padEnd(6, 'X')}`;
}

// ======================================
// ИМПОРТ МОДЕЛЕЙ
// ======================================
const User = require('./models/User');
const Package = require('./models/Package');
const Salon = require('./models/Salon');
const Service = require('./models/Service');
const Slot = require('./models/Slot');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');
const SiteSettings = require('./models/SiteSettings');
const Specialist = require('./models/Specialist');
const Message = require('./models/Message');
const { Group, Post, Comment, DirectMessage, Conversation, Notification, Follow } = require('./models/Community');

// ======================================
// ИМПОРТ ROUTES
// ======================================
const communityRoutes = require('./routes/community');
const aiRoutes = require('./routes/ai');

// ======================================
// ИМПОРТ MIDDLEWARE
// ======================================
const { authMiddleware, adminMiddleware, salonOwnerMiddleware } = require('./middleware/auth');

// ======================================
// НАСТРОЙКА ПРИЛОЖЕНИЯ
// ======================================
const app = express();
const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');
const uploadsPath = path.join(__dirname, 'uploads');
const communityUploadsPath = path.join(__dirname, 'uploads', 'community');

// Создаем папки uploads если они не существуют
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
if (!fs.existsSync(communityUploadsPath)) {
  fs.mkdirSync(communityUploadsPath, { recursive: true });
}

// ======================================
// ПОДКЛЮЧЕНИЕ К MONGODB
// ======================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена успешно'))
  .catch(err => {
    console.error('❌ Ошибка подключения к MongoDB:', err);
    process.exit(1);
  });

// ======================================
// MIDDLEWARE - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ======================================

// Включаем логирование всех запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 [${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Настройка безопасности
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "default-src": ["'self'"],
        "connect-src": ["'self'", "https://api.tbcbank.ge"],
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        "script-src-attr": ["'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);

// Настройка CORS - ИСПРАВЛЕНО
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://beautypass-website.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Парсеры JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ======================================
// СТАТИЧЕСКИЕ ФАЙЛЫ - ПРАВИЛЬНАЯ ВЕРСИЯ
// ======================================

// Раздаем статические файлы с меткой времени
// Раздаем статические файлы с меткой времени
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    console.log(`📁 Отдаем файл: ${filePath}`);
    
    // Отключаем кэширование для JS файлов
    if (filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('pragma', 'no-cache');
      res.setHeader('expires', '0');
    }
    
    if (filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('pragma', 'no-cache');
      res.setHeader('expires', '0');
    }
    
    // Отключаем кэширование для HTML
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('pragma', 'no-cache');
      res.setHeader('expires', '0');
    }
    
    if (filePath.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
    if (filePath.endsWith('.html')) {
      res.set('Content-Type', 'text/html');
    }
    if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    }
    if (filePath.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
  }
}));

// Отдельно раздаем папку uploads
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ======================================
// MULTER НАСТРОЙКА
// ======================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB for high quality photos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

// ======================================
// ГЛОБАЛЬНЫЙ EMAIL TRANSPORTER
// ======================================
let emailTransporter = null;
try {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Email transporter создан');
} catch (err) {
  console.error('❌ Ошибка создания email transporter:', err);
}

// ======================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================================

// Отправка 2FA кода на Email
async function send2FACode(user) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты
  user.twoFACode = code;
  user.twoFACodeExpires = expires;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Beauty Pass" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'თქვენი დადასტურების კოდი - Beauty Pass',
    html: `
      <div style="font-family: 'Noto Sans Georgian', Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #ff6b9d; text-align: center;">🌸 Beauty Pass</h2>
          <p style="font-size: 16px; color: #333;">გამარჯობა, ${user.firstName || user.login}!</p>
          <p style="font-size: 16px; color: #333;">თქვენი დადასტურების კოდი:</p>
          <div style="background-color: #ffe0e8; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #888;">კოდი მოქმედებს 2 წუთის განმავლობაში.</p>
          <p style="font-size: 14px; color: #888;">თუ თქვენ არ მოითხოვეთ ეს კოდი, უგულებელყავით ეს შეტყობინება.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ 2FA код отправлен на ${user.email}`);
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    console.log(`!!! 2FA CODE FOR ${user.email} !!!`);
    console.log(`CODE: ${code}`);
    console.log(`----------------------------------`);
  }
  
  return code;
}

// Функция отправки QR кода на email после бронирования
async function sendBookingQREmail(booking, user) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  const mailOptions = {
    from: `"Beauty Pass" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🌸 ჯავშანი დადასტურებულია - ${booking.serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #ff6b9d; text-align: center;">🌸 Beauty Pass - ჯავშანი</h2>
          
          <p style="font-size: 16px; color: #333;">გამარჯობა, ${user.firstName || 'მომხმარებელო'}!</p>
          <p style="font-size: 16px; color: #333;">თქვენი ჯავშანი დადასტურებულია:</p>
          
          <div style="background-color: #ffe0e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>📍 სალონი:</strong> ${booking.salonName}</p>
            ${booking.specialistName ? `<p><strong>👩‍🎨 სპეციალისტი:</strong> ${booking.specialistName}</p>` : ''}
            <p><strong>💅 პროცედურა:</strong> ${booking.serviceName}</p>
            <p><strong>📅 თარიღი:</strong> ${booking.date}</p>
            <p><strong>🕐 დრო:</strong> ${booking.time}</p>
            <p><strong>💰 ფასი:</strong> ${booking.bpPrice} BP</p>
            <p><strong>🎫 კოდი:</strong> <span style="font-size: 20px; font-weight: bold; color: #ff6b9d;">${booking.bookingCode}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff;">
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">აჩვენეთ ეს QR კოდი სალონში:</p>
            <div style="display: inline-block; padding: 15px; background: white; border: 2px solid #ff6b9d; border-radius: 10px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&format=png&margin=10&data=${encodeURIComponent(booking.bookingCode)}" alt="QR Code" width="250" height="250" style="display: block;"/>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">ან უთხარით კოდი:</p>
            <p style="font-size: 24px; font-weight: bold; color: #ff6b9d; letter-spacing: 2px; margin-top: 5px;">${booking.bookingCode}</p>
          </div>
          
          <p style="font-size: 14px; color: #888;">გისურვებთ სასიამოვნო ვიზიტს! ✨</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ QR email გაგზავნილია: ${user.email}`);
  } catch (error) {
    console.error('❌ QR email error:', error);
  }
}

// Отправка SMS кода (через SMS провайдер)
// Для Грузии можно использовать: Magti SMS API, Geocell SMS API, или международные Twilio/Nexmo
async function sendSMS2FACode(user, phone) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты
  user.twoFACode = code;
  user.twoFACodeExpires = expires;
  user.twoFAMethod = 'sms';
  await user.save();
  
  // Нормализуем номер телефона
  let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!normalizedPhone.startsWith('+')) {
    if (normalizedPhone.startsWith('995')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (normalizedPhone.startsWith('5')) {
      normalizedPhone = '+995' + normalizedPhone;
    }
  }
  
  // === ИНТЕГРАЦИЯ С SMS ПРОВАЙДЕРОМ ===
  // Раскомментируйте нужный провайдер:
  
  // 1. Twilio (международный)
  /*
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      await twilio.messages.create({
        body: `Beauty Pass: თქვენი კოდია ${code}. კოდი მოქმედებს 2 წუთი.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: normalizedPhone
      });
      console.log(`✅ SMS код отправлен на ${normalizedPhone}`);
      return code;
    } catch (err) {
      console.error('❌ Twilio SMS error:', err);
    }
  }
  */
  
  // 2. Magti SMS API (Грузия)
  /*
  if (process.env.MAGTI_USERNAME && process.env.MAGTI_PASSWORD) {
    try {
      const response = await axios.post('https://sms.magti.com/api/send', {
        username: process.env.MAGTI_USERNAME,
        password: process.env.MAGTI_PASSWORD,
        to: normalizedPhone,
        text: `Beauty Pass: თქვენი კოდია ${code}. კოდი მოქმედებს 2 წუთი.`,
        from: 'BeautyPass'
      });
      console.log(`✅ Magti SMS код отправлен на ${normalizedPhone}`);
      return code;
    } catch (err) {
      console.error('❌ Magti SMS error:', err);
    }
  }
  */
  
  // 3. В тестовом режиме выводим код в консоль
  console.log(`!!! SMS 2FA CODE FOR ${normalizedPhone} !!!`);
  console.log(`CODE: ${code}`);
  console.log(`----------------------------------`);
  
  return code;
}

// ======================================
// ПУБЛИЧНЫЕСКИЕ МАРШРУТЫ
// ======================================

app.get('/api/status', (req, res) => {
  console.log('📊 Запрос статуса API');
  res.json({ 
    message: 'Сервер работает!', 
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
});

app.get('/api/check-availability', async (req, res) => {
  try {
    const { type, value } = req.query;
    if (!type || !value) return res.status(400).json({ message: 'Неверный запрос' });
    
    let user;
    if (type === 'email') user = await User.findOne({ login: value });
    else if (type === 'phone') user = await User.findOne({ phone: value });
    else return res.status(400).json({ message: 'Неверный тип проверки' });
    
    if (user) {
      res.json({ available: false, message: 'Уже занято' });
    } else {
      res.json({ available: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/packages', async (req, res) => {
  try {
    console.log('📦 Запрос пакетов');
    const packages = await Package.find().sort({ price: 1 });
    console.log(`📦 Найдено пакетов: ${packages.length}`);
    res.json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === API: Публичная статистика сайта ===
app.get('/api/public-stats', async (req, res) => {
  try {
    const [clientsCount, salonsCount, bookingsCount] = await Promise.all([
      User.countDocuments({ userType: 'client' }),
      User.countDocuments({ userType: 'salon' }),
      Booking.countDocuments({ status: { $in: ['completed', 'confirmed'] } })
    ]);
    
    console.log(`📊 Статистика: клиенты=${clientsCount}, салоны=${salonsCount}, бронирования=${bookingsCount}`);
    
    res.json({
      clients: clientsCount,
      salons: salonsCount,
      bookings: bookingsCount
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.json({ clients: 0, salons: 0, bookings: 0 });
  }
});

app.get('/api/salons', async (req, res) => {
  try {
    console.log('🏢 Запрос салонов');
    const salons = await Salon.find().populate('ownerId', 'firstName lastName email');
    const salonsForFrontend = salons.map(salon => ({
      ...salon.toObject(),
      location: salon.address
    }));
    console.log(`🏢 Найдено салонов: ${salonsForFrontend.length}`);
    res.json(salonsForFrontend);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/salons/:name/slots', async (req, res) => {
  try {
    const { name } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Укажите дату' });
    
    const salon = await Salon.findOne({ name });
    if (!salon) return res.status(404).json({ message: 'Салон не найден' });
    
    const slot = await Slot.findOne({ salonId: salon._id, date });
    if (slot && slot.times.length > 0) {
      res.json(slot.times);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    console.log('💅 Запрос услуг');
    const services = await Service.find().populate('ownerId', 'salonName');
    const servicesForFrontend = services.map(service => ({
      id: service._id,
      name: service.name,
      cat: service.category,
      bp: service.bpPrice,
      salonName: service.ownerId?.salonName || 'Салон'
    }));
    console.log(`📦 Найдено услуг: ${servicesForFrontend.length}`);
    res.json(servicesForFrontend);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/salons/:id/services', async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) return res.status(404).json({ message: 'Салон не найден' });
    
    if (salon.ownerId) {
      const services = await Service.find({ ownerId: salon.ownerId });
      res.json(services);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Публичный API: Получить специалистов салона (для клиентов)
app.get('/api/salons/:salonId/specialists', async (req, res) => {
  try {
    const salonId = req.params.salonId;
    let specialists = [];
    
    // Сначала проверяем есть ли это Salon с ownerId - приоритет у специалистов владельца
    const salon = await Salon.findById(salonId);
    if (salon && salon.ownerId) {
      // Ищем специалистов, привязанных к User._id владельца
      specialists = await Specialist.find({ 
        salonId: salon.ownerId, 
        isActive: true 
      }).select('name position description photoUrl services workingHours averageRating reviewCount').lean();
    }
    
    // Если не нашли через ownerId, ищем напрямую по salonId
    if (specialists.length === 0) {
      specialists = await Specialist.find({ 
        salonId: salonId, 
        isActive: true 
      }).select('name position description photoUrl services workingHours averageRating reviewCount').lean();
    }
    
    console.log(`🔍 Specialists for salon ${salonId}: found ${specialists.length} (ownerId: ${salon?.ownerId})`);
    res.json(specialists);
  } catch (error) {
    console.error('Get public specialists error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Публичный API: Получить слоты специалиста (реальные слоты из БД)
app.get('/api/specialists/:specialistId/slots', async (req, res) => {
  try {
    const { date } = req.query;
    const { specialistId } = req.params;
    
    if (!date) {
      // Возвращаем все будущие слоты специалиста
      const today = new Date().toISOString().split('T')[0];
      const slots = await Slot.find({
        specialistId: specialistId,
        date: { $gte: today },
        isBooked: false
      }).sort({ date: 1, time: 1 });
      return res.json(slots);
    }
    
    // Получаем реальные слоты из базы данных для этого специалиста на выбранную дату
    const slots = await Slot.find({
      specialistId: specialistId,
      date: date
    }).sort({ time: 1 });
    
    res.json(slots);
  } catch (error) {
    console.error('Get specialist slots error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// === API: Добавить отзыв на специалиста ===
app.post('/api/specialists/:specialistId/review', authMiddleware, async (req, res) => {
  try {
    const { specialistId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    console.log('📝 Adding review for specialist:', specialistId, 'rating:', rating, 'userId:', userId);
    
    if (!rating || rating < 1 || rating > 5) {
      console.log('❌ Invalid rating:', rating);
      return res.status(400).json({ message: 'რეიტინგი უნდა იყოს 1-დან 5-მდე / Rating must be 1-5' });
    }
    
    const specialist = await Specialist.findById(specialistId);
    if (!specialist) {
      console.log('❌ Specialist not found:', specialistId);
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა / Specialist not found' });
    }
    
    const user = await User.findById(userId);
    console.log('👤 User found:', user?.firstName);
    
    // Check if user already reviewed this specialist
    if (!specialist.reviews) {
      specialist.reviews = [];
    }
    
    // Check for existing review within last 7 days (one review per week allowed)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const existingReviewIndex = specialist.reviews.findIndex(
      r => r.userId && r.userId.toString() === userId && new Date(r.createdAt) > oneWeekAgo
    );
    
    const reviewData = {
      userId,
      userName: user?.firstName || 'User',
      rating,
      comment: comment || '',
      createdAt: new Date()
    };
    
    let xpEarned = 0;
    if (existingReviewIndex >= 0) {
      // User already left review this week - update it
      specialist.reviews[existingReviewIndex] = reviewData;
      console.log('🔄 Updated existing review from this week');
    } else {
      // Add new review (user can leave new review after a week)
      specialist.reviews.push(reviewData);
      console.log('➕ Added new review');
      
      // Начисляем XP за новый отзыв (+5 XP)
      const user = await User.findById(userId);
      if (user) {
        const oldLevel = Math.floor((user.xp || 0) / 100) + 1;
        user.xp = (user.xp || 0) + 5;
        const newLevel = Math.floor(user.xp / 100) + 1;
        xpEarned = 5;
        
        // Проверяем награду за уровень (каждый 5-й уровень)
        if (newLevel > oldLevel && newLevel % 5 === 0) {
          const levelBonus = newLevel * 10; // 50 BP за 5 уровень, 100 BP за 10 и т.д.
          user.beautyPoints = (user.beautyPoints || 0) + levelBonus;
          console.log(`🎁 Level ${newLevel} bonus: +${levelBonus} BP for ${user.email}`);
        }
        
        await user.save();
        console.log(`⭐ +5 XP for review (total: ${user.xp} XP)`);
      }
    }
    
    // Recalculate average rating
    const totalRating = specialist.reviews.reduce((sum, r) => sum + r.rating, 0);
    specialist.averageRating = totalRating / specialist.reviews.length;
    specialist.reviewCount = specialist.reviews.length;
    
    console.log('💾 Saving specialist with reviews:', specialist.reviewCount, 'avgRating:', specialist.averageRating);
    await specialist.save();
    console.log('✅ Review saved successfully!');
    
    res.json({ 
      message: 'შეფასება დამატებულია / Review added successfully',
      averageRating: specialist.averageRating,
      reviewCount: specialist.reviewCount,
      xpEarned: xpEarned
    });
    
  } catch (error) {
    console.error('Add specialist review error:', error);
    res.status(500).json({ message: 'სერვერის შეცდომა / Server error' });
  }
});

// === API: Get specialist reviews ===
app.get('/api/specialists/:specialistId/reviews', async (req, res) => {
  try {
    console.log('📖 Getting reviews for specialist:', req.params.specialistId);
    const specialist = await Specialist.findById(req.params.specialistId)
      .select('reviews averageRating reviewCount name')
      .lean();
    
    if (!specialist) {
      console.log('❌ Specialist not found');
      return res.status(404).json({ message: 'Specialist not found' });
    }
    
    console.log('✅ Found reviews:', (specialist.reviews || []).length, 'avgRating:', specialist.averageRating);
    res.json({
      reviews: specialist.reviews || [],
      averageRating: specialist.averageRating || 0,
      reviewCount: specialist.reviewCount || 0
    });
  } catch (error) {
    console.error('Get specialist reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === API: Салон создает слоты для специалиста ===
app.post('/api/salon/specialists/:specialistId/slots', authMiddleware, async (req, res) => {
  try {
    const salon = req.user;
    if (salon.userType !== 'salon') {
      return res.status(403).json({ message: 'მხოლოდ სალონებს შეუძლიათ / Only salons can create slots' });
    }
    
    const specialist = await Specialist.findById(req.params.specialistId);
    if (!specialist) {
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა / Specialist not found' });
    }
    
    // Проверяем что специалист принадлежит этому салону
    if (specialist.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ message: 'ეს სპეციალისტი არ ეკუთვნის თქვენს სალონს / This specialist does not belong to your salon' });
    }
    
    const { date, times, serviceName, serviceCategory, duration, bpPrice } = req.body;
    
    if (!date || !times || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({ message: 'თარიღი და დრო აუცილებელია / Date and times are required' });
    }
    
    const createdSlots = [];
    
    for (const time of times) {
      // Проверяем что слот не существует
      const existingSlot = await Slot.findOne({
        specialistId: specialist._id,
        date,
        time
      });
      
      if (!existingSlot) {
        const slot = new Slot({
          salonId: salon._id,
          salonName: salon.salonName,
          specialistId: specialist._id,
          specialistName: specialist.name,
          serviceName: serviceName || 'ნებისმიერი / Any',
          serviceCategory: serviceCategory || 'other',
          date,
          time,
          duration: duration || 30,
          bpPrice: bpPrice || 10,
          isBooked: false
        });
        await slot.save();
        createdSlots.push(slot);
      }
    }
    
    res.status(201).json({ 
      message: `შეიქმნა ${createdSlots.length} სლოტი / Created ${createdSlots.length} slots`,
      slots: createdSlots 
    });
    
  } catch (error) {
    console.error('Create specialist slots error:', error);
    res.status(500).json({ message: 'სერვერის შეცდომა / Server error' });
  }
});

// === API: Салон генерирует слоты автоматически ===
app.post('/api/salon/specialists/:specialistId/generate-slots', authMiddleware, async (req, res) => {
  try {
    const salon = req.user;
    if (salon.userType !== 'salon') {
      return res.status(403).json({ message: 'Only salons can generate slots' });
    }
    
    const specialist = await Specialist.findById(req.params.specialistId);
    if (!specialist || specialist.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate, startHour, endHour, slotDuration, excludeDays } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sHour = startHour || 10;
    const eHour = endHour || 20;
    const duration = slotDuration || 30;
    const excluded = excludeDays || [0]; // По умолчанию воскресенье
    
    const createdSlots = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (excluded.includes(dayOfWeek)) continue;
      
      const dateStr = d.toISOString().split('T')[0];
      
      for (let h = sHour; h < eHour; h++) {
        for (let m = 0; m < 60; m += duration) {
          const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          
          const exists = await Slot.findOne({
            specialistId: specialist._id,
            date: dateStr,
            time: timeStr
          });
          
          if (!exists) {
            const slot = new Slot({
              salonId: salon._id,
              salonName: salon.salonName,
              specialistId: specialist._id,
              specialistName: specialist.name,
              serviceName: 'Any Service',
              date: dateStr,
              time: timeStr,
              duration: duration,
              bpPrice: 10,
              isBooked: false
            });
            await slot.save();
            createdSlots.push(slot);
          }
        }
      }
    }
    
    res.json({ 
      message: `Generated ${createdSlots.length} slots`,
      count: createdSlots.length 
    });
    
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === API: Получить слоты салона ===
app.get('/api/salon/slots', authMiddleware, async (req, res) => {
  try {
    const salon = req.user;
    if (salon.userType !== 'salon') {
      return res.status(403).json({ message: 'Only salons' });
    }
    
    const { date, specialistId } = req.query;
    const query = { salonId: salon._id };
    
    if (date) query.date = date;
    if (specialistId) query.specialistId = specialistId;
    
    const slots = await Slot.find(query)
      .sort({ date: 1, time: 1 })
      .lean();
    
    res.json(slots);
  } catch (error) {
    console.error('Get salon slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === API: Удалить слот ===
app.delete('/api/salon/slots/:slotId', authMiddleware, async (req, res) => {
  try {
    const salon = req.user;
    if (salon.userType !== 'salon') {
      return res.status(403).json({ message: 'Only salons' });
    }
    
    const slot = await Slot.findById(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot delete booked slot' });
    }
    
    await Slot.findByIdAndDelete(req.params.slotId);
    res.json({ message: 'Slot deleted' });
    
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === API: Редактировать слот ===
app.put('/api/salon/slots/:slotId', authMiddleware, async (req, res) => {
  try {
    const salon = req.user;
    if (salon.userType !== 'salon') {
      return res.status(403).json({ message: 'Only salons' });
    }
    
    const slot = await Slot.findById(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot edit booked slot' });
    }
    
    const { serviceName, date, time, bpPrice, specialistId, specialistName, serviceCategory } = req.body;
    
    // Обновляем поля
    if (serviceName) slot.serviceName = serviceName;
    if (date) slot.date = date;
    if (time) slot.time = time;
    if (bpPrice) slot.bpPrice = bpPrice;
    if (specialistId) slot.specialistId = specialistId;
    if (specialistName) slot.specialistName = specialistName;
    if (serviceCategory) slot.serviceCategory = serviceCategory;
    
    await slot.save();
    res.json({ message: 'Slot updated', slot });
    
  } catch (error) {
    console.error('Edit slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === API: Бронирование по существующему слоту ===
app.post('/api/booking/slot', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { slotId } = req.body;
    
    // Салоны не могут бронировать
    if (user.userType === 'salon') {
      return res.status(403).json({ message: 'სალონებს არ შეუძლიათ ჯავშნის გაკეთება. მხოლოდ კლიენტებისთვის / Salons cannot make bookings. Clients only' });
    }
    
    if (!slotId) {
      return res.status(400).json({ message: 'აირჩიეთ სლოტი / Select a slot' });
    }
    
    // Находим слот
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'სლოტი ვერ მოიძებნა / Slot not found' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'სლოტი უკვე დაკავებულია / Slot already booked' });
    }
    
    const price = slot.bpPrice || 10;
    
    // Проверка баланса
    if ((user.beautyPoints || 0) < price) {
      return res.status(400).json({ message: `არასაკმარისი BP. საჭიროა ${price} BP / Insufficient BP. Need ${price} BP` });
    }
    
    // Генерируем уникальный код
    const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Создаём dateTime из date и time
    const dateTimeStr = `${slot.date}T${slot.time}:00`;
    const dateTime = new Date(dateTimeStr);
    
    // Создаём бронирование
    const booking = new Booking({
      salonId: slot.salonId,
      salonName: slot.salonName,
      specialistId: slot.specialistId,
      specialistName: slot.specialistName,
      slotId: slot._id,
      serviceName: slot.serviceName,
      serviceCategory: slot.serviceCategory,
      date: slot.date,
      time: slot.time,
      dateTime: dateTime,
      duration: slot.duration || 30,
      bpPrice: price,
      userId: user._id,
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      userPhone: user.phone || '',
      clientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      clientEmail: user.email,
      clientPhone: user.phone || '',
      status: 'confirmed',
      bookingCode
    });
    
    await booking.save();
    
    // Помечаем слот как забронированный
    slot.isBooked = true;
    slot.bookedBy = user._id;
    slot.bookingId = booking._id;
    await slot.save();
    
    // Списываем BP
    user.beautyPoints = (user.beautyPoints || 0) - price;
    
    // Начисляем XP за бронирование (+10 XP)
    const oldLevel = Math.floor((user.xp || 0) / 100) + 1;
    user.xp = (user.xp || 0) + 10;
    const newLevel = Math.floor(user.xp / 100) + 1;
    user.totalBookings = (user.totalBookings || 0) + 1;
    
    // Проверяем награду за уровень (каждый 5-й уровень)
    let levelBonus = 0;
    if (newLevel > oldLevel && newLevel % 5 === 0) {
      levelBonus = newLevel * 10; // 50 BP за 5 уровень, 100 BP за 10 и т.д.
      user.beautyPoints = (user.beautyPoints || 0) + levelBonus;
      console.log(`🎁 Level ${newLevel} bonus: +${levelBonus} BP for ${user.email}`);
    }
    
    await user.save();
    
    console.log(`✅ Slot booking: ${slot.serviceName} - ${slot.date} ${slot.time} by ${user.email}`);
    
    // Отправляем email с QR кодом
    try {
      await sendBookingQREmail(booking, user);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
    }
    
    res.status(201).json({
      message: '✅ ჯავშანი წარმატებით შეიქმნა!',
      booking: {
        _id: booking._id,
        bookingCode: booking.bookingCode,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        salonName: booking.salonName,
        bpPrice: price
      },
      newBalance: user.beautyPoints
    });
    
  } catch (error) {
    console.error('Slot booking error:', error);
    res.status(500).json({ message: 'შეცდომა ჯავშნისას / Booking error' });
  }
});

// === API: Бронирование специалиста (новый) ===
app.post('/api/booking/specialist', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { salonId, specialistId, specialistName, serviceName, serviceCategory, date, times, duration, bpPrice } = req.body;
    
    // Салоны не могут бронировать
    if (user.userType === 'salon') {
      return res.status(403).json({ message: 'სალონებს არ შეუძლიათ ჯავშნის გაკეთება. მხოლოდ კლიენტებისთვის / Salons cannot make bookings. Clients only' });
    }
    
    if (!specialistId || !serviceName || !date || !times || times.length === 0) {
      return res.status(400).json({ message: 'შეავსეთ ყველა ველი / Fill all fields' });
    }
    
    const time = times[0]; // Первый выбранный слот
    const price = bpPrice || 10;
    
    // Проверка баланса
    if ((user.beautyPoints || 0) < price) {
      return res.status(400).json({ message: `არასაკმარისი BP. საჭიროა ${price} BP / Insufficient BP. Need ${price} BP` });
    }
    
    // Проверяем есть ли уже бронирование на это время
    const existingBooking = await Booking.findOne({
      specialistId,
      date,
      time,
      status: { $nin: ['cancelled'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'ეს დრო უკვე დაკავებულია / This time is already booked' });
    }
    
    // Получаем информацию о салоне
    let salonName = 'Beauty Salon';
    try {
      const salon = await Salon.findById(salonId);
      if (salon) salonName = salon.name;
    } catch(e) {}
    
    // Создаем бронирование
    const booking = new Booking({
      userId: user._id,
      salonId: salonId,
      salonName: salonName,
      specialistId: specialistId,
      specialistName: specialistName,
      service: serviceName,
      serviceName: serviceName,
      serviceCategory: serviceCategory,
      date: date,
      time: time,
      dateTime: new Date(`${date}T${time}`),
      duration: duration || 30,
      bpPrice: price,
      status: 'confirmed',
      bookingCode: `BP-${Date.now().toString(36).toUpperCase()}`
    });
    
    await booking.save();
    
    // Списываем BP
    user.beautyPoints = (user.beautyPoints || 0) - price;
    user.totalBookings = (user.totalBookings || 0) + 1;
    user.xp = (user.xp || 0) + 10;
    
    // Обновляем streak
    const now = new Date();
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
    if (lastActivity) {
      const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.streak = (user.streak || 0) + 1;
      } else if (daysDiff > 1) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }
    user.lastActivity = now;
    await user.save();
    
    // Начисляем BP салону (в pending)
    const salonUser = await User.findOne({ role: 'salon', salonId: salonId });
    if (salonUser) {
      salonUser.salonPendingRevenue = (salonUser.salonPendingRevenue || 0) + price;
      salonUser.salonTotalBookings = (salonUser.salonTotalBookings || 0) + 1;
      await salonUser.save();
    }
    
    console.log(`✅ Бронирование создано: ${booking.bookingCode} | ${user.email} → ${salonName} (${specialistName})`);
    
    res.status(201).json({
      message: 'ჯავშანი წარმატებით დადასტურდა! / Booking confirmed!',
      booking: {
        id: booking._id,
        code: booking.bookingCode,
        salon: salonName,
        specialist: specialistName,
        service: serviceName,
        date: date,
        time: time,
        price: price
      },
      updatedBalance: user.beautyPoints
    });
    
  } catch (error) {
    console.error('Specialist booking error:', error);
    res.status(500).json({ message: 'სერვერის შეცდომა / Server error' });
  }
});

// ======================================
// АУТЕНТИФИФИКАЦИЯ
// ======================================

app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Запрос на регистрацию:', req.body);
    const { firstName, email, login, password, phone, userType, birthDate, referredByCode } = req.body;
    
    // === ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ ===
    if (!email || !password || !phone) {
      return res.status(400).json({ message: 'შეავსეთ ყველა სავალდებულო ველი' });
    }
    
    // === ВАЛИДАЦИЯ ИМЕНИ ===
    if (!firstName || firstName.trim().length < 2) {
      return res.status(400).json({ message: 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო' });
    }
    
    // === ВАЛИДАЦИЯ EMAIL ===
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'არასწორი ელ-ფოსტის ფორმატი' });
    }
    
    // Блокировка временных/одноразовых email
    const blockedDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com', 'yopmail.com', 'sharklasers.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(emailDomain)) {
      return res.status(400).json({ message: 'დროებითი ელ-ფოსტა არ არის დაშვებული' });
    }
    
    // === ВАЛИДАЦИЯ ТЕЛЕФОНА ===
    const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+995|995)?5\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      return res.status(400).json({ message: 'არასწორი ტელეფონის ნომერი' });
    }
    
    // === ВАЛИДАЦИЯ ПАРОЛЯ ===
    if (password.length < 8) {
      return res.status(400).json({ message: 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო' });
    }
    
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasNumber || !hasSpecial) {
      return res.status(400).json({ message: 'პაროლი უნდა შეიცავდეს ციფრს და სპეცსიმბოლოს' });
    }
    
    // === ВАЛИДАЦИЯ ДАТЫ РОЖДЕНИЯ ===
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      
      if (isNaN(birth.getTime())) {
        return res.status(400).json({ message: 'არასწორი დაბადების თარიღი' });
      }
      
      if (birth > today) {
        return res.status(400).json({ message: 'დაბადების თარიღი არ შეიძლება იყოს მომავალში' });
      }
      
      const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 13) {
        return res.status(400).json({ message: 'მინიმალური ასაკი: 13 წელი' });
      }
      if (age > 120) {
        return res.status(400).json({ message: 'არასწორი დაბადების თარიღი' });
      }
    }
    
    // Проверка существования пользователя
    if (await User.findOne({ login })) {
      return res.status(400).json({ message: 'ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს' });
    }
    
    // Проверка телефона на уникальность
    if (await User.findOne({ phone: phoneClean })) {
      return res.status(400).json({ message: 'ამ ტელეფონით მომხმარებელი უკვე არსებობს' });
    }
    
    // Генерация уникального реферального кода
    const referralCode = generateReferralCode(email);
    
    // Проверка реферального кода
    let referrer = null;
    if (referredByCode) {
      referrer = await User.findOne({ referralCode: referredByCode.toUpperCase() });
      if (!referrer) {
        console.log('⚠️ Реферальный код не найден:', referredByCode);
      }
    }
    
    // Создание пользователя
    const user = new User({ 
      firstName: firstName.trim(), 
      email: email.toLowerCase().trim(), 
      login: login.toLowerCase().trim(), 
      password, 
      phone: phoneClean, 
      birthDate: birthDate ? new Date(birthDate) : null,
      referralCode: referralCode,
      referredBy: referrer ? referrer._id : null,
      userType: userType || 'client',
      isEmailVerified: false 
    });
    
    console.log('📝 Создаем пользователя:', { email: user.email, passwordLength: password.length });
    await user.save();
    console.log('✅ Пользователь сохранен, пароль хеширован:', user.password ? 'да' : 'нет');
    
    // Начисляем бонус рефереру
    if (referrer) {
      const REFERRAL_BONUS_BP = 10; // 10 BP за реферала
      const REFERRAL_BONUS_XP = 20; // 20 XP за реферала
      
      const oldLevel = Math.floor((referrer.xp || 0) / 100) + 1;
      referrer.beautyPoints = (referrer.beautyPoints || 0) + REFERRAL_BONUS_BP;
      referrer.xp = (referrer.xp || 0) + REFERRAL_BONUS_XP;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      const newLevel = Math.floor(referrer.xp / 100) + 1;
      
      // Проверяем награду за уровень (каждый 5-й уровень)
      if (newLevel > oldLevel && newLevel % 5 === 0) {
        const levelBonus = newLevel * 10; // 50 BP за 5 уровень, 100 BP за 10 и т.д.
        referrer.beautyPoints = (referrer.beautyPoints || 0) + levelBonus;
        console.log(`🎁 Level ${newLevel} bonus: +${levelBonus} BP for ${referrer.email}`);
      }
      
      await referrer.save();
      console.log(`✅ Начислено ${REFERRAL_BONUS_BP} BP и ${REFERRAL_BONUS_XP} XP пользователю ${referrer.email} за реферала`);
    }

    try {
      await send2FACode(user);
      res.status(201).json({ message: 'რეგისტრაცია წარმატებულია! შეამოწმეთ ელფოსტა და შეიყვანეთ კოდი.', needVerification: true, email: user.email });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      await User.deleteOne({ _id: user._id });
      // Отменяем бонус рефереру если регистрация не удалась
      if (referrer) {
        referrer.beautyPoints = (referrer.beautyPoints || 0) - REFERRAL_BONUS;
        referrer.referralCount = (referrer.referralCount || 0) - 1;
        await referrer.save();
      }
      return res.status(500).json({ message: 'კოდის გაგზავნის შეცდომა. სცადეთ თავიდან.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "სერვერის შეცდომა" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('🔑 Запрос на вход:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Укажите email и пароль' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('🔍 Пользователь найден:', user ? user.email : 'нет');
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
    
    console.log('🔐 Проверяем пароль, хеш в базе:', user.password ? user.password.substring(0, 20) + '...' : 'отсутствует');
    
    // Проверяем хешированный пароль
    let isMatch = false;
    
    // Если пароль начинается с $2 - это bcrypt хеш
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Если пароль не хеширован (старые пользователи) - сравниваем напрямую
      // и хешируем пароль для будущих входов
      isMatch = (password === user.password);
      if (isMatch) {
        console.log('⚠️ Найден нехешированный пароль, хешируем...');
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        console.log('✅ Пароль захеширован');
      }
    }
    
    console.log('🔐 Результат проверки пароля:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
    
    // Отправляем 2FA код
    await send2FACode(user);
    
    res.json({ 
      message: 'Введите код подтверждения, отправленный на ваш email.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/auth/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Укажите email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    await send2FACode(user);
    res.json({ message: 'Новый код отправлен на ваш email.' });
  } catch (error) {
    console.error('Ошибка отправки кода:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/confirm-2fa', async (req, res) => {
  try {
    console.log('🔐 Запрос подтверждения 2FA:', req.body);
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Укажите email и код' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }
    
    if (user.twoFACode !== code) {
      return res.status(400).json({ message: 'Неверный код' });
    }
    
    if (Date.now() > user.twoFACodeExpires) {
      // If user not verified and code expired - delete user
      if (!user.isEmailVerified) {
        await User.deleteOne({ _id: user._id });
        return res.status(400).json({ message: 'კოდის ვადა ამოიწურა. გაიარეთ რეგისტრაცია თავიდან.' });
      }
      return res.status(400).json({ message: 'კოდის ვადა ამოიწურა' });
    }

    
    // Подтверждаем email
    user.isEmailVerified = true;
    user.twoFACode = undefined;
    user.twoFACodeExpires = undefined;
    await user.save();
    
    // Создаем JWT токен
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    const userPayload = { 
      id: user._id.toString(), 
      _id: user._id.toString(),
      email: user.email, 
      login: user.login, 
      phone: user.phone, 
      firstName: user.firstName, 
      lastName: user.lastName, 
      balance: user.balance,
      beautyPoints: user.beautyPoints,
      purchases: user.purchases, 
      isAdmin: user.isAdmin, 
      userType: user.userType,
      salonName: user.salonName,
      address: user.address,
      salonDescription: user.salonDescription,
      createdAt: user.createdAt
    };
    
    res.json({ 
      message: 'Вход выполнен успешно!', 
      token, 
      user: userPayload 
    });
  } catch (error) {
    console.error('❌ Ошибка подтверждения 2FA:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// ВОССТАНОВЛЕНИЕ ПАРОЛЯ
// ======================================

// Шаг 1: Запрос на восстановление пароля - отправка кода на email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'შეიყვანეთ ელფოსტა' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Не раскрываем, существует ли пользователь (безопасность)
      return res.json({ message: 'თუ ეს ელფოსტა რეგისტრირებულია, კოდი გაიგზავნა' });
    }
    
    // Генерируем 6-значный код
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Сохраняем код и время истечения (15 минут)
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    
    // Отправляем email с кодом
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: '🔐 Beauty Pass - პაროლის აღდგენა',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea;">💜 Beauty Pass</h1>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">პაროლის აღდგენა</h2>
                <p style="color: #666; margin-bottom: 20px;">თქვენი პაროლის აღდგენის კოდი:</p>
                <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin-bottom: 20px;">
                  ${resetCode}
                </div>
                <p style="color: #999; font-size: 14px;">კოდი მოქმედებს 15 წუთის განმავლობაში.</p>
                <p style="color: #999; font-size: 14px;">თუ თქვენ არ მოითხოვეთ პაროლის აღდგენა, უგულებელყოფეთ ეს შეტყობინება.</p>
              </div>
              <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                © 2026 Beauty Pass. ყველა უფლება დაცულია.
              </div>
            </div>
          `
        });
        console.log('✅ Password reset code sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Email send error:', emailError);
      }
    }
    
    res.json({ 
      success: true,
      message: 'კოდი გაგზავნილია თქვენს ელფოსტაზე' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

// Шаг 2: Подтверждение кода и установка нового пароля
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'შეავსეთ ყველა ველი' });
    }
    
    // Проверка длины пароля
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო' });
    }
    
    // Проверка сложности пароля
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasNumber || !hasSpecial) {
      return res.status(400).json({ message: 'პაროლი უნდა შეიცავდეს ციფრს და სპეციალურ სიმბოლოს' });
    }
    
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'არასწორი კოდი ან ვადა ამოიწურა' });
    }
    
    // Устанавливаем новый пароль (будет автоматически захеширован через pre-save hook)
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Отправляем уведомление об изменении пароля
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: '✅ Beauty Pass - პაროლი შეიცვალა',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea;">💜 Beauty Pass</h1>
              </div>
              <div style="background: #d4edda; padding: 30px; border-radius: 10px; border: 1px solid #c3e6cb;">
                <h2 style="color: #155724; margin-bottom: 20px;">✅ პაროლი წარმატებით შეიცვალა</h2>
                <p style="color: #155724;">თქვენი ანგარიშის პაროლი წარმატებით განახლდა.</p>
                <p style="color: #856404; margin-top: 20px;">თუ თქვენ არ შეცვალეთ პაროლი, დაუყოვნებლივ დაგვიკავშირდით.</p>
              </div>
              <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                © 2026 Beauty Pass. ყველა უფლება დაცულია.
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }
    
    res.json({ 
      success: true,
      message: 'პაროლი წარმატებით შეიცვალა! შეგიძლიათ შეხვიდეთ ახალი პაროლით.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

// SMS 2FA - отправка кода на телефон
app.post('/api/auth/send-sms-code', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ message: 'Укажите email или телефон' });
    }
    
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
      user = await User.findOne({ phone: phoneClean });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    await sendSMS2FACode(user, user.phone);
    
    // Маскируем номер телефона
    const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{2})/, '$1****$2');
    
    res.json({ 
      message: `SMS код გაგზავნილია: ${maskedPhone}`,
      method: 'sms'
    });
  } catch (error) {
    console.error('SMS 2FA error:', error);
    res.status(500).json({ message: 'შეცდომა SMS გაგზავნისას' });
  }
});

// Выбор метода 2FA (email или SMS)
app.post('/api/auth/select-2fa-method', async (req, res) => {
  try {
    const { email, method } = req.body; // method: 'email' or 'sms'
    
    if (!email || !method) {
      return res.status(400).json({ message: 'Укажите email и метод' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (method === 'sms') {
      if (!user.phone) {
        return res.status(400).json({ message: 'Телефон не указан в профиле' });
      }
      await sendSMS2FACode(user, user.phone);
      const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{2})/, '$1****$2');
      res.json({ message: `კოდი გაგზავნილია SMS-ით: ${maskedPhone}`, method: 'sms' });
    } else {
      await send2FACode(user);
      const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      res.json({ message: `კოდი გაგზავნილია ელფოსტაზე: ${maskedEmail}`, method: 'email' });
    }
  } catch (error) {
    console.error('2FA method selection error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// АДМИН ПАНЕЛЬ - РАСШИРЕННЫЕ ФУНКЦИИ
// ======================================

// Получить всех пользователей (только для админа)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const users = await User.find()
      .select('-password -twoFACode -twoFACodeExpires')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить пользователя (только для админа)
app.put('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Запрещаем изменение критичных полей
    delete updateData.password;
    delete updateData.twoFACode;
    delete updateData.twoFACodeExpires;
    
    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -twoFACode -twoFACodeExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Заблокировать/разблокировать пользователя
app.put('/api/admin/users/:id/toggle-ban', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    user.isBanned = !user.isBanned;
    await user.save();
    
    res.json({ message: user.isBanned ? 'Пользователь заблокирован' : 'Пользователь разблокирован', user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить пользователя (только для админа)
app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Запрещаем удаление админов
    if (user.isAdmin) {
      return res.status(400).json({ message: 'Нельзя удалить администратора' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание пользователя-салона (админ)
app.post('/api/admin/create-salon-user', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { email, password, salonName, address, phone, salonDescription } = req.body;
    
    if (!email || !password || !salonName) {
      return res.status(400).json({ message: 'Введите email, пароль და название салона' });
    }
    
    // Проверяем существует ли пользователь с таким email
    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { login: email.toLowerCase() }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    
    // Создаем пользователя-салон
    const salonUser = new User({
      login: email.toLowerCase(), // Логин = email
      email: email.toLowerCase(),
      password,
      firstName: salonName,
      lastName: 'სალონი',
      userType: 'salon',
      salonName,
      address: address || '',
      phone: phone || '+995000000000', // Телефон обязателен в модели
      salonDescription: salonDescription || '',
      isEmailVerified: true, // Админ сразу верифицирует
      beautyPoints: 0,
      balance: 0
    });
    
    await salonUser.save();
    
    // Также создаем запись Salon для совместимости
    const salon = new Salon({
      name: salonName,
      address: address || '',
      ownerId: salonUser._id,
      category: 'other',
      services: []
    });
    
    await salon.save();
    
    res.status(201).json({ 
      message: 'Салон успешно создан',
      salon: {
        _id: salonUser._id,
        email: salonUser.email,
        salonName: salonUser.salonName,
        address: salonUser.address,
        phone: salonUser.phone
      }
    });
  } catch (error) {
    console.error('Create salon error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех салонов (для админа)
app.get('/api/admin/salon-users', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const salonUsers = await User.find({ userType: 'salon' })
      .select('email salonName address phone salonDescription createdAt')
      .sort({ createdAt: -1 });
    
    res.json(salonUsers);
  } catch (error) {
    console.error('Get salon users error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Статистика админа
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const totalUsers = await User.countDocuments();
    const totalSalons = await Salon.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalServices = await Service.countDocuments();
    
    // Новые пользователи за последние 7 дней
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    
    // Записи за последние 7 дней
    const bookingsThisWeek = await Booking.countDocuments({ createdAt: { $gte: weekAgo } });
    
    // Общий оборот (сумма всех покупок)
    const usersWithPurchases = await User.find({ 'purchases.0': { $exists: true } });
    let totalRevenue = 0;
    usersWithPurchases.forEach(u => {
      u.purchases.forEach(p => {
        totalRevenue += p.price || 0;
      });
    });
    
    res.json({
      totalUsers,
      totalSalons,
      totalBookings,
      totalServices,
      newUsersThisWeek,
      bookingsThisWeek,
      totalRevenue
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Все записи (для админа)
app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отменить запись (админ)
app.put('/api/admin/bookings/:id/cancel', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Запись отменена', booking });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Все салоны (для админа с расширенной информацией)
app.get('/api/admin/salons', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const salons = await Salon.find()
      .populate('ownerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    res.json(salons);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать салон (админ)
app.post('/api/admin/salons', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const salon = new Salon(req.body);
    await salon.save();
    
    res.status(201).json(salon);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить салон (админ)
app.put('/api/admin/salons/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const salon = await Salon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    res.json(salon);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить салон (админ)
app.delete('/api/admin/salons/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    await Salon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Салон удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Все услуги (для админа)
app.get('/api/admin/services', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const services = await Service.find()
      .populate('ownerId', 'salonName')
      .sort({ createdAt: -1 });
    
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать услугу (админ)
app.post('/api/admin/services', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Если не указан ownerId, используем ID админа или находим первый салон
    let serviceData = { ...req.body };
    
    if (!serviceData.ownerId) {
      // Попробуем найти первый салон или использовать ID админа
      const salon = await User.findOne({ accountType: 'salon' });
      serviceData.ownerId = salon ? salon._id : req.user.userId;
    }
    
    const service = new Service(serviceData);
    await service.save();
    
    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error('Admin create service error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера: ' + error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
});

// Обновить услугу (админ)
app.put('/api/admin/services/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) {
      return res.status(404).json({ message: 'Услуга не найдена' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить услугу (админ)
app.delete('/api/admin/services/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Услуга удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Все тарифы/пакеты (для админа)
app.get('/api/admin/packages', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const packages = await Package.find().sort({ price: 1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать пакет (админ)
app.post('/api/admin/packages', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const pkg = new Package(req.body);
    await pkg.save();
    
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить пакет (админ)
app.put('/api/admin/packages/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) {
      return res.status(404).json({ message: 'Пакет не найден' });
    }
    
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить пакет (админ)
app.delete('/api/admin/packages/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: 'Пакет удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// АДМИН: АНАЛИТИКА САЛОНОВ (ФИНАНСЫ)
// ======================================

// Получить список всех салонов с финансовой статистикой
app.get('/api/admin/salon-analytics', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Все салоны (users с userType='salon')
    const salons = await User.find({ userType: 'salon' }).select(
      'email salonName salonAddress salonPhone createdAt salonRevenue salonPendingRevenue salonTotalBookings salonCompletedBookings salonCancelledBookings salonWithdrawnRevenue'
    ).lean();
    
    // Дополняем информацией о бронированиях
    const analytics = await Promise.all(salons.map(async (salon) => {
      // Статистика бронирований из БД
      const bookingStats = await Booking.aggregate([
        { $match: { salonId: salon._id } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBP: { $sum: '$bpPrice' }
        }}
      ]);
      
      const stats = {
        pending: { count: 0, totalBP: 0 },
        confirmed: { count: 0, totalBP: 0 },
        cancelled: { count: 0, totalBP: 0 },
        completed: { count: 0, totalBP: 0 }
      };
      
      bookingStats.forEach(s => {
        if (stats[s._id]) {
          stats[s._id] = { count: s.count, totalBP: s.totalBP };
        }
      });
      
      // Сумма доступная для вывода
      const availableForWithdrawal = (salon.salonRevenue || 0) - (salon.salonWithdrawnRevenue || 0);
      
      return {
        _id: salon._id,
        email: salon.email,
        salonName: salon.salonName,
        salonAddress: salon.salonAddress,
        salonPhone: salon.salonPhone,
        registeredAt: salon.createdAt,
        // Финансы
        totalRevenue: salon.salonRevenue || 0,           // Всего заработано BP
        pendingRevenue: salon.salonPendingRevenue || 0,  // В escrow
        withdrawnRevenue: salon.salonWithdrawnRevenue || 0, // Уже выплачено
        availableForWithdrawal,                          // Доступно к выводу
        // Статистика бронирований
        totalBookings: salon.salonTotalBookings || 0,
        completedBookings: salon.salonCompletedBookings || 0,
        cancelledBookings: salon.salonCancelledBookings || 0,
        // Детальная статистика
        bookingStats: stats
      };
    }));
    
    // Общая статистика
    const totalStats = {
      totalSalons: salons.length,
      totalRevenue: analytics.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalPending: analytics.reduce((sum, s) => sum + s.pendingRevenue, 0),
      totalWithdrawn: analytics.reduce((sum, s) => sum + s.withdrawnRevenue, 0),
      totalBookings: analytics.reduce((sum, s) => sum + s.totalBookings, 0),
      totalCompleted: analytics.reduce((sum, s) => sum + s.completedBookings, 0)
    };
    
    res.json({
      success: true,
      totalStats,
      salons: analytics
    });
  } catch (error) {
    console.error('Salon analytics error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить детальную аналитику одного салона
app.get('/api/admin/salon-analytics/:salonId', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const salon = await User.findOne({ _id: req.params.salonId, userType: 'salon' }).select(
      '-password -verificationCode -verificationCodeExpires'
    ).lean();
    
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    // Все бронирования салона
    const bookings = await Booking.find({ salonId: salon._id })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Статистика по месяцам
    const monthlyStats = await Booking.aggregate([
      { $match: { salonId: salon._id, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$bpPrice' }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    // История выплат (если будет)
    const withdrawalHistory = []; // TODO: можно добавить модель Withdrawal
    
    res.json({
      success: true,
      salon: {
        _id: salon._id,
        email: salon.email,
        salonName: salon.salonName,
        salonAddress: salon.salonAddress,
        salonPhone: salon.salonPhone,
        registeredAt: salon.createdAt,
        totalRevenue: salon.salonRevenue || 0,
        pendingRevenue: salon.salonPendingRevenue || 0,
        withdrawnRevenue: salon.salonWithdrawnRevenue || 0,
        availableForWithdrawal: (salon.salonRevenue || 0) - (salon.salonWithdrawnRevenue || 0),
        totalBookings: salon.salonTotalBookings || 0,
        completedBookings: salon.salonCompletedBookings || 0,
        cancelledBookings: salon.salonCancelledBookings || 0
      },
      recentBookings: bookings.slice(0, 50),
      monthlyStats,
      withdrawalHistory
    });
  } catch (error) {
    console.error('Salon detail analytics error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Админ: Зарегистрировать выплату салону
app.post('/api/admin/salon-payout/:salonId', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { amount, paymentMethod, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Укажите сумму выплаты' });
    }
    
    const salon = await User.findOne({ _id: req.params.salonId, userType: 'salon' });
    
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    const availableForWithdrawal = (salon.salonRevenue || 0) - (salon.salonWithdrawnRevenue || 0);
    
    if (amount > availableForWithdrawal) {
      return res.status(400).json({ 
        message: `Недостаточно средств. Доступно: ${availableForWithdrawal} BP` 
      });
    }
    
    // Регистрируем выплату
    salon.salonWithdrawnRevenue = (salon.salonWithdrawnRevenue || 0) + amount;
    await salon.save();
    
    // TODO: Можно сохранить в отдельную коллекцию Withdrawal для истории
    
    console.log(`💸 Payout to salon ${salon.salonName}: ${amount} BP (Method: ${paymentMethod || 'N/A'})`);
    
    res.json({
      success: true,
      message: `გადახდა ${amount} BP დარეგისტრირდა`,
      payout: {
        salonId: salon._id,
        salonName: salon.salonName,
        amount,
        paymentMethod: paymentMethod || 'bank_transfer',
        notes: notes || '',
        processedAt: new Date(),
        processedBy: req.user.email
      },
      newBalance: {
        totalRevenue: salon.salonRevenue,
        withdrawnRevenue: salon.salonWithdrawnRevenue,
        availableForWithdrawal: (salon.salonRevenue || 0) - (salon.salonWithdrawnRevenue || 0)
      }
    });
  } catch (error) {
    console.error('Salon payout error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// АДМИН: ЭКСПОРТ БИЗНЕС-АНАЛИТИКИ В EXCEL
// ======================================

// Экспорт полной аналитики в Excel
app.get('/api/admin/export-analytics', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { period } = req.query; // all, month, week
    let dateFilter = {};
    
    if (period === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    }
    
    // Получаем все данные
    const [users, salons, bookings, specialists] = await Promise.all([
      User.find({ userType: { $ne: 'salon' }, ...dateFilter }).select('-password -verificationCode').lean(),
      User.find({ userType: 'salon', ...dateFilter }).select('-password -verificationCode').lean(),
      Booking.find(dateFilter).populate('userId', 'firstName lastName email').lean(),
      Specialist.find({ isActive: true }).lean()
    ]);
    
    // Создаем Excel workbook
    const wb = XLSX.utils.book_new();
    
    // === ЛИСТ 1: Обзор ===
    const overviewData = [
      ['Beauty Pass - ბიზნეს ანალიტიკა'],
      ['გენერირების თარიღი:', new Date().toLocaleString('ka-GE')],
      ['პერიოდი:', period === 'month' ? 'ბოლო თვე' : period === 'week' ? 'ბოლო კვირა' : 'სრული'],
      [],
      ['მომხმარებლები', users.length],
      ['სალონები', salons.length],
      ['ჯავშნები', bookings.length],
      ['სპეციალისტები', specialists.length],
      [],
      ['მთლიანი შემოსავალი (BP)', salons.reduce((sum, s) => sum + (s.salonRevenue || 0), 0)],
      ['Escrow-ში (BP)', salons.reduce((sum, s) => sum + (s.salonPendingRevenue || 0), 0)],
      ['გადახდილი (BP)', salons.reduce((sum, s) => sum + (s.salonWithdrawnRevenue || 0), 0)]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'მიმოხილვა');
    
    // === ЛИСТ 2: Салоны ===
    const salonHeaders = ['სალონის სახელი', 'Email', 'ტელეფონი', 'მისამართი', 'რეგისტრაცია', 'შემოსავალი (BP)', 'Escrow (BP)', 'გადახდილი (BP)', 'ჯავშნები', 'დასრულებული', 'გაუქმებული'];
    const salonData = salons.map(s => [
      s.salonName || '-',
      s.email,
      s.salonPhone || '-',
      s.salonAddress || '-',
      s.createdAt ? new Date(s.createdAt).toLocaleDateString('ka-GE') : '-',
      s.salonRevenue || 0,
      s.salonPendingRevenue || 0,
      s.salonWithdrawnRevenue || 0,
      s.salonTotalBookings || 0,
      s.salonCompletedBookings || 0,
      s.salonCancelledBookings || 0
    ]);
    const wsSalons = XLSX.utils.aoa_to_sheet([salonHeaders, ...salonData]);
    XLSX.utils.book_append_sheet(wb, wsSalons, 'სალონები');
    
    // === ЛИСТ 3: Бронирования ===
    const bookingHeaders = ['კოდი', 'კლიენტი', 'Email', 'სალონი', 'სერვისი', 'კატეგორია', 'თარიღი', 'დრო', 'BP', 'სტატუსი', 'გადახდა', 'შექმნის თარიღი'];
    const bookingData = bookings.map(b => [
      b.bookingCode,
      b.userId ? `${b.userId.firstName || ''} ${b.userId.lastName || ''}` : b.clientName || '-',
      b.userId?.email || b.clientEmail || '-',
      b.salonName || '-',
      b.serviceName || '-',
      b.serviceCategory || '-',
      b.date || '-',
      b.time || '-',
      b.bpPrice || 0,
      b.status || '-',
      b.paymentStatus || '-',
      b.createdAt ? new Date(b.createdAt).toLocaleDateString('ka-GE') : '-'
    ]);
    const wsBookings = XLSX.utils.aoa_to_sheet([bookingHeaders, ...bookingData]);
    XLSX.utils.book_append_sheet(wb, wsBookings, 'ჯავშნები');
    
    // === ЛИСТ 4: Пользователи ===
    const userHeaders = ['სახელი', 'გვარი', 'Email', 'ტელეფონი', 'BP ბალანსი', 'რეფერალი', 'რეგისტრაცია'];
    const userData = users.map(u => [
      u.firstName || '-',
      u.lastName || '-',
      u.email,
      u.phone || '-',
      u.beautyPoints || 0,
      u.referralCode || '-',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('ka-GE') : '-'
    ]);
    const wsUsers = XLSX.utils.aoa_to_sheet([userHeaders, ...userData]);
    XLSX.utils.book_append_sheet(wb, wsUsers, 'მომხმარებლები');
    
    // === ЛИСТ 5: Специалисты ===
    const specHeaders = ['სახელი', 'პოზიცია', 'სალონი', 'სერვისები', 'შექმნის თარიღი'];
    const specData = await Promise.all(specialists.map(async (sp) => {
      const salon = salons.find(s => s._id.toString() === sp.salonId?.toString());
      return [
        sp.name || '-',
        sp.position || '-',
        salon?.salonName || '-',
        (sp.services || []).map(s => `${s.name} (${s.bpPrice} BP)`).join(', ') || '-',
        sp.createdAt ? new Date(sp.createdAt).toLocaleDateString('ka-GE') : '-'
      ];
    }));
    const wsSpecs = XLSX.utils.aoa_to_sheet([specHeaders, ...specData]);
    XLSX.utils.book_append_sheet(wb, wsSpecs, 'სპეციალისტები');
    
    // === ЛИСТ 6: Аналитика по категориям ===
    const categoryStats = {};
    bookings.forEach(b => {
      const cat = b.serviceCategory || 'other';
      if (!categoryStats[cat]) categoryStats[cat] = { count: 0, revenue: 0 };
      categoryStats[cat].count++;
      categoryStats[cat].revenue += b.bpPrice || 0;
    });
    const catHeaders = ['კატეგორია', 'ჯავშნები', 'შემოსავალი (BP)'];
    const catData = Object.entries(categoryStats).map(([cat, data]) => [
      cat, data.count, data.revenue
    ]);
    const wsCats = XLSX.utils.aoa_to_sheet([catHeaders, ...catData]);
    XLSX.utils.book_append_sheet(wb, wsCats, 'კატეგორიები');
    
    // Генерируем файл
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const filename = `beautypass_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
    console.log(`📊 Excel export by admin: ${req.user.email}`);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// Экспорт аналитики конкретного салона
app.get('/api/admin/export-salon/:salonId', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const salon = await User.findOne({ _id: req.params.salonId, userType: 'salon' }).lean();
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    const [bookings, specialists] = await Promise.all([
      Booking.find({ salonId: salon._id }).populate('userId', 'firstName lastName email phone').lean(),
      Specialist.find({ salonId: salon._id, isActive: true }).lean()
    ]);
    
    const wb = XLSX.utils.book_new();
    
    // === ЛИСТ 1: Информация о салоне ===
    const salonInfo = [
      ['სალონის ანგარიში - Beauty Pass'],
      [],
      ['სახელი:', salon.salonName || '-'],
      ['Email:', salon.email],
      ['ტელეფონი:', salon.salonPhone || '-'],
      ['მისამართი:', salon.salonAddress || '-'],
      ['რეგისტრაცია:', salon.createdAt ? new Date(salon.createdAt).toLocaleDateString('ka-GE') : '-'],
      [],
      ['=== ფინანსები ==='],
      ['მთლიანი შემოსავალი:', `${salon.salonRevenue || 0} BP`],
      ['Escrow-ში:', `${salon.salonPendingRevenue || 0} BP`],
      ['გადახდილი:', `${salon.salonWithdrawnRevenue || 0} BP`],
      ['გასატანი:', `${(salon.salonRevenue || 0) - (salon.salonWithdrawnRevenue || 0)} BP`],
      [],
      ['=== სტატისტიკა ==='],
      ['სულ ჯავშნები:', salon.salonTotalBookings || 0],
      ['დასრულებული:', salon.salonCompletedBookings || 0],
      ['გაუქმებული:', salon.salonCancelledBookings || 0]
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(salonInfo);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'ინფორმაცია');
    
    // === ЛИСТ 2: Бронирования ===
    const bookingHeaders = ['კოდი', 'კლიენტი', 'ტელეფონი', 'სერვისი', 'სპეციალისტი', 'თარიღი', 'დრო', 'BP', 'სტატუსი', 'გადახდა'];
    const bookingData = bookings.map(b => [
      b.bookingCode,
      b.userId ? `${b.userId.firstName || ''} ${b.userId.lastName || ''}` : b.clientName || '-',
      b.userId?.phone || b.clientPhone || '-',
      b.serviceName || '-',
      b.specialistName || '-',
      b.date || '-',
      b.time || '-',
      b.bpPrice || 0,
      b.status || '-',
      b.paymentStatus || '-'
    ]);
    const wsBookings = XLSX.utils.aoa_to_sheet([bookingHeaders, ...bookingData]);
    XLSX.utils.book_append_sheet(wb, wsBookings, 'ჯავშნები');
    
    // === ЛИСТ 3: Специалисты ===
    const specHeaders = ['სახელი', 'პოზიცია', 'სერვისები'];
    const specData = specialists.map(sp => [
      sp.name || '-',
      sp.position || '-',
      (sp.services || []).map(s => `${s.name} - ${s.bpPrice} BP`).join('; ')
    ]);
    const wsSpecs = XLSX.utils.aoa_to_sheet([specHeaders, ...specData]);
    XLSX.utils.book_append_sheet(wb, wsSpecs, 'სპეციალისტები');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `salon_${(salon.salonName || 'export').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
    console.log(`📊 Salon export: ${salon.salonName} by admin: ${req.user.email}`);
  } catch (error) {
    console.error('Export salon error:', error);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// ======================================
// ПОЛЬЗОВАТЕЛЬСКИЕ МАРШРУТЫ
// ======================================

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    console.log('👤 Запрос профиля пользователя:', req.user.email);
    
    // Считаем реальное количество бронирований из базы
    const bookingsCount = await Booking.countDocuments({ 
      clientId: req.user._id,
      status: { $in: ['completed', 'confirmed'] }
    });
    
    // Обновляем totalBookings в user если отличается
    if (req.user.totalBookings !== bookingsCount) {
      req.user.totalBookings = bookingsCount;
      await req.user.save();
    }
    
    res.json(req.user);
  } catch (error) {
    console.error('Profile error:', error);
    res.json(req.user);
  }
});

// Обновление профиля пользователя
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, birthDate } = req.body;
    const user = req.user;
    
    // Обновляем поля
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (birthDate !== undefined) user.birthDate = birthDate ? new Date(birthDate) : null;
    
    await user.save();
    
    console.log('👤 Профиль обновлён:', user.email);
    res.json(user);
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка при сохранении профиля' });
  }
});

app.post('/api/packages/buy', authMiddleware, async (req, res) => {
  try {
    const { plan, price } = req.body;
    const user = req.user;
    
    const pkg = await Package.findOne({ plan });
    if (!pkg) return res.status(404).json({ message: 'Пакет не найден' });
    
    if (user.balance < price) {
      return res.status(400).json({ message: 'Недостаточно средств на балансе. არასაკმარისი ბალანსი.' });
    }
    
    // Вычисляем BP на основе пакета (tokens в Package = BP)
    const bpToAdd = pkg.tokens || 0;
    
    // Списываем деньги с баланса
    user.balance -= price;
    
    // Добавляем Beauty Points
    user.beautyPoints = (user.beautyPoints || 0) + bpToAdd;
    
    // Устанавливаем активный план
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 дней
    
    user.activePlan = {
      name: pkg.plan,
      purchasedAt: now,
      expiresAt: expiresAt,
      bpIncluded: bpToAdd
    };
    
    // Добавляем в историю покупок
    user.purchases.push({ 
      id: Date.now(), 
      type: 'tariff', 
      plan: pkg.plan, 
      price: price,
      bpAmount: bpToAdd,
      includes: pkg.includes, 
      perks: pkg.perks,
      ts: now,
      valid_until: expiresAt
    });
    
    await user.save();
    
    console.log(`✅ User ${user.email} purchased ${pkg.plan}: -${price}₾, +${bpToAdd} BP`);
    
    res.json({ 
      message: `${pkg.plan} შეძენილია! +${bpToAdd} BP დამატებულია`,
      user: {
        balance: user.balance,
        beautyPoints: user.beautyPoints,
        activePlan: user.activePlan,
        purchases: user.purchases
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/balance/add', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;
    
    if (amount <= 0) {
      return res.status(400).json({ message: 'Сумма должна быть положительной' });
    }
    
    user.balance += amount;
    await user.save();
    res.json({ message: 'Баланс успешно пополнен!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { salonName, date, time, procedureId } = req.body;
    const user = req.user;
    
    // Салоны не могут бронировать
    if (user.userType === 'salon') {
      return res.status(403).json({ message: 'სალონებს არ შეუძლიათ ჯავშნის გაკეთება. მხოლოდ კლიენტებისთვის / Salons cannot make bookings. Clients only' });
    }
    
    const service = await Service.findById(procedureId);
    if (!service) return res.status(404).json({ message: 'Услуга не найдена' });
    
    const priceBP = service.bpPrice;
    if (user.balance < priceBP) {
      return res.status(400).json({ message: 'Недостаточно BP. Пополните баланс в профиле.' });
    }
    
    user.balance -= priceBP;
    // Обновляем gamification статистику
    user.totalBookings = (user.totalBookings || 0) + 1;
    user.xp = (user.xp || 0) + 10; // 10 XP за бронирование
    
    // Обновляем streak
    const now = new Date();
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
    if (lastActivity) {
      const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.streak = (user.streak || 0) + 1;
      } else if (daysDiff > 1) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }
    user.lastActivity = now;
    
    await user.save();
    
    const newBooking = new Booking({
      userId: user._id,
      salonName,
      service: service.name,
      dateTime: new Date(`${date}T${time}`),
      status: 'booked'
    });
    
    await newBooking.save();
    res.status(201).json({ 
      message: 'Успешно забронировано!', 
      booking: newBooking, 
      updatedUser: user 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ userId }).sort({ dateTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/bookings/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Бронирование не найдено' });
    
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав для отмены этого бронирования' });
    }
    
    if (booking.status !== 'booked') {
      return res.status(400).json({ message: 'Это бронирование уже отменено или завершено' });
    }
    
    const service = await Service.findOne({ name: booking.service });
    if (service) {
      req.user.balance += service.bpPrice;
      await req.user.save();
    }
    
    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Бронирование отменено, BP возвращены на ваш счет.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// МАРШРУТЫ ВЛАДЕЛЬЦА САЛОНА
// ======================================

app.get('/api/salon-owner/services', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { 
    const services = await Service.find({ ownerId: req.user._id }); 
    res.json(services); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

app.post('/api/salon-owner/services', authMiddleware, salonOwnerMiddleware, async (req, res) => { 
  try { 
    const newService = new Service({ ...req.body, ownerId: req.user._id }); 
    await newService.save(); 
    await updateSalonServices(req.user._id); 
    res.status(201).json(newService); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

app.put('/api/salon-owner/services/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => { 
  try { 
    const service = await Service.findOne({ _id: req.params.id, ownerId: req.user._id }); 
    if (!service) return res.status(404).json({ message: 'Услуга не найдена' }); 
    Object.assign(service, req.body); 
    await service.save(); 
    await updateSalonServices(req.user._id); 
    res.json(service); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

app.delete('/api/salon-owner/services/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => { 
  try { 
    const result = await Service.deleteOne({ _id: req.params.id, ownerId: req.user._id }); 
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Услуга не найдена' }); 
    await updateSalonServices(req.user._id); 
    res.json({ message: 'Услуга удалена' }); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

// Обновление профиля салона
app.put('/api/salon-owner/profile', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const { salonName, address, phone, salonDescription } = req.body;
    const user = req.user;
    
    if (salonName) user.salonName = salonName;
    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (salonDescription !== undefined) user.salonDescription = salonDescription;
    
    await user.save();
    
    // Также обновим связанный Salon если он есть
    const salon = await Salon.findOne({ ownerId: user._id });
    if (salon) {
      if (salonName) salon.name = salonName;
      if (address) salon.address = address;
      await salon.save();
    }
    
    res.json({ 
      message: 'Профиль обновлен',
      user: {
        _id: user._id,
        email: user.email,
        salonName: user.salonName,
        address: user.address,
        phone: user.phone,
        salonDescription: user.salonDescription,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Смена пароля салона
app.post('/api/salon-owner/change-password', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'შეავსეთ ყველა ველი' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'პაროლი უნდა იყოს მინ. 8 სიმბოლო' });
    }
    
    // Загружаем пользователя С паролем (req.user не содержит пароль из-за select('-password'))
    const userWithPassword = await User.findById(req.user._id);
    if (!userWithPassword) {
      return res.status(404).json({ message: 'მომხმარებელი ვერ მოიძებნა' });
    }
    
    // Проверяем текущий пароль
    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'არასწორი მიმდინარე პაროლი' });
    }
    
    // Устанавливаем новый пароль (хэширование в модели)
    userWithPassword.password = newPassword;
    await userWithPassword.save();
    
    res.json({ message: 'პაროლი წარმატებით შეიცვალა' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// МАРШРУТЫ СЛОТОВ
// ======================================

app.post('/api/slots', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const { category, date, times } = req.body;
    const ownerId = req.user._id;
    
    const salon = await Salon.findOne({ ownerId });
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    const slot = new Slot({
      salonId: salon._id,
      date,
      times,
      category
    });
    
    await slot.save();
    res.status(201).json({ message: 'Слоты успешно добавлены!', slot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/salon-owner/slots', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { 
    const ownerId = req.user._id; 
    const salon = await Salon.findOne({ ownerId }); 
    if (!salon) { 
      return res.status(404).json({ message: 'Салон не найден' }); 
    }
    const slots = await Slot.find({ salonId: salon._id }).sort({ date: 1 }); 
    res.json(slots); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

app.delete('/api/slots/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => { 
  try { 
    const slot = await Slot.findById(req.params.id); 
    if (!slot) { 
      return res.status(404).json({ message: 'Слот не найден' }); 
    }
    const salon = await Salon.findOne({ ownerId: req.user._id }); 
    if (salon._id.toString() !== slot.salonId.toString()) { 
      return res.status(403).json({ message: 'Нет прав для удаления этого слота' }); 
    }
    await Slot.findByIdAndDelete(req.params.id); 
    res.json({ message: 'Слот успешно удален' }); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

// ======================================
// МАРШРУТЫ БРОНИРОВАНИЙ
// ======================================

app.get('/api/salon-owner/bookings', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { 
    const ownerId = req.user._id; 
    const salon = await Salon.findOne({ ownerId }); 
    if (!salon) { 
      return res.status(404).json({ message: 'Салон не найден' }); 
    }
    const bookings = await Booking.find({ salonName: salon.name })
      .populate('userId', 'firstName lastName phone')
      .sort({ dateTime: -1 });
    
    const bookingsWithClientInfo = bookings.map(booking => ({
      ...booking.toObject(),
      clientName: booking.userId ? `${booking.userId.firstName} ${booking.userId.lastName}` : 'Клиент',
      clientPhone: booking.userId ? booking.userId.phone : 'Нет телефона',
    }));
    
    res.json(bookingsWithClientInfo); 
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

// ======================================
// СТАТИСТИКА
// ======================================

app.get('/api/salon-owner/statistics', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { 
    const ownerId = req.user._id; 
    const salon = await Salon.findOne({ ownerId }); 
    if (!salon) { 
      return res.status(404).json({ message: 'Салон не найден' }); 
    }
    // Статистика слотов
    const totalSlots = await Slot.countDocuments({ salonId: salon._id });
    const bookedSlots = await Booking.countDocuments({ 
      salonName: salon.name, 
      status: 'booked' 
    });
    const availableSlots = totalSlots - bookedSlots;
    
    // Статистика бронирований
    const totalBookings = await Booking.countDocuments({ 
      salonName: salon.name 
    });
    const completedBookings = await Booking.countDocuments({ 
      salonName: salon.name, 
      status: 'completed' 
    });
    const cancelledBookings = await Booking.countDocuments({ 
      salonName: salon.name, 
      status: 'cancelled' 
    });
    
    // Финансовая статистика
    const bookings = await Booking.find({ salonName: salon.name });
    let totalBPSpent = 0;
    let refundableBP = 0;
    let nonRefundableBP = 0;
    
    for (const booking of bookings) {
      const service = await Service.findOne({ name: booking.service });
      if (service) {
        const bpAmount = service.bpPrice;
        totalBPSpent += bpAmount;
        
        if (booking.status === 'cancelled') {
          refundableBP += bpAmount;
        } else if (booking.status === 'completed') {
          nonRefundableBP += bpAmount;
        }
      }
    }
    
    res.json({
      totalSlots,
      availableSlots,
      bookedSlots,
      totalBookings,
      activatedVisits: completedBookings,
      validCancellations: cancelledBookings,
      lateCancellations: cancelledBookings,
      totalBPSpent,
      refundableBP,
      nonRefundableBP
    });
  } catch (error) { 
    res.status(500).json({ message: 'Ошибка сервера' }); 
  }
});

// ======================================
// САЛОН: ФИНАНСОВАЯ СТАТИСТИКА
// ======================================

// Получить финансовую статистику для салона
app.get('/api/salon-owner/finance', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'მხოლოდ სალონის მფლობელებისთვის' });
    }
    
    const salon = req.user;
    
    // Статистика бронирований по статусу платежа
    const paymentStats = await Booking.aggregate([
      { $match: { salonId: salon._id } },
      { $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalBP: { $sum: '$bpPrice' }
      }}
    ]);
    
    const escrow = paymentStats.find(s => s._id === 'escrow') || { count: 0, totalBP: 0 };
    const released = paymentStats.find(s => s._id === 'released') || { count: 0, totalBP: 0 };
    const refunded = paymentStats.find(s => s._id === 'refunded') || { count: 0, totalBP: 0 };
    
    // Последние транзакции (бронирования)
    const recentBookings = await Booking.find({ salonId: salon._id })
      .select('bookingCode serviceName bpPrice status paymentStatus createdAt confirmedAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    // Доступно для вывода
    const availableForWithdrawal = (salon.salonRevenue || 0) - (salon.salonWithdrawnRevenue || 0);
    
    res.json({
      success: true,
      finance: {
        totalRevenue: salon.salonRevenue || 0,           // Всего заработано (released)
        pendingRevenue: salon.salonPendingRevenue || 0,  // В escrow (ожидают подтверждения)
        withdrawnRevenue: salon.salonWithdrawnRevenue || 0, // Уже выплачено
        availableForWithdrawal                            // Доступно к выводу
      },
      stats: {
        totalBookings: salon.salonTotalBookings || 0,
        completedBookings: salon.salonCompletedBookings || 0,
        cancelledBookings: salon.salonCancelledBookings || 0,
        conversionRate: salon.salonTotalBookings > 0 
          ? Math.round((salon.salonCompletedBookings || 0) / salon.salonTotalBookings * 100) 
          : 0
      },
      paymentBreakdown: {
        inEscrow: escrow,
        released: released,
        refunded: refunded
      },
      recentBookings
    });
  } catch (error) {
    console.error('Salon finance error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// ПЛАТЕЖИ
// ======================================

app.post('/api/transactions/create', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;
    
    console.log('💳 Создание платежа на сумму:', amount);
    
    // Запрашиваем access token у TBC
    const credentials = Buffer.from(`${process.env.TBC_IPAY_KEY}:${process.env.TBC_IPAY_SECRET}`).toString('base64');
    const tokenResponse = await axios.post(process.env.TBC_OAUTH_URL, 'grant_type=client_credentials', {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Authorization': `Basic ${credentials}` 
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) { 
      throw new Error('Не удалось получить access token от TBC'); 
    }
    
    // Создаем транзакцию в БД
    const transaction = new Transaction({ 
      transactionId: `BP_${Date.now()}_${userId}`, 
      userId, 
      amount, 
      bank: 'tbc', 
      status: 'pending' 
    });
    await transaction.save();
    
    // Создаем платеж в TBC
    const paymentData = {
      shop_order_id: transaction.transactionId,
      purchase_amount: { amount: amount * 100, currency: 'GEL' },
      language: 'ru',
      callback_url: 'https://beautypass-website.onrender.com/api/payments/tbc-callback'
    };
    
    const paymentResponse = await axios.post(process.env.TBC_API_URL, paymentData, {
      headers: { 
        'accept': 'application/json', 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${accessToken}` 
      }
    });
    
    const paymentUrl = paymentResponse.data.redirect_url;
    if (!paymentUrl) { 
      throw new Error('TBC не вернул ссылку на оплату'); 
    }
    
    res.status(201).json({ 
      transactionId: transaction.transactionId, 
      paymentUrl: paymentUrl, 
      status: transaction.status 
    });
  } catch (error) {
    console.error('❌ Ошибка создания платежа:', error);
    res.status(500).json({ message: 'Не удалось создать платеж. Попробуйте еще раз.' });
  }
});

app.get('/api/transactions/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) return res.status(404).json({ message: 'Транзакция не найдена' });
    
    res.status(200).json({ 
      transactionId: transaction.transactionId, 
      status: transaction.status, 
      amount: transaction.amount, 
      bank: transaction.bank 
    });
  } catch (error) { 
    console.error('❌ Ошибка проверки статуса транзакции:', error); 
    res.status(500).json({ message: 'Внутренняя ошибка сервера' }); 
  }
});

// ======================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================================

async function updateSalonServices(ownerId) {
  try {
    const services = await Service.find({ ownerId });
    const serviceNames = services.map(service => service.name);
    await Salon.findOneAndUpdate({ ownerId }, { services: serviceNames }, { new: true });
  } catch (error) { 
    console.error('❌ Ошибка обновления услуг салона:', error); 
  }
}

// ======================================
// НАСТРОЙКИ САЙТА (ADMIN)
// ======================================

// Получить настройки сайта
app.get('/api/site-settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new SiteSettings({ key: 'main' });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Site settings error:', error);
    res.status(500).json({ message: 'Ошибка получения настроек' });
  }
});

// Сохранить настройки сайта (только админ)
app.put('/api/admin/site-settings', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const updateData = req.body;
    delete updateData._id;
    delete updateData.key;
    
    let settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    console.log('✅ Настройки сайта обновлены админом:', req.user.email);
    res.json({ message: 'Настройки сохранены', settings });
  } catch (error) {
    console.error('Site settings update error:', error);
    res.status(500).json({ message: 'Ошибка сохранения настроек' });
  }
});

// ======================================
// РАСШИРЕННАЯ СИСТЕМА БРОНИРОВАНИЯ С QR
// ======================================

// Функция отправки QR кода на email
async function sendBookingQREmail(booking, user) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  const qrData = `${process.env.BASE_URL || 'https://beautypass-website.onrender.com'}/api/booking/verify/${booking.bookingCode}`;
  
  const mailOptions = {
    from: `"Beauty Pass" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🌸 ჯავშანი დადასტურებულია - ${booking.serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #ff6b9d; text-align: center;">🌸 Beauty Pass - ჯავშანი</h2>
          
          <p style="font-size: 16px; color: #333;">გამარჯობა, ${user.firstName}!</p>
          <p style="font-size: 16px; color: #333;">თქვენი ჯავშანი დადასტურებულია:</p>
          
          <div style="background-color: #ffe0e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>📍 სალონი:</strong> ${booking.salonName}</p>
            <p><strong>💅 პროცედურა:</strong> ${booking.serviceName}</p>
            <p><strong>📅 თარიღი:</strong> ${booking.date}</p>
            <p><strong>🕐 დრო:</strong> ${booking.time}</p>
            <p><strong>🎫 კოდი:</strong> <span style="font-size: 20px; font-weight: bold; color: #ff6b9d;">${booking.bookingCode}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff;">
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">აჩვენეთ ეს QR კოდი სალონში:</p>
            <div style="display: inline-block; padding: 15px; background: white; border: 2px solid #ff6b9d; border-radius: 10px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&format=png&margin=10&data=${encodeURIComponent(booking.bookingCode)}" alt="QR Code" width="250" height="250" style="display: block;"/>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">ან უთხარით კოდი:</p>
            <p style="font-size: 24px; font-weight: bold; color: #ff6b9d; letter-spacing: 2px; margin-top: 5px;">${booking.bookingCode}</p>
          </div>
          
          <p style="font-size: 14px; color: #888;">გისურვებთ სასიამოვნო ვიზიტს! ✨</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ QR email გაგზავნილია: ${user.email}`);
  } catch (error) {
    console.error('❌ QR email error:', error);
  }
}

// Получить салоны с владельцами (для бронирования)
app.get('/api/salons-with-owners', async (req, res) => {
  try {
    // Находим всех пользователей с типом salon
    const salonOwners = await User.find({ userType: 'salon' })
      .select('_id salonName address phone workingHours');
    
    // Также получаем салоны из модели Salon
    const salons = await Salon.find().populate('ownerId', '_id salonName');
    
    // Объединяем результаты
    const allSalons = [
      ...salonOwners.map(owner => ({
        _id: owner._id,
        name: owner.salonName || 'Салон',
        address: owner.address || '',
        phone: owner.phone || '',
        workingHours: owner.workingHours || '10:00 - 20:00',
        type: 'owner'
      })),
      ...salons.map(salon => ({
        _id: salon.ownerId?._id || salon._id,
        name: salon.name,
        address: salon.address || '',
        phone: salon.phone || '',
        workingHours: salon.workingHours || '10:00 - 20:00',
        type: 'salon'
      }))
    ];
    
    // Убираем дубликаты по ID
    const uniqueSalons = [...new Map(allSalons.map(s => [s._id.toString(), s])).values()];
    
    res.json(uniqueSalons);
  } catch (error) {
    console.error('Salons with owners error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить услуги салона (по ID владельца)
app.get('/api/salon/:salonId/services', async (req, res) => {
  try {
    const { salonId } = req.params;
    const services = await Service.find({ ownerId: salonId });
    res.json(services);
  } catch (error) {
    console.error('Salon services error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ПУБЛИЧНЫЙ: Получить ВСЕ доступные слоты с фильтрами
app.get('/api/available-slots', async (req, res) => {
  try {
    const { date, salonId, specialistId, category, limit = 50 } = req.query;
    
    // Базовый запрос - только свободные слоты
    let query = { isBooked: false };
    
    // Фильтр по дате (только будущие слоты)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    if (date) {
      query.date = date;
    } else {
      query.date = { $gte: todayStr };
    }
    
    if (salonId) query.salonId = salonId;
    if (specialistId) query.specialistId = specialistId;
    
    // Находим слоты
    let slots = await Slot.find(query)
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit))
      .lean();
    
    // Фильтр по категории
    if (category && slots.length > 0) {
      const specIds = slots.map(s => s.specialistId).filter(Boolean);
      const specialists = await Specialist.find({ _id: { $in: specIds } }).lean();
      const specMap = {};
      specialists.forEach(s => {
        specMap[s._id.toString()] = s;
      });
      
      slots = slots.filter(slot => {
        if (!slot.specialistId) return false;
        const spec = specMap[slot.specialistId.toString()];
        if (!spec) return false;
        return spec.services?.some(svc => svc.category === category);
      });
    }
    
    // Добавляем информацию о салоне и специалисте
    const enrichedSlots = await Promise.all(slots.map(async (slot) => {
      let specialistInfo = null;
      if (slot.specialistId) {
        specialistInfo = await Specialist.findById(slot.specialistId)
          .select('name position photo services averageRating')
          .lean();
      }
      
      return {
        ...slot,
        specialist: specialistInfo
      };
    }));
    
    console.log(`📅 Доступные слоты: найдено ${enrichedSlots.length}`);
    res.json(enrichedSlots);
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить доступные слоты салона
app.get('/api/salon/:salonId/available-slots', async (req, res) => {
  try {
    const { salonId } = req.params;
    const { date, serviceId } = req.query;
    
    let query = { salonId, isBooked: false };
    if (date) query.date = date;
    if (serviceId) query.serviceId = serviceId;
    
    const slots = await Slot.find(query).sort({ date: 1, time: 1 });
    res.json(slots);
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Добавить слот
app.post('/api/salon-owner/add-slot', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { serviceName, serviceCategory, date, time, duration, bpPrice, serviceId } = req.body;
    
    if (!serviceName || !date || !time) {
      return res.status(400).json({ message: 'Укажите услугу, дату и время' });
    }
    
    const slot = new Slot({
      salonId: req.user._id,
      salonName: req.user.salonName || 'Салон',
      serviceId: serviceId || null,
      serviceName,
      serviceCategory: serviceCategory || '',
      date,
      time,
      duration: duration || 30,
      bpPrice: bpPrice || 10,
      isBooked: false
    });
    
    await slot.save();
    
    console.log(`✅ Слот добавлен: ${req.user.salonName} - ${serviceName} ${date} ${time}`);
    res.status(201).json({ message: 'სლოტი დამატებულია', slot });
  } catch (error) {
    console.error('Add slot error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Добавить несколько слотов сразу
app.post('/api/salon-owner/add-slots-batch', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { serviceName, serviceCategory, date, times, duration, bpPrice, serviceId, specialistId, specialistName } = req.body;
    
    if (!serviceName || !date || !times || !times.length) {
      return res.status(400).json({ message: 'შეავსეთ სერვისი, თარიღი და დრო' });
    }
    
    // Валидация категории
    const validCategories = ['nails', 'hair', 'face', 'body', 'makeup', 'other'];
    if (!serviceCategory || !validCategories.includes(serviceCategory)) {
      return res.status(400).json({ message: 'აირჩიეთ კატეგორია' });
    }
    
    // Валидация даты - нельзя создать слот в прошлом
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    
    if (slotDate < today) {
      return res.status(400).json({ message: 'წარსული თარიღის სლოტის შექმნა შეუძლებელია' });
    }
    
    // Если сегодня - проверяем что время не прошло
    const now = new Date();
    const isToday = slotDate.getTime() === today.getTime();
    
    const slots = [];
    for (const time of times) {
      // Если сегодня, проверяем что время не в прошлом
      if (isToday) {
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        if (slotTime <= now) {
          continue; // Пропускаем прошедшее время
        }
      }
      
      const slot = new Slot({
        salonId: req.user._id,
        salonName: req.user.salonName || 'სალონი',
        specialistId: specialistId || null,
        specialistName: specialistName || null,
        serviceId: serviceId || null,
        serviceName,
        serviceCategory,
        date,
        time,
        duration: duration || 30,
        bpPrice: bpPrice || 10,
        isBooked: false
      });
      await slot.save();
      slots.push(slot);
    }
    
    console.log(`✅ Добавлено ${slots.length} слотов для ${req.user.salonName}`);
    res.status(201).json({ message: `${slots.length} სლოტი დამატებულია`, slots });
  } catch (error) {
    console.error('Add slots batch error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// МАРШРУТЫ СПЕЦИАЛИСТОВ
// ======================================

// САЛОН: Получить своих специалистов
app.get('/api/salon-owner/specialists', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const specialists = await Specialist.find({ salonId: req.user._id, isActive: true })
      .sort({ name: 1 });
    
    res.json(specialists);
  } catch (error) {
    console.error('Get specialists error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Добавить специалиста
app.post('/api/salon-owner/specialists', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { name, position, description, services, photoUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'შეიყვანეთ სპეციალისტის სახელი' });
    }
    
    const specialist = new Specialist({
      salonId: req.user._id,
      name,
      position: position || '',
      description: description || '',
      services: services || [],
      photoUrl: photoUrl || ''
    });
    
    await specialist.save();
    
    res.status(201).json({ message: 'სპეციალისტი დამატებულია', specialist });
  } catch (error) {
    console.error('Add specialist error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Обновить специалиста
app.put('/api/salon-owner/specialists/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const specialist = await Specialist.findOne({ _id: req.params.id, salonId: req.user._id });
    if (!specialist) {
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა' });
    }
    
    const { name, position, description, services, photoUrl } = req.body;
    
    if (name) specialist.name = name;
    if (position !== undefined) specialist.position = position;
    if (description !== undefined) specialist.description = description;
    if (services) specialist.services = services;
    if (photoUrl !== undefined) specialist.photoUrl = photoUrl;
    
    await specialist.save();
    
    res.json({ message: 'სპეციალისტი განახლებულია', specialist });
  } catch (error) {
    console.error('Update specialist error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Удалить специалиста
app.delete('/api/salon-owner/specialists/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const specialist = await Specialist.findOne({ _id: req.params.id, salonId: req.user._id });
    if (!specialist) {
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა' });
    }
    
    // Деактивируем (soft delete)
    specialist.isActive = false;
    await specialist.save();
    
    res.json({ message: 'სპეციალისტი წაშლილია' });
  } catch (error) {
    console.error('Delete specialist error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Загрузить фото специалиста
app.post('/api/salon-owner/specialists/:id/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const specialist = await Specialist.findOne({ _id: req.params.id, salonId: req.user._id });
    if (!specialist) {
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'ფოტო არ არის ატვირთული' });
    }
    
    // Удаляем старое фото если есть
    if (specialist.photoUrl) {
      const oldPath = path.join(__dirname, specialist.photoUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    specialist.photoUrl = '/uploads/' + req.file.filename;
    await specialist.save();
    
    res.json({ 
      message: 'ფოტო ატვირთულია',
      photoUrl: specialist.photoUrl
    });
  } catch (error) {
    console.error('Upload specialist photo error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// =====================================================
// САЛОН: ГАЛЕРЕЯ (ФОТО/ВИДЕО)
// =====================================================

// Получить галерею салона
app.get('/api/salon-owner/gallery', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    // Ищем по ObjectId и по строке на случай разных форматов
    let salon = await Salon.findOne({ ownerId: req.user._id });
    if (!salon) {
      salon = await Salon.findOne({ ownerId: req.user._id.toString() });
    }
    
    console.log(`📷 Gallery request: userId=${req.user._id}, salon found: ${!!salon}, gallery items: ${salon?.gallery?.length || 0}`);
    
    if (!salon) {
      return res.json({ gallery: [] });
    }
    
    res.json({ gallery: salon.gallery || [] });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Загрузить фото/видео в галерею
app.post('/api/salon-owner/gallery', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'ფაილი არ არის ატვირთული' });
    }
    
    // Определяем тип файла
    const isVideo = req.file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'photo';
    const mediaUrl = '/uploads/' + req.file.filename;
    
    // Создаем новый элемент галереи
    const newGalleryItem = {
      type: mediaType,
      url: mediaUrl,
      caption: req.body.caption || '',
      createdAt: new Date()
    };
    
    // Используем findOneAndUpdate чтобы избежать проблем с валидацией workingHours
    const updateObj = {
      $push: { 
        gallery: newGalleryItem
      }
    };
    
    // Добавляем в соответствующий массив photos/videos
    if (isVideo) {
      updateObj.$push.videos = mediaUrl;
    } else {
      updateObj.$push.photos = mediaUrl;
    }
    
    let salon = await Salon.findOneAndUpdate(
      { ownerId: req.user._id },
      updateObj,
      { new: true, upsert: false }
    );
    
    // Если салона нет, создаем новый
    if (!salon) {
      salon = await Salon.create({
        name: req.user.salonName || 'სალონი',
        address: 'მისამართი არ არის მითითებული',
        ownerId: req.user._id,
        gallery: [newGalleryItem],
        photos: isVideo ? [] : [mediaUrl],
        videos: isVideo ? [mediaUrl] : []
      });
    }
    
    console.log(`✅ სალონის ${mediaType} ატვირთულია: ${mediaUrl}`);
    
    res.json({ 
      message: 'მედია ატვირთულია',
      media: salon.gallery[salon.gallery.length - 1],
      gallery: salon.gallery
    });
  } catch (error) {
    console.error('Upload gallery media error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить медиа из галереи
app.delete('/api/salon-owner/gallery/:index', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const salon = await Salon.findOne({ ownerId: req.user._id });
    if (!salon || !salon.gallery) {
      return res.status(404).json({ message: 'გალერეა ვერ მოიძებნა' });
    }
    
    const index = parseInt(req.params.index);
    if (index < 0 || index >= salon.gallery.length) {
      return res.status(400).json({ message: 'არასწორი ინდექსი' });
    }
    
    const removed = salon.gallery[index];
    
    // Удаляем файл
    const filePath = path.join(__dirname, removed.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Удаляем из массивов
    if (removed.type === 'video') {
      salon.videos = (salon.videos || []).filter(v => v !== removed.url);
    } else {
      salon.photos = (salon.photos || []).filter(p => p !== removed.url);
    }
    
    // Удаляем из галереи
    salon.gallery.splice(index, 1);
    await salon.save();
    
    res.json({ message: 'მედია წაშლილია', gallery: salon.gallery });
  } catch (error) {
    console.error('Delete gallery media error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Добавить услугу специалисту
app.post('/api/salon-owner/specialists/:id/services', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const specialist = await Specialist.findOne({ _id: req.params.id, salonId: req.user._id });
    if (!specialist) {
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა' });
    }
    
    const { name, category, duration, bpPrice } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ message: 'შეიყვანეთ სერვისის სახელი და კატეგორია' });
    }
    
    specialist.services.push({
      name,
      category,
      duration: duration || 30,
      bpPrice: bpPrice || 10
    });
    
    await specialist.save();
    
    res.json({ message: 'სერვისი დამატებულია', specialist });
  } catch (error) {
    console.error('Add service to specialist error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Удалить услугу специалиста
app.delete('/api/salon-owner/specialists/:id/services/:serviceId', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const specialist = await Specialist.findOne({ _id: req.params.id, salonId: req.user._id });
    if (!specialist) {
      return res.status(404).json({ message: 'სპეციალისტი ვერ მოიძებნა' });
    }
    
    const serviceId = decodeURIComponent(req.params.serviceId);
    
    // Try to find by _id first, then by name
    const serviceIndex = specialist.services.findIndex(s => 
      s._id?.toString() === serviceId || s.name === serviceId
    );
    
    if (serviceIndex === -1) {
      return res.status(404).json({ message: 'სერვისი ვერ მოიძებნა' });
    }
    
    specialist.services.splice(serviceIndex, 1);
    await specialist.save();
    
    res.json({ message: 'სერვისი წაშლილია', specialist });
  } catch (error) {
    console.error('Delete service from specialist error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ПУБЛИЧНЫЙ: Получить специалистов салона
app.get('/api/salon/:salonId/specialists', async (req, res) => {
  try {
    const specialists = await Specialist.find({ 
      salonId: req.params.salonId, 
      isActive: true 
    }).sort({ name: 1 });
    
    res.json(specialists);
  } catch (error) {
    console.error('Get salon specialists error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ПУБЛИЧНЫЙ: Получить галерею салона
app.get('/api/salon/:salonId/gallery', async (req, res) => {
  try {
    const salonId = req.params.salonId;
    
    // Сначала ищем напрямую в коллекции Salon
    let salon = await Salon.findById(salonId);
    
    // Если не нашли, может это User._id владельца
    if (!salon) {
      salon = await Salon.findOne({ ownerId: salonId });
    }
    
    if (!salon || !salon.gallery || salon.gallery.length === 0) {
      return res.json([]);
    }
    
    res.json(salon.gallery);
  } catch (error) {
    console.error('Get salon gallery error:', error);
    res.json([]);
  }
});

// САЛОН: Получить свои слоты
app.get('/api/salon-owner/my-slots', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { date, showBooked } = req.query;
    let query = { salonId: req.user._id };
    
    if (date) query.date = date;
    if (showBooked === 'false') query.isBooked = false;
    
    const slots = await Slot.find(query)
      .populate('bookedBy', 'firstName lastName email phone')
      .sort({ date: 1, time: 1 });
    
    res.json(slots);
  } catch (error) {
    console.error('My slots error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Удалить слот
app.delete('/api/salon-owner/slots/:slotId', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const slot = await Slot.findOne({ _id: req.params.slotId, salonId: req.user._id });
    if (!slot) {
      return res.status(404).json({ message: 'Слот не найден' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Нельзя удалить забронированный слот' });
    }
    
    await Slot.findByIdAndDelete(req.params.slotId);
    res.json({ message: 'სლოტი წაშლილია' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// КЛИЕНТ: Забронировать слот
app.post('/api/booking/create', authMiddleware, async (req, res) => {
  try {
    const { slotId } = req.body;
    const user = req.user;
    
    // Салоны не могут бронировать
    if (user.userType === 'salon') {
      return res.status(403).json({ message: 'სალონებს არ შეუძლიათ ჯავშნის გაკეთება. მხოლოდ კლიენტებისთვის / Salons cannot make bookings. Clients only' });
    }
    
    // Находим слот
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'სლოტი ვერ მოიძებნა' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'ეს სლოტი უკვე დაჯავშნილია' });
    }
    
    // Проверяем баланс BP
    const bpPrice = slot.bpPrice || 10;
    if ((user.beautyPoints || 0) < bpPrice) {
      return res.status(400).json({ 
        message: `არასაკმარისი BP. საჭიროა: ${bpPrice} BP, თქვენ გაქვთ: ${user.beautyPoints || 0} BP` 
      });
    }
    
    // Генерируем код бронирования
    const bookingCode = Booking.generateBookingCode();
    
    // Создаем дату и время
    const dateTime = new Date(`${slot.date}T${slot.time}:00`);
    
    // Создаем бронирование
    const booking = new Booking({
      bookingCode,
      userId: user._id,
      clientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      clientEmail: user.email,
      clientPhone: user.phone || '',
      salonId: slot.salonId,
      salonName: slot.salonName,
      slotId: slot._id,
      serviceName: slot.serviceName,
      serviceCategory: slot.serviceCategory || '',
      specialistId: slot.specialistId || null,
      specialistName: slot.specialistName || '',
      date: slot.date,
      time: slot.time,
      dateTime,
      duration: slot.duration || 30,
      bpPrice,
      status: 'pending',
      paymentStatus: 'escrow' // BP в эскроу до подтверждения
    });
    
    await booking.save();
    
    // Обновляем слот
    slot.isBooked = true;
    slot.bookedBy = user._id;
    slot.bookingId = booking._id;
    await slot.save();
    
    // Списываем BP у клиента (в эскроу)
    user.beautyPoints = (user.beautyPoints || 0) - bpPrice;
    await user.save();
    
    // Обновляем статистику салона
    const salon = await User.findById(slot.salonId);
    if (salon) {
      salon.salonTotalBookings = (salon.salonTotalBookings || 0) + 1;
      salon.salonPendingRevenue = (salon.salonPendingRevenue || 0) + bpPrice;
      await salon.save();
    }
    
    // Отправляем email с QR кодом
    sendBookingQREmail(booking, user);
    
    console.log(`✅ Бронирование создано: ${bookingCode} для ${user.email} (${bpPrice} BP в эскроу)`);
    
    res.status(201).json({ 
      message: 'ჯავშანი წარმატებით შეიქმნა! QR კოდი გაგზავნილია თქვენს ელფოსტაზე.',
      booking: {
        bookingCode: booking.bookingCode,
        salonName: booking.salonName,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        bpPrice: booking.bpPrice,
        status: booking.status
      },
      newBalance: user.beautyPoints
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// КЛИЕНТ: Мои бронирования
app.get('/api/booking/my-bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .sort({ dateTime: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('My bookings error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// КЛИЕНТ: Отменить бронирование
// >= 2 дней до визита - BP возвращаются клиенту
// < 2 дней до визита - BP идут салону
app.put('/api/booking/:bookingId/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'ჯავშანი ვერ მოიძებნა' });
    }
    
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'ამ ჯავშნის გაუქმება შეუძლებელია' });
    }
    
    // Проверяем время до визита
    const now = new Date();
    const bookingTime = new Date(booking.dateTime);
    const daysUntil = Math.ceil((bookingTime - now) / (1000 * 60 * 60 * 24));
    
    const user = req.user;
    const salon = await User.findById(booking.salonId);
    const bpPrice = booking.bpPrice || 0;
    
    // Освобождаем слот в любом случае
    if (booking.slotId) {
      await Slot.findByIdAndUpdate(booking.slotId, {
        isBooked: false,
        bookedBy: null,
        bookingId: null
      });
    }
    
    booking.status = 'cancelled';
    
    if (daysUntil >= 2) {
      // >= 2 дней - возврат клиенту
      user.beautyPoints = (user.beautyPoints || 0) + bpPrice;
      await user.save();
      
      if (salon) {
        salon.salonPendingRevenue = Math.max(0, (salon.salonPendingRevenue || 0) - bpPrice);
        salon.salonCancelledBookings = (salon.salonCancelledBookings || 0) + 1;
        await salon.save();
      }
      
      booking.paymentStatus = 'refunded';
      await booking.save();
      
      console.log(`✅ Бронирование отменено (возврат клиенту): ${booking.bookingCode}, ${bpPrice} BP`);
      
      res.json({ 
        message: `ჯავშანი გაუქმებულია. ${bpPrice} BP დაბრუნებულია.`,
        refunded: true,
        refundedAmount: bpPrice,
        newBalance: user.beautyPoints
      });
    } else {
      // < 2 дней - BP идут салону
      if (salon) {
        salon.salonPendingRevenue = Math.max(0, (salon.salonPendingRevenue || 0) - bpPrice);
        salon.salonRevenue = (salon.salonRevenue || 0) + bpPrice;
        salon.salonCancelledBookings = (salon.salonCancelledBookings || 0) + 1;
        await salon.save();
      }
      
      booking.paymentStatus = 'released';
      await booking.save();
      
      console.log(`✅ Бронирование отменено (BP салону): ${booking.bookingCode}, ${bpPrice} BP -> ${salon?.salonName}`);
      
      res.json({ 
        message: `ჯავშანი გაუქმებულია. ${bpPrice} BP ჩაერიცხა სალონს (გაუქმება 2 დღეზე ნაკლებით ადრე).`,
        refunded: false,
        chargedAmount: bpPrice,
        newBalance: user.beautyPoints
      });
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// КЛИЕНТ: Изменить бронирование (выбрать новый слот)
// Изменение доступно только если до визита >= 2 дней
app.put('/api/booking/:bookingId/change', authMiddleware, async (req, res) => {
  try {
    const { newSlotId } = req.body;
    
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'ჯავშანი ვერ მოიძებნა' });
    }
    
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'ამ ჯავშნის შეცვლა შეუძლებელია' });
    }
    
    // Проверяем время до визита
    const now = new Date();
    const bookingTime = new Date(booking.dateTime);
    const daysUntil = Math.ceil((bookingTime - now) / (1000 * 60 * 60 * 24));
    
    // Изменение доступно только если >= 2 дней до визита
    if (daysUntil < 2) {
      return res.status(400).json({ 
        message: 'შეცვლა შესაძლებელია მხოლოდ 2+ დღით ადრე. დარჩენილია: ' + daysUntil + ' დღე.'
      });
    }
    
    // Находим новый слот
    const newSlot = await Slot.findById(newSlotId);
    if (!newSlot) {
      return res.status(404).json({ message: 'სლოტი ვერ მოიძებნა' });
    }
    
    if (newSlot.isBooked) {
      return res.status(400).json({ message: 'ეს სლოტი უკვე დაკავებულია' });
    }
    
    // Освобождаем старый слот
    if (booking.slotId) {
      await Slot.findByIdAndUpdate(booking.slotId, {
        isBooked: false,
        bookedBy: null,
        bookingId: null
      });
    }
    
    // Бронируем новый слот
    newSlot.isBooked = true;
    newSlot.bookedBy = req.user._id;
    newSlot.bookingId = booking._id;
    await newSlot.save();
    
    // Обновляем бронирование
    const oldDate = booking.date;
    const oldTime = booking.time;
    
    booking.slotId = newSlot._id;
    booking.date = newSlot.date;
    booking.time = newSlot.time;
    booking.dateTime = new Date(`${newSlot.date}T${newSlot.time}`);
    await booking.save();
    
    console.log(`✅ Бронирование изменено: ${booking.bookingCode}, ${oldDate} ${oldTime} -> ${newSlot.date} ${newSlot.time}`);
    
    res.json({ 
      message: `ჯავშანი შეიცვალა: ${newSlot.date} ${newSlot.time}`,
      booking: {
        ...booking.toObject(),
        date: newSlot.date,
        time: newSlot.time
      }
    });
  } catch (error) {
    console.error('Change booking error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ПУБЛИЧНЫЙ: Проверка QR кода (для сканирования)
app.get('/api/booking/verify/:bookingCode', async (req, res) => {
  try {
    const { bookingCode } = req.params;
    
    const booking = await Booking.findOne({ bookingCode })
      .populate('userId', 'firstName lastName email phone');
    
    if (!booking) {
      return res.status(404).json({ 
        valid: false, 
        message: 'ჯავშანი ვერ მოიძებნა' 
      });
    }
    
    // Проверяем статус
    if (booking.status === 'cancelled') {
      return res.json({ 
        valid: false, 
        message: 'ეს ჯავშანი გაუქმებულია',
        booking: {
          bookingCode: booking.bookingCode,
          status: booking.status
        }
      });
    }
    
    if (booking.status === 'completed') {
      return res.json({ 
        valid: false, 
        message: 'ეს ჯავშანი უკვე გამოყენებულია',
        booking: {
          bookingCode: booking.bookingCode,
          status: booking.status,
          completedAt: booking.completedAt
        }
      });
    }
    
    // Проверяем дату
    const today = new Date().toISOString().split('T')[0];
    if (booking.date !== today) {
      return res.json({ 
        valid: false, 
        message: `ეს ჯავშანი მოქმედებს მხოლოდ ${booking.date} თარიღზე`,
        booking: {
          bookingCode: booking.bookingCode,
          date: booking.date,
          status: booking.status
        }
      });
    }
    
    // Бронирование валидно
    res.json({ 
      valid: true, 
      message: 'ჯავშანი მოქმედია ✓',
      booking: {
        bookingCode: booking.bookingCode,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        serviceName: booking.serviceName,
        serviceCategory: booking.serviceCategory,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Verify booking error:', error);
    res.status(500).json({ valid: false, message: 'Ошибка сервера' });
  }
});

// САЛОН: Подтвердить бронирование (сканирование QR)
app.post('/api/salon-owner/confirm-booking', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { bookingCode } = req.body;
    
    const booking = await Booking.findOne({ 
      bookingCode,
      salonId: req.user._id
    }).populate('userId', 'firstName lastName email phone');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'ჯავშანი ვერ მოიძებნა ან სხვა სალონს ეკუთვნის' 
      });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false,
        message: 'ეს ჯავშანი გაუქმებულია' 
      });
    }
    
    if (booking.status === 'confirmed' || booking.status === 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'ეს ჯავშანი უკვე დადასტურებულია' 
      });
    }
    
    // === ПРОВЕРКА ДАТЫ И ВРЕМЕНИ ±30 МИНУТ ===
    const now = new Date();
    const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const timeDiff = Math.abs(now - bookingDateTime);
    const thirtyMinutes = 30 * 60 * 1000; // 30 минут в миллисекундах
    
    // Проверяем дату
    const today = now.toISOString().split('T')[0];
    if (booking.date !== today) {
      return res.status(400).json({ 
        success: false,
        message: `კოდის გააქტიურება შესაძლებელია მხოლოდ ${booking.date} თარიღზე` 
      });
    }
    
    // Проверяем время ±30 минут
    if (timeDiff > thirtyMinutes) {
      const bookingTimeStr = booking.time;
      return res.status(400).json({ 
        success: false,
        message: `კოდის გააქტიურება შესაძლებელია მხოლოდ ${bookingTimeStr}-ის ±30 წუთში` 
      });
    }
    
    // Подтверждаем
    booking.status = 'confirmed';
    booking.qrScannedAt = new Date();
    booking.confirmedAt = new Date();
    booking.confirmedBy = req.user._id;
    
    // === РЕЛИЗ BP: Переводим BP из escrow в revenue салона ===
    const bpPrice = booking.bpPrice || 0;
    if (booking.paymentStatus === 'escrow' && bpPrice > 0) {
      const salon = await User.findById(req.user._id);
      if (salon) {
        // Убираем из pending, добавляем в revenue
        salon.salonPendingRevenue = Math.max(0, (salon.salonPendingRevenue || 0) - bpPrice);
        salon.salonRevenue = (salon.salonRevenue || 0) + bpPrice;
        salon.salonCompletedBookings = (salon.salonCompletedBookings || 0) + 1;
        await salon.save();
        
        console.log(`💰 BP Released: ${bpPrice} BP -> ${salon.salonName} (Total: ${salon.salonRevenue} BP)`);
      }
      booking.paymentStatus = 'released';
    }
    
    await booking.save();
    
    console.log(`✅ Бронирование подтверждено салоном: ${bookingCode}`);
    
    res.json({ 
      success: true,
      message: `ჯავშანი დადასტურებულია ✓ ${bpPrice} BP ჩაირიცხა თქვენს ანგარიშზე`,
      booking: {
        bookingCode: booking.bookingCode,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        confirmedAt: booking.confirmedAt,
        bpEarned: bpPrice
      }
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// САЛОН: Завершить бронирование (услуга оказана)
app.post('/api/salon-owner/complete-booking', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { bookingCode } = req.body;
    
    const booking = await Booking.findOne({ 
      bookingCode,
      salonId: req.user._id
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'ჯავშანი ვერ მოიძებნა' });
    }
    
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'ჯავშანი ჯერ არ არის დადასტურებული' });
    }
    
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();
    
    console.log(`✅ Услуга оказана: ${bookingCode}`);
    
    res.json({ 
      success: true,
      message: 'პროცედურა დასრულებულია ✓',
      booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Отметить неявку клиента
app.post('/api/salon-owner/no-show', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { bookingCode } = req.body;
    
    const booking = await Booking.findOne({ 
      bookingCode,
      salonId: req.user._id
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'ჯავშანი ვერ მოიძებნა' });
    }
    
    booking.status = 'no-show';
    await booking.save();
    
    console.log(`❌ Клиент не пришел: ${bookingCode}`);
    
    res.json({ 
      success: true,
      message: 'კლიენტი არ გამოცხადდა',
      booking
    });
  } catch (error) {
    console.error('No-show error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// САЛОН: Получить бронирования салона
app.get('/api/salon-owner/my-bookings', authMiddleware, async (req, res) => {
  try {
    if (req.user.userType !== 'salon') {
      return res.status(403).json({ message: 'Только для владельцев салонов' });
    }
    
    const { date, status } = req.query;
    let query = { salonId: req.user._id };
    
    if (date) query.date = date;
    if (status) query.status = status;
    
    const bookings = await Booking.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ dateTime: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Salon bookings error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// АДМИН: Получить все бронирования с расширенной информацией
app.get('/api/admin/all-bookings', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { status, date } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (date) query.date = date;
    
    const bookings = await Booking.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('confirmedBy', 'salonName email')
      .sort({ createdAt: -1 })
      .limit(500);
    
    res.json(bookings);
  } catch (error) {
    console.error('Admin all bookings error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// АДМИН: Статистика бронирований
app.get('/api/admin/booking-stats', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const noShowBookings = await Booking.countDocuments({ status: 'no-show' });
    
    // За сегодня
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = await Booking.countDocuments({ date: today });
    const todayCompleted = await Booking.countDocuments({ date: today, status: 'completed' });
    
    // Общий оборот в BP
    const allBookings = await Booking.find({ status: 'completed' });
    const totalBPEarned = allBookings.reduce((sum, b) => sum + (b.bpPrice || 0), 0);
    
    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      todayBookings,
      todayCompleted,
      totalBPEarned
    });
  } catch (error) {
    console.error('Admin booking stats error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// MESSENGER API - ЧАТ МЕЖДУ КЛИЕНТАМИ И САЛОНАМИ
// ======================================

// Получить список чатов для пользователя
app.get('/api/messages/chats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.userType === 'salon' ? 'salon' : 'client';
    
    // Находим все сообщения где пользователь участник
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ createdAt: -1 });
    
    // Группируем по собеседникам
    const chatsMap = new Map();
    
    for (const msg of messages) {
      const partnerId = msg.senderId.toString() === userId.toString() 
        ? msg.receiverId.toString() 
        : msg.senderId.toString();
      
      if (!chatsMap.has(partnerId)) {
        // Получаем инфо о собеседнике
        const partner = await User.findById(partnerId).select('firstName lastName salonName email phone userType');
        if (partner) {
          const unreadCount = await Message.countDocuments({
            senderId: partnerId,
            receiverId: userId,
            isRead: false
          });
          
          chatsMap.set(partnerId, {
            partnerId,
            partnerName: partner.userType === 'salon' ? partner.salonName : `${partner.firstName} ${partner.lastName}`,
            partnerType: partner.userType === 'salon' ? 'salon' : 'client',
            partnerPhone: partner.phone,
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt,
            unreadCount
          });
        }
      }
    }
    
    const chats = Array.from(chatsMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
    
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить сообщения с конкретным пользователем
app.get('/api/messages/:partnerId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const partnerId = req.params.partnerId;
    
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 }).limit(100);
    
    // Помечаем входящие как прочитанные
    await Message.updateMany(
      { senderId: partnerId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    // Получаем инфо о партнере
    const partner = await User.findById(partnerId).select('firstName lastName salonName phone userType');
    
    res.json({
      partner: {
        id: partnerId,
        name: partner?.userType === 'salon' ? partner.salonName : `${partner?.firstName} ${partner?.lastName}`,
        phone: partner?.phone,
        type: partner?.userType === 'salon' ? 'salon' : 'client'
      },
      messages: messages.map(m => ({
        id: m._id,
        message: m.message,
        senderId: m.senderId,
        isOwn: m.senderId.toString() === userId.toString(),
        createdAt: m.createdAt,
        isRead: m.isRead
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отправить сообщение
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { receiverId, message, bookingId } = req.body;
    
    if (!receiverId || !message) {
      return res.status(400).json({ message: 'მიმღები და შეტყობინება სავალდებულოა' });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({ message: 'შეტყობინება ძალიან გრძელია (მაქს. 1000 სიმბოლო)' });
    }
    
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'მიმღები ვერ მოიძებნა' });
    }
    
    const sender = req.user;
    const senderType = sender.userType === 'salon' ? 'salon' : 'client';
    const receiverType = receiver.userType === 'salon' ? 'salon' : 'client';
    
    const newMessage = new Message({
      senderId: sender._id,
      senderType,
      senderName: senderType === 'salon' ? sender.salonName : `${sender.firstName} ${sender.lastName}`,
      receiverId: receiver._id,
      receiverType,
      message: message.trim(),
      bookingId: bookingId || null
    });
    
    await newMessage.save();
    
    res.status(201).json({
      success: true,
      message: {
        id: newMessage._id,
        message: newMessage.message,
        senderId: newMessage.senderId,
        isOwn: true,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Количество непрочитанных сообщений
app.get('/api/messages/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить чат с пользователем
app.delete('/api/messages/chat/:partnerId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const partnerId = req.params.partnerId;
    
    // Удаляем все сообщения между этими двумя пользователями
    await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    });
    
    res.json({ success: true, message: 'ჩატი წაშლილია' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Начать чат с салоном (для клиентов)
app.post('/api/messages/start-chat', authMiddleware, async (req, res) => {
  try {
    const { salonId, initialMessage } = req.body;
    
    if (req.user.userType === 'salon') {
      return res.status(400).json({ message: 'სალონებს არ შეუძლიათ ჩატის დაწყება' });
    }
    
    const salon = await User.findOne({ _id: salonId, userType: 'salon' });
    if (!salon) {
      return res.status(404).json({ message: 'სალონი ვერ მოიძებნა' });
    }
    
    // Создаем первое сообщение если есть
    if (initialMessage) {
      const message = new Message({
        senderId: req.user._id,
        senderType: 'client',
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        receiverId: salon._id,
        receiverType: 'salon',
        message: initialMessage.trim()
      });
      await message.save();
    }
    
    res.json({
      success: true,
      chatPartnerId: salon._id,
      partnerName: salon.salonName,
      partnerPhone: salon.phone
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// ПОДКЛЮЧЕНИЕ РОУТОВ
// ======================================
app.use('/api/community', communityRoutes);
app.use('/api/ai', aiRoutes);

// ======================================
// КАРТА САЛОНОВ - API ENDPOINTS
// ======================================

// 1. Получить все салоны для карты
app.get('/api/map/salons', async (req, res) => {
  try {
    const { category, rating, search } = req.query;
    
    let query = { isActive: { $ne: false } };
    
    // Фильтр по категории
    if (category) {
      query.categories = category;
    }
    
    // Фильтр по рейтингу
    if (rating) {
      query.averageRating = { $gte: parseFloat(rating) };
    }
    
    // Поиск по названию
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const salons = await Salon.find(query)
      .populate('ownerId', 'salonName phone salonDescription')
      .select('name address coordinates phone averageRating totalReviews services categories salonPhotoUrl photos rating workingHours')
      .lean();
    
    const salonsForMap = salons.map(s => ({
      id: s._id,
      name: s.name,
      address: s.address,
      coordinates: s.coordinates || { lat: 41.7151, lng: 44.8271 },
      phone: s.phone || s.ownerId?.phone || '',
      rating: s.averageRating || s.rating || 0,
      reviewCount: s.totalReviews || 0,
      services: s.services || [],
      categories: s.categories || [],
      photo: s.salonPhotoUrl || (s.photos && s.photos[0]) || '',
      workingHours: s.workingHours || null,
      description: s.ownerId?.salonDescription || ''
    }));
    
    res.json(salonsForMap);
  } catch (error) {
    console.error('Map salons error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 2. Получить детальную информацию о салоне
app.get('/api/map/salon/:id', async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('ownerId', 'salonName phone salonDescription email')
      .populate('reviews.userId', 'firstName lastName')
      .lean();
    
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    // Получаем специалистов салона
    const specialists = await Specialist.find({ 
      salonId: salon.ownerId?._id, 
      isActive: true 
    }).select('name position services photoUrl rating').lean();
    
    // Получаем услуги салона
    const services = await Service.find({ 
      ownerId: salon.ownerId?._id 
    }).select('name category bpPrice price durationMinutes description').lean();
    
    res.json({
      id: salon._id,
      name: salon.name,
      address: salon.address,
      coordinates: salon.coordinates || { lat: 41.7151, lng: 44.8271 },
      phone: salon.phone || salon.ownerId?.phone || '',
      email: salon.ownerId?.email || '',
      description: salon.description || salon.ownerId?.salonDescription || '',
      rating: salon.averageRating || salon.rating || 0,
      reviewCount: salon.totalReviews || 0,
      photo: salon.salonPhotoUrl || (salon.photos && salon.photos[0]) || '',
      photos: salon.photos || [],
      workingHours: salon.workingHours || null,
      categories: salon.categories || [],
      reviews: (salon.reviews || []).map(r => ({
        userName: r.userName || (r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : 'ანონიმი'),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt
      })),
      specialists: specialists.map(sp => ({
        id: sp._id,
        name: sp.name,
        position: sp.position,
        services: sp.services,
        photo: sp.photoUrl || '/images/default-avatar.svg',
        rating: sp.rating || 0
      })),
      services: services.map(sv => ({
        id: sv._id,
        name: sv.name,
        category: sv.category,
        bpPrice: sv.bpPrice,
        price: sv.price,
        duration: sv.durationMinutes,
        description: sv.description
      }))
    });
  } catch (error) {
    console.error('Salon details error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 3. Получить слоты салона для календаря
app.get('/api/map/salon/:id/slots', async (req, res) => {
  try {
    const { date, specialistId } = req.query;
    const salon = await Salon.findById(req.params.id);
    
    if (!salon || !salon.ownerId) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    let query = { 
      salonId: salon.ownerId, 
      isBooked: false 
    };
    
    if (date) {
      query.date = date;
    } else {
      // Только будущие слоты (следующие 7 дней)
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query.date = { $gte: today, $lte: nextWeek };
    }
    
    if (specialistId) {
      query.specialistId = specialistId;
    }
    
    const slots = await Slot.find(query)
      .populate('specialistId', 'name position photoUrl')
      .sort({ date: 1, time: 1 })
      .limit(100)
      .lean();
    
    // Группируем слоты по дате
    const groupedSlots = {};
    slots.forEach(slot => {
      if (!groupedSlots[slot.date]) {
        groupedSlots[slot.date] = [];
      }
      groupedSlots[slot.date].push({
        id: slot._id,
        time: slot.time,
        specialist: slot.specialistId ? {
          id: slot.specialistId._id,
          name: slot.specialistId.name,
          position: slot.specialistId.position,
          photo: slot.specialistId.photoUrl
        } : null
      });
    });
    
    res.json(groupedSlots);
  } catch (error) {
    console.error('Salon slots error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 4. Добавить отзыв о салоне (только авторизованные пользователи)
app.post('/api/map/salon/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'რეიტინგი უნდა იყოს 1-დან 5-მდე' });
    }
    
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ message: 'სალონი ვერ მოიძებნა' });
    }
    
    // Инициализируем массив отзывов если его нет
    if (!salon.reviews) {
      salon.reviews = [];
    }
    
    // Проверяем, не оставлял ли пользователь уже отзыв
    const existingReview = salon.reviews.find(
      r => r.userId?.toString() === req.user._id.toString()
    );
    
    if (existingReview) {
      return res.status(400).json({ message: 'თქვენ უკვე დატოვეთ მიმოხილვა' });
    }
    
    // Добавляем отзыв
    salon.reviews.push({
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      rating: parseInt(rating),
      comment: comment?.trim() || '',
      createdAt: new Date()
    });
    
    // Пересчитываем средний рейтинг
    const totalRating = salon.reviews.reduce((sum, r) => sum + r.rating, 0);
    salon.averageRating = Math.round((totalRating / salon.reviews.length) * 10) / 10;
    salon.totalReviews = salon.reviews.length;
    
    await salon.save();
    
    res.json({ 
      success: true,
      message: 'მიმოხილვა დამატებულია',
      averageRating: salon.averageRating,
      totalReviews: salon.totalReviews
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 5. Обновить координаты салона (админ или владелец)
app.put('/api/admin/salon/:id/coordinates', authMiddleware, async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    
    // Проверяем права (админ или владелец салона)
    const isOwner = salon.ownerId?.toString() === req.user._id.toString();
    if (!req.user.isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const { lat, lng, address, phone, workingHours, categories, description } = req.body;
    
    if (lat && lng) {
      salon.coordinates = { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng) 
      };
    }
    
    if (address) salon.address = address;
    if (phone) salon.phone = phone;
    if (description) salon.description = description;
    if (categories) salon.categories = categories;
    if (workingHours) salon.workingHours = workingHours;
    
    await salon.save();
    
    res.json({ 
      success: true,
      message: 'Данные салона обновлены', 
      salon: {
        id: salon._id,
        name: salon.name,
        address: salon.address,
        coordinates: salon.coordinates,
        phone: salon.phone
      }
    });
  } catch (error) {
    console.error('Update salon error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 6. Получить категории услуг
app.get('/api/map/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'nails', name: 'ფრჩხილები', nameEn: 'Nails', icon: '💅' },
      { id: 'hair', name: 'თმა', nameEn: 'Hair', icon: '💇' },
      { id: 'face', name: 'სახე', nameEn: 'Face', icon: '🧖' },
      { id: 'body', name: 'სხეული', nameEn: 'Body', icon: '💆' },
      { id: 'makeup', name: 'მაკიაჟი', nameEn: 'Makeup', icon: '💄' },
      { id: 'spa', name: 'სპა', nameEn: 'Spa', icon: '🧘' }
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ======================================
// ЗАПУСК СЕРВЕР
// ======================================

app.listen(port, () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
  console.log(`🌐 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  console.log(`📁 Папка public: ${publicPath}`);
  console.log(`📁 Папка uploads: ${uploadsPath}`);
  console.log('✅ MongoDB подключена успешно');
  console.log('✅ Сервер готов к работе!');
});