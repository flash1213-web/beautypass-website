// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    personalNumber: { type: String, required: false, unique: true, sparse: true },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    twoFACode: { type: String },
    twoFACodeExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    purchases: [{
        id: Number,
        package: String,
        price: Number,
        date: Date,
        visitsLeft: Number
    }],
    cards: [{
        number: String,
        expiry: String,
        cvv: String,
        id: Number
    }],
    isAdmin: { type: Boolean, default: false },
    userType: { type: String, enum: ['client', 'salon'], required: true, default: 'client' },
    salonName: { type: String, default: '' },
    address: { type: String, default: '' },
    salonDescription: { type: String, default: '' },
    salonPhotoUrl: { type: String, default: '' }
});

module.exports = mongoose.model('User', UserSchema);