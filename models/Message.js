// models/Message.js - Модель сообщений между клиентами и салонами
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    // Отправитель
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    senderType: {
        type: String,
        enum: ['client', 'salon'],
        required: true
    },
    
    senderName: {
        type: String,
        required: true
    },
    
    // Получатель
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    receiverType: {
        type: String,
        enum: ['client', 'salon'],
        required: true
    },
    
    // Сообщение
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    
    // Прочитано ли
    isRead: {
        type: Boolean,
        default: false
    },
    
    readAt: {
        type: Date
    },
    
    // Связанное бронирование (опционально)
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }
    
}, { timestamps: true });

// Индексы для быстрого поиска
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
MessageSchema.index({ createdAt: -1 });

// Виртуальное поле для получения ID чата
MessageSchema.virtual('chatId').get(function() {
    const ids = [this.senderId.toString(), this.receiverId.toString()].sort();
    return ids.join('_');
});

module.exports = mongoose.model('Message', MessageSchema);
