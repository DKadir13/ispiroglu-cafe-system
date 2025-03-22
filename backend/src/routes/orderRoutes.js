const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Table = require('../models/Table');
const PDFDocument = require('pdfkit');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive API yapılandırması
const auth2 = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../../credentials.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

const drive = google.drive({ version: 'v3', auth: auth2 });

// PDF oluşturma fonksiyonu
const generateReceipt = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Başlık
      doc.fontSize(20)
         .text('İSPİROĞLU CAFE', { align: 'center' })
         .moveDown();

      // Tarih ve saat
      const now = new Date();
      doc.fontSize(12)
         .text(`Tarih: ${now.toLocaleDateString('tr-TR')}`, { align: 'center' })
         .text(`Saat: ${now.toLocaleTimeString('tr-TR')}`, { align: 'center' })
         .moveDown();

      // Masa numarası
      doc.fontSize(14)
         .text(`Masa: ${order.tableNumber}`, { align: 'center' })
         .moveDown();

      // Ürünler
      doc.fontSize(12)
         .text('Ürünler:', { underline: true })
         .moveDown();

      order.items.forEach(item => {
        doc.text(`${item.product.name} x ${item.quantity} - ${(item.product.price * item.quantity).toFixed(2)} ₺`);
      });

      // Toplam
      doc.moveDown()
         .text('----------------------------------------', { align: 'center' })
         .fontSize(14)
         .text(`Toplam: ${order.total.toFixed(2)} ₺`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Google Drive'a yükleme fonksiyonu
const uploadToDrive = async (fileBuffer, fileName) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: ['1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'] // Google Drive klasör ID'nizi buraya ekleyin
      },
      media: {
        mimeType: 'application/pdf',
        body: fileBuffer
      }
    });
    return response.data.id;
  } catch (error) {
    console.error('Google Drive yükleme hatası:', error);
    throw error;
  }
};

// Tüm siparişleri getir (sadece admin)
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Siparişler getirilirken hata:', error);
    res.status(500).json({ message: 'Siparişler getirilirken bir hata oluştu' });
  }
});

// Yeni sipariş oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { tableNumber, items, total } = req.body;
    console.log('Gelen sipariş verisi:', req.body);
    console.log('Kullanıcı bilgisi:', req.user);

    // Gerekli alanları kontrol et
    if (!tableNumber || !items || !total) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
    }

    // Masanın var olup olmadığını kontrol et
    const table = await Table.findOne({ number: tableNumber });
    if (!table) {
      return res.status(404).json({ message: 'Masa bulunamadı' });
    }

    // Siparişi oluştur
    const order = new Order({
      tableNumber,
      items,
      total,
      status: 'pending',
      createdBy: req.user.id
    });

    console.log('Oluşturulan sipariş:', order);

    await order.save();

    // Masayı güncelle
    table.status = 'occupied';
    await table.save();

    // Populate işlemi
    await order.populate('items.product');

    // PDF fiş oluştur
    try {
      const receiptBuffer = await generateReceipt(order);
      
      // Google Drive'a yükle
      const fileName = `Siparis_${order._id}_${new Date().toISOString().split('T')[0]}.pdf`;
      const fileId = await uploadToDrive(receiptBuffer, fileName);

      // Siparişi güncelle
      order.receiptUrl = `https://drive.google.com/file/d/${fileId}/view`;
      await order.save();
    } catch (error) {
      console.error('Fiş oluşturma hatası:', error);
      // Fiş oluşturma hatası siparişi etkilemesin
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({ 
      message: 'Sipariş oluşturulurken bir hata oluştu',
      error: error.message 
    });
  }
});

// Sipariş durumunu güncelle (sadece admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    order.status = status;
    await order.save();

    // Eğer sipariş tamamlandıysa masayı boşalt
    if (status === 'completed') {
      await Table.findOneAndUpdate(
        { number: order.tableNumber },
        { status: 'available' }
      );
    }

    res.json(order);
  } catch (error) {
    console.error('Sipariş durumu güncellenirken hata:', error);
    res.status(500).json({ message: 'Sipariş durumu güncellenirken bir hata oluştu' });
  }
});

// Günlük siparişleri getir
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: today }
    }).populate('items.product');

    res.json(orders);
  } catch (error) {
    console.error('Günlük siparişler getirilirken hata:', error);
    res.status(500).json({ message: 'Günlük siparişler getirilirken bir hata oluştu' });
  }
});

module.exports = router; 