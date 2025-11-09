const express = require('express');
const router = express.Router();
const Mensaje = require('../models/Mensaje');

router.get('/mensajes', async (req, res, next) => {
  try {
    const sala = (typeof req.query.sala === 'string' ? req.query.sala.trim() : '') || 'general';
    const docs = await Mensaje.find({ sala }).sort({ createdAt: -1 }).limit(50);
    const history = docs.reverse();
    res.json(history);
  } catch (err) {
    next(err);
  }
});


router.post('/mensajes', async (req, res, next) => {
  try {
    const text = (typeof req.body.text === 'string' ? req.body.text : '').trim();
    if (!text) return res.status(400).json({ error: 'Texto del mensaje requerido' });

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const userLabel = req.user?.email || req.user?.id || 'Usuario';
    const color = (typeof req.body.color === 'string' ? req.body.color.trim() : '#333');
    const sala = (typeof req.body.sala === 'string' ? req.body.sala.trim() : '') || 'general';

    const nuevo = new Mensaje({ user: userLabel, text, color, time, sala });
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
   