<template>
  <div class="departamentos-manager">
    <NavBar />
    
    <div class="manager-content">
      <div class="manager-header">
        <h1>Gestión de Departamentos</h1>
        <div class="header-actions">
          <select v-model="selectedRegion" @change="loadDepartamentos" class="form-select filter-select">
            <option value="">Todas las regiones</option>
            <option v-for="region in regiones" :key="region.id" :value="region.id">
              {{ region.nombre }} ({{ region.codigo }})
            </option>
          </select>
          <button @click="showCreateModal = true" class="btn btn-primary">
            <span>➕</span>
            Nuevo Departamento
          </button>
        </div>
      </div>

      <!-- Lista de Departamentos -->
      <div class="departamentos-list">
        <div v-if="loading" class="loading-message">
          Cargando departamentos...
        </div>

        <div v-else-if="departamentos.length === 0" class="empty-message">
          <div class="empty-icon">🏞️</div>
          <h3>No hay departamentos registrados</h3>
          <p>{{ selectedRegion ? 'No hay departamentos en esta región' : 'Comienza creando tu primer departamento' }}</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            Crear Departamento
          </button>
        </div>

        <div v-else class="departamentos-grid">
          <div 
            v-for="departamento in departamentos" 
            :key="departamento.id" 
            class="departamento-card"
          >
            <div class="departamento-header">
              <div class="departamento-info">
                <h3>{{ departamento.nombre }}</h3>
                <p class="departamento-id">ID: {{ departamento.id }}</p>
              </div>
              <div class="departamento-icon">🏞️</div>
            </div>

            <div class="departamento-details">
              <div class="detail-item">
                <strong>Región:</strong> 
                {{ departamento.regiones?.nombre || 'N/A' }}
              </div>
              <div class="detail-item">
                <strong>Departamento:</strong> {{ departamento.nombre }}
              </div>
            </div>

            <div class="departamento-actions">
              <button 
                @click="editDepartamento(departamento)" 
                class="btn btn-outline"
                title="Editar"
              >
                ✏️ Editar
              </button>
              <button 
                @click="confirmDelete(departamento)" 
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

    <!-- Modal Crear/Editar Departamento -->
    <div v-if="showCreateModal || editingDepartamento" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento' }}</h2>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>

        <form @submit.prevent="saveDepartamento" class="modal-form">
          <div class="form-group">
            <label for="nombre" class="form-label">Nombre *</label>
            <input
              id="nombre"
              v-model="formData.nombre"
              type="text"
              class="form-input"
              placeholder="Ej: Antioquia, Cundinamarca, Valle del Cauca"
              required
            />
          </div>

          <div class="form-group">
            <label for="region_id" class="form-label">Región *</label>
            <select
              id="region_id"
              v-model="formData.region_id"
              class="form-select"
              required
            >
              <option value="">Seleccionar región</option>
              <option v-for="region in regiones" :key="region.id" :value="region.id">
                {{ region.nombre }}
              </option>
            </select>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (editingDepartamento ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="deletingDepartamento" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button @click="cancelDelete" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>¿Estás seguro de que deseas eliminar el departamento <strong>{{ deletingDepartamento.nombre }}</strong>?</p>
          <p class="warning-text">Esta acción eliminará también todos los municipios asociados.</p>
        </div>

        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="deleteDepartamento" class="btn btn-danger" :disabled="deleting">
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

const departamentos = ref([])
const regiones = ref([])
const selectedRegion = ref('')
const loading = ref(false)
const showCreateModal = ref(false)
const editingDepartamento = ref(null)
const deletingDepartamento = ref(null)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

const formData = ref({
  nombre: '',
  region_id: ''
})

const loadRegiones = async () => {
  try {
    const response = await axios.get('http://localhost:3002/admin/regiones')
    regiones.value = response.data
  } catch (err) {
    console.error('Error cargando regiones:', err)
  }
}

const loadDepartamentos = async () => {
  loading.value = true
  try {
    const params = selectedRegion.value ? { region_id: selectedRegion.value } : {}
    const response = await axios.get('http://localhost:3002/admin/departamentos', { params })
    departamentos.value = response.data
  } catch (err) {
    console.error('Error cargando departamentos:', err)
    error.value = 'Error cargando departamentos'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    nombre: '',
    region_id: ''
  }
  error.value = ''
}

const editDepartamento = (departamento) => {
  editingDepartamento.value = departamento
  formData.value = {
    nombre: departamento.nombre,
    region_id: departamento.region_id
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingDepartamento.value = null
  resetForm()
}

const saveDepartamento = async () => {
  saving.value = true
  error.value = ''

  try {
    if (editingDepartamento.value) {
      // Actualizar
      await axios.put(`http://localhost:3002/admin/departamentos/${editingDepartamento.value.id}`, formData.value)
    } else {
      // Crear
      await axios.post('http://localhost:3002/admin/departamentos', formData.value)
    }
    
    await loadDepartamentos()
    closeModal()
  } catch (err) {
    console.error('Error guardando departamento:', err)
    error.value = err.response?.data?.error || 'Error guardando departamento'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (departamento) => {
  deletingDepartamento.value = departamento
}

const cancelDelete = () => {
  deletingDepartamento.value = null
}

const deleteDepartamento = async () => {
  deleting.value = true
  try {
    await axios.delete(`http://localhost:3002/admin/departamentos/${deletingDepartamento.value.id}`)
    await loadDepartamentos()
    cancelDelete()
  } catch (err) {
    console.error('Error eliminando departamento:', err)
    error.value = err.response?.data?.error || 'Error eliminando departamento'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadRegiones()
  await loadDepartamentos()
})
</script>

<style scoped>
.departamentos-manager {
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

.departamentos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.departamento-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.departamento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.departamento-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.departamento-info h3 {
  color: var(--primary-color);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.departamento-codigo {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.departamento-icon {
  font-size: 32px;
  opacity: 0.7;
}

.departamento-details {
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

.detail-item strong {
  color: var(--primary-color);
}

.departamento-actions {
  display: flex;
  gap: 12px;
}

.departamento-actions .btn {
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
  max-width: 500px;
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
  
  .departamentos-grid {
    grid-template-columns: 1fr;
  }
}
</style>