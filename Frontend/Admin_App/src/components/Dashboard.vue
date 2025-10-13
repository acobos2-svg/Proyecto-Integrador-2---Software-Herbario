<template>
  <div class="dashboard">
    <NavBar />
    
    <div class="dashboard-content">
      <div class="dashboard-header">
        <h1>Panel de Control</h1>
        <p>Bienvenido al sistema de administración de Herbario Digital - Tax-IFN</p>
      </div>

      <!-- Aviso de diseño -->
      <div class="design-notice">
        <div class="notice-icon">⚠️</div>
        <div class="notice-content">
          <h4>Diseño de Interfaz</h4>
          <p>Las estadísticas mostradas son solo diseño de interfaz. Los datos no están implementados con información real del sistema.</p>
        </div>
      </div>

      <!-- Estadísticas Generales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon herbarios">🏛️</div>
          <div class="stat-info">
                <h3>--</h3>
            <p>Herbarios Totales</p>
            <span class="stat-detail">Datos mockup</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon usuarios">👥</div>
          <div class="stat-info">
            <h3>--</h3>
            <p>Usuarios del Sistema</p>
            <span class="stat-detail">Datos mockup</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon roles">👤</div>
          <div class="stat-info">
            <h3>--</h3>
            <p>Roles Diferentes</p>
            <span class="stat-detail">Datos mockup</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon regiones">🌍</div>
          <div class="stat-info">
            <h3>--</h3>
            <p>Regiones</p>
            <span class="stat-detail">Datos mockup</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon departamentos">🏞️</div>
          <div class="stat-info">
            <h3>--</h3>
            <p>Departamentos</p>
            <span class="stat-detail">Datos mockup</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon municipios">🏘️</div>
          <div class="stat-info">
            <h3>--</h3>
            <p>Municipios</p>
            <span class="stat-detail">Datos mockup</span>
          </div>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        
        <div class="actions-grid">
          <router-link to="/herbarios" class="action-card">
            <div class="action-icon">🏛️</div>
            <h3>Gestionar Herbarios</h3>
            <p>Crear, editar y administrar herbarios del sistema</p>
          </router-link>

          <router-link to="/usuarios" class="action-card">
            <div class="action-icon">👥</div>
            <h3>Gestionar Usuarios</h3>
            <p>Administrar usuarios y sus permisos por herbario</p>
          </router-link>

          <router-link to="/regiones" class="action-card">
            <div class="action-icon">🌍</div>
            <h3>Gestionar Regiones</h3>
            <p>Configurar las regiones del país</p>
          </router-link>

          <router-link to="/departamentos" class="action-card">
            <div class="action-icon">🏞️</div>
            <h3>Gestionar Departamentos</h3>
            <p>Administrar departamentos por región</p>
          </router-link>

          <router-link to="/municipios" class="action-card">
            <div class="action-icon">🏘️</div>
            <h3>Gestionar Municipios</h3>
            <p>Configurar municipios por departamento</p>
          </router-link>

          <div class="action-card" @click="refreshStats">
            <div class="action-icon">📊</div>
            <h3>Actualizar Estadísticas</h3>
            <p>Refrescar los datos del panel de control</p>
          </div>

          <div class="action-card" @click="logout">
            <div class="action-icon">🚪</div>
            <h3>Cerrar Sesión</h3>
            <p>Salir del panel de administración</p>
          </div>
        </div>
      </div>

      <!-- Roles por Usuario (si hay datos) -->
      <div v-if="stats.usuariosPorRol && Object.keys(stats.usuariosPorRol).length > 0" class="roles-section">
        <h2>Distribución de Roles</h2>
        <div class="roles-grid">
          <div 
            v-for="(count, role) in stats.usuariosPorRol" 
            :key="role" 
            class="role-card"
          >
            <div class="role-count">{{ count }}</div>
            <div class="role-name">{{ formatRoleName(role) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import NavBar from './NavBar.vue'

const router = useRouter()
const stats = ref({})
const loading = ref(false)

const loadStats = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3002/admin/estadisticas')
    stats.value = response.data
  } catch (error) {
    console.error('Error cargando estadísticas:', error)
  } finally {
    loading.value = false
  }
}

const refreshStats = () => {
  loadStats()
}

const formatRoleName = (role) => {
  const roleNames = {
    'admin': 'Administrador',
    'curator': 'Curador',
    'researcher': 'Investigador',
    'student': 'Estudiante',
    'visitor': 'Visitante'
  }
  return roleNames[role] || role
}

const logout = () => {
  localStorage.removeItem('admin-token')
  localStorage.removeItem('admin-user')
  router.push('/login')
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--background-color);
}

.dashboard-content {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  color: var(--primary-color);
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.dashboard-header p {
  color: var(--text-secondary);
  font-size: 16px;
}

/* Estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.herbarios {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
}

.stat-icon.usuarios {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.stat-icon.roles {
  background: linear-gradient(135deg, #fff3e0, #ffcc02);
}

.stat-icon.regiones {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
}

.stat-icon.departamentos {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
}

.stat-icon.municipios {
  background: linear-gradient(135deg, #fce4ec, #f8bbd9);
}

.stat-info h3 {
  font-size: 28px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-info p {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-detail {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Acciones Rápidas */
.quick-actions h2 {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.action-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.action-icon {
  font-size: 32px;
  margin-bottom: 16px;
}

.action-card h3 {
  color: var(--primary-color);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.action-card p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

/* Roles */
.roles-section h2 {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.role-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.role-count {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.role-name {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Design notice styles */
.design-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-content h4 {
  margin: 0 0 5px 0;
  color: #856404;
  font-size: 16px;
}

.notice-content p {
  margin: 0;
  color: #856404;
  font-size: 14px;
}
</style>