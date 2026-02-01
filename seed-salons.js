// Скрипт для добавления тестовых салонов
require('dotenv').config();
const mongoose = require('mongoose');
const Salon = require('./models/Salon');

const sampleSalons = [
  {
    name: 'Nail Art Studio',
    address: 'თბილისი, რუსთაველის გამზირი 24',
    coordinates: { lat: 41.6934, lng: 44.8015 },
    phone: '+995 555 12 34 56',
    services: ['მანიკური', 'პედიკური', 'გელ-ლაქი', 'Nail Art'],
    categories: ['nails'],
    rating: 4.8,
    averageRating: 4.8,
    totalReviews: 45,
    salonPhotoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    photos: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'
    ],
    workingHours: {
      monday: '10:00-20:00',
      tuesday: '10:00-20:00',
      wednesday: '10:00-20:00',
      thursday: '10:00-20:00',
      friday: '10:00-20:00',
      saturday: '11:00-18:00',
      sunday: 'დახურულია'
    },
    description: 'პრემიუმ ფრჩხილის სტუდია თბილისის ცენტრში. გთავაზობთ მანიკურის, პედიკურის და nail art-ის სრულ სპექტრს.',
    reviews: [
      { userName: 'ანა მ.', rating: 5, comment: 'საუკეთესო მანიკური თბილისში!', createdAt: new Date('2025-12-15') },
      { userName: 'მარიამ კ.', rating: 5, comment: 'პროფესიონალი მასტერები', createdAt: new Date('2025-12-20') }
    ],
    isActive: true
  },
  {
    name: 'Beauty House Tbilisi',
    address: 'თბილისი, ჭავჭავაძის გამზირი 71',
    coordinates: { lat: 41.7086, lng: 44.7731 },
    phone: '+995 577 98 76 54',
    services: ['თმის შეჭრა', 'შეღებვა', 'სტილისტიკა', 'მაკიაჟი', 'მანიკური'],
    categories: ['hair', 'makeup', 'nails'],
    rating: 4.6,
    averageRating: 4.6,
    totalReviews: 89,
    salonPhotoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    photos: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400'
    ],
    workingHours: {
      monday: '09:00-21:00',
      tuesday: '09:00-21:00',
      wednesday: '09:00-21:00',
      thursday: '09:00-21:00',
      friday: '09:00-21:00',
      saturday: '10:00-20:00',
      sunday: '11:00-18:00'
    },
    description: 'სრულფასოვანი სილამაზის სახლი ვაკეში. თმა, მაკიაჟი, ფრჩხილები - ყველაფერი ერთ სივრცეში.',
    reviews: [
      { userName: 'ნინო გ.', rating: 5, comment: 'მშვენიერი სერვისი!', createdAt: new Date('2025-11-10') },
      { userName: 'თამარ ბ.', rating: 4, comment: 'კარგი სალონია', createdAt: new Date('2025-12-01') }
    ],
    isActive: true
  },
  {
    name: 'Glamour Spa & Wellness',
    address: 'თბილისი, აბაშიძის ქუჩა 36',
    coordinates: { lat: 41.7195, lng: 44.7647 },
    phone: '+995 599 11 22 33',
    services: ['მასაჟი', 'სპა პროცედურები', 'სახის მოვლა', 'პილინგი', 'რელაქსაცია'],
    categories: ['spa', 'face', 'body'],
    rating: 4.9,
    averageRating: 4.9,
    totalReviews: 156,
    salonPhotoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
    photos: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'
    ],
    workingHours: {
      monday: '10:00-22:00',
      tuesday: '10:00-22:00',
      wednesday: '10:00-22:00',
      thursday: '10:00-22:00',
      friday: '10:00-22:00',
      saturday: '10:00-22:00',
      sunday: '12:00-20:00'
    },
    description: 'პრემიუმ სპა ცენტრი ვაკეში. მოგვანიჭეთ რელაქსაცია და განახლება პროფესიონალური პროცედურებით.',
    reviews: [
      { userName: 'ლიკა ჯ.', rating: 5, comment: 'საუკეთესო მასაჟი!', createdAt: new Date('2025-12-25') },
      { userName: 'ნატა მ.', rating: 5, comment: 'სამოთხე დედამიწაზე', createdAt: new Date('2026-01-05') }
    ],
    isActive: true
  },
  {
    name: 'Hair Master Studio',
    address: 'თბილისი, პეკინის გამზირი 18',
    coordinates: { lat: 41.7251, lng: 44.7920 },
    phone: '+995 591 45 67 89',
    services: ['თმის შეჭრა', 'შეღებვა', 'ბალაიაჟი', 'კერატინი', 'თმის მკურნალობა'],
    categories: ['hair'],
    rating: 4.7,
    averageRating: 4.7,
    totalReviews: 203,
    salonPhotoUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
    photos: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'
    ],
    workingHours: {
      monday: '09:00-20:00',
      tuesday: '09:00-20:00',
      wednesday: '09:00-20:00',
      thursday: '09:00-20:00',
      friday: '09:00-20:00',
      saturday: '10:00-19:00',
      sunday: 'დახურულია'
    },
    description: 'თმის სტილისტიკის ექსპერტები. ბალაიაჟი, ომბრე, კერატინით გასწორება - ყველაფერი ერთ ადგილას.',
    reviews: [
      { userName: 'სოფო რ.', rating: 5, comment: 'ბალაიაჟი იდეალურია!', createdAt: new Date('2025-12-18') },
      { userName: 'ეკა ხ.', rating: 4, comment: 'კარგი მასტერები', createdAt: new Date('2026-01-02') }
    ],
    isActive: true
  },
  {
    name: 'Makeup Pro Academy',
    address: 'თბილისი, მარჯანიშვილის მოედანი 5',
    coordinates: { lat: 41.7058, lng: 44.8025 },
    phone: '+995 568 99 88 77',
    services: ['საღამოს მაკიაჟი', 'საქორწინო მაკიაჟი', 'თვალის მაკიაჟი', 'კონტურინგი'],
    categories: ['makeup'],
    rating: 4.5,
    averageRating: 4.5,
    totalReviews: 67,
    salonPhotoUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
    photos: [
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400'
    ],
    workingHours: {
      monday: '11:00-20:00',
      tuesday: '11:00-20:00',
      wednesday: '11:00-20:00',
      thursday: '11:00-20:00',
      friday: '11:00-21:00',
      saturday: '10:00-21:00',
      sunday: '12:00-18:00'
    },
    description: 'პროფესიონალური მაკიაჟის სტუდია. საქორწინო, საღამოს და ყოველდღიური მაკიაჟი.',
    reviews: [
      { userName: 'დიანა შ.', rating: 5, comment: 'საქორწინო მაკიაჟი ზღაპრული იყო!', createdAt: new Date('2025-11-20') }
    ],
    isActive: true
  },
  {
    name: 'Body Care Center',
    address: 'თბილისი, წერეთლის გამზირი 116',
    coordinates: { lat: 41.7300, lng: 44.7815 },
    phone: '+995 574 33 22 11',
    services: ['სხეულის მასაჟი', 'ანტიცელულიტური მასაჟი', 'wrap პროცედურები', 'სხეულის პილინგი'],
    categories: ['body', 'spa'],
    rating: 4.4,
    averageRating: 4.4,
    totalReviews: 98,
    salonPhotoUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    photos: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'
    ],
    workingHours: {
      monday: '10:00-21:00',
      tuesday: '10:00-21:00',
      wednesday: '10:00-21:00',
      thursday: '10:00-21:00',
      friday: '10:00-21:00',
      saturday: '11:00-19:00',
      sunday: 'დახურულია'
    },
    description: 'სხეულის მოვლის ცენტრი. ანტიცელულიტური პროგრამები და რელაქსაციის მასაჟი.',
    reviews: [
      { userName: 'ნანა ფ.', rating: 4, comment: 'კარგი მასაჟია', createdAt: new Date('2025-12-10') }
    ],
    isActive: true
  }
];

async function seedSalons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    // Check existing salons count
    const existingCount = await Salon.countDocuments();
    console.log(`📊 Existing salons: ${existingCount}`);
    
    // Add sample salons
    for (const salonData of sampleSalons) {
      // Check if salon already exists
      const exists = await Salon.findOne({ name: salonData.name });
      if (exists) {
        console.log(`⏭️  Salon "${salonData.name}" already exists, skipping...`);
        continue;
      }
      
      const salon = new Salon(salonData);
      await salon.save();
      console.log(`✅ Added: ${salonData.name}`);
    }
    
    const totalCount = await Salon.countDocuments();
    console.log(`\n🎉 Total salons now: ${totalCount}`);
    
    // List all salons
    const allSalons = await Salon.find().select('name address coordinates rating');
    console.log('\n📍 All salons:');
    allSalons.forEach(s => {
      console.log(`   - ${s.name} (${s.address}) ⭐${s.rating || s.averageRating || 0}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedSalons();
