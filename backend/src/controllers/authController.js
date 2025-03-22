const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Varsayılan kullanıcıları oluştur
exports.createDefaultUsers = async () => {
  try {
    // Admin kullanıcısı
    const adminExists = await User.findOne({ username: 'ispiroglu' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('ispiroglu123', 10);
      await User.create({
        username: 'ispiroglu',
        password: adminPassword,
        role: 'admin'
      });
      console.log('Admin kullanıcısı oluşturuldu');
    }

    // Garson kullanıcısı
    const waiterExists = await User.findOne({ username: 'garsonispir' });
    if (!waiterExists) {
      const waiterPassword = await bcrypt.hash('garsonispir123', 10);
      await User.create({
        username: 'garsonispir',
        password: waiterPassword,
        role: 'waiter'
      });
      console.log('Garson kullanıcısı oluşturuldu');
    }
  } catch (error) {
    console.error('Varsayılan kullanıcılar oluşturulurken hata:', error);
  }
};

// Login işlemi
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    console.log('Login isteği:', { username, role });

    // Kullanıcıyı bul
    const user = await User.findOne({ username });
    console.log('Bulunan kullanıcı:', user ? 'Kullanıcı bulundu' : 'Kullanıcı bulunamadı');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Şifre hatalı');
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Rol kontrolü
    if (role && user.role !== role) {
      console.log('Rol uyuşmazlığı');
      return res.status(403).json({
        success: false,
        error: role === 'admin' 
          ? 'Yönetim paneline erişim yetkiniz bulunmamaktadır'
          : 'Masalara erişim yetkiniz bulunmamaktadır'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Token oluşturuldu ve giriş başarılı');

    // Başarılı giriş
    res.status(200).json({
      success: true,
      token,
      data: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Şifre yenileme işlemi
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // auth middleware'den gelen kullanıcı bilgisi

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi kontrol et
    if (user.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        error: 'Mevcut şifre hatalı'
      });
    }

    // Yeni şifreyi güncelle
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Şifre başarıyla güncellendi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 