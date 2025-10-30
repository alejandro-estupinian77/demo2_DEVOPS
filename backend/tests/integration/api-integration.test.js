const request = require('supertest');
const { app } = require('../../src/server');

describe('Pruebas de integración - API Completa', () => {
    beforeEach(() => {
        if (app.resetData) {
            app.resetData();
        }
    });

    describe('Flujos complejos de usuario', () => {
        test('Flujo completo: crear, listar, desactivar cursos', async () => {
            // CORRECCIÓN: Agregar / al inicio de las rutas
            const initialResponse = await request(app).get('/api/courses');
            const initialCount = initialResponse.body.total; // CORRECCIÓN: initialCount no initialContent

            const coursesToCreate = [
                { title: 'Curso de Integración 1', students: 10 },
                { title: 'Curso de Integración 2', students: 15 },
                { title: 'Curso de Integración 3', students: 20 }
            ];

            const createdCourses = [];
            for (const courseData of coursesToCreate) {
                const response = await request(app)
                    .post('/api/courses') // CORRECCIÓN: Agregar / al inicio
                    .send(courseData);
                
                expect(response.status).toBe(201);
                createdCourses.push(response.body.data);
            }

            const afterCreateResponse = await request(app).get('/api/courses'); // CORRECCIÓN: Agregar /
            expect(afterCreateResponse.body.total).toBe(initialCount + coursesToCreate.length);

            for (const createdCourse of createdCourses) {
                const getResponse = await request(app).get(`/api/courses/${createdCourse.id}`);
                expect(getResponse.status).toBe(200);
                expect(getResponse.body.data.title).toBe(createdCourse.title);
            }

            const courseToDeactivate = createdCourses[0];
            const deleteResponse = await request(app)
                .delete(`/api/courses/${courseToDeactivate.id}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.data.active).toBe(false);

            const finalResponse = await request(app).get('/api/courses');
            const deactivatedCourse = finalResponse.body.data.find(
                course => course.id === courseToDeactivate.id
            );
            expect(deactivatedCourse).toBeUndefined();
        });

        test('Integración entre multiples endpoints', async () => {
            const endpoints = [
                { path: '/api/health', method: 'GET', expectedStatus: 200 },
                { path: '/api/courses', method: 'GET', expectedStatus: 200 },
                { path: '/api/courses/1', method: 'GET', expectedStatus: 200 },
                { path: '/api/courses/999', method: 'GET', expectedStatus: 404 },
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)[endpoint.method.toLowerCase()](endpoint.path);
                expect(response.status).toBe(endpoint.expectedStatus);
            }
        });

        test('Manejo de errores en flujo integrado', async () => {
            const invalidResponses = [
                await request(app).get('/api/courses/invalid-id'),
                await request(app).post('/api/courses').send({}),
                await request(app).delete('/api/courses/9999')
            ];

            invalidResponses.forEach(response => {
                expect(response.status).toBeGreaterThanOrEqual(400);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Pruebas de Estado Consistente', () => {
        test('El estado debería ser consistente entre requests', async () => {
            const createResponse = await request(app)
                .post('/api/courses')
                .send({ title: 'Curso consistente', students: 5 });

            const courseId = createResponse.body.data.id; // CORRECCIÓN: courseId no courseID

            for (let i = 0; i < 5; i++) {
                const getResponse = await request(app).get(`/api/courses/${courseId}`); // CORRECCIÓN: usar courseId
                expect(getResponse.status).toBe(200);
                expect(getResponse.body.data.id).toBe(courseId); // CORRECCIÓN: usar courseId
                expect(getResponse.body.data.title).toBe('Curso consistente');

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        });

        test('Múltiples usuarios creando cursos simultáneamente', async () => {
            const coursePromises = [];
            const numCourses = 10;

            for (let i = 0; i < numCourses; i++) {
                const promise = request(app)
                    .post('/api/courses')
                    .send({ title: `Curso Concurrente ${i}`, students: i * 5 });

                coursePromises.push(promise);
            }

            const results = await Promise.all(coursePromises);

            results.forEach((response, index) => {
                expect(response.status).toBe(201);
                expect(response.body.data.title).toBe(`Curso Concurrente ${index}`);
            });

            const finalResponse = await request(app).get('/api/courses');
            expect(finalResponse.body.total).toBeGreaterThanOrEqual(numCourses);
        });
    });
});