const request = require('supertest');
const { app } = require('../../src/server');

describe('Pruebas Unitarias - Cursos', () => {
  // Mock de console para evitar logs en las pruebas
  let consoleLogMock;
  let consoleErrorMock;

  beforeAll(() => {
    // Mockear console.log y console.error
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar console original - CORREGIDO
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  beforeEach(() => {
    if (app.resetData) {
      app.resetData();
    }
  });

  describe('GET /api/health', () => {
    test('debería retornar status OK y timestamp', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });

  describe('GET /api/courses', () => {
    test('debería retornar solo cursos activos', async () => {
      const response = await request(app).get('/api/courses');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2); // 2 cursos activos
    });
  });

  describe('GET /api/courses/:id', () => {
    test('debería retornar un curso específico', async () => {
      const response = await request(app).get('/api/courses/1');
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(1);
    });

    test('debería retornar 404 para curso inexistente', async () => {
      const response = await request(app).get('/api/courses/999');
      expect(response.status).toBe(404);
    });

    test('debería retornar 400 para ID inválido', async () => {
      const response = await request(app).get('/api/courses/abc');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/courses', () => {
    test('debería crear un nuevo curso exitosamente', async () => {
      const newCourse = { 
        title: 'Nuevo Curso de Prueba', 
        students: 10 
      };
      
      const response = await request(app)
        .post('/api/courses')
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(newCourse.title);
    });

    test('debería retornar error 400 sin título', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({ students: 10 });

      expect(response.status).toBe(400);
    });

    test('debería retornar error 400 con título vacío', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({ title: '   ', students: 10 });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    test('debería desactivar un curso existente', async () => {
      const response = await request(app).delete('/api/courses/1');
      expect(response.status).toBe(200);
    });

    test('debería retornar 404 al desactivar curso inexistente', async () => {
      const response = await request(app).delete('/api/courses/999');
      expect(response.status).toBe(404);
    });
  });
});