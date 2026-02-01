// payment-routes.js
const express = require('express');
const path = require('path');
const router = express.Router();
const crypto = require('crypto');

// Правильное подключение модели
const Transaction = require(path.join(__dirname, 'models', 'Transaction.js'));

// Вебхук для проверки подписи от TBC
router.post('/webhook/tbc', async (req, res) => {
  try {
    const { order_id, status, amount, signature } = req.body;

    // Проверяем подпись
    const hmac = crypto
      .createHmac('sha256', process.env.TBC_SECRET_KEY)
      .update(`${order_id}${status}${amount}`)
      .digest('hex');

    if (hmac !== signature) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const transaction = await Transaction.findOne({ transactionId: order_id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (status === 'OK') {
      transaction.status = 'success';
      const User = require(path.join(__dirname, 'models', 'User.js')); // Подключаем модель User здесь
      const user = await User.findById(transaction.userId);
      if (user) {
        user.balance += transaction.amount;
        await user.save();
      }
    } else {
      transaction.status = 'failed';
    }

    await transaction.save();
    res.json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;