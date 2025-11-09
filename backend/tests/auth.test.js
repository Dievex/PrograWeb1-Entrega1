const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  it('POST /auth/register crea usuario y devuelve token', async () => {
    const res = await request(app).post('/auth/register').send({
      nombre: 'Tester',
      email: `tester_${Date.now()}@example.com`,
      password: '1234',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('usuario');
  });

  it('POST /auth/login devuelve token con credenciales correctas', async () => {
    const email = `login_${Date.now()}@example.com`;
    const password = 'abcd';
    await request(app).post('/auth/register').send({ nombre: 'Login', email, password });
    const res = await request(app).post('/auth/login').send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});