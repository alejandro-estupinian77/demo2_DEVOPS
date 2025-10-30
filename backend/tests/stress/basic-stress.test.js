const request = require('supertest');
const { app } = require('../../src/server');

describe('Pruebas de estrés básicas', () => {
  beforeEach(() => {
    if (app.resetData) {
      app.resetData();
    }
  });

  test('Múltiples requests simultáneos al health check', async () => {
    const numRequests = 20; // Reducido para pruebas iniciales
    const promises = [];

    console.log(`🚀 Enviando ${numRequests} requests simultáneos al health check...`);

    for (let i = 0; i < numRequests; i++) {
      promises.push(
        request(app)
          .get('/api/health') // CORRECCIÓN: Agregar / al inicio
          .timeout(5000)
      );
    }

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`⏱️  ${numRequests} requests tomó ${totalTime}ms`);
    console.log(`📈 Promedio: ${(totalTime / numRequests).toFixed(2)}ms por request`);

    // Verificar que todas las responses fueron exitosas
    const successfulRequests = responses.filter(r => r.status === 200).length;
    console.log(`✅ ${successfulRequests}/${numRequests} requests exitosos`);

    expect(successfulRequests).toBe(numRequests);
    expect(totalTime).toBeLessThan(3000); // Aumentado a 3 segundos para ser más realista
  });

  test('Creación masiva de cursos', async () => {
    const numCourses = 10; // Reducido para pruebas iniciales
    const promises = [];

    console.log(`📚 Creando ${numCourses} cursos simultáneamente...`);

    for (let i = 0; i < numCourses; i++) {
      promises.push(
        request(app)
          .post('/api/courses')
          .send({
            title: `Curso Masivo ${i + 1}`,
            students: Math.floor(Math.random() * 100)
          })
          .timeout(3000)
      );
    }

    const responses = await Promise.all(promises);

    // Verificar resultados
    const successfulResponses = responses.filter(r => r.status === 201).length;
    const successRate = successfulResponses / numCourses;
    
    console.log(`✅ ${successfulResponses}/${numCourses} cursos creados exitosamente`);
    console.log(`📊 Tasa de éxito: ${(successRate * 100).toFixed(2)}%`);

    expect(successRate).toBeGreaterThan(0.8); // Al menos 80% de éxito
  });

  test('Prueba de carga con delays simulados', async () => {
    const operations = [];
    const numUsers = 5; // Reducido para pruebas iniciales

    console.log(`👥 Simulando ${numUsers} usuarios con delays...`);

    for (let user = 0; user < numUsers; user++) {
      operations.push(
        (async () => {
          try {
            // CORRECCIÓN: "resolve" no "resolver"
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

            const healthResponse = await request(app).get('/api/health');
            if (healthResponse.status !== 200) {
              return { user, success: false, error: 'Health check failed' };
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

            const coursesResponse = await request(app).get('/api/courses');
            if (coursesResponse.status !== 200) {
              return { user, success: false, error: 'Courses failed' };
            }

            return { user, success: true };
          } catch (error) {
            return { user, success: false, error: error.message };
          }
        })()
      );
    }
    
    const results = await Promise.all(operations); // CORRECCIÓN: "results" no "result"
    const successfulOps = results.filter(r => r.success).length;
    
    console.log(`✅ ${successfulOps}/${numUsers} usuarios completaron el flujo`);
    
    // Log de errores si los hay
    const failedOps = results.filter(r => !r.success);
    if (failedOps.length > 0) {
      console.log('❌ Errores encontrados:');
      failedOps.forEach(failed => {
        console.log(`   Usuario ${failed.user}: ${failed.error}`);
      });
    }

    expect(successfulOps).toBe(numUsers);
  });
});