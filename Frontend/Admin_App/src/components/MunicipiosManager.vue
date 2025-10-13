<template>
  <div class="municipios-manager">
    <NavBar />
    
    <div class="manager-content">
      <div class="manager-header">
        <h1>Gestión de Municipios</h1>
        <div class="header-actions">
          <select v-model="selectedDepartamento" @change="loadMunicipios" class="form-select filter-select">
            <option value="">Todos los departamentos</option>
            <option v-for="departamento in departamentos" :key="departamento.id" :value="departamento.id">
              {{ departamento.nombre }} ({{ departamento.codigo }})
            </option>
          </select>
          <button @click="showCreateModal = true" class="btn btn-primary">
            <span>➕</span>
            Nuevo Municipio
          </button>
        </div>
      </div>

      <!-- Lista de Municipios -->
      <div class="municipios-list">
        <div v-if="loading" class="loading-message">
          Cargando municipios...
        </div>

        <div v-else-if="municipios.length === 0" class="empty-message">
          <div class="empty-icon">🏘️</div>
          <h3>No hay municipios registrados</h3>
          <p>{{ selectedDepartamento ? 'No hay municipios en este departamento' : 'Comienza creando tu primer municipio' }}</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            Crear Municipio
          </button>
        </div>

        <div v-else class="municipios-grid">
          <div 
            v-for="municipio in municipios" 
            :key="municipio.id" 
            class="municipio-card"
          >
            <div class="municipio-header">
              <div class="municipio-info">
                <h3>{{ municipio.nombre }}</h3>
                <p class="municipio-id">ID: {{ municipio.id }}</p>
              </div>
              <div class="municipio-icon">🏘️</div>
            </div>

            <div class="municipio-details">
              <div class="detail-item">
                <strong>Departamento:</strong> 
                {{ municipio.departamentos?.nombre || 'N/A' }}
              </div>
              <div class="detail-item">
                <strong>Región:</strong> 
                {{ municipio.departamentos?.regiones?.nombre || 'N/A' }}
              </div>
            </div>

            <div class="municipio-actions">
              <button 
                @click="editMunicipio(municipio)" 
                class="btn btn-outline"
                title="Editar"
              >
                ✏️ Editar
              </button>
              <button 
                @click="confirmDelete(municipio)" 
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

    <!-- Modal Crear/Editar Municipio -->
    <div v-if="showCreateModal || editingMunicipio" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingMunicipio ? 'Editar Municipio' : 'Nuevo Municipio' }}</h2>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>

        <form @submit.prevent="saveMunicipio" class="modal-form">
          <div class="form-group">
            <label for="nombre" class="form-label">Nombre *</label>
            <input
              id="nombre"
              v-model="formData.nombre"
              type="text"
              class="form-input"
              placeholder="Ej: Medellín, Bogotá, Cali"
              required
            />
          </div>

          <div class="form-group">
            <label for="departamento_id" class="form-label">Departamento *</label>
            <select
              id="departamento_id"
              v-model="formData.departamento_id"
              class="form-select"
              required
            >
              <option value="">Seleccionar departamento</option>
              <option v-for="departamento in departamentos" :key="departamento.id" :value="departamento.id">
                {{ departamento.nombre }} - {{ departamento.regiones?.nombre }}
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
              {{ saving ? 'Guardando...' : (editingMunicipio ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="deletingMunicipio" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button @click="cancelDelete" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>¿Estás seguro de que deseas eliminar el municipio <strong>{{ deletingMunicipio.nombre }}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>

        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="deleteMunicipio" class="btn btn-danger" :disabled="deleting">
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

const municipios = ref([])
const departamentos = ref([])
const selectedDepartamento = ref('')
const loading = ref(false)
const showCreateModal = ref(false)
const editingMunicipio = ref(null)
const deletingMunicipio = ref(null)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

const formData = ref({
  nombre: '',
  departamento_id: ''
})

const loadDepartamentos = async () => {
  try {
    const response = await axios.get('http://localhost:3002/admin/departamentos')
    departamentos.value = response.data
  } catch (err) {
    console.error('Error cargando departamentos:', err)
  }
}

const loadMunicipios = async () => {
  loading.value = true
  try {
    const params = selectedDepartamento.value ? { departamento_id: selectedDepartamento.value } : {}
    const response = await axios.get('http://localhost:3002/admin/municipios', { params })
    municipios.value = response.data
  } catch (err) {
    console.error('Error cargando municipios:', err)
    error.value = 'Error cargando municipios'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    nombre: '',
    departamento_id: ''
  }
  error.value = ''
}

const editMunicipio = (municipio) => {
  editingMunicipio.value = municipio
  formData.value = {
    nombre: municipio.nombre,
    departamento_id: municipio.departamento_id
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingMunicipio.value = null
  resetForm()
}

const saveMunicipio = async () => {
  saving.value = true
  error.value = ''

  try {
    if (editingMunicipio.value) {
      // Actualizar
      await axios.put(`http://localhost:3002/admin/municipios/${editingMunicipio.value.id}`, formData.value)
    } else {
      // Crear
      await axios.post('http://localhost:3002/admin/municipios', formData.value)
    }
    
    await loadMunicipios()
    closeModal()
  } catch (err) {
    console.error('Error guardando municipio:', err)
    error.value = err.response?.data?.error || 'Error guardando municipio'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (municipio) => {
  deletingMunicipio.value = municipio
}

const cancelDelete = () => {
  deletingMunicipio.value = null
}

const deleteMunicipio = async () => {
  deleting.value = true
  try {
    await axios.delete(`http://localhost:3002/admin/municipios/${deletingMunicipio.value.id}`)
    await loadMunicipios()
    cancelDelete()
  } catch (err) {
    console.error('Error eliminando municipio:', err)
    error.value = err.response?.data?.error || 'Error eliminando municipio'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadDepartamentos()
  await loadMunicipios()
})
</script>

<style scoped>
.municipios-manager {
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

.municipios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.municipio-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.municipio-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.municipio-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.municipio-info h3 {
  color: var(--primary-color);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.municipio-codigo {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.municipio-icon {
  font-size: 32px;
  opacity: 0.7;
}

.municipio-details {
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

.municipio-actions {
  display: flex;
  gap: 12px;
}

.municipio-actions .btn {
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
  
  .municipios-grid {
    grid-template-columns: 1fr;
  }
}
</style>