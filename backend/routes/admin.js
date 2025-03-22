const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Table = require('../models/Table');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PDFDocument = require('pdfkit');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Yetkilendirme kontrolü endpoint'i
router.get('/check-auth', [auth, admin], async (req, res) => {
  try {
    res.json({ message: 'Yetkilendirme başarılı' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Masa ekleme API'si
router.post('/tables/add', auth, async (req, res) => {
  try {
    const { count } = req.body;
    const tables = [];
    
    // Mevcut masa sayısını al
    const currentTables = await Table.find();
    const startNumber = currentTables.length + 1;
    
    // Yeni masaları oluştur
    for (let i = 0; i < count; i++) {
      const tableNumber = startNumber + i;
      const table = new Table({
        number: tableNumber,
        status: 'available',
        orders: []
      });
      await table.save();
      tables.push(table);
    }
    
    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gün sonu raporu oluşturma ve Drive'a yükleme API'si
router.post('/end-of-day', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Bugünün siparişlerini al
    const orders = await Order.find({
      createdAt: { $gte: today }
    }).populate('items.product');
    
    // PDF oluştur
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, '../temp/end-of-day.pdf');
    doc.pipe(fs.createWriteStream(pdfPath));
    
    // PDF içeriğini oluştur
    doc.fontSize(20).text('Gün Sonu Raporu', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tarih: ${today.toLocaleDateString('tr-TR')}`);
    doc.moveDown();
    
    // Toplam sipariş sayısı
    doc.fontSize(14).text(`Toplam Sipariş Sayısı: ${orders.length}`);
    doc.moveDown();
    
    // Toplam gelir
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    doc.fontSize(14).text(`Toplam Gelir: ${totalRevenue.toFixed(2)} TL`);
    doc.moveDown();
    
    // Sipariş detayları
    doc.fontSize(14).text('Sipariş Detayları:');
    doc.moveDown();
    
    orders.forEach((order, index) => {
      doc.fontSize(12).text(`Sipariş #${index + 1}`);
      doc.fontSize(10).text(`Masa: ${order.tableNumber}`);
      doc.fontSize(10).text(`Tarih: ${order.createdAt.toLocaleString('tr-TR')}`);
      doc.moveDown();
      
      order.items.forEach(item => {
        doc.fontSize(10).text(`${item.product.name} x${item.quantity} - ${(item.product.price * item.quantity).toFixed(2)} TL`);
      });
      
      doc.fontSize(10).text(`Toplam: ${order.total.toFixed(2)} TL`);
      doc.moveDown();
    });
    
    doc.end();
    
    // Google Drive API yapılandırması
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../config/google-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // PDF'i Drive'a yükle
    const fileMetadata = {
      name: `Gun-Sonu-Raporu-${today.toISOString().split('T')[0]}.pdf`,
      parents: ['YOUR_DRIVE_FOLDER_ID'] // Drive klasör ID'sini buraya ekleyin
    };
    
    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(pdfPath)
    };
    
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    // Geçici PDF dosyasını sil
    fs.unlinkSync(pdfPath);
    
    res.json({
      success: true,
      message: 'Gün sonu raporu başarıyla oluşturuldu ve Drive\'a yüklendi',
      fileId: file.data.id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ürün ekleme API'si
router.post('/products', auth, async (req, res) => {
  try {
    const { name, price, category, description, image } = req.body;
    
    const product = new Product({
      name,
      price,
      category,
      description,
      image
    });
    
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ürün güncelleme API'si
router.put('/products/:id', auth, async (req, res) => {
  try {
    const { name, price, category, description, image } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, category, description, image },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ürün silme API'si
router.delete('/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
    }
    
    res.json({ success: true, message: 'Ürün başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 