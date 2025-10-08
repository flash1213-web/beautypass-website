// seed.js
const mongoose = require('mongoose');
const Package = require('./models/Package');
const Salon = require('./models/Salon');
require('dotenv').config();

// seeds.js
const packages = [
    { name: 'Basic', price: 99, tokens: 100, description: 'იდეალურია დამწყებთათვის', features: ['100 ტოკენი', 'ყველა პარტნიორ სალონში', 'უფასო გაუქმება'] },
    { name: 'Standard', price: 179, tokens: 200, description: 'ყველაზე პოპულარული', features: ['200 ტოკენი', 'ყველა პარტნიორ სალონში', 'უფასო გაუქმება', 'პრიორიტეტული მხარდაჭერა'], popular: true },
    { name: 'Premium', price: 299, tokens: 350, description: 'შეუზღუდავი სილამაზე', features: ['350 ტოკენი', 'ყველა პარტნიორ სალონში', 'უფასო გაუქმება', 'პრიორიტეტული მხარდაჭერა', 'VIP სერვისები'] }
];

const salons = [
    { name: 'Elegance Beauty', services: ['მანიკური', 'პედიკური', 'თმის შეჭრა'], address: 'ვაკე, ჭავჭავაძის 12', rating: 4.8 },
    { name: 'Royal Spa', services: ['კოსმეტოლოგია', 'მასაჟი', 'სახის მოვლა'], address: 'საბურთალო, კოსტავას 45', rating: 4.9 },
    { name: 'Glamour Studio', services: ['თმის შეჭრა', 'მანიკური', 'მაკიაჟი'], address: 'ისანი, გორგასლის 23', rating: 4.7 },
    { name: 'Beauty Zone', services: ['კოსმეტოლოგია', 'ეპილაცია', 'სახის მოვლა'], address: 'ვაკე, აბაშიძის 8', rating: 4.6 }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB подключена для наполнения...');

        await Package.deleteMany(); // Очищаем коллекцию перед наполнением
        await Salon.deleteMany();  // Очищаем коллекцию перед наполнением

        await Package.insertMany(packages);
        console.log('✅ Пакеты успешно добавлены!');
        
        await Salon.insertMany(salons);
        console.log('✅ Салоны успешно добавлены!');

    } catch (err) {
        console.error('❌ Ошибка наполнения БД:', err);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Соединение с БД закрыто.');
    }
};

seedDB();