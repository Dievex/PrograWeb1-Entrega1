const Producto = require('../models/Producto');

async function findAll() {
  return Producto.find().sort({ createdAt: -1 });
}

async function create(data) {
  const nuevo = new Producto(data);
  return nuevo.save();
}

async function updateById(id, data) {
  return Producto.findByIdAndUpdate(id, data, { new: true });
}

async function deleteById(id) {
  return Producto.findByIdAndDelete(id);
}

async function setImage(id, imagenUrl) {
  const prod = await Producto.findById(id);
  if (!prod) return null;
  prod.imagenUrl = imagenUrl;
  await prod.save();
  return prod;
}

module.exports = {
  findAll,
  create,
  updateById,
  deleteById,
  setImage,
};
