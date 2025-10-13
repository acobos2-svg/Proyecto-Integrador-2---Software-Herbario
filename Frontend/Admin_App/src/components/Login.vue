<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <!-- Logo SVG del herbario -->
          <svg width="60" height="60" viewBox="0 0 100 100" class="logo">
            <defs>
              <radialGradient id="leafGradient" cx="0.3" cy="0.3" r="0.7">
                <stop offset="0%" stop-color="#8bc34a"/>
                <stop offset="100%" stop-color="#2c5530"/>
              </radialGradient>
            </defs>
            <path d="M50 10 C30 30, 30 70, 50 90 C70 70, 70 30, 50 10 Z" 
                  fill="url(#leafGradient)" 
                  stroke="#1a3d1f" 
                  stroke-width="2"/>
            <path d="M50 10 Q35 35, 50 60 Q65 35, 50 10" 
                  fill="none" 
                  stroke="#1a3d1f" 
                  stroke-width="1.5"/>
            <path d="M50 60 Q42 75, 50 90" 
                  fill="none" 
                  stroke="#1a3d1f" 
                  stroke-width="1"/>
            <path d="M50 60 Q58 75, 50 90" 
                  fill="none" 
                  stroke="#1a3d1f" 
                  stroke-width="1"/>
          </svg>
        </div>
        <h1 class="login-title">Herbario Digital - Tax-IFN</h1>
        <p class="login-subtitle">Panel de Administración</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">Usuario</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            class="form-input"
            placeholder="Ingrese su usuario"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Contraseña</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="form-input"
            placeholder="Ingrese su contraseña"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary login-btn"
          :disabled="loading"
        >
          <span v-if="loading">Iniciando sesión...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>

      <div class="login-footer">
        <p class="admin-info">
          <strong>Credenciales de prueba:</strong><br>
          Usuario: admin | Contraseña: admin
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const credentials = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.post('http://localhost:3002/admin/login', {
      username: credentials.value.username,
      password: credentials.value.password
    })

    if (response.data.success) {
      localStorage.setItem('admin-token', response.data.token)
      localStorage.setItem('admin-user', JSON.stringify(response.data.user))
      router.push('/dashboard')
    }
  } catch (err) {
    console.error('Error en login:', err)
    error.value = err.response?.data?.error || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}

// Verificar si ya está autenticado
const token = localStorage.getItem('admin-token')
if (token) {
  router.push('/dashboard')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container {
  margin-bottom: 16px;
}

.logo {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
}

.login-title {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  justify-content: center;
  font-size: 16px;
  padding: 16px;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: var(--error-color);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.admin-info {
  font-size: 12px;
  color: var(--text-secondary);
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}
</style>