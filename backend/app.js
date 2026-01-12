const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const productosRouter = require('./routes/productos');
const authRouter = require('./routes/auth');
const auth = require('./middleware/auth');
const chatRouter = require('./routes/chat');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/auth', authRouter);
app.use('/productos', auth, productosRouter);
app.use('/chat', auth, chatRouter);

app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
