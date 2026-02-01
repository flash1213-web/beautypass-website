// models/Specialist.js - Модель специалиста
const mongoose = require('mongoose');

const SpecialistSchema = new mongoose.Schema({
    // Салон, к которому принадлежит специалист
    salonId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // Данные специалиста
    name: { 
        type: String, 
        required: true 
    },
    
    // Фото специалиста
    photoUrl: { 
        type: String 
    },
    
    // Специализация/должность
    position: { 
        type: String 
    },
    
    // Описание/био
    description: { 
        type: String 
    },
    
    // Услуги, которые оказывает специалист
    services: [{
        name: { type: String, required: true },
        category: { 
            type: String, 
            enum: ['nails', 'hair', 'face', 'body', 'makeup', 'other'],
            default: 'other'
        },
        duration: { type: Number, default: 30 }, // в минутах
        bpPrice: { type: Number, default: 10 },  // цена в BP
        price: { type: Number }                   // цена в GEL
    }],
    
    // Рабочие дни и часы
    workingHours: {
        monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
        sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
    },
    
    // Отзывы о специалисте
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now }
    }],
    
    // Средний рейтинг
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    
    // Активен ли специалист
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Specialist', SpecialistSchema);
