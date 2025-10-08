// models/Salon.js
const mongoose = require('mongoose');

const SalonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    services: [String], // Названия услуг для отображения
    address: { type: String, required: true },
    rating: { type: Number, required: true, default: 0 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salonPhotoUrl: { type: String, default: '' } // Добавим поле для фото
});

module.exports = mongoose.model('Salon', SalonSchema);