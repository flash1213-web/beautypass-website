// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    personalNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    balance: { type: Number, default: 0 },
    registeredDate: { type: Date, default: Date.now },
    purchases: [{
        id: Number,
        package: String,
        price: Number,
        date: Date,
        visitsLeft: Number
    }],
    cards: [{
        id: Number,
        number: String,
        expiry: String,
        cvv: String
    }]
});

module.exports = mongoose.model('User', UserSchema);