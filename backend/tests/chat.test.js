const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Chat API', () => {
  it('GET /chat/mensajes sin token debe fallar con 401', async () => {
    const res = await request(app).get('/chat/mensajes');
    expect(res.statusCode).toBe(401);
  });

  it('GET /chat/mensajes con token válido devuelve array', async () => {
    const email = `chat_${Date.now()}@example.com`;
    const password = '1234';
    const reg = await request(app).post('/auth/register').send({ nombre: 'ChatUser', email, password });
    expect(reg.statusCode).toBe(201);
    const token = reg.body.token;
    const res = await request(app).get('/chat/mensajes').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /chat/mensajes con token válido crea mensaje', async () => {
    const email = `chatpost_${Date.now()}@example.com`;
    const password = 'abcd';
    const reg = await request(app).post('/auth/register').send({ nombre: 'Poster', email, password });
    expect(reg.statusCode).toBe(201);
    const token = reg.body.token;
    const res = await request(app)
      .post('/chat/mensajes')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Hola mundo', color: '#123456', sala: 'general' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('text', 'Hola mundo');
    expect(res.body).toHaveProperty('sala', 'general');
  });

  it('POST /chat/mensajes sin texto debe dar 400', async () => {
    const email = `chaterr_${Date.now()}@example.com`;
    const password = 'abcd';
    const reg = await request(app).post('/auth/register').send({ nombre: 'ErrUser', email, password });
    expect(reg.statusCode).toBe(201);
    const token = reg.body.token;
    const res = await request(app)
      .post('/chat/mensajes')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '   ' });
    expect(res.statusCode).toBe(400);
  });
});