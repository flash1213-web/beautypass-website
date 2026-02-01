// ==================== ðÿðØðÿðªðÿðÉðøðÿðùðÉðªðÿð» ðÿ ðØðÉðíðóðáð×ðÖðÜðÉ ====================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const axios = require('axios'); // ðöð¥ð▒ð░ð▓ð╗ðÁð¢ð¥ ð┤ð╗ÐÅ ðÀð░ð┐ÐÇð¥Ðüð¥ð▓ ð║ TBC

// ðƒð¥ð┤ð║ð╗ÐÄÐçð░ðÁð╝ ð╝ð¥ð┤ðÁð╗ð©
const User = require('./models/User');
const Booking = require('./models/Booking');
const Package = require('./models/Package');
const Salon = require('./models/Salon');
const Service = require('./models/Service');
const Transaction = require('./models/Transaction');

// ðƒð¥ð┤ð║ð╗ÐÄÐçð░ðÁð╝ middleware
const { authMiddleware, adminMiddleware, salonOwnerMiddleware } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

// ðƒð¥ð┤ð║ð╗ÐÄÐçðÁð¢ð©ðÁ ð║ MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Ô£à MongoDB ð┐ð¥ð┤ð║ð╗ÐÄÐçðÁð¢ð░ ÐâÐüð┐ðÁÐêð¢ð¥'))
  .catch(err => console.error('ÔØî ð×Ðêð©ð▒ð║ð░ ð┐ð¥ð┤ð║ð╗ÐÄÐçðÁð¢ð©ÐÅ ð║ MongoDB:', err));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== MULTER ðØðÉðíðóðáð×ðÖðÜðÉ ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('ðóð¥ð╗Ðîð║ð¥ ð©ðÀð¥ð▒ÐÇð░ðÂðÁð¢ð©ÐÅ ÐÇð░ðÀÐÇðÁÐêðÁð¢Ðï!'));
    }
  }
});

// ==================== ðƒðúðæðøðÿðºðØð½ðò ð£ðÉðáð¿ðáðúðóð½ ====================
app.get('/api/status', (req, res) => {
  res.json({ message: 'ðíðÁÐÇð▓ðÁÐÇ ÐÇð░ð▒ð¥Ðéð░ðÁÐé!' });
});

app.get('/api/check-availability', async (req, res) => {
  try {
    const { type, value } = req.query;
    if (!type || !value) return res.status(400).json({ message: 'ðØðÁð▓ðÁÐÇð¢Ðïð╣ ðÀð░ð┐ÐÇð¥Ðü' });
    let user;
    if (type === 'email') user = await User.findOne({ login: value });
    else if (type === 'phone') user = await User.findOne({ phone: value });
    else if (type === 'personalId') user = await User.findOne({ personalNumber: value });
    else return res.status(400).json({ message: 'ðØðÁð▓ðÁÐÇð¢Ðïð╣ Ðéð©ð┐ ð┐ÐÇð¥ð▓ðÁÐÇð║ð©' });
    if (user) res.json({ available: false, message: 'ßâúßâÖßâòßâö ßâôßâÉßâÖßâÉßâòßâößâæßâúßâÜßâÿßâÉ' });
    else res.json({ available: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.get('/api/salons', async (req, res) => {
  try {
    const salons = await Salon.find().populate('ownerId', 'firstName lastName');
    const salonsWithServices = await Promise.all(
      salons.map(async (salon) => {
        if (salon.ownerId) {
          const services = await Service.find({ ownerId: salon.ownerId._id });
          return {
            ...salon.toObject(),
            services: services.map(service => service.name),
            hasDetailedServices: true
          };
        } else {
          return {
            ...salon.toObject(),
            hasDetailedServices: false
          };
        }
      })
    );
    res.json(salonsWithServices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.get('/api/salons/:id/services', async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) return res.status(404).json({ message: 'ðíð░ð╗ð¥ð¢ ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢' });
    if (salon.ownerId) {
      const services = await Service.find({ ownerId: salon.ownerId });
      res.json(services);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

// ==================== ðÉðúðóðòðØðóðÿðñðÿðÜðÉðªðÿð» ====================
app.post('/api/register', async (req, res) => {
  try {
    const { login, personalNumber, password, phone, firstName, lastName, userType } = req.body;
    if (await User.findOne({ login })) return res.status(400).json({ message: 'ßâøßâØßâøßâ«ßâøßâÉßâáßâößâæßâößâÜßâÿ ßâÉßâø ßâÜßâØßâÆßâÿßâ£ßâÿßâù ßâúßâÖßâòßâö ßâÉßâáßâíßâößâæßâØßâæßâí' });
    if (await User.findOne({ personalNumber })) return res.status(400).json({ message: 'ßâøßâØßâøßâ«ßâøßâÉßâáßâößâæßâößâÜßâÿ ßâÉßâø ßâ×ßâÿßâáßâÉßâôßâÿ ßâ£ßâØßâøßâáßâÿßâù ßâúßâÖßâòßâö ßâÉßâáßâíßâößâæßâØßâæßâí' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ login, personalNumber, password: hashedPassword, phone, firstName, lastName, userType });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const userPayload = { id: user._id.toString(), login: user.login, personalNumber: user.personalNumber, phone: user.phone, firstName: user.firstName, lastName: user.lastName, balance: user.balance, purchases: user.purchases, cards: user.cards, isAdmin: user.isAdmin, userType: user.userType };
    res.status(201).json({ message: 'ßâáßâößâÆßâÿßâíßâóßâáßâÉßâ¬ßâÿßâÉ ßâ¼ßâÉßâáßâøßâÉßâóßâößâæßâÿßâù ßâÆßâÉßâ£ßâ«ßâØßâáßâ¬ßâÿßâößâÜßâôßâÉ!', token, user: userPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ personalNumber: login });
    if (!user) return res.status(400).json({ message: 'ßâÉßâáßâÉßâíßâ¼ßâØßâáßâÿ ßâ×ßâÿßâáßâÉßâôßâÿ ßâ£ßâØßâøßâößâáßâÿ ßâÉßâ£ ßâ×ßâÉßâáßâØßâÜßâÿ' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'ßâÉßâáßâÉßâíßâ¼ßâØßâáßâÿ ßâ×ßâÿßâáßâÉßâôßâÿ ßâ£ßâØßâøßâößâáßâÿ ßâÉßâ£ ßâ×ßâÉßâáßâØßâÜßâÿ' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const userPayload = { id: user._id.toString(), login: user.login, personalNumber: user.personalNumber, phone: user.phone, firstName: user.firstName, lastName: user.lastName, balance: user.balance, purchases: user.purchases, cards: user.cards, isAdmin: user.isAdmin, userType: user.userType, salonName: user.salonName, address: user.address, salonDescription: user.salonDescription, salonPhotoUrl: user.salonPhotoUrl };
    res.json({ token, user: userPayload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.get('/api/profile', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ==================== ðƒð×ðøð¼ðùð×ðÆðÉðóðòðøð¼ðíðÜðÿðò ð£ðÉðáð¿ðáðúðóð½ ====================
app.post('/api/packages/buy', authMiddleware, async (req, res) => {
  try {
    const { packageId } = req.body;
    const user = req.user;
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'ßâ×ßâÉßâÖßâößâóßâÿ ßâÉßâá ßâøßâØßâÿßâ½ßâößâæßâ£ßâÉ' });
    if (user.balance < pkg.price) return res.status(400).json({ message: 'ßâÉßâáßâÉßâíßâÉßâÖßâøßâÉßâáßâÿßâíßâÿ ßâæßâÉßâÜßâÉßâ£ßâíßâÿ.' });
    user.balance -= pkg.price;
    user.purchases.push({ id: Date.now(), package: pkg.name, price: pkg.price, date: new Date(), visitsLeft: pkg.tokens });
    await user.save();
    res.json({ message: 'ßâ×ßâÉßâÖßâößâóßâÿ ßâ¼ßâÉßâáßâøßâÉßâóßâößâæßâÿßâù ßâ¿ßâößâ½ßâößâ£ßâÿßâÜßâÿßâÉ!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.post('/api/balance/add', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;
    if (amount <= 0) return res.status(400).json({ message: 'ßâùßâÉßâ£ßâ«ßâÉ ßâúßâ£ßâôßâÉ ßâÿßâºßâØßâí ßâôßâÉßâôßâößâæßâÿßâùßâÿ' });
    user.balance += amount;
    await user.save();
    res.json({ message: 'ßâæßâÉßâÜßâÉßâ£ßâíßâÿ ßâ¼ßâÉßâáßâøßâÉßâóßâößâæßâÿßâù ßâ¿ßâößâÿßâòßâíßâÉ!', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { salonId, salonName, service, dateTime } = req.body;
    const user = req.user;
    const activePackage = user.purchases.find(p => p.visitsLeft > 0);
    if (!activePackage) return res.status(400).json({ message: 'ßâÉßâá ßâÆßâÉßâÑßâòßâù ßâ«ßâößâÜßâøßâÿßâíßâÉßâ¼ßâòßâôßâØßâøßâÿ ßâòßâÿßâûßâÿßâóßâößâæßâÿ.' });
    const newBooking = new Booking({ userId: user._id, salonId, salonName, service, dateTime: new Date(dateTime) });
    await newBooking.save();
    const packageIndex = user.purchases.findIndex(p => p.id === activePackage.id);
    user.purchases[packageIndex].visitsLeft -= 1;
    await user.save();
    res.status(201).json({ message: 'ßâùßâÑßâòßâößâ£ ßâ¼ßâÉßâáßâøßâÉßâóßâößâæßâÿßâù ßâôßâÉßâÿßâ»ßâÉßâòßâ¿ßâ£ßâößâù!', booking: newBooking, updatedUser: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ userId }).sort({ dateTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' });
  }
});

// ==================== ð£ðÉðáð¿ðáðúðóð½ ðÆðøðÉðöðòðøð¼ðªðÉ ðíðÉðøð×ðØðÉ ====================
app.get('/api/salon-owner/services', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { const services = await Service.find({ ownerId: req.user._id }); res.json(services); }
  catch (error) { res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' }); }
});

app.post('/api/salon-owner/services', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { const newService = new Service({ ...req.body, ownerId: req.user._id }); await newService.save(); await updateSalonServices(req.user._id); res.status(201).json(newService); }
  catch (error) { res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' }); }
});

app.put('/api/salon-owner/services/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { const service = await Service.findOne({ _id: req.params.id, ownerId: req.user._id }); if (!service) return res.status(404).json({ message: 'ðúÐüð╗Ðâð│ð░ ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢ð░' }); Object.assign(service, req.body); await service.save(); await updateSalonServices(req.user._id); res.json(service); }
  catch (error) { res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' }); }
});

app.delete('/api/salon-owner/services/:id', authMiddleware, salonOwnerMiddleware, async (req, res) => {
  try { const result = await Service.deleteOne({ _id: req.params.id, ownerId: req.user._id }); if (result.deletedCount === 0) return res.status(404).json({ message: 'ðúÐüð╗Ðâð│ð░ ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢ð░' }); await updateSalonServices(req.user._id); res.json({ message: 'ðúÐüð╗Ðâð│ð░ Ðâð┤ð░ð╗ðÁð¢ð░' }); }
  catch (error) { res.status(500).json({ message: 'ßâíßâößâáßâòßâößâáßâÿßâí ßâ¿ßâößâ¬ßâôßâØßâøßâÉ' }); }
});

app.put('/api/salon-owner/profile', authMiddleware, salonOwnerMiddleware, upload.single('salonPhoto'), async (req, res) => {
  try {
    const { salonName, address, salonDescription, phone } = req.body;
    let salonPhotoUrl = req.body.salonPhotoUrl;
    if (req.file) salonPhotoUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { salonName, address, salonDescription, salonPhotoUrl, phone }, { new: true, runValidators: true });
    if (!updatedUser) return res.status(404).json({ message: 'ðƒð¥ð╗ÐîðÀð¥ð▓ð░ÐéðÁð╗Ðî ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢' });
    const services = await Service.find({ ownerId: req.user._id }); const serviceNames = services.map(service => service.name);
    let salon = await Salon.findOne({ ownerId: req.user._id });
    if (salon) { salon.name = updatedUser.salonName; salon.address = updatedUser.address; salon.salonPhotoUrl = updatedUser.salonPhotoUrl; salon.services = serviceNames; await salon.save(); }
    else { const newSalon = new Salon({ name: updatedUser.salonName, address: updatedUser.address, services: serviceNames, rating: 0, ownerId: req.user._id, salonPhotoUrl: updatedUser.salonPhotoUrl }); await newSalon.save(); }
    const userPayload = { id: updatedUser._id.toString(), login: updatedUser.login, personalNumber: updatedUser.personalNumber, phone: updatedUser.phone, firstName: updatedUser.firstName, lastName: updatedUser.lastName, balance: updatedUser.balance, purchases: updatedUser.purchases, cards: updatedUser.cards, isAdmin: updatedUser.isAdmin, userType: updatedUser.userType, salonName: updatedUser.salonName, address: updatedUser.address, salonDescription: updatedUser.salonDescription, salonPhotoUrl: updatedUser.salonPhotoUrl, };
    res.json({ message: 'ðƒÐÇð¥Ðäð©ð╗Ðî ÐâÐüð┐ðÁÐêð¢ð¥ ð¥ð▒ð¢ð¥ð▓ð╗ðÁð¢!', user: userPayload });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░ ð┐ÐÇð© ð¥ð▒ð¢ð¥ð▓ð╗ðÁð¢ð©ð© ð┐ÐÇð¥Ðäð©ð╗ÐÅ' }); }
});

// ==================== ðÉðöð£ðÿðØ ð£ðÉðáð¿ðáðúðóð½ ====================
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => { try { const users = await User.find().select('-password'); res.json(users); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.post('/api/admin/packages', authMiddleware, adminMiddleware, async (req, res) => { try { const newPackage = new Package(req.body); await newPackage.save(); res.status(201).json(newPackage); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.put('/api/admin/packages/:id', authMiddleware, adminMiddleware, async (req, res) => { try { const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!updatedPackage) return res.status(404).json({ message: 'ðƒð░ð║ðÁÐé ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢' }); res.json(updatedPackage); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.delete('/api/admin/packages/:id', authMiddleware, adminMiddleware, async (req, res) => { try { const deletedPackage = await Package.findByIdAndDelete(req.params.id); if (!deletedPackage) return res.status(404).json({ message: 'ðƒð░ð║ðÁÐé ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢' }); res.json({ message: 'ðƒð░ð║ðÁÐé ÐâÐüð┐ðÁÐêð¢ð¥ Ðâð┤ð░ð╗ðÁð¢' }); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.get('/api/admin/salons', authMiddleware, adminMiddleware, async (req, res) => { try { const salons = await Salon.find(); res.json(salons); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.post('/api/admin/salons', authMiddleware, adminMiddleware, async (req, res) => { try { const newSalon = new Salon(req.body); await newSalon.save(); res.status(201).json(newSalon); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.put('/api/admin/salons/:id', authMiddleware, adminMiddleware, async (req, res) => { try { const updatedSalon = await Salon.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!updatedSalon) return res.status(404).json({ message: 'ðíð░ð╗ð¥ð¢ ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢' }); res.json(updatedSalon); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.delete('/api/admin/salons/:id', authMiddleware, adminMiddleware, async (req, res) => { try { const deletedSalon = await Salon.findByIdAndDelete(req.params.id); if (!deletedSalon) return res.status(404).json({ message: 'ðíð░ð╗ð¥ð¢ ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢' }); res.json({ message: 'ðíð░ð╗ð¥ð¢ ÐâÐüð┐ðÁÐêð¢ð¥ Ðâð┤ð░ð╗ðÁð¢' }); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.get('/api/admin/bookings', authMiddleware, adminMiddleware, async (req, res) => { try { const bookings = await Booking.find().populate('userId', 'firstName lastName login personalNumber').sort({ dateTime: -1 }); res.json(bookings); } catch (error) { res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); } });
app.put('/api/admin/bookings/:id/cancel', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'ðùð░ð┐ð©ÐüÐî ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢ð░' });
    if (booking.status !== 'scheduled') return res.status(400).json({ message: 'ð¡ÐéÐâ ðÀð░ð┐ð©ÐüÐî ÐâðÂðÁ ð¢ðÁð╗ÐîðÀÐÅ ð¥Ðéð╝ðÁð¢ð©ÐéÐî' });
    const user = await User.findById(booking.userId);
    if (user) {
      const lastPurchase = user.purchases.sort((a, b) => new Date(b.date) - new Date(a.date)).find(p => p.visitsLeft >= 0);
      if (lastPurchase) { lastPurchase.visitsLeft += 1; await user.save(); }
    }
    booking.status = 'cancelled'; await booking.save();
    res.json({ message: 'ðùð░ð┐ð©ÐüÐî ÐâÐüð┐ðÁÐêð¢ð¥ ð¥Ðéð╝ðÁð¢ðÁð¢ð░, ð▓ð©ðÀð©Ðé ð▓ð¥ðÀð▓ÐÇð░ÐëðÁð¢ ð┐ð¥ð╗ÐîðÀð¥ð▓ð░ÐéðÁð╗ÐÄ.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'ð×Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); }
});

// ==================== ðƒðøðÉðóðòðûðÿ (ðñðÿðØðÉðøð¼ðØðÉð» ðÆðòðáðíðÿð» ðí OAUTH) ====================
app.post('/api/transactions/create', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // --- ð¿ðÉðô 1: ðƒð¥ð╗ÐâÐçð░ðÁð╝ ð▓ÐÇðÁð╝ðÁð¢ð¢Ðïð╣ Ðéð¥ð║ðÁð¢ ð┤ð¥ÐüÐéÐâð┐ð░ (access token) ---
    console.log('ð¿ð░ð│ 1: ðùð░ð┐ÐÇð░Ðêð©ð▓ð░ðÁð╝ access token Ðâ TBC...');
    const credentials = Buffer.from(`${process.env.TBC_IPAY_KEY}:${process.env.TBC_IPAY_SECRET}`).toString('base64');
    const tokenResponse = await axios.post(process.env.TBC_OAUTH_URL, 'grant_type=client_credentials', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${credentials}` }
    });
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) { throw new Error('ðØðÁ Ðâð┤ð░ð╗ð¥ÐüÐî ð┐ð¥ð╗ÐâÐçð©ÐéÐî access token ð¥Ðé TBC'); }
    console.log('ð¿ð░ð│ 1: Access token ÐâÐüð┐ðÁÐêð¢ð¥ ð┐ð¥ð╗ÐâÐçðÁð¢.');

    // --- ð¿ðÉðô 2: ðíð¥ðÀð┤ð░ðÁð╝ ð┐ð╗ð░ÐéðÁðÂ, ð©Ðüð┐ð¥ð╗ÐîðÀÐâÐÅ ð▓ÐÇðÁð╝ðÁð¢ð¢Ðïð╣ Ðéð¥ð║ðÁð¢ ---
    console.log('ð¿ð░ð│ 2: ðíð¥ðÀð┤ð░ðÁð╝ ð┐ð╗ð░ÐéðÁðÂ Ðü ð┐ð¥ð╝ð¥ÐëÐîÐÄ access token...');
    const transaction = new Transaction({ transactionId: `BP_${Date.now()}_${userId}`, userId, amount, bank: 'tbc', status: 'pending' });
    await transaction.save();

    const paymentData = {
      shop_order_id: transaction.transactionId,
      purchase_amount: { amount: amount * 100, currency: 'GEL' },
      language: 'ka',
      callback_url: 'https://beautypass-website.onrender.com/api/payments/tbc-callback'
    };
    console.log('ðöð░ð¢ð¢ÐïðÁ ð┤ð╗ÐÅ ð┐ð╗ð░ÐéðÁðÂð░:', paymentData);

    const paymentResponse = await axios.post(process.env.TBC_API_URL, paymentData, {
      headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
    });

    const paymentUrl = paymentResponse.data.redirect_url;
    console.log('ð¿ð░ð│ 2: ðƒð╗ð░ÐéðÁðÂ Ðüð¥ðÀð┤ð░ð¢. URL:', paymentUrl);
    if (!paymentUrl) { console.error('ð×Ðêð©ð▒ð║ð░: TBC ð¢ðÁ ð▓ðÁÐÇð¢Ðâð╗ ÐüÐüÐïð╗ð║Ðâ ð¢ð░ ð¥ð┐ð╗ð░ÐéÐâ. ð×Ðéð▓ðÁÐé:', paymentResponse.data); throw new Error('TBC ð¢ðÁ ð▓ðÁÐÇð¢Ðâð╗ ÐüÐüÐïð╗ð║Ðâ ð¢ð░ ð¥ð┐ð╗ð░ÐéÐâ'); }

    res.status(201).json({ transactionId: transaction.transactionId, paymentUrl: paymentUrl, status: transaction.status });

  } catch (error) {
    console.error('!!! ð×ð¿ðÿðæðÜðÉ ðƒðáðÿ ðíð×ðùðöðÉðØðÿðÿ ðƒðøðÉðóðòðûðÉ !!!');
    if (error.response) { console.error('ðöð░ð¢ð¢ÐïðÁ ð¥Ðéð▓ðÁÐéð░:', error.response.data); console.error('ðíÐéð░ÐéÐâÐü:', error.response.status); } else { console.error('ðíð¥ð¥ð▒ÐëðÁð¢ð©ðÁ:', error.message); }
    res.status(500).json({ message: 'ðØðÁ Ðâð┤ð░ð╗ð¥ÐüÐî Ðüð¥ðÀð┤ð░ÐéÐî ð┐ð╗ð░ÐéðÁðÂ. ðƒð¥ð┐ÐÇð¥ð▒Ðâð╣ÐéðÁ ðÁÐëðÁ ÐÇð░ðÀ.' });
  }
});

app.get('/api/transactions/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) return res.status(404).json({ message: 'ðóÐÇð░ð¢ðÀð░ð║Ðåð©ÐÅ ð¢ðÁ ð¢ð░ð╣ð┤ðÁð¢ð░' });
    res.status(200).json({ transactionId: transaction.transactionId, status: transaction.status, amount: transaction.amount, bank: transaction.bank });
  } catch (error) { console.error('ð×Ðêð©ð▒ð║ð░ ð┐ÐÇð¥ð▓ðÁÐÇð║ð© ÐüÐéð░ÐéÐâÐüð░ ÐéÐÇð░ð¢ðÀð░ð║Ðåð©ð©:', error); res.status(500).json({ message: 'ðÆð¢ÐâÐéÐÇðÁð¢ð¢ÐÅÐÅ ð¥Ðêð©ð▒ð║ð░ ÐüðÁÐÇð▓ðÁÐÇð░' }); }
});

// ==================== ðÆðíðƒð×ð£ð×ðôðÉðóðòðøð¼ðØð½ðò ðñðúðØðÜðªðÿðÿ ====================
async function updateSalonServices(ownerId) {
  try {
    const services = await Service.find({ ownerId });
    const serviceNames = services.map(service => service.name);
    await Salon.findOneAndUpdate({ ownerId }, { services: serviceNames }, { new: true });
  } catch (error) { console.error('ð×Ðêð©ð▒ð║ð░ ð¥ð▒ð¢ð¥ð▓ð╗ðÁð¢ð©ÐÅ ÐâÐüð╗Ðâð│ Ðüð░ð╗ð¥ð¢ð░:', error); }
}

// ==================== ðùðÉðƒðúðíðÜ ðíðòðáðÆðòðáðÉ ====================
app.listen(port, () => {
  console.log(`­ƒÜÇ ðíðÁÐÇð▓ðÁÐÇ ðÀð░ð┐ÐâÐëðÁð¢ ð¢ð░ ð┐ð¥ÐÇÐéÐâ ${port}`);
});
