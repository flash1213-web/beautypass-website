require('dotenv/config');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const Booking = require('./models/Booking');
  
  const user = await User.findOne({email: 'a.muradiani26@gmail.com'});
  console.log('User ID:', user._id.toString());
  
  // Обновим ВСЕ бронирования напрямую через коллекцию
  const result = await mongoose.connection.db.collection('bookings').updateMany(
    {},
    { $set: { clientId: user._id } }
  );
  console.log('Updated bookings:', result.modifiedCount);
  
  // Проверяем
  const allBookings = await Booking.find();
  console.log('\nAll bookings after update:');
  allBookings.forEach(b => {
    console.log('  -', b.status, '| clientId:', b.clientId ? b.clientId.toString() : 'NULL');
  });
  
  // Считаем confirmed+completed
  const count = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
  user.totalBookings = count;
  await user.save();
  console.log('\nUser totalBookings updated to:', user.totalBookings);
  
  mongoose.disconnect();
});
