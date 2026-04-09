import request from 'supertest';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config/app-config';

describe('Express App (e2e)', () => {
  const config = loadConfig();
  const app = createApp(config, {
    authService: {
      register: jest.fn(),
      login: jest.fn(),
      me: jest.fn(),
      changePassword: jest.fn(),
      updateProfile: jest.fn(),
    } as never,
    auditService: {
      findAll: jest.fn(),
    } as never,
    entitiesService: {
      findAll: jest.fn(),
      createEntity: jest.fn(),
      createItem: jest.fn(),
      createRecord: jest.fn(),
    } as never,
    settingsService: {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      getLoginHistory: jest.fn(),
    } as never,
  });

  it('GET /api/v1/health', () => {
    return request(app)
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as { status: string; timestamp: string };
        expect(body.status).toBe('ok');
        expect(typeof body.timestamp).toBe('string');
      });
  });

  it('GET /api/v1', () => {
    return request(app)
      .get('/api/v1')
      .expect(200)
      .expect((response) => {
        const body = response.body as { name: string; docs: string };
        expect(body.name).toBe('control-financiero-api');
        expect(body.docs).toBe('/docs');
      });
  });
});
