// admin-routes.js
const express = require('express');
const path = require('path');
const router = express.Router();

// Правильное подключение middleware и моделей
const { authMiddleware, adminMiddleware } = require(path.join(__dirname, 'middleware', 'auth.js'));
const Package = require(path.join(__dirname, 'models', 'Package.js'));
const Salon = require(path.join(__dirname, 'models', 'Salon.js'));
const Booking = require(path.join(__dirname, 'models', 'Booking.js'));

// Middleware для проверки аутентификации и прав администратора
router.use(authMiddleware);
router.use(adminMiddleware);

// Маршруты для управления пакетами
router.get('/packages', async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/packages', async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/packages/:id', async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updatedPackage) {
      return res.status(404).json({ message: 'Пакет не найден' });
    }
    res.json(updatedPackage);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/packages/:id', async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    if (!deletedPackage) {
      return res.status(404).json({ message: 'Пакет не найден' });
    }
    res.json({ message: 'Пакет успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршруты для управления салонами
router.get('/salons', async (req, res) => {
  try {
    const salons = await Salon.find();
    res.json(salons);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/salons', async (req, res) => {
  try {
    const newSalon = new Salon(req.body);
    await newSalon.save();
    res.status(201).json(newSalon);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/salons/:id', async (req, res) => {
  try {
    const updatedSalon = await Salon.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updatedSalon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    res.json(updatedSalon);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/salons/:id', async (req, res) => {
  try {
    const deletedSalon = await Salon.findByIdAndDelete(req.params.id);
    if (!deletedSalon) {
      return res.status(404).json({ message: 'Салон не найден' });
    }
    res.json({ message: 'Салон успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршруты для управления записями
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName login personalNumber')
      .sort({ dateTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    if (booking.status !== 'scheduled') {
      return res.status(400).json({ message: 'Эту запись уже нельзя отменить' });
    }
    
    const User = require(path.join(__dirname, 'models', 'User.js')); // Подключаем модель User здесь, чтобы избежать циклической зависимости
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

module.exports = router;