// models/SiteSettings.js - Настройки сайта
const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true
    },
    
    // Контактная информация
    phone: { type: String, default: '+995 555 12 34 56' },
    email: { type: String, default: 'info@beautypass.ge' },
    address: { type: String, default: 'თბილისი, რუსთაველის გამზირი 1' },
    workingHours: { type: String, default: 'ორშ-პარ 10:00 - 20:00' },
    
    // Социальные сети
    socialFacebook: { type: String, default: '' },
    socialInstagram: { type: String, default: '' },
    socialTiktok: { type: String, default: '' },
    
    // Юридическая информация
    legalCompanyName: { type: String, default: 'Beauty Pass LLC' },
    legalTaxId: { type: String, default: '' },
    legalTermsUrl: { type: String, default: '' },
    legalPrivacyUrl: { type: String, default: '' },
    
    // SEO
    seoTitle: { type: String, default: 'Beauty Pass - თქვენი სილამაზის გამოწერა' },
    seoDescription: { type: String, default: 'სილამაზის სერვისების გამოწერა თბილისში' },
    seoKeywords: { type: String, default: 'beauty, salon, subscription, tbilisi' },
    
    // Промо банер
    promoEnabled: { type: Boolean, default: false },
    promoText: { type: String, default: '' },
    promoLink: { type: String, default: '' },
    
    // Дополнительные настройки
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    bookingEnabled: { type: Boolean, default: true }
    
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
