// models/slot.js - Модель временных слотов для записи
const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
    salonId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Ссылка на владельца салона (User с userType: salon)
        required: [true, 'ID салона обязателен'] 
    },
    
    salonName: {
        type: String,
        required: [true, 'Название салона обязательно']
    },
    
    // Специалист
    specialistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialist'
    },
    
    specialistName: {
        type: String
    },
    
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    },
    
    serviceName: {
        type: String,
        required: [true, 'Название услуги обязательно']
    },
    
    serviceCategory: {
        type: String
    },
    
    date: { 
        type: String, 
        required: [true, 'Дата обязательна'] 
    }, // Дата в формате YYYY-MM-DD
    
    time: { 
        type: String,
        required: [true, 'Время обязательно']
    }, // Время: "10:00"
    
    duration: {
        type: Number,
        default: 30
    }, // Длительность в минутах
    
    bpPrice: {
        type: Number,
        default: 10
    }, // Цена в BP
    
    isBooked: {
        type: Boolean,
        default: false
    },
    
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }
    
}, { timestamps: true });

// Индекс для быстрого поиска свободных слотов
SlotSchema.index({ salonId: 1, date: 1, isBooked: 1 });

module.exports = mongoose.model('Slot', SlotSchema);