// Configuración para Artillery (pruebas de estrés)
module.exports = {
  config: {
    target: 'http://localhost:5001',
    phases: [
      {
        name: 'Carga inicial',
        duration: 20,  // 20 segundos (reducido para pruebas)
        arrivalRate: 2, // 2 usuarios por segundo
        rampTo: 5      // escalar hasta 5 usuarios/segundo
      },
      {
        name: 'Carga sostenida',
        duration: 30,  // 30 segundos
        arrivalRate: 5 // 5 usuarios por segundo
      },
      {
        name: 'Pico de carga',
        duration: 15,  // 15 segundos
        arrivalRate: 8, // 8 usuarios por segundo
        rampTo: 10     // escalar hasta 10 usuarios/segundo
      }
    ],
    defaults: {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  },
  scenarios: [
    {
      name: 'Health Check Stress',
      flow: [
        {
          get: {
            url: '/api/health'
          }
        }
      ]
    },
    {
      name: 'Listar Cursos Stress',
      flow: [
        {
          get: {
            url: '/api/courses'
          }
        }
      ]
    },
    {
      name: 'Flujo Completo Stress',
      flow: [
        {
          get: {
            url: '/api/health'
          }
        },
        {
          get: {
            url: '/api/courses'
          }
        },
        {
          post: {
            url: '/api/courses',
            json: {
              title: 'Curso de Estrés {{ $timestamp }}',
              students: '{{ $randomNumber(1, 50) }}'
            }
          }
        }
      ]
    }
  ]
};