// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    // ID пользователя, который сделал запись
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // ID и название салона
    salonId: { type: Number, required: true },
    salonName: { type: String, required: true },
    
    // Выбранная услуга
    service: { type: String, required: true },
    
    // Дата и время записи
    dateTime: { type: Date, required: true },
    
    // Статус записи (запланирована, завершена, отменена)
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    
    // Когда запись была создана
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);