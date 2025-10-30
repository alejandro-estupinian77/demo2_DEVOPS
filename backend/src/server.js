const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Datos iniciales
const initialCourses = [
  { id: 1, title: 'Matemáticas Básicas', students: 25, active: true },
  { id: 2, title: 'Programación en JavaScript', students: 40, active: true },
  { id: 3, title: 'Ciencias Naturales', students: 18, active: false }
];

// Datos en memoria
let courses = [...initialCourses];

// Función para resetear datos (útil en pruebas)
app.resetData = function() {
  courses = [...initialCourses];
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/courses', (req, res) => {
  try {
    const activeCourses = courses.filter(course => course.active);
    res.json({
      success: true,
      data: activeCourses,
      total: activeCourses.length,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.get('/api/courses/:id', (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de curso inválido' 
      });
    }

    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curso no encontrado'
      });
    }
    
    res.json({ 
      success: true, 
      data: course 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/courses', (req, res) => {
  try {
    const { title, students = 0 } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El título es requerido' 
      });
    }

    // Encontrar el próximo ID disponible
    const nextId = courses.length > 0 
      ? Math.max(...courses.map(c => c.id)) + 1 
      : 1;

    const newCourse = {
      id: nextId,
      title: title.trim(),
      students: parseInt(students) || 0,
      active: true,
      createdAt: new Date().toISOString()
    };

    courses.push(newCourse);
    
    res.status(201).json({ 
      success: true, 
      data: newCourse,
      message: 'Curso creado exitosamente'
    });
  } catch (error) {
    console.error('Error en POST /api/courses:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de curso inválido' 
      });
    }

    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Curso no encontrado' 
      });
    }

    courses[courseIndex].active = false;
    
    res.json({ 
      success: true, 
      message: 'Curso desactivado exitosamente',
      data: courses[courseIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint no encontrado' 
  });
});

// Exportar solo la app para testing
module.exports = { app };