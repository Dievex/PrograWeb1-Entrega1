const mongoose = require('mongoose');
const mensajeSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    color: { type: String, default: '#333', trim: true },
    time: { type: String, required: true },
    sala: { type: String, required: true, trim: true, default: 'general' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mensaje', mensajeSchema);