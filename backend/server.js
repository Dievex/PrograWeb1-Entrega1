const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { setupApollo } = require('./graphql/apollo');

dotenv.config();

const app = require('./app');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO chat
const setupChat = require('./socket/chatHandler');
setupChat(io);

// Conexión a Mongo y arranque del servidor
const config = require('./config');
const PORT = config.PORT;
const MONGO_URI = config.MONGO_URI;

console.log('Intentando conectar a MongoDB Atlas...');

mongoose
  .connect(MONGO_URI, config.MONGO_OPTIONS)
  .then(async () => {
    console.log('Conectado a MongoDB');

    await setupApollo(app);

    if (config.NODE_ENV !== 'test') {
      server.listen(PORT, () =>
        console.log(`Servidor en http://localhost:${PORT}`)
      );
    }
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB', err);
    process.exit(1);
  });

module.exports = app;
