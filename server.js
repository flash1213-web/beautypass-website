// ==================== ИНИЦИАЛИЗАЦИЯ И НАСТРОЙКА ====================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const axios = require('axios'); // <-- ДОБАВИТЬ ЭТУ СТРОКУ

// Подключаем модели
const User = require('./models/User');
const Booking = require('./models/Booking');
const Package = require('./models/Package');
const Salon = require('./models/Salon');
const Service = require('./models/Service');
const Transaction = require('./models/Transaction');

// Подключаем middleware
const { authMiddleware, adminMiddleware, salonOwnerMiddleware } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000; // Берем порт из переменной окружения Render

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена успешно'))
  .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== MULTER НАСТРОЙКА ====================
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
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

// ==================== ПУБЛИЧНЫЕ МАРШРУТЫ ====================
app.get('/api/status', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

app.get('/api/check-availability', async (req, res) => {
  try {
    const { type, value } = req.query;
    if (!type || !value) return res.status(400).json({ message: 'Неверный запрос' });

    let user;
    if (type === 'email') user = await User.findOne({ login: value });
    else if (type === 'phone') user = await User.findOne({ phone: value });
    else if (type === 'personalId') user = await User.findOne({ personalNumber: value });
    else return res.status(400).json({ message: 'Неверный тип проверки' });

    if (user) res.json({ available: false, message: 'უკვე დაკავებულია' });
    else res.json({ available: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.get('/api/salons', async (req, res) => {
  try {
    const salons = await Salon.find().populate('ownerId', 'firstName lastName');

    const salonsWithServices = await Promise.all(
      salons.map(async (salon) => {
        if (salon.ownerId) {
          const services = await Service.find({ ownerId: salon.ownerId._id });
          return {
            ...salon.toObject(),
            services: services.map(service => service.name),
            hasDetailedServices: true
          };
        } else {
          return {
            ...salon.toObject(),
            hasDetailedServices: false
          };
        }
      })
    );

    res.json(salonsWithServices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.get('/api/salons/:id/services', async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }

    if (salon.ownerId) {
      const services = await Service.find({ ownerId: salon.ownerId });
      res.json(services);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

// ==================== АУТЕНТИФИКАЦИЯ ====================
app.post('/api/register', async (req, res) => {
  try {
    const { login, personalNumber, password, phone, firstName, lastName, userType } = req.body;
    
    if (await User.findOne({ login })) 
      return res.status(400).json({ message: 'მომხმარებელი ამ ლოგინით უკვე არსებობს' });
    
    if (await User.findOne({ personalNumber })) 
      return res.status(400).json({ message: 'მომხმარებელი ამ პირადი ნომრით უკვე არსებობს' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      login, personalNumber, password: hashedPassword, phone, 
      firstName, lastName, userType 
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const userPayload = {
      id: user._id.toString(),
      login: user.login,
      personalNumber: user.personalNumber,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      balance: user.balance,
      purchases: user.purchases,
      cards: user.cards,
      isAdmin: user.isAdmin,
      userType: user.userType
    };
    
    res.status(201).json({ message: 'რეგისტრაცია წარმატებით განხორციელდა!', token, user: userPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ personalNumber: login });
    
    if (!user) 
      return res.status(400).json({ message: 'არასწორი პირადი ნომერი ან პაროლი' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) 
      return res.status(400).json({ message: 'არასწორი პირადი ნომერი ან პაროლი' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const userPayload = {
      id: user._id.toString(),
      login: user.login,
      personalNumber: user.personalNumber,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      balance: user.balance,
      purchases: user.purchases,
      cards: user.cards,
      isAdmin: user.isAdmin,
      userType: user.userType,
      salonName: user.salonName,
      address: user.address,
      salonDescription: user.salonDescription,
      salonPhotoUrl: user.salonPhotoUrl
    };
    
    res.json({ token, user: userPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.get('/api/profile', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ==================== ПОЛЬЗОВАТЕЛЬСКИЕ МАРШРУТЫ ====================
app.post('/api/packages/buy', authMiddleware, async (req, res) => {
  try {
    const { packageId } = req.body;
    const user = req.user;
    const pkg = await Package.findById(packageId);
    
    if (!pkg) 
      return res.status(404).json({ message: 'პაკეტი არ მოიძებნა' });
    
    if (user.balance < pkg.price) 
      return res.status(400).json({ message: 'არასაკმარისი ბალანსი.' });

    user.balance -= pkg.price;
    user.purchases.push({
      id: Date.now(),
      package: pkg.name,
      price: pkg.price,
      date: new Date(),
      visitsLeft: pkg.tokens
    });
    
    await user.save();
    res.json({ message: 'პაკეტი წარმატებით შეძენილია!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.post('/api/balance/add', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;
    
    if (amount <= 0) 
      return res.status(400).json({ message: 'თანხა უნდა იყოს დადებითი' });

    user.balance += amount;
    await user.save();
    res.json({ message: 'ბალანსი წარმატებით შეივსა!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { salonId, salonName, service, dateTime } = req.body;
    const user = req.user;

    const activePackage = user.purchases.find(p => p.visitsLeft > 0);
    
    if (!activePackage) 
      return res.status(400).json({ message: 'არ გაქვთ ხელმისაწვდომი ვიზიტები.' });

    const newBooking = new Booking({ 
      userId: user._id, salonId, salonName, service, 
      dateTime: new Date(dateTime) 
    });
    
    await newBooking.save();
    
    const packageIndex = user.purchases.findIndex(p => p.id === activePackage.id);
    user.purchases[packageIndex].visitsLeft -= 1;
    await user.save();

    res.status(201).json({ 
      message: 'თქვენ წარმატებით დაიჯავშნეთ!', 
      booking: newBooking, 
      updatedUser: user 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ userId }).sort({ dateTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

// ==================== МАРШРУТЫ ВЛАДЕЛЬЦА САЛОНА ====================
app.get('/api/salon-owner/services', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ ownerId: req.user._id });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.post('/api/salon-owner/services', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const newService = new Service({ ...req.body, ownerId: req.user._id });
    await newService.save();
    await updateSalonServices(req.user._id);
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.put('/api/salon-owner/services/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, ownerId: req.user._id });
    
    if (!service) 
      return res.status(404).json({ message: 'Услуга не найдена' });
    
    Object.assign(service, req.body);
    await service.save();
    await updateSalonServices(req.user._id);
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.delete('/api/salon-owner/services/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try {
    const result = await Service.deleteOne({ _id: req.params.id, ownerId: req.user._id });
    
    if (result.deletedCount === 0) 
      return res.status(404).json({ message: 'Услуга не найдена' });
    
    await updateSalonServices(req.user._id);
    res.json({ message: 'Услуга удалена' });
  } catch (error) {
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});

app.put('/api/salon-owner/profile', authMiddleware, salonOwnerMiddleware, upload.single('salonPhoto'), async (req, res) => {
  try {
    const { salonName, address, salonDescription, phone } = req.body;

    let salonPhotoUrl = req.body.salonPhotoUrl;
    if (req.file) {
      salonPhotoUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { salonName, address, salonDescription, salonPhotoUrl, phone },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const services = await Service.find({ ownerId: req.user._id });
    const serviceNames = services.map(service => service.name);

    let salon = await Salon.findOne({ ownerId: req.user._id });

    if (salon) {
      salon.name = updatedUser.salonName;
      salon.address = updatedUser.address;
      salon.salonPhotoUrl = updatedUser.salonPhotoUrl;
      salon.services = serviceNames;
      await salon.save();
    } else {
      const newSalon = new Salon({
        name: updatedUser.salonName,
        address: updatedUser.address,
        services: serviceNames,
        rating: 0,
        ownerId: req.user._id,
        salonPhotoUrl: updatedUser.salonPhotoUrl
      });
      await newSalon.save();
    }

    const userPayload = {
      id: updatedUser._id.toString(),
      login: updatedUser.login,
      personalNumber: updatedUser.personalNumber,
      phone: updatedUser.phone,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      balance: updatedUser.balance,
      purchases: updatedUser.purchases,
      cards: updatedUser.cards,
      isAdmin: updatedUser.isAdmin,
      userType: updatedUser.userType,
      salonName: updatedUser.salonName,
      address: updatedUser.address,
      salonDescription: updatedUser.salonDescription,
      salonPhotoUrl: updatedUser.salonPhotoUrl,
    };

    res.json({ message: 'Профиль успешно обновлен!', user: userPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля' });
  }
});

// ==================== АДМИН МАРШРУТЫ ====================
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/admin/packages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/admin/packages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPackage) return res.status(404).json({ message: 'Пакет не найден' });
    res.json(updatedPackage);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/packages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    if (!deletedPackage) return res.status(404).json({ message: 'Пакет не найден' });
    res.json({ message: 'Пакет успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/admin/salons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const salons = await Salon.find();
    res.json(salons);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/admin/salons', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const newSalon = new Salon(req.body);
    await newSalon.save();
    res.status(201).json(newSalon);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/admin/salons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updatedSalon = await Salon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSalon) return res.status(404).json({ message: 'Салон не найден' });
    res.json(updatedSalon);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/salons/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedSalon = await Salon.findByIdAndDelete(req.params.id);
    if (!deletedSalon) return res.status(404).json({ message: 'Салон не найден' });
    res.json({ message: 'Салон успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/admin/bookings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName login personalNumber')
      .sort({ dateTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/admin/bookings/:id/cancel', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) 
      return res.status(404).json({ message: 'Запись не найдена' });
    
    if (booking.status !== 'scheduled') 
      return res.status(400).json({ message: 'Эту запись уже нельзя отменить' });

    const user = await User.findById(booking.userId);
    if (user) {
      const lastPurchase = user.purchases
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .find(p => p.visitsLeft >= 0);

      if (lastPurchase) {
        lastPurchase.visitsLeft += 1;
        await user.save();
      }
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Запись успешно отменена, визит возвращен пользователю.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== ПЛАТЕЖИ ====================
app.post('/api/transactions/create', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body; // Пока работаем только с TBC
    const userId = req.user._id;

    // 1. Создаем транзакцию у себя в базе со статусом 'pending'
    const transaction = new Transaction({
      transactionId: `BP_${Date.now()}_${userId}`,
      userId,
      amount,
      bank: 'tbc',
      status: 'pending'
    });
    await transaction.save();

    // 2. Готовим запрос к TBC iPay API
    // !!! ВАЖНО: URL и поля в теле запроса могут отличаться. ПРОВЕРЬТЕ В ДОКУМЕНТАЦИИ TBC !!!
    const tbcpaymentData = {
      amount: amount * 100, // TBC часто требует сумму в тетри (в копейках)
      currency: 'GEL',
      // language: 'ka', // Язык страницы оплаты
      order_id: transaction.transactionId,
      description: `Пополнение баланса BeautyPass на сумму ${amount} GEL`,
      // callback_url: `https://beautypass-website.onrender.com/api/payments/tbc-callback` // URL для уведомлений от TBC
    };

    // 3. Отправляем запрос на сервер TBC
   // ... внутри app.post('/api/transactions/create', ...)

// ... внутри app.post('/api/transactions/create', ...)

console.log('Отправляю запрос в TBC с авторизацией через Bearer token...');
const response = await axios.post(
  process.env.TBC_API_URL, // 'https://api.tbcbank.ge/v1/tpay/payments'
  tbcpaymentData,
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TBC_IPAY_KEY}` // <-- МЕНЯЕМ СПОСОБ АВТОРИЗАЦИИ
    }
    // Блок auth: { ... } полностью удаляем
  }
);

    // 4. Получаем ответ от TBC
    const paymentUrl = response.data.payment_url; // <-- ПРОВЕРЬТЕ, КАК НАЗЫВАЕТСЯ ПОЛЕ С URL В ОТВЕТЕ

    if (!paymentUrl) {
        throw new Error('TBC не вернул ссылку на оплату');
    }

    // 5. Отправляем ссылку на фронтенд
    res.status(201).json({
      transactionId: transaction.transactionId,
      paymentUrl: paymentUrl,
      status: transaction.status
    });

  } catch (error) {
    console.error('Ошибка при создании платежа в TBC:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Не удалось создать платеж. Попробуйте еще раз.' });
  }
});
// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
async function updateSalonServices(ownerId) {
  try {
    const services = await Service.find({ ownerId });
    const serviceNames = services.map(service => service.name);

    await Salon.findOneAndUpdate(
      { ownerId },
      { services: serviceNames },
      { new: true }
    );
  } catch (error) {
    console.error('Ошибка обновления услуг салона:', error);
  }
}

// ==================== ЗАПУСК СЕРВЕРА (В САМОМ КОНЦЕ ФАЙЛА) ====================
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
});