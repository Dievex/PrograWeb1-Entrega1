const productoService = require('../services/productoService');

async function listar(req, res, next) {
  try {
    const productos = await productoService.listar();
    res.json(productos);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const nuevo = await productoService.crear(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const actualizado = await productoService.actualizar(req.params.id, req.body);
    if (!actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(actualizado);
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const eliminado = await productoService.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    next(err);
  }
}

async function subirImagen(req, res, next) {
  try {
    const id = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'No se proporcionó archivo' });
    const publicUrl = `/uploads/${req.file.filename}`;
    const prod = await productoService.actualizarImagen(id, publicUrl);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ imagenUrl: publicUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
  eliminar,
  subirImagen,
};
