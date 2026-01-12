# PrograWeb1 – Proyecto Tienda
## Requisitos previos
- Node.js `>= 18` (probado con Node 20)
- MongoDB (local o Atlas)
- Navegador moderno

## Tecnologías utilizadas
- Backend: `Node.js`, `Express`, `Mongoose`, `JWT (jsonwebtoken)`, `Multer`, `Socket.IO`, `Morgan`, `CORS`
- Frontend: `HTML`, `CSS`, `JavaScript` (sin framework), `Service Worker` y `Manifest` para PWA básica
- Testing: `Jest` y `Supertest`
- Estilo/código: `ESLint` y `Prettier`

## Estructura del proyecto
```
/ backend
  server.js               # Punto de entrada Express + Socket.IO
  config.js               # Variables de entorno y opciones de conexión
  middleware/auth.js      # Verificación de JWT y extracción de usuario
  routes/
    auth.js               # Registro y login
    productos.js          # CRUD de productos (protegido + rol admin)
    chat.js               # API REST de mensajes de chat
  models/
    Usuario.js, Producto.js, Mensaje.js
  socket/chatHandler.js   # Lógica de eventos Socket.IO por sala
  tests/productos.test.js # Pruebas (ver consideraciones más abajo)

/ frontend
  index.html              # Redirección inicial según sesión
  auth.html               # Pantalla de login/registro
  productos.html          # Vista principal de productos
  chat.html               # Vista del chat
  client.js               # Lógica de la SPA básica
  styles.css              # Estilos
  manifest.json           # PWA
  service-worker.js       # Cache básico (requiere servir via HTTP)
```

## Configuración
Crear un archivo `.env` en `backend/` con al menos:
```
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/productos
JWT_SECRET=pon-una-clave-segura-aqui
```
- `MONGO_URI`: usar su instancia local o una URI de MongoDB Atlas.
- `JWT_SECRET`: clave privada para firmar tokens.
- `PORT`: puerto del backend.

## Instalación
Backend:
1. `cd backend`
2. `npm install`

Frontend: no requiere instalación (HTML/CSS/JS estático).

## Ejecución
Backend:
- Desarrollo con recarga: `npm run dev`
- Producción/simple: `npm start`
- El servidor arrancará en `http://localhost:3001` (o el `PORT` configurado).

Frontend:
- Abrir `frontend/index.html` o `frontend/auth.html` en el navegador.
- Para que el Service Worker funcione, es necesario servir los archivos por HTTP y que la ruta `/service-worker.js` sea accesible desde el origen del frontend. En la versión subida al servidor web de Digital Ocean esta caracteristica no esta disponible.
- La variable `API_URL` en `frontend/client.js` apunta a `http://localhost:3001` en el servidor apuntara a `http://tu_ip_del_servidor:3001`.

## Endpoints principales
Autenticación (`/auth`):
- `POST /auth/register` → body `{ nombre, email, password, role? }` devuelve `{ token, usuario }`.
- `POST /auth/login` → body `{ email, password }` devuelve `{ token, usuario }`.

Productos (protegido con `Authorization: Bearer <token>` y rol admin para mutaciones):
- `GET /productos` → lista de productos.
- `POST /productos` (admin) → crea producto.
- `PUT /productos/:id` (admin) → actualiza producto.
- `DELETE /productos/:id` (admin) → elimina producto.
- `POST /productos/:id/imagen` (admin) `multipart/form-data` con campo `imagen` → guarda imagen en `uploads/` y asocia `imagenUrl`.

Chat:
- REST: `GET /chat/mensajes?sala=general` y `POST /chat/mensajes` (protegidos por JWT).
- Tiempo real: Socket.IO con eventos `chat message`, `join room`, `typing`, etc. Persistencia en Mongo por sala con limite a ~50 mensajes.

## Tests

### Cómo ejecutarlos
- En `backend`: `NODE_ENV=test npm test`
- Ejecutar un archivo específico: `NODE_ENV=test npm test -- tests/chat.test.js`
- `NODE_ENV=test` evita que el servidor llame a `app.listen()` durante los tests, las pruebas usan la `app` directamente. Asegurarse de tener `MONGO_URI` y `JWT_SECRET` configurados.

### Tests disponibles
- `tests/auth.test.js`: registro y login, devuelve token y usuario.
- `tests/productos.test.js`: acceso no autenticado (401), listado autenticado (200), creación admin (201).
- `tests/chat.test.js`: listado de mensajes autenticado (200), creación de mensaje (201), validación de texto vacío (400), sin token (401).

Pruebas manuales (curl/Postman):
1. Registro: `POST http://localhost:3001/auth/register` con JSON `{"nombre":"Ana","email":"ana@uni.es","password":"1234"}`.
2. Login: `POST http://localhost:3001/auth/login` → copiar `token`.
3. Listar productos: `GET http://localhost:3001/productos` con cabecera `Authorization: Bearer <token>`.
4. Crear producto (admin): `POST http://localhost:3001/productos` con `{ nombre, precio, descripcion }` y `Authorization: Bearer <token_admin>`.
5. Subir imagen: `POST http://localhost:3001/productos/:id/imagen` con `multipart/form-data` y campo `imagen`.

## Decisiones de desarrollo
- Separación frontend/backend para practicar consumo de API y CORS.
- Autenticación con JWT: simplicidad y compatibilidad con un frontend estático. Los tokens se guardan en `sessionStorage` para evitar persistencia larga.
- Roles: operaciones de escritura de productos restringidas a administradores. El middleware `auth` añade `req.user` y se valida el rol en rutas.
- Persistencia con MongoDB/Mongoose: esquemas simples (`Usuario`, `Producto`, `Mensaje`) y uso de timestamps.
- Socket.IO para chat: diseño por salas y poda de historial para limitar tamaño de la base de datos. El chat REST permite lectura/creación pero solo si el usuario esta autenticado con JWT.
- Subida de archivos con `multer`: almacenamiento en `backend/uploads/` y exposición estática de `/uploads/`. Se ha empleado esta librería dado que es muy sencilla de configurar.
- Se ha añadido una sección de Tests para probar los endpoints del backend. En cieertos puntos del desarrollo se han empleado dado que fallaban funcionalidades.
- En los test se añade que se cierre la conexión de Mongoose en `afterAll` para evitar fallos.  
- PWA básica: manifest y service worker. Solo funcional sirviendo por HTTP/HTTPS.
- Observabilidad: Se ha empleado `morgan` en el desarrollo para logs y middleware de errores centralizado.
- Uso de un servidor `Debian` en `Digital Ocean` para el despliegue de la aplicación. Se optó por esta opción debido a la simplicidad de despliegue y para tener centralizado `frontend` como `backend`.
- Separación de los estilos de cada página en archivos separados, manteniendo styles.css para estilos globales. Esto se ha hecho para mejorar la mantenibilidad y la legibilidad del código.
- Uso de MongoDB Atlas: Se optó por utilizar MongoDB Atlas en lugar de una instancia local de MongoDB debido a los requisitos de recursos elevados que implicaría mantener una base de datos MongoDB en un servidor personal de Digital Ocean. MongoDB Atlas ofrece una capa gratuita que es suficiente para el desarrollo y testing del proyecto, reduciendo significativamente el consumo de CPU y memoria del servidor.
- El audio de los mensajes se sirve desde el backend (aunque en un principio se hacía desde el frontend) para mejor seguridad y evitar duplicaciones de archivos.
  
## Problemas conocidos y mejoras
- Service Worker requiere servir el frontend por HTTP en el mismo origen. Lo cual limita el poder tener la PWA en el desarrollo subido al servidor Digital Ocean.
- UI: la SPA es básica; podría migrarse a un framework moderno y añadir paginación real desde API. Se ha optado por esta solución para aprender mas acerca de html y css dado que es un proceso mas manual.

## Ejecución rápida (resumen)
- Backend: `cd backend && npm install && npm start` (con `.env` configurado)
- Frontend: servir `cd frontend && npx serve -p 3000`

---

# Actualización E-commerce (GraphQL + Orders)

El proyecto ha evolucionado para incluir funcionalidades completas de comercio electrónico utilizando **GraphQL** como capa principal para la gestión de datos, conviviendo con la API REST existente.

## Nuevas Tecnologías
- **Apollo Server (@apollo/server)**: Servidor GraphQL integrado con Express.
- **GraphQL**: Lenguaje de consulta para manejar productos, usuarios y pedidos.

## Nueva Estructura
```
/backend
  graphql/
    schema.js       # Definición de tipos (Type Definitions)
    resolvers.js    # Lógica de negocio (Queries y Mutations)
  models/
    Orden.js        # Nuevo modelo para pedidos (colección: 'ordenes')
```

## Funcionalidades Añadidas

### 1. Gestión de Pedidos (Orders)
- **Modelo de Datos (`Orden`)**: Almacena el usuario, lista de productos con cantidad y precio histórico, total y estado.
- **Flujo de Compra**:
  - El frontend gestiona el carrito localmente (`localStorage`).
  - Al finalizar compra, se ejecuta la mutación `createOrder`.
  - El backend valida precios, calcula el total y crea la orden en estado `PENDING`.

### 2. Panel de Administración (`/admin.html`)
- Interfaz exclusiva para usuarios con rol `admin`.
- **Gestión de Usuarios**: Listado completo, eliminación y cambio de roles (User/Admin) mediante mutaciones GraphQL.
- **Gestión de Pedidos**: Visualización de pedidos filtrados por estado (Pendiente/Completado) y actualización de estado.

### 3. API GraphQL (`/graphql`)
El endpoint `/graphql` maneja las siguientes operaciones:

**Queries:**
- `products`: Obtiene el catálogo.
- `orders(status?)`: Obtiene pedidos (filtrados por usuario o todos si es admin).
- `users`: Obtiene todos los usuarios (solo admin).

**Mutations:**
- `createOrder`: Crea un nuevo pedido desde el carrito.
- `updateOrderStatus`: Cambia el estado de un pedido (admin).
- `deleteUser` / `toggleUserRole`: Gestión de usuarios (admin).

## Decisiones de Diseño
- **Híbrido REST + GraphQL**: Se mantuvieron los endpoints REST de autenticación (`/auth`) y subida de archivos por simplicidad, mientras que toda la lógica de negocio compleja (pedidos, relaciones) se migró a GraphQL para evitar "over-fetching" y tener un esquema tipado.

- **Carrito Cliente-Servidor**: El carrito es temporal en el cliente, se recoge en el Local Storage. Solo se persiste en la base de datos cuando se convierte en una Orden confirmada.

- **Coherencia Visual**: Las nuevas pantallas (Carrito, Admin) se han diseñado siguiendo estrictamente el sistema de estilos existente (CSS variables, paleta de colores, componentes de UI) para garantizar una experiencia de usuario consistente en toda la aplicación.

- **Nuevos archivos.js en el front**: Además, se han añadido archivos `.js` separados por pantalla (por ejemplo, `frontend/cart.js` y `frontend/admin.js`) en lugar de seguir ampliando el antiguo `frontend/client.js`. Esto mejora la modularidad y mantenibilidad, facilita la separación de responsabilidades y reduce el riesgo de efectos colaterales entre funcionalidades al evolucionar cada vista de forma independiente.

- **Arquitectura en capas (Controller/Service/DAO)**: Backend organizado para escalar y mantener el código limpio:
  - Controller: recibe peticiones HTTP y construye respuestas.
  - Service: encapsula la lógica de negocio y reglas de aplicación.
  - Model/DAO: Model define estructura y validaciones; DAO encapsula consultas/mutaciones a la base de datos.
  Las rutas delegan en controladores, los servicios concentran reglas y los DAOs aíslan Mongoose. `server.js` se ha reducido a orquestador mínimo (HTTP + Socket.IO + conexión a Mongo), moviendo la configuración de Express a app.js y la de GraphQL a graphql/apollo.js