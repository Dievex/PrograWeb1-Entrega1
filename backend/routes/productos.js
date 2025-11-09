const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Verificar rol admin
function requireAdmin(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Requiere rol administrador' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Configuración de subida de imágenes (multer)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

// Obtener todos (usuarios autenticados pueden ver)
router.get('/', async (req, res, next) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (err) {
    next(err);
  }
});

// Crear (solo admin)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
});

// Actualizar (solo admin)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!actualizado)
      return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(actualizado);
  } catch (err) {
    next(err);
  }
});

// Eliminar (solo admin)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const eliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!eliminado)
      return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    next(err);
  }
});

// Subir imagen de producto (solo admin)
router.post(
  '/:id/imagen',
  requireAdmin,
  upload.single('imagen'),
  async (req, res, next) => {
    try {
      const prod = await Producto.findById(req.params.id);
      if (!prod)
        return res.status(404).json({ error: 'Producto no encontrado' });
      if (!req.file)
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      const publicUrl = `/uploads/${req.file.filename}`;
      prod.imagenUrl = publicUrl;
      await prod.save();
      res.json({ imagenUrl: publicUrl });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
