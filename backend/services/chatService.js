const mensajeDao = require('../daos/mensajeDao');

async function listarMensajes(sala) {
  const docs = await mensajeDao.listBySala(sala);
  return docs.reverse();
}

async function crearMensaje({ user, text, color, sala }) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  return mensajeDao.create({ user, text, color, time, sala });
}

module.exports = {
  listarMensajes,
  crearMensaje,
};
