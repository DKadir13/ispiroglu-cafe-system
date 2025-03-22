const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tableRoutes = require('./routes/tableRoutes');
const { createDefaultUsers } = require('./controllers/authController');
const path = require('path');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Environment variables'ları yükle
dotenv.config();

// MongoDB'ye bağlan
connectDB();

// Varsayılan kullanıcıları oluştur
createDefaultUsers();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosya servisi
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tables', tableRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend API çalışıyor!' });
});

// Port tanımlama
const PORT = process.env.PORT || 3000;

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 