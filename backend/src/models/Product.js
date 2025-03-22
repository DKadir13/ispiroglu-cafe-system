const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması zorunludur']
  },
  price: {
    type: Number,
    required: [true, 'Ürün fiyatı zorunludur'],
    min: [0, 'Fiyat 0\'dan küçük olamaz']
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    enum: ['İçecek', 'Yemek', 'Tatlı', 'Atıştırmalık']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema); 