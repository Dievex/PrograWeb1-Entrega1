const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioDao = require('../daos/usuarioDao');

async function register({ nombre, email, password, role }) {
  if (!nombre || !email || !password) return { error: 'Todos los campos son obligatorios', status: 400 };
  const existe = await usuarioDao.findByEmail(email);
  if (existe) return { error: 'El email ya está registrado', status: 409 };
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const userRole = role === 'admin' ? 'admin' : 'user';
  const usuario = await usuarioDao.create({ nombre, email, password: hash, role: userRole });
  const secret = process.env.JWT_SECRET || 'dev_secret_cambia_esto';
  const token = jwt.sign({ id: usuario._id, email: usuario.email, role: usuario.role }, secret, { expiresIn: '1h' });
  return {
    status: 201,
    data: {
      mensaje: 'Usuario registrado',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
      },
    },
  };
}

async function login({ email, password }) {
  if (!email || !password) return { error: 'Email y contraseña son obligatorios', status: 400 };
  const usuario = await usuarioDao.findByEmail(email);
  if (!usuario) return { error: 'Credenciales inválidas', status: 401 };
  const coincide = await bcrypt.compare(password, usuario.password);
  if (!coincide) return { error: 'Credenciales inválidas', status: 401 };
  const secret = process.env.JWT_SECRET || 'dev_secret_cambia_esto';
  const token = jwt.sign({ id: usuario._id, email: usuario.email, role: usuario.role }, secret, { expiresIn: '1h' });
  return {
    status: 200,
    data: {
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
      },
    },
  };
}

module.exports = {
  register,
  login,
};
