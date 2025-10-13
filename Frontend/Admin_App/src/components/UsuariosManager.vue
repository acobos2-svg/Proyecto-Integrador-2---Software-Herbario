<template>
  <div class="usuarios-manager">
    <NavBar />
    
    <div class="manager-content">
      <div class="manager-header">
        <h1>Gestión de Usuarios</h1>
        <div class="header-actions">
          <select v-model="selectedHerbario" @change="loadUsuarios" class="form-select filter-select">
            <option value="">Todos los herbarios</option>
            <option v-for="herbario in herbarios" :key="herbario.id" :value="herbario.id">
              {{ herbario.nombre }} ({{ herbario.codigo_postal }})
            </option>
          </select>
          <button @click="showCreateModal = true" class="btn btn-primary">
            <span>➕</span>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Lista de Usuarios -->
      <div class="usuarios-list">
        <div v-if="loading" class="loading-message">
          Cargando usuarios...
        </div>

        <div v-else-if="usuarios.length === 0" class="empty-message">
          <div class="empty-icon">👥</div>
          <h3>No hay usuarios registrados</h3>
          <p>{{ selectedHerbario ? 'No hay usuarios en este herbario' : 'Comienza creando tu primer usuario' }}</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            Crear Usuario
          </button>
        </div>

        <div v-else class="usuarios-grid">
          <div 
            v-for="usuario in usuarios" 
            :key="usuario.id_user" 
            class="usuario-card"
          >
            <div class="usuario-header">
              <div class="usuario-avatar">
                {{ getInitials(usuario.nombre_completo) }}
              </div>
              <div class="usuario-info">
                <h3>{{ usuario.nombre_completo }}</h3>
                <p class="usuario-email">{{ usuario.correo_electronico }}</p>
                <p class="usuario-cedula">C.C: {{ usuario.cedula }}</p>
              </div>

            </div>

            <div class="usuario-details">
              <div class="detail-item">
                <strong>Rol:</strong> 
                <span :class="['role-badge', `role-${usuario.rol}`]">
                  {{ formatRole(usuario.rol) }}
                </span>
              </div>
              <div class="detail-item">
                <strong>Herbario:</strong> 
                {{ usuario.herbarios?.nombre || 'N/A' }} ({{ usuario.herbarios?.codigo_postal || 'N/A' }})
              </div>
            </div>

            <div class="usuario-actions">
              <button 
                @click="editUsuario(usuario)" 
                class="btn btn-outline"
                title="Editar"
              >
                ✏️ Editar
              </button>
              <button 
                @click="confirmDelete(usuario)" 
                class="btn btn-danger"
                title="Eliminar"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear/Editar Usuario -->
    <div v-if="showCreateModal || editingUsuario" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>

        <form @submit.prevent="saveUsuario" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="nombre" class="form-label">Nombre Completo *</label>
              <input
                id="nombre"
                v-model="formData.nombre"
                type="text"
                class="form-input"
                placeholder="Nombre completo del usuario"
                required
              />
            </div>

            <div class="form-group">
              <label for="cedula" class="form-label">Cédula *</label>
              <input
                id="cedula"
                v-model="formData.cedula"
                type="text"
                class="form-input"
                placeholder="Número de cédula"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Correo Electrónico *</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="form-input"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="id_herbario" class="form-label">Herbario *</label>
              <select
                id="id_herbario"
                v-model="formData.id_herbario"
                class="form-select"
                required
              >
                <option value="">Seleccionar herbario</option>
                <option v-for="herbario in herbarios" :key="herbario.id" :value="herbario.id">
                  {{ herbario.nombre }} ({{ herbario.codigo_postal }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="rol" class="form-label">Rol *</label>
              <select
                id="rol"
                v-model="formData.rol"
                class="form-select"
                required
              >
                <option value="">Seleccionar rol</option>
                <option value="laboratorista">Laboratorista</option>
                <option value="recepcionista">Recepcionista</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              {{ editingUsuario ? 'Nueva Contraseña (opcional)' : 'Contraseña *' }}
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="form-input"
              placeholder="Contraseña del usuario"
              :required="!editingUsuario"
            />
          </div>



          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (editingUsuario ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="deletingUsuario" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button @click="cancelDelete" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>¿Estás seguro de que deseas eliminar al usuario <strong>{{ deletingUsuario.nombre_completo }}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>

        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="deleteUsuario" class="btn btn-danger" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import NavBar from './NavBar.vue'

const usuarios = ref([])
const herbarios = ref([])
const selectedHerbario = ref('')
const loading = ref(false)
const showCreateModal = ref(false)
const editingUsuario = ref(null)
const deletingUsuario = ref(null)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

const formData = ref({
  nombre: '',
  email: '',
  cedula: '',
  password: '',
  rol: '',
  id_herbario: ''
})

const loadHerbarios = async () => {
  try {
    const response = await axios.get('http://localhost:3002/admin/herbario')
    herbarios.value = response.data
  } catch (err) {
    console.error('Error cargando herbarios:', err)
  }
}

const loadUsuarios = async () => {
  loading.value = true
  try {
    const params = selectedHerbario.value ? { id_herbario: selectedHerbario.value } : {}
    const response = await axios.get('http://localhost:3002/admin/usuarios', { params })
    usuarios.value = response.data
  } catch (err) {
    console.error('Error cargando usuarios:', err)
    error.value = 'Error cargando usuarios'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    nombre: '',
    email: '',
    cedula: '',
    password: '',
    rol: '',
    id_herbario: ''
  }
  error.value = ''
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatRole = (role) => {
  const roleNames = {
    'laboratorista': 'Laboratorista',
    'recepcionista': 'Recepcionista'
  }
  return roleNames[role] || role
}

const editUsuario = (usuario) => {
  editingUsuario.value = usuario
  formData.value = {
    nombre: usuario.nombre_completo,
    email: usuario.correo_electronico,
    cedula: usuario.cedula,
    password: '',
    rol: usuario.rol,
    id_herbario: usuario.id_herbario
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingUsuario.value = null
  resetForm()
}

const saveUsuario = async () => {
  saving.value = true
  error.value = ''

  try {
    if (editingUsuario.value) {
      // Actualizar
      const updateData = { ...formData.value }
      if (!updateData.password) {
        delete updateData.password
      }
      await axios.put(`http://localhost:3002/admin/usuarios/${editingUsuario.value.id_user}`, updateData)
    } else {
      // Crear
      await axios.post('http://localhost:3002/admin/usuarios', formData.value)
    }
    
    await loadUsuarios()
    closeModal()
  } catch (err) {
    console.error('Error guardando usuario:', err)
    error.value = err.response?.data?.error || 'Error guardando usuario'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (usuario) => {
  deletingUsuario.value = usuario
}

const cancelDelete = () => {
  deletingUsuario.value = null
}

const deleteUsuario = async () => {
  deleting.value = true
  try {
    await axios.delete(`http://localhost:3002/admin/usuarios/${deletingUsuario.value.id_user}`)
    await loadUsuarios()
    cancelDelete()
  } catch (err) {
    console.error('Error eliminando usuario:', err)
    error.value = err.response?.data?.error || 'Error eliminando usuario'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadHerbarios()
  await loadUsuarios()
})
</script>

<style scoped>
.usuarios-manager {
  min-height: 100vh;
  background: var(--background-color);
}

.manager-content {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
}

.manager-header h1 {
  color: var(--primary-color);
  font-size: 32px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-select {
  min-width: 200px;
}

.loading-message {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
  font-size: 16px;
}

.empty-message {
  text-align: center;
  padding: 64px 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.empty-message h3 {
  color: var(--primary-color);
  font-size: 24px;
  margin-bottom: 16px;
}

.empty-message p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.usuarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.usuario-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.usuario-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.usuario-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.usuario-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.usuario-info {
  flex: 1;
}

.usuario-info h3 {
  color: var(--primary-color);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.usuario-email {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 2px;
}

.usuario-cedula {
  color: var(--text-secondary);
  font-size: 13px;
}

.usuario-details {
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item strong {
  color: var(--primary-color);
  min-width: 70px;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-laboratorista {
  background: #e1f5fe;
  color: #0277bd;
}

.role-recepcionista {
  background: #f1f8e9;
  color: #558b2f;
}

.usuario-actions {
  display: flex;
  gap: 12px;
}

.usuario-actions .btn {
  padding: 8px 16px;
  font-size: 13px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
}

.modal-form {
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.warning-text {
  color: var(--error-color);
  font-size: 14px;
  margin-top: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: 18px;
  height: 18px;
}

.checkbox-text {
  font-size: 14px;
  color: var(--text-primary);
}

.error-message {
  background: #ffebee;
  color: var(--error-color);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .usuarios-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>