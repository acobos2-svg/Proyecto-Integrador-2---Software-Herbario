import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../components/Dashboard.vue'
import HerbariosManager from '../components/HerbariosManager.vue'
import UsuariosManager from '../components/UsuariosManager.vue'
import RegionesManager from '../components/RegionesManager.vue'
import DepartamentosManager from '../components/DepartamentosManager.vue'
import MunicipiosManager from '../components/MunicipiosManager.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/herbarios',
    name: 'Herbarios',
    component: HerbariosManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/usuarios',
    name: 'Usuarios',
    component: UsuariosManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/regiones',
    name: 'Regiones',
    component: RegionesManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/departamentos',
    name: 'Departamentos',
    component: DepartamentosManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/municipios',
    name: 'Municipios',
    component: MunicipiosManager,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de autenticación
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('admin-token')
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router