<template>
  <div class="regiones-manager">
    <NavBar />
    
    <div class="manager-content">
      <div class="manager-header">
        <h1>Gestión de Regiones</h1>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <span>➕</span>
          Nueva Región
        </button>
      </div>

      <!-- Lista de Regiones -->
      <div class="regiones-list">
        <div v-if="loading" class="loading-message">
          Cargando regiones...
        </div>

        <div v-else-if="regiones.length === 0" class="empty-message">
          <div class="empty-icon">🌍</div>
          <h3>No hay regiones registradas</h3>
          <p>Comienza creando tu primera región</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            Crear Región
          </button>
        </div>

        <div v-else class="regiones-grid">
          <div 
            v-for="region in regiones" 
            :key="region.id" 
            class="region-card"
          >
            <div class="region-header">
              <div class="region-info">
                <h3>{{ region.nombre }}</h3>
                <p class="region-id">ID: {{ region.id }}</p>
              </div>
              <div class="region-icon">🌍</div>
            </div>

            <div class="region-details">
              <div class="detail-item">
                <strong>Región:</strong> {{ region.nombre }}
              </div>
            </div>

            <div class="region-actions">
              <button 
                @click="editRegion(region)" 
                class="btn btn-outline"
                title="Editar"
              >
                ✏️ Editar
              </button>
              <button 
                @click="confirmDelete(region)" 
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

    <!-- Modal Crear/Editar Región -->
    <div v-if="showCreateModal || editingRegion" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingRegion ? 'Editar Región' : 'Nueva Región' }}</h2>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>

        <form @submit.prevent="saveRegion" class="modal-form">
          <div class="form-group">
            <label for="nombre" class="form-label">Nombre *</label>
            <input
              id="nombre"
              v-model="formData.nombre"
              type="text"
              class="form-input"
              placeholder="Ej: Región Andina, Región Caribe, Región Pacífica"
              required
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
              {{ saving ? 'Guardando...' : (editingRegion ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="deletingRegion" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button @click="cancelDelete" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>¿Estás seguro de que deseas eliminar la región <strong>{{ deletingRegion.nombre }}</strong>?</p>
          <p class="warning-text">Esta acción eliminará también todos los departamentos y municipios asociados.</p>
        </div>

        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="deleteRegion" class="btn btn-danger" :disabled="deleting">
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

const regiones = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const editingRegion = ref(null)
const deletingRegion = ref(null)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

const formData = ref({
  nombre: ''
})

const loadRegiones = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3002/admin/regiones')
    regiones.value = response.data
  } catch (err) {
    console.error('Error cargando regiones:', err)
    error.value = 'Error cargando regiones'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    nombre: ''
  }
  error.value = ''
}

const editRegion = (region) => {
  editingRegion.value = region
  formData.value = { ...region }
}

const closeModal = () => {
  showCreateModal.value = false
  editingRegion.value = null
  resetForm()
}

const saveRegion = async () => {
  saving.value = true
  error.value = ''

  try {
    if (editingRegion.value) {
      // Actualizar
      await axios.put(`http://localhost:3002/admin/regiones/${editingRegion.value.id}`, formData.value)
    } else {
      // Crear
      await axios.post('http://localhost:3002/admin/regiones', formData.value)
    }
    
    await loadRegiones()
    closeModal()
  } catch (err) {
    console.error('Error guardando región:', err)
    error.value = err.response?.data?.error || 'Error guardando región'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (region) => {
  deletingRegion.value = region
}

const cancelDelete = () => {
  deletingRegion.value = null
}

const deleteRegion = async () => {
  deleting.value = true
  try {
    await axios.delete(`http://localhost:3002/admin/regiones/${deletingRegion.value.id}`)
    await loadRegiones()
    cancelDelete()
  } catch (err) {
    console.error('Error eliminando región:', err)
    error.value = err.response?.data?.error || 'Error eliminando región'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadRegiones()
})
</script>

<style scoped>
.regiones-manager {
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
}

.manager-header h1 {
  color: var(--primary-color);
  font-size: 32px;
  font-weight: 600;
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

.regiones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.region-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.region-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.region-info h3 {
  color: var(--primary-color);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.region-id {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.region-icon {
  font-size: 32px;
  opacity: 0.7;
}

.region-details {
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

.region-actions {
  display: flex;
  gap: 12px;
}

.region-actions .btn {
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
</style>