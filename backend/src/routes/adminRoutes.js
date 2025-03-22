const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Table = require('../models/Table');
const Order = require('../models/Order');

// Admin yetkisi kontrolü middleware'i
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
    }
    next();
  } catch (error) {
    console.error('Admin yetki kontrolü hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin yetkisi kontrolü endpoint'i
router.get('/check-auth', auth, isAdmin, async (req, res) => {
  try {
    res.json({ 
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Admin yetki kontrolü hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı yönetimi
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    res.status(500).json({ message: 'Kullanıcılar listelenirken bir hata oluştu' });
  }
});

router.post('/users', auth, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ success: true, data: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    res.status(500).json({ message: 'Kullanıcı oluşturulurken bir hata oluştu' });
  }
});

router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { username, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, role },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({ message: 'Kullanıcı güncellenirken bir hata oluştu' });
  }
});

router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ message: 'Kullanıcı silinirken bir hata oluştu' });
  }
});

// Ürün yönetimi
router.get('/products', auth, isAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    res.status(500).json({ message: 'Ürünler listelenirken bir hata oluştu' });
  }
});

router.post('/products', auth, isAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    res.status(500).json({ message: 'Ürün oluşturulurken bir hata oluştu' });
  }
});

router.put('/products/:id', auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({ message: 'Ürün güncellenirken bir hata oluştu' });
  }
});

router.delete('/products/:id', auth, isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ürün başarıyla silindi' });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    res.status(500).json({ message: 'Ürün silinirken bir hata oluştu' });
  }
});

// Masa yönetimi
router.get('/tables', auth, isAdmin, async (req, res) => {
  try {
    const tables = await Table.find();
    res.json({ success: true, data: tables });
  } catch (error) {
    console.error('Masa listesi hatası:', error);
    res.status(500).json({ message: 'Masalar listelenirken bir hata oluştu' });
  }
});

router.post('/tables', auth, isAdmin, async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error('Masa oluşturma hatası:', error);
    res.status(500).json({ message: 'Masa oluşturulurken bir hata oluştu' });
  }
});

router.put('/tables/:id', auth, isAdmin, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: table });
  } catch (error) {
    console.error('Masa güncelleme hatası:', error);
    res.status(500).json({ message: 'Masa güncellenirken bir hata oluştu' });
  }
});

router.delete('/tables/:id', auth, isAdmin, async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Masa başarıyla silindi' });
  } catch (error) {
    console.error('Masa silme hatası:', error);
    res.status(500).json({ message: 'Masa silinirken bir hata oluştu' });
  }
});

// Masa sayısını güncelleme
router.post('/tables/update-count', auth, isAdmin, async (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || count < 1) {
      return res.status(400).json({ message: 'Geçerli bir masa sayısı belirtmelisiniz' });
    }

    // Mevcut masaları sil
    await Table.deleteMany({});
    
    // Yeni masaları oluştur
    const tables = [];
    for (let i = 1; i <= count; i++) {
      tables.push(new Table({ number: i, status: 'empty' }));
    }
    await Table.insertMany(tables);

    res.json({ 
      success: true, 
      message: `${count} adet masa başarıyla oluşturuldu`,
      data: tables 
    });
  } catch (error) {
    console.error('Masa sayısı güncelleme hatası:', error);
    res.status(500).json({ message: 'Masa sayısı güncellenirken bir hata oluştu' });
  }
});

// Sipariş yönetimi
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Sipariş listesi hatası:', error);
    res.status(500).json({ message: 'Siparişler listelenirken bir hata oluştu' });
  }
});

router.put('/orders/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('createdBy', 'username');
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Sipariş durumu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sipariş durumu güncellenirken bir hata oluştu' });
  }
});

module.exports = router; 
module.exports = router; 