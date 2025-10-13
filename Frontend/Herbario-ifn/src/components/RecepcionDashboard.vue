<template>
  <div class="recepcion-container">
    <!-- Header -->
    <div class="view-header">📦 Sistema de Recepción - IDEAM</div>

    <div class="container">
      <!-- Información del usuario logueado -->
      <div class="user-info mb-20">
        <div class="card">
          <h3>👤 Usuario: {{ currentUser.nombre }}</h3>
          <p><strong>Rol:</strong> {{ currentUser.rol }}</p>
          <p><strong>Área:</strong> Recepción de Muestras Botánicas</p>
        </div>
      </div>

      <!-- Tabs de navegación -->
      <div class="tabs">
        <button 
          @click="activeTab = 'registro'" 
          :class="['tab-btn', { active: activeTab === 'registro' }]"
        >
          <span class="tab-icon">📦</span> Registrar Paquete
        </button>
        <button 
          @click="activeTab = 'consulta'" 
          :class="['tab-btn', { active: activeTab === 'consulta' }]"
        >
          <span class="tab-icon">📋</span> Paquetes Recibidos
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
        
        <!-- PESTAÑA: REGISTRO DE PAQUETES -->
        <div v-if="activeTab === 'registro'" class="registro-tab">
          
          <!-- Stepper de progreso -->
          <div class="stepper">
            <div v-for="(step, index) in registrationSteps" :key="index" 
                 :class="['step', { 
                   active: currentStep === index, 
                   completed: currentStep > index 
                 }]">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>

          <!-- Formulario de registro multi-step -->
          <form @submit.prevent="submitRegistroPaquete" class="registro-form">
            
            <!-- PASO 1: EVENTO DE COLECCIÓN -->
            <div v-if="currentStep === 0" class="form-step">
              <div class="step-header">
                <h3>📍 Información del Evento de Colección</h3>
                <p>Registre la información general del evento de recolección</p>
              </div>
              
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Descripción del Evento *</label>
                  <textarea 
                    v-model="registroForm.evento.descripcion"
                    placeholder="Ej: Inventario forestal Conglomerado CG001-2024"
                    required
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label>Conglomerado *</label>
                  <select 
                    v-model="registroForm.evento.id_conglomerado" 
                    required 
                    @change="loadSubparcelas"
                  >
                    <option value="">Seleccionar conglomerado...</option>
                    <option 
                      v-for="conglomerado in conglomerados" 
                      :key="conglomerado.id" 
                      :value="conglomerado.id"
                    >
                      {{ conglomerado.nombre_completo }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Archivo PDF (Opcional)</label>
                  <input 
                    type="file" 
                    @change="handleFileUpload"
                    accept=".pdf"
                    class="file-input"
                  >
                  <small>Documentos de colección, mapas, etc.</small>
                </div>
              </div>
            </div>

            <!-- PASO 2: INFORMACIÓN DEL PAQUETE -->
            <div v-if="currentStep === 1" class="form-step">
              <div class="step-header">
                <h3>📦 Datos del Paquete</h3>
                <p>Información específica del paquete recibido</p>
              </div>
              
              <div class="form-grid">
                <div class="form-group">
                  <label>Número de Paquete *</label>
                  <input 
                    v-model="registroForm.paquete.num_paquete"
                    type="text"
                    placeholder="Ej: PKG-2024-001"
                    required
                  >
                </div>

                <div class="form-group">
                  <label>Fecha de Colección *</label>
                  <input 
                    v-model="registroForm.paquete.fecha_coleccion"
                    type="date"
                    required
                    :max="today"
                  >
                </div>

                <div class="form-group">
                  <label>Fecha de Envío *</label>
                  <input 
                    v-model="registroForm.paquete.fecha_envio"
                    type="date"
                    required
                    :max="today"
                  >
                </div>

                <div class="form-group full-width">
                  <label>Observaciones Generales</label>
                  <textarea 
                    v-model="registroForm.paquete.observaciones_generales"
                    placeholder="Estado del paquete, condiciones de envío, observaciones especiales..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- PASO 3: MUESTRAS -->
            <div v-if="currentStep === 2" class="form-step">
              <div class="step-header">
                <h3>🌿 Registro de Muestras</h3>
                <p>Agregue las muestras individuales contenidas en el paquete</p>
              </div>

              <div class="muestras-section">
                <div class="muestras-header">
                  <h4>Muestras en el Paquete ({{ registroForm.muestras.length }})</h4>
                  <button type="button" @click="addMuestra" class="btn btn-success">
                    + Agregar Muestra
                  </button>
                </div>

                <div v-if="registroForm.muestras.length === 0" class="empty-muestras">
                  <p>No hay muestras agregadas. Haga clic en "Agregar Muestra" para comenzar.</p>
                </div>

                <div v-else class="muestras-list">
                  <div v-for="(muestra, index) in registroForm.muestras" :key="index" class="muestra-item">
                    <div class="muestra-header">
                      <h5>Muestra {{ index + 1 }}</h5>
                      <button type="button" @click="removeMuestra(index)" class="btn btn-danger btn-sm">
                        Eliminar
                      </button>
                    </div>
                    
                    <div class="muestra-form">
                      <div class="form-group">
                        <label>Número de Colección *</label>
                        <input 
                          v-model="muestra.num_coleccion"
                          type="text"
                          placeholder="Ej: BOT-2024-001"
                          required
                        >
                      </div>

                      <div class="form-group">
                        <label>Colector *</label>
                        <input 
                          v-model="muestra.colector"
                          type="text"
                          placeholder="Nombre del colector"
                          required
                        >
                      </div>

                      <div class="form-group">
                        <label>Fecha de Colección</label>
                        <input 
                          v-model="muestra.fecha_coleccion"
                          type="date"
                        >
                      </div>

                      <div class="form-group">
                        <label>Subparcela</label>
                        <select v-model="muestra.id_subparcela">
                          <option value="">Sin subparcela específica</option>
                          <option 
                            v-for="subparcela in subparcelas" 
                            :key="subparcela.id" 
                            :value="subparcela.id"
                          >
                            {{ subparcela.nombre }}
                          </option>
                        </select>
                      </div>

                      <div class="form-group full-width">
                        <label>Observaciones de la Muestra</label>
                        <textarea 
                          v-model="muestra.observaciones"
                          placeholder="Estado de conservación, características especiales..."
                          rows="2"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de navegación -->
            <div class="form-navigation">
              <button 
                type="button" 
                @click="prevStep" 
                :disabled="currentStep === 0"
                class="btn btn-secondary"
              >
                ← Anterior
              </button>
              
              <div class="nav-center">
                <span class="step-indicator">
                  Paso {{ currentStep + 1 }} de {{ registrationSteps.length }}
                </span>
              </div>

              <button 
                v-if="currentStep < registrationSteps.length - 1"
                type="button" 
                @click="nextStep"
                class="btn btn-primary"
                :disabled="!canProceedToNext"
              >
                Siguiente →
              </button>

              <button 
                v-else
                type="submit"
                class="btn btn-success"
                :disabled="isSubmitting || !canSubmit"
              >
                {{ isSubmitting ? 'Registrando...' : 'Registrar Paquete' }}
              </button>
            </div>
          </form>
        </div>

        <!-- PESTAÑA: CONSULTA DE PAQUETES -->
        <div v-if="activeTab === 'consulta'" class="consulta-tab">
          <div class="consulta-header">
            <h3>📋 Paquetes Recibidos</h3>
            <p>Consulte y administre los paquetes registrados en el sistema</p>
          </div>

          <!-- Filtros de búsqueda -->
          <div class="filtros-section">
            <div class="filtros-grid">
              <div class="form-group">
                <label>Buscar por número:</label>
                <input 
                  v-model="filtros.numeroPaquete"
                  type="text"
                  placeholder="Número de paquete..."
                  @input="filtrarPaquetes"
                >
              </div>

              <div class="form-group">
                <label>Fecha desde:</label>
                <input 
                  v-model="filtros.fechaDesde"
                  type="date"
                  @change="filtrarPaquetes"
                >
              </div>

              <div class="form-group">
                <label>Fecha hasta:</label>
                <input 
                  v-model="filtros.fechaHasta"
                  type="date"
                  @change="filtrarPaquetes"
                >
              </div>

              <div class="form-group">
                <label>Conglomerado:</label>
                <select v-model="filtros.conglomerado" @change="filtrarPaquetes">
                  <option value="">Todos los conglomerados</option>
                  <option 
                    v-for="cong in conglomerados" 
                    :key="cong.id" 
                    :value="cong.id"
                  >
                    {{ cong.nombre_completo }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Lista de paquetes -->
          <div class="paquetes-list">
            <div v-if="paquetesFiltrados.length === 0" class="empty-state">
              <div class="empty-icon">📦</div>
              <h4>No se encontraron paquetes</h4>
              <p>No hay paquetes que coincidan con los filtros aplicados</p>
            </div>

            <div v-else>
              <div v-for="paquete in paquetesFiltrados" :key="paquete.id" class="paquete-card">
                <div class="paquete-header">
                  <div class="paquete-title">
                    <h4>{{ paquete.num_paquete }}</h4>
                    <span :class="['status-badge', paquete.estado]">
                      {{ paquete.estado_texto }}
                    </span>
                  </div>
                  <div class="paquete-actions">
                    <button @click="verDetallePaquete(paquete)" class="btn btn-sm btn-primary">
                      Ver Detalle
                    </button>
                  </div>
                </div>

                <div class="paquete-info">
                  <div class="info-row">
                    <span class="label">Conglomerado:</span>
                    <span>{{ paquete.conglomerado_nombre }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Fecha Colección:</span>
                    <span>{{ formatDate(paquete.fecha_coleccion) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Muestras:</span>
                    <span>{{ paquete.total_muestras }} muestras</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Fecha Registro:</span>
                    <span>{{ formatDate(paquete.fecha_registro) }}</span>
                  </div>
                </div>
              </div>
            </div>
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
            <h3>📊 Estadísticas de Recepción</h3>
            <p>Métricas y reportes de actividad del módulo de recepción</p>
          </div>

          <div class="metrics-dashboard">
            <div class="metrics-grid">
              <div class="metric-card primary">
                <div class="metric-icon">📦</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Paquetes Hoy</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
              
              <div class="metric-card success">
                <div class="metric-icon">🌿</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Total Muestras</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
              
              <div class="metric-card info">
                <div class="metric-icon">📍</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Conglomerados Activos</div>
                  <div class="metric-note">Datos mockup</div>
                </div>
              </div>
              
              <div class="metric-card warning">
                <div class="metric-icon">⏳</div>
                <div class="metric-content">
                  <div class="metric-number">--</div>
                  <div class="metric-label">Pendientes Laboratorio</div>
                  <div class="metric-note">Datos mockup</div>
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

// Estado reactivo principal
const activeTab = ref('registro')
const currentStep = ref(0)
const isSubmitting = ref(false)

// Usuario actual (simulado)
const currentUser = ref({
  nombre: 'María González',
  rol: 'Recepcionista',
  id: 1
})

// Pasos del registro
const registrationSteps = [
  { label: 'Evento', description: 'Información del evento de colección' },
  { label: 'Paquete', description: 'Datos del paquete recibido' },
  { label: 'Muestras', description: 'Registro de muestras individuales' }
]

// Datos de formulario
const registroForm = reactive({
  evento: {
    descripcion: '',
    id_conglomerado: '',
    archivo_pdf: null
  },
  paquete: {
    num_paquete: '',
    fecha_coleccion: '',
    fecha_envio: '',
    observaciones_generales: ''
  },
  muestras: []
})

// Datos para selects
const conglomerados = ref([])
const subparcelas = ref([])

// Filtros para consulta
const filtros = reactive({
  numeroPaquete: '',
  fechaDesde: '',
  fechaHasta: '',
  conglomerado: ''
})

// Datos de consulta
const paquetes = ref([])
const paquetesFiltrados = ref([])

// Estadísticas
const estadisticasGenerales = ref({
  paquetesHoy: 0,
  muestrasTotal: 0,
  conglomerados: 0,
  pendientes: 0
})

// Computed properties
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 0:
      return registroForm.evento.descripcion && registroForm.evento.id_conglomerado
    case 1:
      return registroForm.paquete.num_paquete && registroForm.paquete.fecha_coleccion && registroForm.paquete.fecha_envio
    case 2:
      return registroForm.muestras.length > 0
    default:
      return false
  }
})

const canSubmit = computed(() => {
  return canProceedToNext.value && registroForm.muestras.every(m => m.num_coleccion && m.colector)
})

// Métodos de navegación del stepper
const nextStep = () => {
  if (currentStep.value < registrationSteps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Métodos de manejo de muestras
const addMuestra = () => {
  registroForm.muestras.push({
    num_individuo: registroForm.muestras.length + 1,
    colector: '',
    num_coleccion: '',
    observaciones: '',
    fecha_coleccion: new Date().toISOString().split('T')[0]
  })
}

const removeMuestra = (index) => {
  registroForm.muestras.splice(index, 1)
}

// Métodos de carga de datos
const loadConglomerados = async () => {
  try {
    const response = await fetch('http://localhost:3002/ubicaciones/conglomerados')
    if (response.ok) {
      const data = await response.json()
      // Adaptar la estructura de datos del backend
      conglomerados.value = data.map(conglomerado => ({
        id: conglomerado.id,
        nombre_completo: `${conglomerado.codigo} - ${conglomerado.municipio.nombre}, ${conglomerado.municipio.departamento.nombre}`
      }))
    }
  } catch (error) {
    console.error('Error loading conglomerados:', error)
    conglomerados.value = []
  }
}

const loadSubparcelas = async () => {
  if (!registroForm.evento.id_conglomerado) {
    subparcelas.value = []
    return
  }

  try {
    const response = await fetch(`http://localhost:3002/ubicaciones/subparcelas/${registroForm.evento.id_conglomerado}`)
    if (response.ok) {
      const data = await response.json()
      // Adaptar la estructura de datos del backend
      subparcelas.value = data.map(subparcela => ({
        id: subparcela.id,
        nombre: `Subparcela ${subparcela.num_subparcela}`
      }))
    }
  } catch (error) {
    console.error('Error loading subparcelas:', error)
    subparcelas.value = []
  }
}

const loadPaquetes = async () => {
  try {
    const response = await fetch('http://localhost:3002/paquetes')
    if (response.ok) {
      paquetes.value = await response.json()
      paquetesFiltrados.value = paquetes.value
    }
  } catch (error) {
    console.error('Error loading paquetes:', error)
    // Datos de ejemplo
    paquetes.value = [
      {
        id: 1,
        num_paquete: 'PKG-2024-001',
        conglomerado_nombre: 'CG001 - Bosque Húmedo Tropical Norte',
        fecha_coleccion: '2024-10-01',
        fecha_registro: '2024-10-02',
        total_muestras: 15,
        estado: 'pendiente',
        estado_texto: 'Pendiente Laboratorio'
      }
    ]
    paquetesFiltrados.value = paquetes.value
  }
}

const loadEstadisticas = async () => {
  try {
    const response = await fetch('http://localhost:3004/api/estadisticas/recepcion')
    if (response.ok) {
      estadisticasGenerales.value = await response.json()
    }
  } catch (error) {
    console.error('Error loading estadísticas:', error)
    // Datos de ejemplo
    estadisticasGenerales.value = {
      paquetesHoy: 3,
      muestrasTotal: 127,
      conglomerados: 8,
      pendientes: 45
    }
  }
}

// Métodos de acción
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    registroForm.evento.archivo_pdf = file
  }
}

const submitRegistroPaquete = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    // Preparar datos para envío en formato JSON correcto
    const payload = {
      evento_coleccion: {
        descripcion: registroForm.evento.descripcion,
        id_conglomerado: parseInt(registroForm.evento.id_conglomerado),
        archivo_pdf: null // Por ahora sin archivo PDF
      },
      num_paquete: registroForm.paquete.num_paquete,
      cantidad_ejemplares: registroForm.muestras.length,
      fecha_envio: registroForm.paquete.fecha_envio || null,
      fecha_recibido_herbario: registroForm.paquete.fecha_recibido_herbario || new Date().toISOString().split('T')[0],
      observaciones_generales: registroForm.paquete.observaciones_generales || null,
      muestras: registroForm.muestras.map(muestra => ({
        num_individuo: muestra.num_individuo,
        colector: muestra.colector,
        num_coleccion: muestra.num_coleccion || null,
        observaciones: muestra.observaciones || null,
        fecha_coleccion: muestra.fecha_coleccion || null
      }))
    }

    const response = await fetch('http://localhost:3004/paquetes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      const resultado = await response.json()
      alert(`Paquete registrado exitosamente. ID: ${resultado.id}`)
      
      // Resetear formulario
      Object.assign(registroForm.evento, { descripcion: '', id_conglomerado: '', archivo_pdf: null })
      Object.assign(registroForm.paquete, { num_paquete: '', fecha_coleccion: '', fecha_envio: '', observaciones_generales: '' })
      registroForm.muestras.splice(0)
      currentStep.value = 0
      
      // Recargar datos
      await loadPaquetes()
      await loadEstadisticas()
    } else {
      throw new Error('Error en el registro')
    }
  } catch (error) {
    console.error('Error submitting paquete:', error)
    alert('Error al registrar el paquete. Por favor intente nuevamente.')
  } finally {
    isSubmitting.value = false
  }
}

const filtrarPaquetes = () => {
  let filtrados = [...paquetes.value]

  if (filtros.numeroPaquete) {
    filtrados = filtrados.filter(p => 
      p.num_paquete.toLowerCase().includes(filtros.numeroPaquete.toLowerCase())
    )
  }

  if (filtros.fechaDesde) {
    filtrados = filtrados.filter(p => 
      new Date(p.fecha_coleccion) >= new Date(filtros.fechaDesde)
    )
  }

  if (filtros.fechaHasta) {
    filtrados = filtrados.filter(p => 
      new Date(p.fecha_coleccion) <= new Date(filtros.fechaHasta)
    )
  }

  if (filtros.conglomerado) {
    filtrados = filtrados.filter(p => 
      p.id_conglomerado === parseInt(filtros.conglomerado)
    )
  }

  paquetesFiltrados.value = filtrados
}

const verDetallePaquete = (paquete) => {
  alert(`Ver detalle del paquete ${paquete.num_paquete} - Funcionalidad en desarrollo`)
}

const formatDate = (dateString) => {
  if (!dateString || dateString === null || dateString === undefined) {
    return '--'
  }
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '--'
    }
    return date.toLocaleDateString('es-CO')
  } catch (error) {
    return '--'
  }
}

// Inicialización
onMounted(async () => {
  await loadConglomerados()
  await loadPaquetes()
  await loadEstadisticas()
})
</script>

<style scoped>
.recepcion-container {
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

/* Tabs */
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

/* Tab Content */
.tab-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 30px;
  min-height: 500px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Stepper */
.stepper {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  padding: 20px 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 200px;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: #e0e0e0;
  z-index: 1;
}

.step.completed:not(:last-child)::after {
  background: #4caf50;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  position: relative;
  z-index: 2;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #2196f3;
  color: white;
}

.step.completed .step-number {
  background: #4caf50;
  color: white;
}

.step-label {
  font-size: 14px;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.step.active .step-label {
  color: #2196f3;
  font-weight: 600;
}

/* Forms */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2196f3;
}

.step-header {
  text-align: center;
  margin-bottom: 30px;
}

.step-header h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

/* Muestras */
.muestras-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
}

.muestras-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.muestra-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
}

.muestra-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.muestra-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

/* Navigation */
.form-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.nav-center {
  text-align: center;
}

.step-indicator {
  color: #666;
  font-weight: 500;
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
  background: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Consulta */
.filtros-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.paquete-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.paquete-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.paquete-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.paquete-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pendiente {
  background: #fff3cd;
  color: #856404;
}

.paquete-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.info-row {
  display: flex;
  gap: 10px;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
}

/* Estadísticas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.metric-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-left: 4px solid;
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card.primary { border-left-color: #2196f3; }
.metric-card.success { border-left-color: #4caf50; }
.metric-card.info { border-left-color: #00bcd4; }
.metric-card.warning { border-left-color: #ff9800; }

.metric-icon {
  font-size: 32px;
}

.metric-number {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-label {
  color: #666;
  font-size: 14px;
}

.metric-note {
  color: #999;
  font-size: 11px;
  font-style: italic;
  margin-top: 2px;
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

/* Empty states */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
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
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .form-navigation {
    flex-direction: column;
    gap: 15px;
  }
  
  .stepper {
    flex-direction: column;
    gap: 20px;
  }
  
  .step:not(:last-child)::after {
    display: none;
  }
}
</style>