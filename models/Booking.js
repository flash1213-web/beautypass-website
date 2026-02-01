// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    // ID пользователя, который сделал запись
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // ID и название салона
    salonId: { type: mongoose.Schema.Types.Mixed },
    salonName: { type: String },
    
    // Специалист
    specialistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialist' },
    specialistName: { type: String },
    
    // Слот
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
    
    // Выбранная услуга
    service: { type: String },
    serviceName: { type: String },
    serviceCategory: { type: String },
    
    // Дата и время записи
    date: { type: String },
    time: { type: String },
    dateTime: { type: Date },
    duration: { type: Number, default: 30 },
    
    // Цена в BP
    bpPrice: { type: Number },
    
    // Данные клиента
    userEmail: { type: String },
    userName: { type: String },
    userPhone: { type: String },
    clientName: { type: String },
    clientEmail: { type: String },
    clientPhone: { type: String },
    
    // Код бронирования
    bookingCode: { type: String },
    
    // Статус записи
    status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'booked'], default: 'scheduled' },
    
    // Когда запись была создана
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);