// 1. Подключаем все необходимые библиотеки
require('dotenv').config(); // Загружает переменные из .env файла
const bcrypt = require('bcryptjs'); // Для шифрования паролей
const User = require('./models/User'); // Подключаем нашу модель пользователя
const Booking = require('./models/Booking');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// 2. Создаем приложение Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Подключаемся к базе данных MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена успешно'))
  .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// 4. Настраиваем мидлвэры (промежуточные обработчики)
app.use(express.json()); // Позволяет серверу понимать JSON в запросах
app.use(express.static('public')); // Отдаем файлы из папки 'public' как статические

// Мидлвэр для проверки JWT-токена
// Мидлвэр для проверки JWT-токена
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // --- НОВАЯ ПРОВЕРКА ---
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'ტოკენი არ არის, წვდომა აკრძალულია' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'მომხმარებელი არ მოიძებნა' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'არასწორი ტოკენი' });
  }
};

// 5. Создаем роуты (маршруты) для API

// Тестовый роут
app.get('/api/status', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});
// Роут для проверки доступности логина, телефона или личного номера
app.get('/api/check-availability', async (req, res) => {
    try {
        const { type, value } = req.query;

        if (!type || !value) {
            return res.status(400).json({ message: 'Неверный запрос' });
        }

        let user;
        if (type === 'email') {
            user = await User.findOne({ login: value });
        } else if (type === 'phone') {
            user = await User.findOne({ phone: value });
        } else if (type === 'personalId') {
            user = await User.findOne({ personalNumber: value });
        } else {
            return res.status(400).json({ message: 'Неверный тип проверки' });
        }

        if (user) {
            res.json({ available: false, message: 'უკვე დაკავებულია' });
        } else {
            res.json({ available: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'სერვერის შეცდომა' });
    }
});

// Роут для регистрации
app.post('/api/register', async (req, res) => {
  try {
    const { login, personalNumber, password, phone, firstName, lastName } = req.body;

    const existingUserByLogin = await User.findOne({ login });
    if (existingUserByLogin) {
      return res.status(400).json({ message: 'მომხმარებელი ამ ლოგინით უკვე არსებობს' });
    }

    const existingUserByNumber = await User.findOne({ personalNumber });
    if (existingUserByNumber) {
      return res.status(400).json({ message: 'მომხმარებელი ამ პირადი ნომრით უკვე არსებობს' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      login,
      personalNumber,
      password: hashedPassword,
      phone,
      firstName,
      lastName
    });

    await user.save();

    // --- ГЛАВНОЕ: СОЗДАЕМ И ОТПРАВЛЯЕМ ТОКЕН ---
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userPayload = {
        id: user._id.toString(),
        login: user.login,
        personalNumber: user.personalNumber,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        purchases: user.purchases,
        cards: user.cards
    };

    res.status(201).json({
      message: 'რეგისტრაცია წარმატებით განხორციელდა!',
      token, // <-- ОТПРАВЛЯЕМ ТОКЕН
      user: userPayload
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});
// Роут для входа
app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ personalNumber: login });
    if (!user) {
      return res.status(400).json({ message: 'არასწორი პირადი ნომერი ან პაროლი' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'არასწორი პირადი ნომერი ან პაროლი' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userPayload = {
      id: user._id.toString(),
      login: user.login,
      personalNumber: user.personalNumber,
      phone: user.phone,
      firstName: user.firstName, // <-- ДОБАВИЛИ
      lastName: user.lastName,   // <-- ДОБАВИЛИ
      balance: user.balance,
      purchases: user.purchases,
      cards: user.cards
    };

    res.json({
      token,
      user: userPayload
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'სერვერის შეცდომა' });
  }
});
// Защищенный роут для получения данных профиля
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ================== НОВЫЕ РОУТЫ ==================

// Роут для покупки пакета
app.post('/api/packages/buy', authMiddleware, async (req, res) => {
    try {
        const { packageId } = req.body;
        const user = req.user;

        // Информация о пакетах (в реальном проекте это лучше хранить в БД)
        const packages = [
            { id: 1, name: 'Basic', price: 99, visits: 4 },
            { id: 2, name: 'Standard', price: 179, visits: 8 },
            { id: 3, name: 'Premium', price: 299, visits: 15 },
        ];
        const pkg = packages.find(p => p.id === packageId);

        if (!pkg) {
            return res.status(404).json({ message: 'პაკეტი არ მოიძებნა' });
        }

        if (user.balance < pkg.price) {
            return res.status(400).json({ message: 'არასაკმარისი ბალანსი. გთხოვთ შეავსოთ ანგარიში' });
        }

        // Обновляем пользователя в базе данных
        user.balance -= pkg.price;
        user.purchases.push({
            id: Date.now(),
            package: pkg.name,
            price: pkg.price,
            date: new Date(),
            visitsLeft: pkg.visits
        });

        await user.save();

        res.json({ message: 'პაკეტი წარმატებით შეძენილია!', user: user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'სერვერის შეცდომა' });
    }
});

// Роут для пополнения баланса
app.post('/api/balance/add', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;

        if (amount <= 0) {
            return res.status(400).json({ message: 'თანხა უნდა იყოს დადებითი' });
        }

        user.balance += amount;
        await user.save();

        res.json({ message: 'ბალანსი წარმატებით შეივსა!', user: user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'სერვერის შეცდომა' });
    }
});

// =================================================
// ... ваш существующий код ...

// ================== НОВЫЕ РОУТЫ ДЛЯ ЗАПИСЕЙ ==================

// Роут для создания новой записи
app.post('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { salonId, salonName, service, dateTime } = req.body;
        const user = req.user;

        // --- БИЗНЕС-ЛОГИКА: Ищем активный пакет с визитами ---
        const activePackage = user.purchases.find(p => p.visitsLeft > 0);

        if (!activePackage) {
            return res.status(400).json({ message: 'არ გაქვთ ხელმისაწვდომი ვიზიტები. გთხოვთ შეიძინოთ პაკეტი.' });
        }

        // Создаем новую запись
        const newBooking = new Booking({
            userId: user._id,
            salonId,
            salonName,
            service,
            dateTime: new Date(dateTime), // Преобразуем строку в дату
        });

        await newBooking.save();

        // --- БИЗНЕС-ЛОГИКА: Списываем один визит ---
        // Находим индекс пакета в массиве пользователя
        const packageIndex = user.purchases.findIndex(p => p.id === activePackage.id);
        user.purchases[packageIndex].visitsLeft -= 1;
        
        await user.save();

        res.status(201).json({
            message: 'თქვენ წარმატებით დაიჯავშნეთ!',
            booking: newBooking,
            updatedUser: user // Отправляем обновленные данные пользователя
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'სერვერის შეცდომა' });
    }
});

// Роут для получения всех записей текущего пользователя
app.get('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Ищем все записи для этого пользователя и сортируем по дате
        const bookings = await Booking.find({ userId }).sort({ dateTime: 1 });

        res.json(bookings);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'სერვერის შეცდომა' });
    }
});

// =================================================

// 6. Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Открыть сайт: http://localhost:${PORT}`);
});