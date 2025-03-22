const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Table = require('../models/Table');

// Tüm masaları getir
router.get('/', auth, async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json({ success: true, data: tables });
  } catch (error) {
    console.error('Masalar alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Masalar alınırken bir hata oluştu' });
  }
});

// Masa sayısını güncelle
router.post('/update-count', auth, async (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || count < 1) {
      return res.status(400).json({ error: 'Geçersiz masa sayısı' });
    }

    // Mevcut masaları sil
    await Table.deleteMany({});

    // Yeni masaları oluştur
    const tables = [];
    for (let i = 1; i <= count; i++) {
      tables.push({
        number: i,
        status: 'empty'
      });
    }

    await Table.insertMany(tables);
    const updatedTables = await Table.find().sort({ number: 1 });
    
    res.json(updatedTables);
  } catch (error) {
    console.error('Masa sayısı güncellenirken hata:', error);
    res.status(500).json({ error: 'Masa sayısı güncellenirken bir hata oluştu' });
  }
});

// Masa durumunu güncelle
router.patch('/:number/status', auth, async (req, res) => {
  try {
    const { number } = req.params;
    const { status } = req.body;

    const table = await Table.findOneAndUpdate(
      { number: parseInt(number) },
      { status },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ error: 'Masa bulunamadı' });
    }

    res.json(table);
  } catch (error) {
    console.error('Masa durumu güncellenirken hata:', error);
    res.status(500).json({ error: 'Masa durumu güncellenirken bir hata oluştu' });
  }
});

// Yeni masa ekle (sadece admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const { number } = req.body;
    const table = new Table({ number });
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    console.error('Masa eklenirken hata:', error);
    res.status(500).json({ message: 'Masa eklenirken bir hata oluştu' });
  }
});

// Masa sil (sadece admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Masa başarıyla silindi' });
  } catch (error) {
    console.error('Masa silinirken hata:', error);
    res.status(500).json({ message: 'Masa silinirken bir hata oluştu' });
  }
});

module.exports = router; 