const mongoose = require('mongoose');
const Table = require('../models/Table');
require('dotenv').config();

const createDefaultTables = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Mevcut masaları temizle
    await Table.deleteMany({});
    console.log('Mevcut masalar temizlendi');

    // 10 adet varsayılan masa oluştur
    const tables = Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      status: 'available'
    }));

    await Table.insertMany(tables);
    console.log('Varsayılan masalar oluşturuldu');

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createDefaultTables(); 