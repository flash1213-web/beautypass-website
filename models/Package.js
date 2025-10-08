// models/Package.js
const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    // <<<< МЕНЯЕМ ПОЛЕ "visits" НА "tokens" >>>>
    tokens: { type: Number, required: true }, // Количество токенов в пакете
    description: { type: String, required: true },
    features: [String],
    popular: { type: Boolean, default: false }
});

module.exports = mongoose.model('Package', PackageSchema);