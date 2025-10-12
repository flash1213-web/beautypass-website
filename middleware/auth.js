const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      // Добавил лог для отладки
      console.log('Ошибка аутентификации: Токен не предоставлен в заголовке Authorization.');
      return res.status(401).json({ message: 'ტოკენი არ არის, წვდომა აკრძალულია' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      // Добавил лог для отладки
      console.log('Ошибка аутентификации: Пользователь для данного токена не найден.');
      return res.status(401).json({ message: 'მომხმარებელი არ მოიძებნა' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации (невалидный токен):', error.message);
    return res.status(401).json({ message: 'არასწორი ტოკენი' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Доступ запрещен: недостаточно прав' });
  }
  next();
};

const salonOwnerMiddleware = (req, res, next) => {
  if (!req.user || req.user.userType !== 'salon') {
    return res.status(403).json({ message: 'Доступ запрещен: для владельцев салонов' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  salonOwnerMiddleware
};