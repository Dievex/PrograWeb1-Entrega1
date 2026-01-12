const chatService = require('../services/chatService');

async function list(req, res, next) {
  try {
    const sala =
      (typeof req.query.sala === 'string' ? req.query.sala.trim() : '') ||
      'general';
    const history = await chatService.listarMensajes(sala);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const text =
      (typeof req.body.text === 'string' ? req.body.text : '').trim();
    if (!text) return res.status(400).json({ error: 'Texto del mensaje requerido' });
    const userLabel = req.user?.email || req.user?.id || 'Usuario';
    const color =
      (typeof req.body.color === 'string' ? req.body.color.trim() : '#333');
    const sala =
      (typeof req.body.sala === 'string' ? req.body.sala.trim() : '') ||
      'general';
    const nuevo = await chatService.crearMensaje({
      user: userLabel,
      text,
      color,
      sala,
    });
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
};
