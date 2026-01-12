const Usuario = require('../models/Usuario');

async function findByEmail(email) {
  return Usuario.findOne({ email });
}

async function create({ nombre, email, password, role }) {
  const usuario = new Usuario({ nombre, email, password, role });
  return usuario.save();
}

module.exports = {
  findByEmail,
  create,
};
