const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı zorunludur'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Şifre zorunludur'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'waiter'],
    required: [true, 'Kullanıcı rolü zorunludur']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 