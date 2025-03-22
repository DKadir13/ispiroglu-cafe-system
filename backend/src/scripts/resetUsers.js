const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const resetUsers = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe');
    console.log('MongoDB bağlantısı başarılı');

    // Tüm kullanıcıları sil
    await User.deleteMany({});
    console.log('Tüm kullanıcılar silindi');

    // Admin şifresini hashle
    const adminPassword = await bcrypt.hash('ispiroglu123', 10);
    // Garson şifresini hashle
    const waiterPassword = await bcrypt.hash('garsonispir123', 10);

    // Yeni kullanıcıları oluştur
    await User.create({
      username: 'ispiroglu',
      password: adminPassword,
      role: 'admin'
    });
    console.log('Admin kullanıcısı oluşturuldu');

    await User.create({
      username: 'garsonispir',
      password: waiterPassword,
      role: 'waiter'
    });
    console.log('Garson kullanıcısı oluşturuldu');

    console.log('Kullanıcılar başarıyla sıfırlandı');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

resetUsers(); 