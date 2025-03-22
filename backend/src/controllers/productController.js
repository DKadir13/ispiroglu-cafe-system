const Product = require('../models/Product');

// Tüm ürünleri getir
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Yeni ürün ekle
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await Product.create({
      name,
      price: Number(price),
      category,
      description,
      image: imageUrl
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Ürün güncelle
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price: Number(price),
        category,
        description,
        ...(imageUrl && { image: imageUrl })
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Ürün sil
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 