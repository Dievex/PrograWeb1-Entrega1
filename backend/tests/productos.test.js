const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

afterAll(async () => {
  await mongoose.connection.close();
});

describe('API de productos', () => {
  it('GET /productos sin token debe fallar con 401', async () => {
    const res = await request(app).get('/productos');
    expect(res.statusCode).toBe(401);
  });

  it('GET /productos con token válido devuelve lista', async () => {
    const email = `prod_${Date.now()}@example.com`;
    const password = '1234';
    const reg = await request(app).post('/auth/register').send({ nombre: 'Prod', email, password });
    expect(reg.statusCode).toBe(201);
    const token = reg.body.token;
    const res = await request(app).get('/productos').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /productos con admin crea producto', async () => {
    const email = `admin_${Date.now()}@example.com`;
    const password = 'abcd';
    const reg = await request(app).post('/auth/register').send({ nombre: 'Admin', email, password, role: 'admin' });
    expect(reg.statusCode).toBe(201);
    const token = reg.body.token;
    const nuevoProducto = { nombre: 'Camiseta', precio: 19.99, descripcion: 'Basica' };
    const res = await request(app)
      .post('/productos')
      .set('Authorization', `Bearer ${token}`)
      .send(nuevoProducto);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('nombre', 'Camiseta');
    expect(res.body).toHaveProperty('precio', 19.99);
  });
});
