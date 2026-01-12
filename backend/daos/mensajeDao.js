const Mensaje = require('../models/Mensaje');

async function listBySala(sala, limit = 50) {
  return Mensaje.find({ sala }).sort({ createdAt: -1 }).limit(limit);
}

async function create({ user, text, color, time, sala }) {
  const nuevo = new Mensaje({ user, text, color, time, sala });
  return nuevo.save();
}

module.exports = {
  listBySala,
  create,
};
