# PRÁCTICA 2 - E-COMMERCE CON GRAPHQL Y GESTIÓN DE PEDIDOS

## Contexto

Partiendo del "Portal de Productos" desarrollado en la Práctica 1, donde ya se cuenta con autenticación JWT, roles y un chat básico, evolucionaremos la aplicación hacia un E-commerce plenamente funcional.

## Objetivos de la práctica

Transformar el portal en una tienda online completa, migrando parte del API a GraphQL e implementando flujos de negocio complejos: 

- Implementar un CRUD de usuarios para administradores. 
- Desarrollar el flujo de carrito de compra y pedidos. 
- Integrar GraphQL como alternativa o complemento al API REST existente. 
- Gestionar estados de pedidos (en curso, completado). 

## Requisitos funcionales

### 1. Ampliación del panel de administrador

El administrador, además de gestionar productos, ahora podrá: 

- Gestión de usuarios: 
  - Listar todos los usuarios registrados. 
  - CRUD de usuarios: Poder eliminar usuarios o cambiar su rol (de user a admin y viceversa). 

- Gestión de pedidos: 
  - Visualizar un listado de todos los pedidos de la plataforma. 
  - Filtrar pedidos por estado: "En curso" (Pending) o "Comprado" (Completed). 
  - Ver el detalle de un pedido (qué productos y qué usuario lo compró). 

### 2. Área de usuario (cliente)

El usuario con rol user tendrá nuevas capacidades: 

- Carrito de compra: 
  - Botón "Añadir al carrito" en los productos. 
  - Visualización del carrito (lista de productos, cantidades y precio total). 
  - Persistencia del carrito (puede ser en base de datos o LocalStorage, pero al hacer login debe recuperarse). 

- Simulación de compra: 
  - Botón "Finalizar compra" que convierte el contenido del carrito en una Orden (Order) en base de datos. 
  - Al comprar, el carrito debe vaciarse. 

### 3. Integración con GraphQL

Se debe implementar un servidor GraphQL (ej. Apollo Server o express-graphql) que conviva con la aplicación Express existente. 

- Requisito: Al menos la lectura de datos (Queries) para Productos y la gestión de pedidos (Mutations y Queries) deben realizarse a través de GraphQL. 
- Los endpoints REST de autenticación pueden mantenerse o migrarse (opcional). 

## Persistencia y modelos de datos

Se deben actualizar o crear nuevos modelos en MongoDB: 

- User: Añadir campo para historial de pedidos (opcional, si se hace por referencia). 
- Order (nuevo): Debe contener, como mínimo: 
  - Referencia al usuario. 
  - Array de productos (con sus cantidades y precios en el momento de la compra). 
  - Estado (pending, completed). 
  - Fecha de creación. 
  - Total del pedido. 

## Tecnologías a utilizar

| Capa        | Tecnología                                                                 |
|------------|-----------------------------------------------------------------------------|
| API        | GraphQL (Schemas, Resolvers, Mutations) + REST existente                    |
| Frontend   | Integración de cliente GraphQL (ej. Apollo Client o fetch nativo)          |
| Base de datos | MongoDB (Mongoose)                                                      |
| Tiempo real | Socket.IO (para notificaciones de stock o chat)                           |  

## Estructura recomendada

Se añaden nuevos directorios a la estructura base: 

```text
/src
  /graphql
    - schema.js     # Definición de tipos (TypeDefs)
    - resolvers.js  # Lógica de obtención de datos
  /models
    - Orden.js      # Nuevo modelo
    - ... (User.js, Product.js existentes)
  /routes
    ... (Rutas REST existentes)
  server.js         # Configuración del endpoint /graphql
```


## Criterios de evaluación

| Criterio                                                                 | Puntuación |
|-------------------------------------------------------------------------|-----------:|
| Implementación de GraphQL (Schemas, Queries y Mutations funcionales)    | 30%        |
| Gestión de pedidos y carrito (flujo completo de compra simulada)        | 25%        |
| CRUD de usuarios (admin)                                                | 15%        |
| Funcionalidades previas mantenidas (Auth JWT, Chat, CRUD productos)     | 15%        |
| Calidad del código y estructura                                         | 10%        |
| Documentación (Explicación del esquema GraphQL y decisiones)            | 5%         |  

## Entregable

Un proyecto funcional donde: 

1. Un usuario se pueda registrar/loguear. 
2. Un usuario pueda llenar un carrito y generar un pedido vía GraphQL. 
3. Un administrador pueda ver esos pedidos y gestionar los usuarios desde el panel. 
4. Documentación actualizada con las instrucciones de las Queries/Mutations de GraphQL. 

## Fecha de entrega

- Hasta el 13 de enero de 2026 a las 23:59. 

## Forma de entrega

- Documentación: necesario subirla a la https://campus.uneatlantico.es/ 
- Código: Enlace a git, que debe estar en la documentación que se suba al Campus. 