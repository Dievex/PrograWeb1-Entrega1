const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const Mensaje = require('./models/Mensaje');

dotenv.config();

const productosRouter = require('./routes/productos');
const authRouter = require('./routes/auth'); // Rutas de autenticación (login y registro)
const auth = require('./middleware/auth'); // Middleware para proteger rutas con JWT
const chatRouter = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
let userCount = 0;
// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Ruta publica
app.use('/auth', authRouter);

// Rutas protegidas
app.use('/productos', auth, productosRouter);
app.use('/chat', auth, chatRouter);

// Servir archivos estáticos de media
app.use('/media', express.static(path.join(__dirname, 'media')));

// Socket.IO chat
const setupChat = require('./socket/chatHandler');
setupChat(io);

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Conexión a Mongo y arranque del servidor
const config = require('./config');
const PORT = config.PORT;
const MONGO_URI = config.MONGO_URI;

console.log('Intentando conectar a MongoDB Atlas...');

mongoose
  .connect(MONGO_URI, config.MONGO_OPTIONS)
  .then(() => {
    console.log('Conectado a MongoDB');
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
