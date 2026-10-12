'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { API } = require('../../src/config/constants');
const { connectTestDatabase, dropTestDatabase } = require('../helpers/db');

const app = createApp();

beforeAll(async () => {
  await connectTestDatabase();
});

afterAll(async () => {
  await dropTestDatabase();
});

describe('GET /api/health', () => {
  test('reports ok with a connected database', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database.connected).toBe(true);
    expect(response.body.data.database.status).toBe('connected');
    expect(response.body.data.api).toEqual({ name: API.NAME, version: API.VERSION });
    expect(new Date(response.body.data.timestamp).toISOString()).toBe(response.body.data.timestamp);
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
  });

  test('never leaks secrets or internals', async () => {
    const response = await request(app).get('/api/health');
    const serialised = JSON.stringify(response.body);
    expect(serialised).not.toMatch(/mongodb(\+srv)?:\/\//);
    expect(serialised).not.toMatch(/JWT_SECRET|passwordHash|token/i);
  });

  test('sets hardening headers and hides the framework', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-request-id']).toBeDefined();
  });
});

describe('service descriptor and unknown routes', () => {
  test('GET /api describes the service', async () => {
    const response = await request(app).get('/api');
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe(API.NAME);
    expect(response.body.data.endpoints.health).toBe('/api/health');
  });

  test('unknown routes return the standard 404 envelope', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false });
    expect(response.body.message).toMatch(/does not exist/);
  });
});
