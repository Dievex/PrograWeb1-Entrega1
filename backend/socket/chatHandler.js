const Mensaje = require('../models/Mensaje');

module.exports = function setupChat(io) {
  let userCount = 0;
  const COLORS = [
    '#e53935',
    '#8e24aa',
    '#3949ab',
    '#1e88e5',
    '#00897b',
    '#43a047',
    '#f4511e',
    '#6d4c41',
    '#546e7a',
    '#e91e63',
  ];
  const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  io.on('connection', (socket) => {
    console.log('[io] nuevo cliente conectado:', socket.id);
    socket.data.username = 'Anónimo';
    socket.data.color = pickColor();
    socket.data.sala = 'general';
    socket.join(socket.data.sala);
    userCount++;
    io.emit('userCount', userCount);

    io.to(socket.data.sala).emit('system message', {
      type: 'join',
      user: socket.data.username,
      text: `${socket.data.username} se ha unido a la sala ${socket.data.sala}`,
    });

    socket.on('join room', (roomName) => {
      const cleanName = (typeof roomName === 'string' ? roomName.trim() : '') || 'general';
      const sanitized = cleanName.replace(/[^\w\-]/g, '').slice(0, 30) || 'general';
      const previous = socket.data.sala || 'general';
      if (previous === sanitized) return;
      socket.leave(previous);
      socket.join(sanitized);
      socket.data.sala = sanitized;
      io.to(previous).emit('system message', {
        type: 'leave',
        user: socket.data.username,
        text: `${socket.data.username} ha salido de la sala ${previous}`,
      });
      io.to(sanitized).emit('system message', {
        type: 'join',
        user: socket.data.username,
        text: `${socket.data.username} se ha unido a la sala ${sanitized}`,
      });
      socket.emit('room joined', { sala: sanitized });
    });

    socket.on('set username', (name) => {
      const previous = socket.data.username;
      const cleanName =
        (typeof name === 'string' ? name.trim() : '').slice(0, 30) || 'Anónimo';
      socket.data.username = cleanName;
      if (previous !== cleanName) {
        io.to(socket.data.sala).emit('system message', {
          type: 'join',
          user: cleanName,
          text: `${cleanName} se ha unido al chat`,
        });
      }
    });

    socket.on('set color', (color) => {
      const isValidHex =
        typeof color === 'string' &&
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
      if (isValidHex) {
        socket.data.color = color.trim();
      }
    });

    // Mostrar historial (por sala)
    socket.on('request history', (payload = {}) => {
      const sala = (payload && typeof payload.sala === 'string' ? payload.sala.trim() : socket.data.sala) || 'general';
      Mensaje.find({ sala })
        .sort({ createdAt: -1 })
        .limit(50)
        .then((docs) => {
          const history = docs.reverse().map((d) => ({
            user: d.user,
            text: d.text,
            color: d.color,
            time: d.time,
            sala: d.sala,
          }));
          socket.emit('chat history', history);
        })
        .catch((err) => {
          console.error('[io] error cargando historial:', err);
        });
    });

    socket.on('chat message', (msg) => {
      const text = (typeof msg === 'string' ? msg : String(msg)).trim();
      if (!text) return;
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sala = socket.data.sala || 'general';
      console.log('[io] mensaje recibido de', socket.data.username, 'en sala', sala, ':', text);

      const payload = {
        user: socket.data.username,
        text,
        color: socket.data.color,
        time,
        sala,
      };
      // Guardar en BD y luego emitir solo a la sala
      Mensaje.create(payload)
        .then(() => {
          io.to(sala).emit('chat message', payload);
          // Limitar historial a 50 mensajes por sala
          Mensaje.countDocuments({ sala })
            .then((count) => {
              if (count > 50) {
                Mensaje.find({ sala })
                  .sort({ createdAt: -1 })
                  .skip(50)
                  .select('_id')
                  .then((oldDocs) => {
                    const ids = oldDocs.map((d) => d._id);
                    if (ids.length) {
                      Mensaje.deleteMany({ _id: { $in: ids } }).catch((err) => {
                        console.error('[io] error limitando historial:', err);
                      });
                    }
                  })
                  .catch((err) =>
                    console.error('[io] error buscando mensajes antiguos:', err)
                  );
              }
            })
            .catch((err) => console.error('[io] error contando mensajes:', err));
        })
        .catch((err) => {
          console.error('[io] error guardando mensaje:', err);
          io.to(sala).emit('chat message', payload);
        });
    });

    socket.on('typing', () => {
      socket.to(socket.data.sala || 'general').emit('typing', { user: socket.data.username });
    });
    socket.on('stop typing', () => {
      socket.to(socket.data.sala || 'general').emit('stop typing', { user: socket.data.username });
    });

    socket.on('disconnect', () => {
      userCount = Math.max(userCount - 1, 0);
      io.emit('userCount', userCount);
      const name = socket.data.username || 'Anónimo';
      const sala = socket.data.sala || 'general';
      console.log('[io] cliente desconectado:', socket.id, 'usuario:', name, 'sala:', sala);
      io.to(sala).emit('system message', {
        type: 'leave',
        user: name,
        text: `${name} ha salido del chat`,
      });
    });
  });
}