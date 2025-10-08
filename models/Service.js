// models/Service.js
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    durationMinutes: { type: Number, required: true }, // Длительность в минутах
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Кому принадлежит эта услуга
});

module.exports = mongoose.model('Service', ServiceSchema);