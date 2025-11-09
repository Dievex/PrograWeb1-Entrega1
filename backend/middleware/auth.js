const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token)
      return res.status(401).json({ error: 'Token no proporcionado' });

    const secret = process.env.JWT_SECRET || 'dev_secret_cambia_esto';
    const payload = jwt.verify(token, secret);

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
