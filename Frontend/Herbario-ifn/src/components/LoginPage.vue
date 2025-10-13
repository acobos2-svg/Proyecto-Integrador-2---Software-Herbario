<template>
  <div>
    <!-- Header -->
    <div class="view-header">Acceso de Usuarios</div>

    <div class="container">
      <h2 class="text-center">Login</h2>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <p class="text-center">El usuario ingresa <strong>cédula y contraseña</strong>.</p>
        
        <div class="form-group">
          <input 
            type="text" 
            v-model="formData.cedula"
            class="form-control"
            placeholder="Cédula (simular: 'recepcion' o 'laboratorio')" 
            required 
          />
        </div>
        
        <div class="form-group">
          <input 
            type="password" 
            v-model="formData.password"
            class="form-control"
            placeholder="Contraseña" 
            required 
          />
        </div>
        
        <!-- Mensaje de error si existe -->
        <div v-if="loginError" class="error-message">
          {{ loginError }}
        </div>
        
        <button type="submit" class="btn btn-primary btn-full">
          Iniciar Sesión
        </button>
      </form>

      <!-- Información adicional -->
      <div class="info-message">
        <p><strong>Funcionamiento del Botón:</strong></p>
        <p>Simula la verificación de credenciales y redirige a <strong>Recepción</strong> o <strong>Laboratorio</strong> según el rol simulado.</p>
        <p><strong>Credenciales de prueba:</strong></p>
        <ul>
          <li><code>recepcion</code> - Acceso al módulo de recepción</li>
          <li><code>laboratorio</code> - Acceso al módulo de laboratorio</li>
        </ul>
      </div>

      <!-- Botón para volver -->
      <div class="text-center mt-20">
        <button 
          class="btn btn-secondary"
          @click="$emit('navigate', 'MainPage')"
        >
          Volver al Inicio
        </button>
      </div>

      <!-- Información del sistema -->
      <div class="system-info mt-40">
        <div class="card">
          <h3>🔐 Sistema de Autenticación</h3>
          <p>El sistema utiliza autenticación JWT con roles diferenciados:</p>
          <ul>
            <li><strong>Recepcionista:</strong> Registro de paquetes y muestras</li>
            <li><strong>Laboratorista:</strong> Clasificación taxonómica</li>
            <li><strong>Coordinador:</strong> Supervisión y reportes</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Props
const props = defineProps({
  loginError: {
    type: String,
    default: null
  }
})

// Eventos
const emit = defineEmits(['login', 'navigate'])

// Estado del formulario
const formData = reactive({
  cedula: '',
  password: ''
})

// Función para manejar el envío del formulario
const handleSubmit = () => {
  emit('login', {
    cedula: formData.cedula,
    password: formData.password
  })
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 30px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fcfcfc;
  box-shadow: var(--shadow-light);
}

.system-info {
  max-width: 600px;
  margin: 0 auto;
}

.system-info ul {
  text-align: left;
  color: var(--text-light);
  margin-top: 15px;
}

.system-info li {
  margin-bottom: 8px;
}

.info-message {
  max-width: 500px;
  margin: 20px auto;
}

.info-message ul {
  text-align: left;
  margin-top: 10px;
}

.info-message code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: var(--primary-green);
  font-weight: 600;
}

@media (max-width: 768px) {
  .login-form {
    margin: 0 20px;
    padding: 20px;
  }
}
</style>