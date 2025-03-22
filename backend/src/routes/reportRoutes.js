const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// Google Drive API yapılandırması
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
let drive;

const initializeDrive = async () => {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('credentials.json dosyası bulunamadı:', CREDENTIALS_PATH);
      return;
    }

    const credentials = require(CREDENTIALS_PATH);
    
    // Private key'i düzelt
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    drive = google.drive({ version: 'v3', auth });
    console.log('Google Drive API başarıyla yapılandırıldı');
  } catch (error) {
    console.error('Google Drive API yapılandırma hatası:', error);
  }
};

// API başlatma
initializeDrive();

// Temp klasörünü oluştur
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Günlük siparişleri getir
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await Order.find({
      createdAt: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('items.product');

    res.json({ orders });
  } catch (error) {
    console.error('Günlük siparişler alınırken hata:', error);
    res.status(500).json({ error: 'Günlük siparişler alınırken bir hata oluştu' });
  }
});

// Günlük rapor PDF'ini oluştur, indir ve siparişleri sil
router.post('/save-daily', auth, async (req, res) => {
  try {
    const { orders, totalAmount } = req.body;
    const date = new Date();
    const formattedDate = date.toLocaleDateString('tr-TR').replace(/\./g, '-');
    
    // PDF oluştur
    const doc = new PDFDocument();
    const fileName = `Gunluk_Rapor_${formattedDate}.pdf`;
    
    // Response header'larını ayarla
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // PDF'i response'a pipe et
    doc.pipe(res);
    
    // PDF içeriğini oluştur
    doc.fontSize(20).text(`Günlük Rapor - ${formattedDate}`, { align: 'center' });
    doc.moveDown();
    
    let calculatedTotal = 0;
    
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        doc.fontSize(14).text(`Masa ${order.tableNumber}`);
        doc.fontSize(12);
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            if (item.product && item.product.name) {
              const itemTotal = (item.product.price || 0) * (item.quantity || 0);
              calculatedTotal += itemTotal;
              doc.text(`${item.product.name} x ${item.quantity} = ₺${itemTotal.toFixed(2)}`);
            }
          });
        }
        const orderTotal = order.total || 0;
        doc.text(`Toplam: ₺${orderTotal.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
      });
    } else {
      doc.text('Bugün için sipariş bulunmamaktadır.');
    }
    
    doc.moveDown();
    const finalTotal = totalAmount || calculatedTotal || 0;
    doc.fontSize(16).text(`Günlük Toplam: ₺${finalTotal.toFixed(2)}`, { align: 'right' });
    
    // PDF'i sonlandır
    doc.end();

    // Bugünün başlangıcını ve sonunu hesapla
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugünün siparişlerini sil
    await Order.deleteMany({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

  } catch (error) {
    console.error('Rapor oluşturulurken hata:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Rapor oluşturulurken bir hata oluştu' 
    });
  }
});

module.exports = router; 