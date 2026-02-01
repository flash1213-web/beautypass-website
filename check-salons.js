const mongoose = require('mongoose');
require('dotenv/config');

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all salons
    const salons = await db.collection('salons').find({}).toArray();
    console.log('\n=== SALONS ===');
    salons.forEach(s => {
      console.log(`Salon _id: ${s._id} | name: ${s.name} | ownerId: ${s.ownerId}`);
    });
    
    // Get levamur user
    const users = await db.collection('users').find({ email: 'dropshippingtbilisi@gmail.com' }).toArray();
    console.log('\n=== LEVAMUR USER ===');
    users.forEach(u => {
      console.log(`User _id: ${u._id} | email: ${u.email} | salonName: ${u.salonName}`);
    });
    
    // Get specialists for levamur
    if (users.length > 0) {
      const levamurId = users[0]._id.toString();
      const specialists = await db.collection('specialists').find({ salonId: levamurId }).toArray();
      console.log('\n=== LEVAMUR SPECIALISTS (by User._id) ===');
      specialists.forEach(sp => {
        console.log(`Specialist: ${sp.name} | salonId: ${sp.salonId}`);
      });
    }
    
    // Find salon with name containing "levamur"
    const levamurSalons = await db.collection('salons').find({ name: /levamur/i }).toArray();
    console.log('\n=== LEVAMUR SALON (from Salon collection) ===');
    levamurSalons.forEach(s => {
      console.log(`Salon _id: ${s._id} | name: ${s.name} | ownerId: ${s.ownerId}`);
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
