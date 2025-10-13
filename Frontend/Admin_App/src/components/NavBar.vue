<template>
  <nav class="navbar">
    <div class="navbar-content">
      <!-- Logo y título -->
      <div class="navbar-brand">
        <router-link to="/dashboard" class="brand-link">
          <svg width="40" height="40" viewBox="0 0 100 100" class="brand-logo">
            <defs>
              <radialGradient id="leafGradient" cx="0.3" cy="0.3" r="0.7">
                <stop offset="0%" stop-color="#8bc34a"/>
                <stop offset="100%" stop-color="#2c5530"/>
              </radialGradient>
            </defs>
            <path d="M50 10 C30 30, 30 70, 50 90 C70 70, 70 30, 50 10 Z" 
                  fill="url(#leafGradient)" 
                  stroke="#ffffff" 
                  stroke-width="2"/>
            <path d="M50 10 Q35 35, 50 60 Q65 35, 50 10" 
                  fill="none" 
                  stroke="#ffffff" 
                  stroke-width="1.5"/>
            <path d="M50 60 Q42 75, 50 90" 
                  fill="none" 
                  stroke="#ffffff" 
                  stroke-width="1"/>
            <path d="M50 60 Q58 75, 50 90" 
                  fill="none" 
                  stroke="#ffffff" 
                  stroke-width="1"/>
          </svg>
          <div class="brand-text">
            <span class="brand-title">Herbario Digital - Tax-IFN</span>
            <span class="brand-subtitle">Administración</span>
          </div>
        </router-link>
      </div>

      <!-- Navegación -->
      <div class="navbar-nav">
        <router-link to="/dashboard" class="nav-link" active-class="nav-link-active">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        
        <router-link to="/herbarios" class="nav-link" active-class="nav-link-active">
          <span class="nav-icon">🏛️</span>
          <span>Herbarios</span>
        </router-link>
        
        <router-link to="/usuarios" class="nav-link" active-class="nav-link-active">
          <span class="nav-icon">👥</span>
          <span>Usuarios</span>
        </router-link>

        <div class="nav-dropdown">
          <button class="nav-link dropdown-toggle">
            <span class="nav-icon">🗺️</span>
            <span>Ubicaciones</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-menu">
            <router-link to="/regiones" class="dropdown-link">
              <span class="nav-icon">🌍</span>
              <span>Regiones</span>
            </router-link>
            <router-link to="/departamentos" class="dropdown-link">
              <span class="nav-icon">🏞️</span>
              <span>Departamentos</span>
            </router-link>
            <router-link to="/municipios" class="dropdown-link">
              <span class="nav-icon">🏘️</span>
              <span>Municipios</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Usuario y acciones -->
      <div class="navbar-user">
        <div class="user-info">
          <span class="user-name">{{ currentUser?.username || 'Admin' }}</span>
          <span class="user-role">{{ formatRole(currentUser?.role) }}</span>
        </div>
        
        <div class="user-actions">
          <button @click="logout" class="logout-btn" title="Cerrar Sesión">
            <span>🚪</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentUser = ref(null)

const formatRole = (role) => {
  const roleNames = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador',
    'manager': 'Gerente'
  }
  return roleNames[role] || role
}

const logout = () => {
  localStorage.removeItem('admin-token')
  localStorage.removeItem('admin-user')
  router.push('/login')
}

onMounted(() => {
  const userStr = localStorage.getItem('admin-user')
  if (userStr) {
    try {
      currentUser.value = JSON.parse(userStr)
    } catch (e) {
      console.error('Error parsing user data:', e)
    }
  }
})
</script>

<style scoped>
.navbar {
  background: var(--primary-color);
  border-bottom: 1px solid var(--primary-dark);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 70px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Brand */
.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: white;
}

.brand-logo {
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1;
}

/* Navigation */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.nav-link:hover {
  background: rgba(255,255,255,0.1);
  opacity: 1;
}

.nav-link-active {
  background: rgba(255,255,255,0.15);
  opacity: 1;
}

.nav-icon {
  font-size: 16px;
}

/* Dropdown */
.nav-dropdown {
  position: relative;
}

.dropdown-toggle {
  background: none;
  border: none;
  cursor: pointer;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
  transition: transform 0.3s ease;
}

.nav-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 180px;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.nav-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.dropdown-link:hover {
  background: var(--background-color);
}

.dropdown-link.router-link-active {
  background: var(--primary-color);
  color: white;
}

/* User section */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: white;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1;
}

.logout-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-content {
    padding: 0 16px;
  }
  
  .brand-text {
    display: none;
  }
  
  .navbar-nav {
    gap: 4px;
  }
  
  .nav-link {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .nav-link span:not(.nav-icon) {
    display: none;
  }
  
  .user-info {
    display: none;
  }
}
</style>