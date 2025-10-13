<script setup>
import { ref, computed } from 'vue'
import TopNavigation from './components/TopNavigation.vue'
import MainPage from './components/MainPage.vue'
import LoginPage from './components/LoginPage.vue'
import RecepcionDashboard from './components/RecepcionDashboard.vue'
import LaboratorioDashboard from './components/LaboratorioDashboard.vue'
import HerbarioDigital from './components/HerbarioDigital.vue'
import EstadisticasPanel from './components/EstadisticasPanel.vue'
import ImageDemo from './components/ImageDemo.vue'

// Estado global de la aplicación
const currentView = ref('MainPage')
const userData = ref({
  nombre: 'Invitado',
  rol: null,
  herbario: 'H. Simulado'
})
const loginError = ref(null)

// Función para navegar entre vistas
const navigateTo = (view, data = null) => {
  console.log(`[FRONTEND] Navegando a: ${view}`)
  currentView.value = view
  if (data) {
    // Manejar datos adicionales si es necesario
  }
}

// Función para manejar login
const handleLogin = (credentials) => {
  const { cedula } = credentials
  
  if (cedula === 'recepcion') {
    userData.value = { 
      nombre: 'María Rodríguez', 
      rol: 'Recepcionista', 
      herbario: 'IDEAM' 
    }
    loginError.value = null
    navigateTo('RecepcionDashboard')
  } else if (cedula === 'laboratorio') {
    userData.value = { 
      nombre: 'Carlos Vargas', 
      rol: 'Laboratorista', 
      herbario: 'IDEAM' 
    }
    loginError.value = null
    navigateTo('LaboratorioDashboard')
  } else {
    loginError.value = "Credenciales simuladas incorrectas. Usa 'recepcion' o 'laboratorio'."
  }
}

// Función para manejar logout
const handleLogout = () => {
  userData.value = { nombre: 'Invitado', rol: null, herbario: 'H. Simulado' }
  loginError.value = null
  navigateTo('MainPage')
}

// Computadas para facilitar el uso en componentes
const isLoggedIn = computed(() => userData.value.rol !== null)
const isRecepcionista = computed(() => userData.value.rol === 'Recepcionista')
const isLaboratorista = computed(() => userData.value.rol === 'Laboratorista')
</script>

<template>
  <div>
    <!-- Navegación superior siempre presente -->
    <TopNavigation 
      :userData="userData"
      :isLoggedIn="isLoggedIn"
      @navigate="navigateTo"
      @logout="handleLogout"
    />

    <!-- Contenido principal con transiciones suaves -->
    <div class="content-area">
      <Transition name="fade" mode="out-in">
        <!-- Página principal -->
        <MainPage 
          v-if="currentView === 'MainPage'"
          @navigate="navigateTo"
        />
        
        <!-- Login -->
        <LoginPage 
          v-else-if="currentView === 'Login'"
          :loginError="loginError"
          @login="handleLogin"
          @navigate="navigateTo"
        />
        
        <!-- Dashboard de Recepción -->
        <RecepcionDashboard 
          v-else-if="currentView === 'RecepcionDashboard'"
          :currentUser="userData"
          @logout="handleLogout"
        />
        
        <!-- Dashboard de Laboratorio -->
        <LaboratorioDashboard 
          v-else-if="currentView === 'LaboratorioDashboard'"
          :currentUser="userData"
          @logout="handleLogout"
        />
        
        <!-- Herbario Digital -->
        <HerbarioDigital 
          v-else-if="currentView === 'HerbarioDigital'"
          @navigate="navigateTo"
        />
        
        <!-- Panel de Estadísticas -->
        <EstadisticasPanel 
          v-else-if="currentView === 'Estadisticas'"
          @navigate="navigateTo"
        />
        
        <!-- Demo de Imágenes -->
        <ImageDemo 
          v-else-if="currentView === 'ImageDemo'"
          @navigate="navigateTo"
        />
        
        <!-- Página 404 -->
        <div v-else class="container text-center">
          <h2>Error 404</h2>
          <p>Página no encontrada.</p>
          <button class="btn btn-primary" @click="navigateTo('MainPage')">
            Volver al Inicio
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.content-area {
  min-height: calc(100vh - 80px);
}

/* Transiciones para cambio de vistas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
