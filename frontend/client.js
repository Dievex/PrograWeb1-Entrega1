const API_URL = "http://localhost:3001";
let productos = [];
let paginaActual = 1;
const porPagina = 6;
let ordenCampo = null;
let ordenAsc = true;

const tbody = document.querySelector("#tabla-productos tbody");
const spinner = document.getElementById("spinner");
const mensaje = document.getElementById("mensaje") || document.getElementById("mensaje");

const PAGE = (document.body && document.body.dataset && document.body.dataset.page) ? document.body.dataset.page : 'index';

// Tabs
const tabsBar = document.getElementById('tabs');
const tabProductosBtn = document.getElementById('tab-productos');
const tabChatBtn = document.getElementById('tab-chat');
const appDiv = document.getElementById('app');
const chatDiv = document.getElementById('chat');

// Elementos del chat
let socket = null;
let chatInitialized = false;
let historyVisible = false;
const messagesEl = document.getElementById('messages');
const formChat = document.getElementById('form-chat');
const inputChat = document.getElementById('input-chat');
const userCountEl = document.getElementById('user-count');
const currentUsernameEl = document.getElementById('current-username');
let currentUsername = sessionStorage.getItem('nombre') || 'Anónimo';
const typingEl = document.getElementById('typing');
let typingTimeout;
const colorInput = document.getElementById('color');
const setColorBtn = document.getElementById('set-color');
let audioCtx;
function resumeAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
['click','keydown','touchstart'].forEach(function(ev){ window.addEventListener(ev, resumeAudio, { once: true }); });
const audioEl = document.getElementById('fart-audio');
audioEl && (audioEl.volume = 0.9);
let audioEnabled = false;
function unlockAudio() {
  audioEnabled = true;
  if (!audioEl) return;
  var playPromise = audioEl.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(function(){ audioEl.pause(); audioEl.currentTime = 0; }).catch(function(){ audioEnabled = false; });
  } else { audioEl.pause(); audioEl.currentTime = 0; }
}
['click','keydown','touchstart'].forEach(function(ev){ window.addEventListener(ev, unlockAudio, { once: true }); });
function playFart() {
  if (!audioEnabled || !audioEl) return; // evita error antes del desbloqueo
  audioEl.currentTime = 0;
  var p = audioEl.play();
  if (p && typeof p.then === 'function') { p.catch(function(){ /* ignore */ }); }
}

function showTab(tab) {
  if (!appDiv || !chatDiv || !tabProductosBtn || !tabChatBtn) return;
  if (tab === 'productos') {
    appDiv.style.display = 'block';
    chatDiv.style.display = 'none';
    tabProductosBtn.classList.add('active');
    tabChatBtn.classList.remove('active');
  } else if (tab === 'chat') {
    appDiv.style.display = 'none';
    chatDiv.style.display = 'block';
    tabProductosBtn.classList.remove('active');
    tabChatBtn.classList.add('active');
    initChatIfNeeded();
  }
}

const btnCargarEl_v2 = document.getElementById("btn-cargar");
if (btnCargarEl_v2) btnCargarEl_v2.addEventListener("click", cargarProductos);
const busquedaEl_v2 = document.getElementById("busqueda");
if (busquedaEl_v2) busquedaEl_v2.addEventListener("input", renderProductos);
const formProductoEl = document.getElementById("form-producto");
const tituloAnadirEl = document.getElementById('titulo-anadir');
if (formProductoEl) formProductoEl.addEventListener("submit", agregarProducto);
document.querySelectorAll("#tabla-productos th[data-field]").forEach(th => {
  th.addEventListener("click", () => ordenarPor(th.dataset.field));
});

if (tabProductosBtn) tabProductosBtn.addEventListener('click', () => { window.location.href = 'productos.html'; });
if (tabChatBtn) tabChatBtn.addEventListener('click', () => { window.location.href = 'chat.html'; });

let authToken = sessionStorage.getItem('token') || null; // Guarda el token en sessionStorage
let currentUserRole = sessionStorage.getItem('role') || null; // Guarda el rol en sessionStorage
function isAdmin() { return currentUserRole === 'admin'; }

// Mostrar/ocultar pantallas según si hay token y rol
function actualizarPantallas() {
  const authDiv = document.getElementById('auth');
  const showTabs = !!authToken;

  if (tabsBar) tabsBar.style.display = showTabs ? 'block' : 'none';
  if (authDiv) authDiv.style.display = showTabs ? 'none' : 'block';

  // Sin token: ocultar contenido de app/chat
  if (!showTabs) {
    if (appDiv) appDiv.style.display = 'none';
    if (chatDiv) chatDiv.style.display = 'none';
    return;
  }

  // Con token: mostrar según la página actual
  if (PAGE === 'chat') {
    if (appDiv) appDiv.style.display = 'none';
    if (chatDiv) chatDiv.style.display = 'block';
    initChatIfNeeded();
  } else if (PAGE === 'productos') {
    if (appDiv) appDiv.style.display = 'block';
    if (chatDiv) chatDiv.style.display = 'none';
  } else {
    if (appDiv) appDiv.style.display = 'block';
    if (chatDiv) chatDiv.style.display = 'none';
  }

  // Ocultar formulario de añadir producto si no es admin
  if (formProductoEl) {
    formProductoEl.style.display = isAdmin() ? 'block' : 'none';
  }
  if (tituloAnadirEl) {
    tituloAnadirEl.style.display = isAdmin() ? 'block' : 'none';
  }
}

// Toggle login y registro
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
if (showRegister) {
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    const lf = document.getElementById('login-form');
    const rf = document.getElementById('register-form');
    if (lf && rf) {
      lf.style.display = 'none';
      rf.style.display = 'block';
    }
    showRegister.style.display = 'none';
    if (showLogin) showLogin.style.display = 'inline';
  });
}
if (showLogin) {
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    const lf = document.getElementById('login-form');
    const rf = document.getElementById('register-form');
    if (lf && rf) {
      lf.style.display = 'block';
      rf.style.display = 'none';
    }
    if (showRegister) showRegister.style.display = 'inline';
    showLogin.style.display = 'none';
  });
}

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    authToken = data.token;
    currentUserRole = (data && data.usuario && data.usuario.role) ? data.usuario.role : null;
    const nombreDB = (data && data.usuario && data.usuario.nombre) ? data.usuario.nombre : 'Anónimo';
    currentUsername = nombreDB;
    if (currentUsernameEl) { if (currentUsernameEl) { if (currentUsernameEl) { currentUsernameEl.textContent = 'Tu nombre: ' + currentUsername; } } }
    sessionStorage.setItem('token', authToken);
    if (currentUserRole) sessionStorage.setItem('role', currentUserRole); else sessionStorage.removeItem('role');
    sessionStorage.setItem('nombre', currentUsername);
    // Redirigir a página de productos tras login exitoso
    window.location.replace('productos.html');
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
});

// Registro para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.log('Falló el registro del ServiceWorker:', error);
      });
  });
}

// Registro
const registerForm = document.getElementById('register-form');
if (registerForm) registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('register-nombre').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrarse');
    authToken = data.token;
    currentUserRole = (data && data.usuario && data.usuario.role) ? data.usuario.role : null;
    const nombreDB = (data && data.usuario && data.usuario.nombre) ? data.usuario.nombre : nombre || 'Anónimo';
    currentUsername = nombreDB;
    if (currentUsernameEl) { currentUsernameEl.textContent = 'Tu nombre: ' + currentUsername; }
    sessionStorage.setItem('token', authToken);
    if (currentUserRole) sessionStorage.setItem('role', currentUserRole); else sessionStorage.removeItem('role');
    sessionStorage.setItem('nombre', currentUsername);
    // Redirigir a página de productos tras registro exitoso
    window.location.replace('productos.html');
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
});

// Logout
function doLogout() {
  authToken = null;
  currentUserRole = null;
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('nombre');
  mostrarMensaje('Sesión cerrada', 'ok');
  window.location.replace('auth.html');
}

document.addEventListener('click', function(e) {
  const btn = e.target && e.target.closest && e.target.closest('#logout-btn');
  if (btn) {
    e.preventDefault();
    doLogout();
  }
});

// Adjuntar en DOMContentLoaded y actualizar pantallas de forma segura
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', function(e){ e.preventDefault(); doLogout(); });
    actualizarPantallas();
  });
} else {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', function(e){ e.preventDefault(); doLogout(); });
  actualizarPantallas();
}

function initChatIfNeeded() {
  if (chatInitialized) return;
  if (typeof window.io !== 'function') {
    console.error('[chat] Socket.IO client no está disponible (script /socket.io/socket.io.js no cargado)');
    mostrarMensaje('No se pudo cargar el cliente de chat. Revisa la conexión.', 'error');
    return;
  }
  socket = io('http://localhost:3001', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });
  chatInitialized = true;

  // Estados de conexión y errores
  const roomSelect = document.getElementById('room');
  const joinRoomBtn = document.getElementById('join-room');
  let currentRoom = 'general';
  socket.on('connect', function(){
    console.log('[chat] conectado con id', socket.id);
    mostrarMensaje('Conectado al chat', 'ok');
    currentUsername = sessionStorage.getItem('nombre') || currentUsername || 'Anónimo';
    if (currentUsernameEl) { currentUsernameEl.textContent = 'Tu nombre: ' + currentUsername; }
    socket.emit('set username', currentUsername);
    currentRoom = (roomSelect && roomSelect.value) ? roomSelect.value : 'general';
    socket.emit('join room', currentRoom);
  });
  socket.on('disconnect', function(reason){
    console.warn('[chat] desconectado:', reason);
  });
  socket.on('connect_error', function(err){
    console.error('[chat] error de conexión:', err);
    mostrarMensaje('Error conectando al chat: ' + (err.message || err), 'error');
  });

  // Actualizar contador de usuarios conectados
  socket.on('userCount', function (count) {
    if (userCountEl) { userCountEl.textContent = 'Usuarios conectados: ' + count; }
  });

  setColorBtn.addEventListener('click', function () {
    var color = (colorInput.value || '').trim();
    if (socket && socket.connected) {
      socket.emit('set color', color);
    }
  });

  formChat.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!socket || !socket.connected) {
      mostrarMensaje('No conectado al chat todavía. Reintenta en unos segundos.', 'error');
      return;
    }
    if (inputChat.value) {
      socket.emit('chat message', inputChat.value);
      socket.emit('stop typing');
      inputChat.value = '';
    }
  });

  inputChat.addEventListener('input', function () {
    if (socket && socket.connected) {
      socket.emit('typing');
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(function () {
        socket.emit('stop typing');
      }, 800);
    }
  });

  socket.on('chat message', function (msg) {
    var li = document.createElement('li');
    li.textContent = (msg.user ? msg.user + ': ' : '') + msg.text;
    if (msg.color) { li.style.color = msg.color; }
    messagesEl.appendChild(li);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    playFart();
  });

  socket.on('typing', function (data) {
    typingEl.textContent = data.user + ' está escribiendo...';
  });

  socket.on('stop typing', function () {
    typingEl.textContent = '';
  });
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', function(){
      if (!socket || !socket.connected) {
        return mostrarMensaje('No conectado al chat todavía. Reintenta en unos segundos.', 'error');
      }
      const nextRoom = (roomSelect && roomSelect.value) ? roomSelect.value : 'general';
      if (nextRoom === currentRoom) return;
      currentRoom = nextRoom;
      socket.emit('join room', currentRoom);
      messagesEl.innerHTML = '';
      socket.emit('request history', { sala: currentRoom });
    });
  }
  const btnHistorial = document.getElementById('btn-historial');
  if (btnHistorial) {
    btnHistorial.addEventListener('click', function(){
      if (!socket || !socket.connected) {
        mostrarMensaje('Todavía no está conectado al chat.', 'error');
        return;
      }
      if (!historyVisible) {
        socket.emit('request history', { sala: currentRoom });
      } else {
        try {
          messagesEl.querySelectorAll('.history-item').forEach(function(el){ el.remove(); });
        } catch (e) { console.error('[chat] error ocultando historial:', e); }
        historyVisible = false;
        btnHistorial.textContent = 'Mostrar historial';
      }
    });
  }

  // Renderizar historial recibido
  socket.on('chat history', function (history) {
    try {
      if (!Array.isArray(history)) return;
      messagesEl.querySelectorAll('.history-item').forEach(function(el){ el.remove(); });
      history.forEach(function (msg) {
        var li = document.createElement('li');
        li.textContent = (msg.user ? msg.user + ': ' : '') + msg.text;
        if (msg.color) { li.style.color = msg.color; }
        li.classList.add('history-item');
        messagesEl.appendChild(li);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
      historyVisible = true;
      if (btnHistorial) { btnHistorial.textContent = 'Ocultar historial'; }
    } catch (e) {
      console.error('[chat] error renderizando historial:', e);
    }
  });
}

// Enviar Authorization en todas las peticiones protegidas
async function cargarProductos() {
  mostrarSpinner(true);
  try {
    const res = await fetch(`${API_URL}/productos`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    if (!res.ok) throw new Error('Error al cargar productos');
    productos = await res.json();
    paginaActual = 1;
    renderProductos();
    mostrarMensaje('Productos cargados', 'ok');
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  } finally {
    mostrarSpinner(false);
  }
}

async function eliminarProducto(id) {
  if (!isAdmin()) { return mostrarMensaje('Esta acción requiere rol administrador', 'error'); }
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    productos = productos.filter(p => p._id !== id);
    renderProductos();
    mostrarMensaje('Producto eliminado', 'ok');
  } catch {
    mostrarMensaje('Error al eliminar producto', 'error');
  }
}

async function guardarProducto(id) {
  if (!isAdmin()) { return mostrarMensaje('Esta acción requiere rol administrador', 'error'); }
  const inputs = document.querySelectorAll(`input[data-id="${id}"]`);
  const actualizado = {};
  inputs.forEach(i => {
    actualizado[i.dataset.field] = i.type === 'number' ? parseFloat(i.value) : i.value;
    i.disabled = true;
  });

  // Usar el input de archivo de la fila (edición por producto)
  const inputImagenFila = document.querySelector(`input[type="file"][data-id="${id}"]`);
  const nuevaImagen = inputImagenFila && inputImagenFila.files && inputImagenFila.files[0] ? inputImagenFila.files[0] : null;

  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(actualizado)
    });

    // Si hay imagen nueva, subirla
    if (nuevaImagen) {
      const fd = new FormData();
      fd.append('imagen', nuevaImagen);
      const resImg = await fetch(`${API_URL}/productos/${id}/imagen`, {
        method: 'POST',
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: fd
      });
      if (resImg.ok) {
        const dataImg = await resImg.json();
        actualizado.imagenUrl = dataImg.imagenUrl;
      }
    }

    productos = productos.map(p => p._id === id ? { ...p, ...actualizado } : p);
    renderProductos();
    mostrarMensaje('Producto actualizado', 'ok');
  } catch {
    mostrarMensaje('Error al actualizar producto', 'error');
  }
}

async function agregarProducto(e) {
  e.preventDefault();
  if (!isAdmin()) { return mostrarMensaje('Esta acción requiere rol administrador', 'error'); }

  const nombre = document.getElementById('nombre').value.trim();
  const precio = parseFloat(document.getElementById('precio').value);
  const descripcion = document.getElementById('descripcion').value.trim();
  const imagenFile = document.getElementById('imagen').files[0] || null;

  if (!nombre) return mostrarMensaje('El nombre no puede estar vacío', 'error');
  if (precio <= 0 || isNaN(precio)) return mostrarMensaje('El precio debe ser mayor que 0', 'error');
  if (!descripcion) return mostrarMensaje('La descripción no puede estar vacía', 'error');

  const nuevo = { nombre, precio, descripcion };

  try {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(nuevo)
    });
    const creado = await res.json();

    if (imagenFile && creado && creado._id) {
      const fd = new FormData();
      fd.append('imagen', imagenFile);
      const resImg = await fetch(`${API_URL}/productos/${creado._id}/imagen`, {
        method: 'POST',
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: fd
      });
      if (resImg.ok) {
        const dataImg = await resImg.json();
        creado.imagenUrl = dataImg.imagenUrl;
      }
    }

    productos.push(creado);
    renderProductos();
    e.target.reset();
    mostrarMensaje('Producto añadido', 'ok');
  } catch {
    mostrarMensaje('Error al añadir producto', 'error');
  }
}

const gridProductos = document.getElementById('grid-productos');
function renderProductos() {
  let filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(document.getElementById("busqueda").value.toLowerCase())
  );

  if (ordenCampo) {
    filtrados.sort((a, b) => {
      if (a[ordenCampo] < b[ordenCampo]) return ordenAsc ? -1 : 1;
      if (a[ordenCampo] > b[ordenCampo]) return ordenAsc ? 1 : -1;
      return 0;
    });
  }

  const inicio = (paginaActual - 1) * porPagina;
  const visibles = filtrados.slice(inicio, inicio + porPagina);

  if (!gridProductos) return;
  gridProductos.innerHTML = "";

  visibles.forEach(p => {
    const accionesVisible = isAdmin();
    const defaultImageUrl = `${API_URL}/uploads/placeholder.png`;
    const imgSrc = p.imagenUrl ? (API_URL + p.imagenUrl) : defaultImageUrl;
    const mediaHtml = `<img src="${imgSrc}" alt="${p.nombre}" onerror="this.src='${defaultImageUrl}'">`;
    const inputsHtml = accionesVisible ? `
      <div class="product-inputs">
        <input type="text" value="${p.nombre}" data-id="${p._id}" data-field="nombre" disabled>
        <input type="number" value="${p.precio}" data-id="${p._id}" data-field="precio" disabled>
        <input type="text" value="${p.descripcion}" data-id="${p._id}" data-field="descripcion" disabled>
        <input type="file" accept="image/*" data-id="${p._id}" data-field="imagen" class="imagen-input-row" style="display:none">
      </div>
    ` : `
      <div class="product-text">
        <div class="product-title">${p.nombre}</div>
        <div class="product-price">$ ${p.precio}</div>
        <div class="product-desc">${p.descripcion}</div>
      </div>
    `;

    const actionsHtml = accionesVisible ? `
      <div class="product-actions">
        <button class="edit-btn" onclick="editarProducto('${p._id}')">Editar</button>
        <button class="save-btn" onclick="guardarProducto('${p._id}')" style="display:none">Guardar</button>
        <button class="delete-btn" onclick="eliminarProducto('${p._id}')">Eliminar</button>
      </div>
    ` : '';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media">
        ${mediaHtml}
        <span class="product-badge">Party Deal</span>
      </div>
      <div class="product-info">
        ${inputsHtml}
      </div>
      ${actionsHtml}
    `;
    gridProductos.appendChild(card);
  });

  renderPaginacion(filtrados.length);
}

function renderPaginacion(total) {
  const totalPaginas = Math.ceil(total / porPagina);
  const pagDiv = document.getElementById("paginacion");
  pagDiv.innerHTML = "";
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.style.background = "#0056b3";
    btn.addEventListener("click", () => {
      paginaActual = i;
      renderProductos();
    });
  }
  pagDiv.appendChild(document.createTextNode("Página: "));
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.style.background = "#0056b3";
    btn.addEventListener("click", () => {
      paginaActual = i;
      renderProductos();
    });
    pagDiv.appendChild(btn);
  }
}

function ordenarPor(campo) {
  if (ordenCampo === campo) {
    ordenAsc = !ordenAsc;
  } else {
    ordenCampo = campo;
    ordenAsc = true;
  }
  renderProductos();
}

function editarProducto(id) {
  if (!isAdmin()) { return mostrarMensaje('Esta acción requiere rol administrador', 'error'); }
  const inputs = document.querySelectorAll(`input[data-id="${id}"]:not([type="file"])`);
  inputs.forEach(i => {
    i.disabled = !i.disabled;
  });
  const saveBtn = document.querySelector(`button.save-btn[onclick="guardarProducto('${id}')"]`);
  const editBtn = document.querySelector(`button.edit-btn[onclick="editarProducto('${id}')"]`);
  if (saveBtn && editBtn) {
    const isDisabled = inputs[0] ? inputs[0].disabled : true;
    saveBtn.style.display = isDisabled ? 'none' : 'inline';
    editBtn.textContent = isDisabled ? 'Editar' : 'Cancelar';
    const fileInput = document.querySelector(`input[type="file"][data-id="${id}"]`);
    if (fileInput) {
      fileInput.style.display = isDisabled ? 'none' : 'block';
      if (isDisabled) { fileInput.value = ''; }
    }
  }
}

function mostrarSpinner(show) {
  spinner.style.display = show ? 'block' : 'none';
}

function mostrarMensaje(texto, tipo) {
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  setTimeout(() => {
    mensaje.textContent = '';
    mensaje.className = 'mensaje';
  }, 3000);
}

if (tabProductosBtn) {
  tabProductosBtn.addEventListener('click', () => { window.location.href = 'productos.html'; });
}
if (tabChatBtn) {
  tabChatBtn.addEventListener('click', () => { window.location.href = 'chat.html'; });
}
const sortBtns = document.querySelectorAll('.sort-btn');
sortBtns.forEach(btn => {
  btn.addEventListener('click', () => ordenarPor(btn.dataset.field));
});