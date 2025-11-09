const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

// POST /auth/register
// Registra un usuario nuevo. Guarda el hash de la contraseña.
router.post('/register', async (req, res, next) => {
  try {
    const { nombre, email, password, role: requestedRole } = req.body;

    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }

    const existe = await Usuario.findOne({ email });
    if (existe)
      return res.status(409).json({ error: 'El email ya está registrado' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const role = requestedRole === 'admin' ? 'admin' : 'user';

    const usuario = new Usuario({
      nombre,
      email,
      password: hash,
      role,
    });
    await usuario.save();

    const secret = process.env.JWT_SECRET || 'dev_secret_cambia_esto';
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, role: usuario.role },
      secret,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
// Autentica al usuario. Compara contraseñas y devuelve un JWT.
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET || 'dev_secret_cambia_esto';
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, role: usuario.role },
      secret,
      { expiresIn: '1h' }
    );

    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
