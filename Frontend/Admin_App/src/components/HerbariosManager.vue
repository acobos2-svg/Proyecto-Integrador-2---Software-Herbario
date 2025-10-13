<template>
  <div class="herbarios-manager">
    <NavBar />
    
    <div class="manager-content">
      <div class="manager-header">
        <h1>Gestión de Herbarios</h1>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <span>➕</span>
          Nuevo Herbario
        </button>
      </div>

      <!-- Lista de Herbarios -->
      <div class="herbarios-list">
        <div v-if="loading" class="loading-message">
          Cargando herbarios...
        </div>

        <div v-else-if="herbarios.length === 0" class="empty-message">
          <div class="empty-icon">🏛️</div>
          <h3>No hay herbarios registrados</h3>
          <p>Comienza creando tu primer herbario</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            Crear Herbario
          </button>
        </div>

        <div v-else class="herbarios-grid">
          <div 
            v-for="herbario in herbarios" 
            :key="herbario.id" 
            class="herbario-card"
          >
            <div class="herbario-header">
              <div class="herbario-info">
                <h3>{{ herbario.nombre }}</h3>
                <p v-if="herbario.codigo_postal" class="herbario-codigo">Código Postal: {{ herbario.codigo_postal }}</p>
              </div>

            </div>

            <div class="herbario-details">
              <div v-if="herbario.direccion" class="detail-item">
                <strong>Dirección:</strong> {{ herbario.direccion }}
              </div>
            </div>

            <div class="herbario-actions">
              <button 
                @click="editHerbario(herbario)" 
                class="btn btn-outline"
                title="Editar"
              >
                ✏️ Editar
              </button>
              <button 
                @click="confirmDelete(herbario)" 
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

    <!-- Modal Crear/Editar Herbario -->
    <div v-if="showCreateModal || editingHerbario" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingHerbario ? 'Editar Herbario' : 'Nuevo Herbario' }}</h2>
          <button @click="closeModal" class="modal-close">✕</button>
        </div>

        <form @submit.prevent="saveHerbario" class="modal-form">
          <div class="form-group">
            <label for="nombre" class="form-label">Nombre *</label>
            <input
              id="nombre"
              v-model="formData.nombre"
              type="text"
              class="form-input"
              placeholder="Ej: Herbario Nacional de Colombia"
              required
            />
          </div>

          <div class="form-group">
            <label for="codigo_postal" class="form-label">Código Postal</label>
            <input
              id="codigo_postal"
              v-model="formData.codigo_postal"
              type="text"
              class="form-input"
              placeholder="Ej: 111321, 050010"
            />
          </div>

          <div class="form-group">
            <label for="direccion" class="form-label">Dirección</label>
            <textarea
              id="direccion"
              v-model="formData.direccion"
              class="form-input"
              rows="3"
              placeholder="Dirección completa del herbario..."
            ></textarea>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (editingHerbario ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="deletingHerbario" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button @click="cancelDelete" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p>¿Estás seguro de que deseas eliminar el herbario <strong>{{ deletingHerbario.nombre }}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>

        <div class="modal-actions">
          <button @click="cancelDelete" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="deleteHerbario" class="btn btn-danger" :disabled="deleting">
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

const herbarios = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const editingHerbario = ref(null)
const deletingHerbario = ref(null)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

const formData = ref({
  nombre: '',
  codigo_postal: '',
  direccion: ''
})

const loadHerbarios = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3002/admin/herbario')
    herbarios.value = response.data
  } catch (err) {
    console.error('Error cargando herbarios:', err)
    error.value = 'Error cargando herbarios'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    nombre: '',
    codigo_postal: '',
    direccion: ''
  }
  error.value = ''
}

const editHerbario = (herbario) => {
  editingHerbario.value = herbario
  formData.value = { ...herbario }
}

const closeModal = () => {
  showCreateModal.value = false
  editingHerbario.value = null
  resetForm()
}

const saveHerbario = async () => {
  saving.value = true
  error.value = ''

  try {
    if (editingHerbario.value) {
      // Actualizar
      await axios.put(`http://localhost:3002/admin/herbario/${editingHerbario.value.id}`, formData.value)
    } else {
      // Crear
      await axios.post('http://localhost:3002/admin/herbario', formData.value)
    }
    
    await loadHerbarios()
    closeModal()
  } catch (err) {
    console.error('Error guardando herbario:', err)
    error.value = err.response?.data?.error || 'Error guardando herbario'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (herbario) => {
  deletingHerbario.value = herbario
}

const cancelDelete = () => {
  deletingHerbario.value = null
}

const deleteHerbario = async () => {
  deleting.value = true
  try {
    await axios.delete(`http://localhost:3002/admin/herbario/${deletingHerbario.value.id}`)
    await loadHerbarios()
    cancelDelete()
  } catch (err) {
    console.error('Error eliminando herbario:', err)
    error.value = err.response?.data?.error || 'Error eliminando herbario'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadHerbarios()
})
</script>

<style scoped>
.herbarios-manager {
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

.herbarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.herbario-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.herbario-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.herbario-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.herbario-info h3 {
  color: var(--primary-color);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.herbario-codigo {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.herbario-details {
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

.herbario-actions {
  display: flex;
  gap: 12px;
}

.herbario-actions .btn {
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
</style>