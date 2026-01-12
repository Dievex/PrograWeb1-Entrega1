const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
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

router.get('/', productosController.listar);

router.post('/', requireAdmin, productosController.crear);

router.put('/:id', requireAdmin, productosController.actualizar);

router.delete('/:id', requireAdmin, productosController.eliminar);

// Subir imagen de producto (solo admin)
router.post('/:id/imagen', requireAdmin, upload.single('imagen'), productosController.subirImagen);

module.exports = router;
