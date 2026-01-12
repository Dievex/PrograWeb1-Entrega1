const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};
