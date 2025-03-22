const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema); 