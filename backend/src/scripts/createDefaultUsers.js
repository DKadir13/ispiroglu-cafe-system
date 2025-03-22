const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createDefaultUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Mevcut kullanıcıları temizle
    await User.deleteMany({});
    console.log('Mevcut kullanıcılar temizlendi');

    // Admin kullanıcısı
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin'
    });

    // Garson kullanıcısı
    const waiterPassword = await bcrypt.hash('garsonispir123', 10);
    await User.create({
      username: 'garsonispir',
      password: waiterPassword,
      role: 'waiter'
    });

    console.log('Varsayılan kullanıcılar oluşturuldu');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createDefaultUsers(); 