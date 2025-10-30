// tests/setup.js - Configuración global para pruebas Jest

// Mock de console para evitar logs en las pruebas
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Silenciar console.log y console.error durante las pruebas
  console.log = jest.fn();
  console.error = jest.fn();
  
  // Configurar variables de entorno para testing
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5001'; // Puerto diferente para tests
});

afterAll(() => {
  // Restaurar console original
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  
  // Limpiar variables de entorno
  delete process.env.NODE_ENV;
  delete process.env.PORT;
});

// Configuración global antes de cada prueba
beforeEach(() => {
  // Resetear mocks si los estás usando
  jest.clearAllMocks();
  
  // Puedes agregar datos de prueba globales aquí
  global.testData = {
    courses: [
      { id: 1, title: 'Matemáticas Básicas', students: 25, active: true },
      { id: 2, title: 'Programación en JavaScript', students: 40, active: true },
      { id: 3, title: 'Ciencias Naturales', students: 18, active: false }
    ],
    users: [
      { id: 1, name: 'Ana García', email: 'ana@educativa.com', role: 'teacher' },
      { id: 2, name: 'Carlos López', email: 'carlos@educativa.com', role: 'student' }
    ]
  };
});

// Configuración después de cada prueba
afterEach(() => {
  // Limpiar cualquier dato temporal
  jest.restoreAllMocks();
});

// Timeout global para pruebas
jest.setTimeout(10000); // 10 segundos

// Configurar fetch mock si necesitas simular llamadas HTTP
global.fetch = jest.fn();

// Utilidades globales para pruebas
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para resetear datos de prueba
global.resetTestData = () => {
  return {
    courses: [
      { id: 1, title: 'Matemáticas Básicas', students: 25, active: true },
      { id: 2, title: 'Programación en JavaScript', students: 40, active: true },
      { id: 3, title: 'Ciencias Naturales', students: 18, active: false }
    ]
  };
};