<template>
  <div class="laboratorio-container">
    <!-- Header -->
    <div class="view-header">🔬 Laboratorio IDEAM - Clasificación Taxonómica</div>

    <div class="container">
      <!-- Información del usuario logueado -->
      <div class="user-info mb-20">
        <div class="card">
          <h3>👨‍🔬 Usuario: {{ currentUser.nombre }}</h3>
          <p><strong>Rol:</strong> {{ currentUser.rol }}</p>
          <p><strong>Área:</strong> Clasificación Taxonómica</p>
        </div>
      </div>

      <!-- Tabs de navegación -->
      <div class="tabs">
        <button 
          @click="activeTab = 'cola'" 
          :class="['tab-btn', { active: activeTab === 'cola' }]"
        >
          <span class="tab-icon">📋</span> Cola de Clasificación
          <span v-if="pendingClassifications > 0" class="tab-badge">{{ pendingClassifications }}</span>
        </button>
        <button 
          @click="activeTab = 'clasificar'" 
          :class="['tab-btn', { active: activeTab === 'clasificar' }]"
        >
          <span class="tab-icon">🔬</span> Clasificar Muestra
        </button>
        <button 
          @click="activeTab = 'historial'" 
          :class="['tab-btn', { active: activeTab === 'historial' }]"
        >
          <span class="tab-icon">📚</span> Historial
        </button>
        <button 
          @click="activeTab = 'estadisticas'" 
          :class="['tab-btn', { active: activeTab === 'estadisticas' }]"
        >
          <span class="tab-icon">📊</span> Estadísticas
        </button>
      </div>

      <!-- Contenido de pestañas -->
      <div class="tab-content">
        
        <!-- PESTAÑA: COLA DE CLASIFICACIÓN -->
        <div v-if="activeTab === 'cola'" class="cola-tab">
          <div class="cola-header">
            <h3>📋 Muestras Pendientes de Clasificación ({{ muestrasPendientes.length }})</h3>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando muestras pendientes...</p>
          </div>

          <div v-else-if="muestrasPendientes.length === 0" class="empty-state">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h3>¡No hay muestras pendientes!</h3>
            <p>Todas las muestras han sido clasificadas.</p>
          </div>

          <div v-else class="samples-grid">
            <div 
              v-for="muestra in muestrasPendientes" 
              :key="muestra.id"
              class="sample-card"
              @click="seleccionarMuestra(muestra)"
            >
              <div class="sample-header">
                <span class="sample-code">{{ muestra.codigo }}</span>
                <span class="pending-badge">PENDIENTE</span>
              </div>
              
              <div class="sample-info">
                <p><strong>Paquete:</strong> {{ muestra.paquete_numero }}</p>
                <p><strong>Colector:</strong> {{ muestra.colector }}</p>
                <p><strong>Recibida:</strong> {{ formatDate(muestra.fecha_recepcion) }}</p>
                <p><strong>Conglomerado:</strong> {{ muestra.conglomerado }}</p>
              </div>
              
              <div class="sample-actions">
                <button @click.stop="iniciarClasificacion(muestra)" class="btn btn-primary btn-sm">
                  🔬 Clasificar
                </button>
                <button @click.stop="verDetalles(muestra)" class="btn btn-secondary btn-sm">
                  👁️ Detalles
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- PESTAÑA: CLASIFICAR MUESTRA -->
        <div v-if="activeTab === 'clasificar'" class="clasificar-tab">
          <div v-if="!muestraSeleccionada" class="empty-state">
            <div style="font-size: 64px; margin-bottom: 20px;">🔬</div>
            <h3>Selecciona una Muestra para Clasificar</h3>
            <p>Ve a la pestaña "Cola de Clasificación" y selecciona una muestra para comenzar el proceso de clasificación taxonómica.</p>
            <button @click="activeTab = 'cola'" class="btn btn-primary">
              📋 Ver Cola de Clasificación
            </button>
          </div>

          <div v-else class="clasificacion-container">
            <div class="muestra-info-header">
              <div class="muestra-details">
                <h3>🔬 Clasificando: {{ muestraSeleccionada.codigo }}</h3>
                <div class="muestra-meta">
                  <span><strong>Colector:</strong> {{ muestraSeleccionada.colector }}</span>
                  <span><strong>Paquete:</strong> {{ muestraSeleccionada.paquete_numero }}</span>
                  <span><strong>Recibida:</strong> {{ formatDate(muestraSeleccionada.fecha_recepcion) }}</span>
                </div>
              </div>
              <div class="classification-methods">
                <button 
                  @click="metodClasificacion = 'manual'" 
                  :class="['method-btn', { active: metodClasificacion === 'manual' }]"
                >
                  🔍 Clasificación Manual
                </button>
              </div>
            </div>

            <!-- Clasificación Manual -->
            <div v-if="metodClasificacion === 'manual'" class="classification-manual">
              <div class="classification-form">
                <h4>📝 Clasificación Taxonómica Manual</h4>
                
                <div class="taxonomy-section">
                  <!-- Selector taxonómico compacto -->
                  <TaxonomicSelector 
                    v-model="taxonomicSelection"
                    @selectionComplete="onTaxonomySelected"
                  />
                </div>

                <!-- Campos adicionales de clasificación -->
                <div class="classification-fields">
                  <div class="form-group">
                    <label>Estado de Clasificación *</label>
                    <select v-model="clasificacionForm.estado" required>
                      <option value="">Seleccionar estado...</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="en análisis">En Análisis</option>
                      <option value="borrador">Borrador</option>
                      <option value="firmado">Firmado</option>
                      <option value="clasificado">Clasificado</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Estado Reproductivo *</label>
                    <select v-model="clasificacionForm.estado_reproductivo" required>
                      <option value="">Seleccionar estado reproductivo...</option>
                      <option value="Vegetativo">Vegetativo</option>
                      <option value="Floración">Floración</option>
                      <option value="Fructificación">Fructificación</option>
                      <option value="Floración y fructificación simultánea">Floración y fructificación simultánea</option>
                      <option value="Estéril">Estéril</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Foto del Espécimen</label>
                    <input 
                      type="file"
                      accept="image/*"
                      @change="handleFotoUpload"
                      class="file-input"
                    >
                    <small>Formatos: JPG, PNG, WEBP</small>
                  </div>

                  <div class="form-group full-width">
                    <label>Observaciones</label>
                    <textarea 
                      v-model="clasificacionForm.observaciones"
                      placeholder="Características morfológicas, criterios de identificación, observaciones adicionales..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                <div class="form-actions">
                  <button 
                    type="button" 
                    @click="guardarClasificacion" 
                    class="btn btn-primary"
                    :disabled="!muestraSeleccionada"
                  >
                    ✅ Guardar Clasificación
                  </button>
                  <button 
                    type="button" 
                    @click="cancelarClasificacion" 
                    class="btn btn-secondary"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>

              <div class="classification-history">
                <h4>📚 Referencias y Historial</h4>
                <div class="reference-tools">
                  <button class="btn btn-sm btn-outline">🔗 Consultar Flora Colombia</button>
                  <button class="btn btn-sm btn-outline">📖 Guías de Campo</button>
                  <button class="btn btn-sm btn-outline">🌿 Herbario Nacional</button>
                </div>
              </div>
            </div>


          </div>
        </div>

        <!-- PESTAÑA: HISTORIAL -->
        <div v-if="activeTab === 'historial'" class="historial-tab">
          <div class="historial-header">
            <h3>📚 Historial de Clasificaciones</h3>
            <div class="historial-filters">
              <input 
                v-model="filtroHistorial" 
                type="text" 
                placeholder="Buscar por código, familia, género..."
                class="search-input"
              >
              <select v-model="filtroFecha">
                <option value="">Todas las fechas</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
              </select>
            </div>
          </div>

          <div class="empty-state" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">📚</div>
            <h3>Historial de Clasificaciones</h3>
            <p>Funcionalidad de historial disponible próximamente.</p>
            <p><strong>Incluirá:</strong></p>
            <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
              <li>📋 Lista de todas las clasificaciones realizadas</li>
              <li>🔍 Búsqueda y filtros avanzados</li>
              <li>📊 Estadísticas de clasificación por período</li>
              <li>📄 Exportación de reportes</li>
              <li>🔄 Historial de revisiones y cambios</li>
            </ul>
          </div>
        </div>

        <!-- PESTAÑA: ESTADÍSTICAS -->
        <div v-if="activeTab === 'estadisticas'" class="estadisticas-tab">
          <div class="design-notice">
            <div class="notice-icon">⚠️</div>
            <div class="notice-content">
              <h4>Diseño de Interfaz</h4>
              <p>Esta sección muestra solo el diseño de la interfaz. Las estadísticas no están implementadas con datos reales.</p>
            </div>
          </div>

          <div class="estadisticas-header">
            <h3>📊 Estadísticas del Laboratorio</h3>
            <p>Métricas y análisis de productividad del laboratorio de taxonomía</p>
          </div>

          <div class="metrics-dashboard">
            <div class="metrics-grid">
              <div class="metric-card primary">
                <div class="metric-icon">🔬</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Clasificaciones Hoy</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
              
              <div class="metric-card success">
                <div class="metric-icon">✅</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Total Clasificadas</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
              
              <div class="metric-card warning">
                <div class="metric-icon">⏳</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Pendientes</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
              
              <div class="metric-card info">
                <div class="metric-icon">🎯</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Eficiencia Semanal</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
            </div>

            <div class="charts-section">
              <div class="chart-card">
                <h4>📈 Clasificaciones por Día (Última Semana)</h4>
                <div class="chart-placeholder">
                  <p>Diseño de interfaz - Gráfico no implementado</p>
                </div>
              </div>
              
              <div class="chart-card">
                <h4>🥧 Distribución por Familias</h4>
                <div class="chart-placeholder">
                  <p>Diseño de interfaz - Gráfico no implementado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import TaxonomicSelector from './TaxonomicSelector.vue'
import TaxonomicClassifier from './TaxonomicClassifier.vue'

// Navegación por pestañas
const activeTab = ref('cola')

// Estados de carga
const loading = ref(false)

// Usuario actual (simulado)
const currentUser = ref({
  nombre: 'Dr. María González',
  rol: 'Laboratorista Senior'
})

// Datos para la cola de clasificación
const muestrasPendientes = ref([])
const pendingClassifications = ref(0)

// Muestra seleccionada para clasificar
const muestraSeleccionada = ref(null)
const metodClasificacion = ref('manual')

// Formulario de clasificación
const clasificacionForm = reactive({
  id_especie: '',
  estado: '',
  estado_reproductivo: '',
  foto: null,
  observaciones: ''
})

// Selector taxonómico
const taxonomicSelection = ref({})
const selectedTaxonomy = ref({
  familia: null,
  genero: null,
  especie: null
})

// Filtros de historial
const filtroHistorial = ref('')
const filtroFecha = ref('')

// Computed
const isValidClassification = computed(() => {
  return clasificacionForm.id_especie || clasificacionForm.estado
})

// Métodos
const loadInitialData = async () => {
  try {
    await loadPendingSamples()
  } catch (error) {
    console.error('Error cargando datos iniciales:', error)
  }
}

const loadPendingSamples = async () => {
  loading.value = true
  try {
    console.log('Cargando muestras pendientes...')
    const response = await fetch('http://localhost:3002/muestras/pendientes')
    
    if (response.ok) {
      const data = await response.json()
      console.log('Datos recibidos:', data)
      
      // Mapear datos del Gest_Herb_service directamente
      if (data && data.length > 0) {
        muestrasPendientes.value = data.map(muestra => ({
          id: muestra.id,
          codigo: muestra.num_coleccion,
          paquete_numero: muestra.paquete.num_paquete,
          colector: muestra.colector,
          fecha_recepcion: muestra.paquete.fecha_recibido_herbario || '--',
          conglomerado: `${muestra.paquete.evento_coleccion.conglomerado.codigo} - ${muestra.paquete.evento_coleccion.conglomerado.municipio.nombre}, ${muestra.paquete.evento_coleccion.conglomerado.municipio.departamento.nombre}`,
          estado: 'pendiente'
        }))
      } else {
        muestrasPendientes.value = []
      }
      
      console.log('Muestras mapeadas:', muestrasPendientes.value)
      pendingClassifications.value = muestrasPendientes.value.length
      
    } else {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
  } catch (error) {
    console.error('Error cargando muestras pendientes:', error)
    // En caso de error, mostrar array vacío sin datos simulados
    muestrasPendientes.value = []
    pendingClassifications.value = 0
  } finally {
    loading.value = false
  }
}

const seleccionarMuestra = (muestra) => {
  muestraSeleccionada.value = muestra
  activeTab.value = 'clasificar'
  resetClasificacionForm()
}

const iniciarClasificacion = (muestra) => {
  seleccionarMuestra(muestra)
}

const verDetalles = (muestra) => {
  alert(`Detalles de la muestra ${muestra.codigo}\n\nEsta funcionalidad se implementará próximamente.`)
}

const resetClasificacionForm = () => {
  Object.assign(clasificacionForm, {
    id_especie: '',
    estado: '',
    estado_reproductivo: '',
    foto: null,
    observaciones: ''
  })
  
  // Reset taxonomic selection
  taxonomicSelection.value = {}
  selectedTaxonomy.value = {
    familia: null,
    genero: null,
    especie: null
  }
}

const onTaxonomySelected = (selection) => {
  selectedTaxonomy.value = {
    familia: selection.familia,
    genero: selection.genero,
    especie: selection.especie
  }
  
  if (selection.especie) {
    clasificacionForm.id_especie = selection.especie.id
  }
}



const handleFotoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    clasificacionForm.foto = file
  }
}

const onSpeciesSelected = (taxonomy) => {
  selectedTaxonomy.value = taxonomy
  clasificacionForm.id_especie = taxonomy.species.id
}

const onClassificationChanged = (taxonomy) => {
  selectedTaxonomy.value = taxonomy
  if (taxonomy.species) {
    clasificacionForm.id_especie = taxonomy.species.id
  } else {
    clasificacionForm.id_especie = ''
  }
}

const guardarClasificacion = async () => {
  console.log('Iniciando guardado de clasificación...')
  console.log('Muestra seleccionada:', muestraSeleccionada.value)
  console.log('Formulario actual:', clasificacionForm)
  
  if (!muestraSeleccionada.value || !muestraSeleccionada.value.id) {
    alert('Error: No hay muestra seleccionada')
    return
  }
  
  try {
    const clasificacionData = {
      id_muestra: muestraSeleccionada.value.id,
      id_especie: clasificacionForm.id_especie || null,
      estado: clasificacionForm.estado || 'en_analisis',
      estado_reproductivo: clasificacionForm.estado_reproductivo || null,
      observaciones: clasificacionForm.observaciones || null,
      foto: null, // Por ahora sin foto
      id_determinador: null // Por ahora sin determinador
    }
    
    console.log('Datos a enviar:', clasificacionData)
    
    const response = await fetch('http://localhost:3002/clasificaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clasificacionData)
    })
    
    console.log('Respuesta del servidor:', response.status, response.statusText)
    
    if (response.ok) {
      const result = await response.json()
      console.log('Clasificación creada exitosamente:', result)
      alert('Clasificación guardada exitosamente')
      await loadPendingSamples()
      muestraSeleccionada.value = null
      resetClasificacionForm()
      activeTab.value = 'cola'
    } else {
      const errorData = await response.text()
      console.error('Error del servidor:', response.status, response.statusText, errorData)
      alert(`Error del servidor: ${response.status} - ${errorData}`)
    }
    
  } catch (error) {
    console.error('Error en la petición:', error)
    alert(`Error de conexión: ${error.message}`)
  }
}

const cancelarClasificacion = () => {
  muestraSeleccionada.value = null
  resetClasificacionForm()
  activeTab.value = 'cola'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle - ejecutar al montar el componente
onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.laboratorio-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.view-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.user-info .card {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

/* Tabs navigation */
.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 5px;
  backdrop-filter: blur(10px);
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 15px 25px;
  border-radius: 45px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  font-weight: 600;
}

.tab-badge {
  background-color: #e74c3c;
  color: white;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 5px;
}

/* Tab Content */
.tab-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 30px;
  min-height: 500px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Cola tab styles */
.cola-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.cola-filters {
  display: flex;
  gap: 10px;
}

.cola-filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.samples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.sample-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.sample-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.sample-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.sample-code {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.alta {
  background-color: #ffebee;
  color: #c62828;
}

.priority-badge.normal {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.priority-badge.baja {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.sample-info p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.sample-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* Classification tab styles */
.clasificacion-container {
  max-width: 1200px;
  margin: 0 auto;
}

.muestra-info-header {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.muestra-meta {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
}

.classification-methods {
  display: flex;
  gap: 10px;
}

.method-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.method-btn.active {
  border-color: #2c3e50;
  background-color: #2c3e50;
  color: white;
}

.classification-form {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 30px;
}

/* Taxonomy section */
.taxonomy-section {
  margin: 20px 0;
}

/* Classification fields */
.classification-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.file-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.classification-history {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.reference-tools {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

/* Taxonomic classifier styles */
.selected-taxonomy-info {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.selected-taxonomy-info h5 {
  color: #28a745;
  margin-bottom: 10px;
  font-size: 1rem;
}

.taxonomy-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.taxonomy-info p {
  margin: 0;
  font-size: 0.9rem;
}

.taxonomy-info strong {
  color: #2c3e50;
}



/* Historial tab styles */
.historial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.historial-filters {
  display: flex;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: 250px;
}

/* Estadísticas tab styles */
.estadisticas-header {
  text-align: center;
  margin-bottom: 30px;
}

.metrics-dashboard {
  max-width: 1000px;
  margin: 0 auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
  border-left: 4px solid #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metric-card.primary {
  border-left-color: #007bff;
}

.metric-card.success {
  border-left-color: #28a745;
}

.metric-card.warning {
  border-left-color: #ffc107;
}

.metric-card.info {
  border-left-color: #17a2b8;
}

.metric-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.metric-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-label {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-note {
  color: #999;
  font-size: 11px;
  font-style: italic;
  margin-top: 2px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
}

.chart-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 25px;
}

.chart-placeholder {
  height: 200px;
  background-color: #f8f9fa;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
}

/* Loading and empty states */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2c3e50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 10px;
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

/* Buttons */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
}

.btn-outline {
  border: 1px solid #ddd;
  background: white;
  color: #2c3e50;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
    border-radius: 15px;
  }
  
  .tab-btn {
    border-radius: 10px;
    justify-content: center;
  }
  
  .samples-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .muestra-info-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .taxonomy-fields {
    grid-template-columns: 1fr;
  }
}
</style>