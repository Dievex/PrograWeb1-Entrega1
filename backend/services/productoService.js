const productoDao = require('../daos/productoDao');

async function listar() {
  return productoDao.findAll();
}

async function crear(data) {
  return productoDao.create(data);
}

async function actualizar(id, data) {
  return productoDao.updateById(id, data);
}

async function eliminar(id) {
  return productoDao.deleteById(id);
}

async function actualizarImagen(id, imagenUrl) {
  return productoDao.setImage(id, imagenUrl);
}

module.exports = {
  listar,
  crear,
  actualizar,
  eliminar,
  actualizarImagen,
};
