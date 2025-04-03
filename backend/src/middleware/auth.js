const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
    }
    console.log(process.env.JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı' });
    }

    req.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({ message: 'Yetkisiz erişim' });
  }
};

module.exports = auth; 