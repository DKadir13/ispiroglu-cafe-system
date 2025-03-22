const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const auth = require('../middleware/auth');
const Product = require('../models/Product');

router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.route('/:id')
  .put(updateProduct)
  .delete(deleteProduct);

// Tüm ürünleri getir
router.get('/all', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Ürünler alınırken hata:', error);
    res.status(500).json({ success: false, error: 'Ürünler alınırken bir hata oluştu' });
  }
});

module.exports = router; 