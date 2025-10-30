const API_BASE_URL = (function() {
    // Si estamos en localhost (desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // En producción, usar el mismo dominio + /api
    return '/api';
})();

// Elementos del DOM
const courseForm = document.getElementById('courseForm');
const coursesList = document.getElementById('coursesList');
const loadCoursesBtn = document.getElementById('loadCourses');
const courseCount = document.getElementById('courseCount');
const apiStatus = document.getElementById('apiStatus');
const lastUpdate = document.getElementById('lastUpdate');

// Estado de la aplicación
let courses = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAPIHealth();
    loadCourses();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    courseForm.addEventListener('submit', handleCourseSubmit);
    loadCoursesBtn.addEventListener('click', loadCourses);
    
    // Recargar cursos cada 30 segundos
    setInterval(loadCourses, 30000);
}

// Verificar salud del API
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            apiStatus.textContent = '✅ Conectado';
            apiStatus.className = 'success';
        } else {
            apiStatus.textContent = '⚠️ Problemas de conexión';
            apiStatus.className = 'error';
        }
    } catch (error) {
        apiStatus.textContent = '❌ Error de conexión';
        apiStatus.className = 'error';
        console.error('Error checking API health:', error);
    }
}

// Cargar cursos desde el API
async function loadCourses() {
    try {
        loadCoursesBtn.classList.add('loading');
        loadCoursesBtn.textContent = 'Cargando...';
        
        const response = await fetch(`${API_BASE_URL}/courses`);
        const result = await response.json();
        
        if (result.success) {
            courses = result.data;
            renderCourses();
            updateLastUpdate();
        } else {
            throw new Error(result.message || 'Error al cargar cursos');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Error al cargar cursos: ' + error.message);
    } finally {
        loadCoursesBtn.classList.remove('loading');
        loadCoursesBtn.textContent = 'Cargar Cursos';
    }
}

// Renderizar lista de cursos
function renderCourses() {
    if (courses.length === 0) {
        coursesList.innerHTML = `
            <div class="no-courses">
                <p>No hay cursos disponibles. ¡Crea el primero!</p>
            </div>
        `;
        courseCount.textContent = '0 cursos';
        return;
    }
    
    courseCount.textContent = `${courses.length} curso${courses.length !== 1 ? 's' : ''}`;
    
    coursesList.innerHTML = courses.map(course => `
        <div class="course-card">
            <span class="course-id">ID: ${course.id}</span>
            <h3>${course.title}</h3>
            <p><strong>Estudiantes:</strong> ${course.students}</p>
            <p><strong>Estado:</strong> ${course.active ? '🟢 Activo' : '🔴 Inactivo'}</p>
            ${course.createdAt ? `<p><strong>Creado:</strong> ${new Date(course.createdAt).toLocaleDateString()}</p>` : ''}
        </div>
    `).join('');
}

// Manejar envío del formulario
async function handleCourseSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(courseForm);
    const courseData = {
        title: formData.get('title').trim(),
        students: parseInt(formData.get('students')) || 0
    };
    
    if (!courseData.title) {
        showError('El título del curso es requerido');
        return;
    }
    
    try {
        const submitBtn = courseForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Creando...';
        
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Limpiar formulario
            courseForm.reset();
            // Recargar cursos
            await loadCourses();
            showSuccess('Curso creado exitosamente!');
        } else {
            throw new Error(result.message || 'Error al crear curso');
        }
    } catch (error) {
        console.error('Error creating course:', error);
        showError('Error al crear curso: ' + error.message);
    } finally {
        const submitBtn = courseForm.querySelector('button[type="submit"]');
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Crear Curso';
    }
}

// Mostrar mensaje de éxito
function showSuccess(message) {
    // Podrías implementar un sistema de notificaciones más elegante
    alert('✅ ' + message);
}

// Mostrar mensaje de error
function showError(message) {
    // Podrías implementar un sistema de notificaciones más elegante
    alert('❌ ' + message);
}

// Actualizar última actualización
function updateLastUpdate() {
    lastUpdate.textContent = new Date().toLocaleTimeString();
}