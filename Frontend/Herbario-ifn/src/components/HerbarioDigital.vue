<template>
  <div>
    <!-- Header -->
    <div class="view-header">🌿 Herbario Digital - Tax-IFN</div>

    <div class="container">
      <!-- Filtros de búsqueda -->
      <div class="search-section">
        <h3>🔍 Explorar Colección</h3>
        <div class="search-filters">
          <div class="filter-group">
            <input 
              type="text" 
              v-model="searchFilters.text"
              placeholder="Buscar por nombre científico, familia..."
              class="search-input"
            />
            <button class="btn btn-primary" @click="performSearch">Buscar</button>
          </div>
          
          <div class="filter-row">
            <select v-model="searchFilters.family" class="filter-select">
              <option value="">Todas las familias</option>
              <option value="Asteraceae">Asteraceae</option>
              <option value="Fabaceae">Fabaceae</option>
              <option value="Rosaceae">Rosaceae</option>
              <option value="Poaceae">Poaceae</option>
            </select>
            
            <select v-model="searchFilters.department" class="filter-select">
              <option value="">Todos los departamentos</option>
              <option value="Cundinamarca">Cundinamarca</option>
              <option value="Antioquia">Antioquia</option>
              <option value="Valle del Cauca">Valle del Cauca</option>
              <option value="Boyacá">Boyacá</option>
            </select>
            
            <select v-model="searchFilters.status" class="filter-select">
              <option value="">Todos los estados</option>
              <option value="clasificada">Clasificadas</option>
              <option value="revision">En Revisión</option>
              <option value="pendiente">Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Estadísticas generales -->
      <div class="collection-stats">
        <h3>📊 Estadísticas de la Colección</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ collectionStats.totalSpecimens }}</div>
            <div class="stat-label">Especímenes Total</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ collectionStats.identifiedSpecies }}</div>
            <div class="stat-label">Especies Identificadas</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ collectionStats.families }}</div>
            <div class="stat-label">Familias</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ collectionStats.departments }}</div>
            <div class="stat-label">Departamentos</div>
          </div>
        </div>
      </div>

      <!-- Galería de especímenes -->
      <div class="specimens-gallery">
        <h3>🖼️ Galería de Especímenes</h3>
        <div class="gallery-grid">
          <div 
            v-for="specimen in displayedSpecimens" 
            :key="specimen.id"
            class="specimen-card"
            @click="selectedSpecimen = specimen"
          >
            <div class="specimen-image">
              <ImageComponent
                :image-url="specimen.imageUrl || null"
                :alt-text="`Espécimen ${specimen.scientificName}`"
                size="medium"
                shape="rectangle"
                :placeholder-icon="'🌿'"
                :placeholder-text="'Sin imagen del espécimen'"
                :badge="specimen.id"
                badge-type="primary"
                :show-overlay="true"
                :overlay-title="specimen.scientificName"
                :overlay-subtitle="specimen.family"
                :zoomable="true"
                @image-click="selectedSpecimen = specimen"
              />
            </div>
            <div class="specimen-info">
              <h4>{{ specimen.scientificName }}</h4>
              <p class="family">{{ specimen.family }}</p>
              <p class="location">📍 {{ specimen.location }}</p>
              <p class="date">📅 {{ specimen.collectionDate }}</p>
              <div class="status-badge" :class="specimen.status">
                {{ getStatusText(specimen.status) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div class="pagination">
        <button 
          class="btn btn-secondary"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Anterior
        </button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button 
          class="btn btn-secondary"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Siguiente
        </button>
      </div>

      <!-- Exploración por categorías -->
      <div class="category-exploration mt-40">
        <h3>🗂️ Explorar por Categorías</h3>
        <div class="category-grid">
          <div class="category-card" @click="filterByFamily('Asteraceae')">
            <div class="category-icon">🌻</div>
            <h4>Asteraceae</h4>
            <p>{{ getFamilyCount('Asteraceae') }} especímenes</p>
          </div>
          <div class="category-card" @click="filterByFamily('Fabaceae')">
            <div class="category-icon">🌿</div>
            <h4>Fabaceae</h4>
            <p>{{ getFamilyCount('Fabaceae') }} especímenes</p>
          </div>
          <div class="category-card" @click="filterByFamily('Rosaceae')">
            <div class="category-icon">🌹</div>
            <h4>Rosaceae</h4>
            <p>{{ getFamilyCount('Rosaceae') }} especímenes</p>
          </div>
          <div class="category-card" @click="filterByFamily('Poaceae')">
            <div class="category-icon">🌾</div>
            <h4>Poaceae</h4>
            <p>{{ getFamilyCount('Poaceae') }} especímenes</p>
          </div>
        </div>
      </div>

      <!-- Botón volver -->
      <div class="text-center mt-40">
        <button 
          class="btn btn-secondary"
          @click="$emit('navigate', 'MainPage')"
        >
          Volver al Inicio
        </button>
      </div>
    </div>

    <!-- Modal de detalle del espécimen -->
    <div v-if="selectedSpecimen" class="modal-overlay" @click="selectedSpecimen = null">
      <div class="modal large-modal" @click.stop>
        <h3>🔍 Detalle del Espécimen</h3>
        <div class="specimen-detail">
          <div class="detail-header">
            <h4>{{ selectedSpecimen.scientificName }}</h4>
            <div class="specimen-id-large">{{ selectedSpecimen.id }}</div>
          </div>
          
          <div class="detail-grid">
            <div class="detail-section">
              <h5>Taxonomía</h5>
              <p><strong>Familia:</strong> {{ selectedSpecimen.family }}</p>
              <p><strong>Género:</strong> {{ selectedSpecimen.genus }}</p>
              <p><strong>Especie:</strong> {{ selectedSpecimen.species }}</p>
            </div>
            
            <div class="detail-section">
              <h5>Colección</h5>
              <p><strong>Fecha:</strong> {{ selectedSpecimen.collectionDate }}</p>
              <p><strong>Colector:</strong> {{ selectedSpecimen.collector }}</p>
              <p><strong>Número:</strong> {{ selectedSpecimen.collectorNumber }}</p>
            </div>
            
            <div class="detail-section">
              <h5>Localización</h5>
              <p><strong>Ubicación:</strong> {{ selectedSpecimen.location }}</p>
              <p><strong>Coordenadas:</strong> {{ selectedSpecimen.coordinates }}</p>
              <p><strong>Altitud:</strong> {{ selectedSpecimen.altitude }} m</p>
            </div>
            
            <div class="detail-section">
              <h5>Estado</h5>
              <p><strong>Clasificación:</strong> 
                <span class="status-badge" :class="selectedSpecimen.status">
                  {{ getStatusText(selectedSpecimen.status) }}
                </span>
              </p>
              <p><strong>Confiabilidad:</strong> {{ selectedSpecimen.confidence }}%</p>
            </div>
          </div>
          
          <div class="detail-notes">
            <h5>Notas de Campo</h5>
            <p>{{ selectedSpecimen.fieldNotes }}</p>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="selectedSpecimen = null">Cerrar</button>
          <button class="btn btn-primary">Descargar Ficha</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import ImageComponent from './ImageComponent.vue'

// Eventos
const emit = defineEmits(['navigate'])

// Estado de búsqueda y filtros
const searchFilters = reactive({
  text: '',
  family: '',
  department: '',
  status: ''
})

const currentPage = ref(1)
const itemsPerPage = 12
const selectedSpecimen = ref(null)

// Estadísticas de la colección
const collectionStats = reactive({
  totalSpecimens: 1247,
  identifiedSpecies: 342,
  families: 89,
  departments: 25
})

// Datos simulados de especímenes
const specimens = reactive([
  {
    id: 'IDEAM-2024-001',
    scientificName: 'Helianthus annuus L.',
    family: 'Asteraceae',
    genus: 'Helianthus',
    species: 'annuus',
    location: 'Cundinamarca, Bogotá',
    coordinates: '4.6097°N, 74.0817°W',
    altitude: 2640,
    collectionDate: '2024-03-15',
    collector: 'J. Rodriguez',
    collectorNumber: 'JR-456',
    status: 'clasificada',
    confidence: 95,
    fieldNotes: 'Espécimen encontrado en jardín urbano, altura aproximada 2m, flores amarillas completamente desarrolladas.',
    imageUrl: 'https://images.unsplash.com/photo-1597848212624-e8867652ad3e?w=400&h=300&fit=crop'
  },
  {
    id: 'IDEAM-2024-002',
    scientificName: 'Mimosa pudica L.',
    family: 'Fabaceae',
    genus: 'Mimosa',
    species: 'pudica',
    location: 'Valle del Cauca, Cali',
    coordinates: '3.4516°N, 76.5320°W',
    altitude: 1018,
    collectionDate: '2024-03-18',
    collector: 'M. García',
    collectorNumber: 'MG-123',
    status: 'clasificada',
    confidence: 92,
    fieldNotes: 'Planta sensitiva típica, hojas se cierran al contacto. Flores rosadas en cabezuelas globosas.',
    imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop'
  },
  {
    id: 'IDEAM-2024-003',
    scientificName: 'Rosa canina L.',
    family: 'Rosaceae',
    genus: 'Rosa',
    species: 'canina',
    location: 'Boyacá, Tunja',
    coordinates: '5.5353°N, 73.3678°W',
    altitude: 2820,
    collectionDate: '2024-03-20',
    collector: 'L. Martínez',
    collectorNumber: 'LM-789',
    status: 'revision',
    confidence: 88,
    fieldNotes: 'Rosa silvestre con flores blancas-rosadas, frutos rojos maduros (escaramujos).',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=300&fit=crop'
  },
  {
    id: 'IDEAM-2024-004',
    scientificName: 'Poa annua L.',
    family: 'Poaceae',
    genus: 'Poa',
    species: 'annua',
    location: 'Antioquia, Medellín',
    coordinates: '6.2442°N, 75.5812°W',
    altitude: 1495,
    collectionDate: '2024-03-22',
    collector: 'C. López',
    collectorNumber: 'CL-334',
    status: 'clasificada',
    confidence: 97,
    fieldNotes: 'Gramínea anual común en áreas urbanas, panículas abiertas con espiguillas pequeñas.',
    imageUrl: 'https://images.unsplash.com/photo-1574263867128-7e5ac58edf1d?w=400&h=300&fit=crop'
  },
  {
    id: 'IDEAM-2024-005',
    scientificName: 'Taraxacum officinale Weber',
    family: 'Asteraceae',
    genus: 'Taraxacum',
    species: 'officinale',
    location: 'Cundinamarca, Chía',
    coordinates: '4.8614°N, 74.0589°W',
    altitude: 2564,
    collectionDate: '2024-03-25',
    collector: 'A. Hernández',
    collectorNumber: 'AH-567',
    status: 'pendiente',
    confidence: 0,
    fieldNotes: 'Diente de león común, hojas en roseta basal, flores amarillas en capítulos solitarios.',
    imageUrl: 'https://images.unsplash.com/photo-1568409938596-d0d2d5d39b9d?w=400&h=300&fit=crop'
  },
  {
    id: 'IDEAM-2024-006',
    scientificName: 'Trifolium repens L.',
    family: 'Fabaceae',
    genus: 'Trifolium',
    species: 'repens',
    location: 'Cundinamarca, Zipaquirá',
    coordinates: '5.0220°N, 74.0041°W',
    altitude: 2652,
    collectionDate: '2024-03-28',
    collector: 'D. Vargas',
    collectorNumber: 'DV-234',
    status: 'clasificada',
    confidence: 94,
    fieldNotes: 'Trébol blanco rastrero, hojas trifoliadas con marca blanquecina característica.',
    imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e8c2c0b34?w=400&h=300&fit=crop'
  }
])

// Computadas
const displayedSpecimens = computed(() => {
  let filtered = specimens
  
  if (searchFilters.family) {
    filtered = filtered.filter(s => s.family === searchFilters.family)
  }
  
  if (searchFilters.status) {
    filtered = filtered.filter(s => s.status === searchFilters.status)
  }
  
  if (searchFilters.text) {
    const searchText = searchFilters.text.toLowerCase()
    filtered = filtered.filter(s => 
      s.scientificName.toLowerCase().includes(searchText) ||
      s.family.toLowerCase().includes(searchText) ||
      s.location.toLowerCase().includes(searchText)
    )
  }
  
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(specimens.length / itemsPerPage)
})

// Funciones
const performSearch = () => {
  currentPage.value = 1
}

const filterByFamily = (family) => {
  searchFilters.family = family
  currentPage.value = 1
}

const getFamilyCount = (family) => {
  return specimens.filter(s => s.family === family).length
}

const getStatusText = (status) => {
  const statusMap = {
    clasificada: 'Clasificada',
    revision: 'En Revisión',
    pendiente: 'Pendiente'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.search-section {
  max-width: 800px;
  margin: 0 auto 40px auto;
}

.search-filters {
  margin-top: 20px;
}

.filter-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.collection-stats {
  max-width: 800px;
  margin: 0 auto 40px auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fcfcfc;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-green);
  margin-bottom: 5px;
}

.stat-label {
  color: var(--text-light);
  font-size: 0.9rem;
}

.specimens-gallery {
  max-width: 1200px;
  margin: 0 auto 40px auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.specimen-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: #fcfcfc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.specimen-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-strong);
}

.specimen-image {
  position: relative;
  height: 200px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  font-size: 3rem;
  color: #ccc;
}

.specimen-id {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--primary-green);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.specimen-info {
  padding: 15px;
}

.specimen-info h4 {
  margin: 0 0 10px 0;
  color: var(--primary-green);
  font-style: italic;
}

.family {
  font-weight: 600;
  margin: 5px 0;
}

.location, .date {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 3px 0;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 10px;
  display: inline-block;
}

.status-badge.clasificada {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.revision {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.pendiente {
  background-color: #f8d7da;
  color: #721c24;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 40px 0;
}

.page-info {
  font-weight: 600;
}

.category-exploration {
  max-width: 800px;
  margin: 0 auto;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.category-card {
  text-align: center;
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fcfcfc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-light);
}

.category-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.category-card h4 {
  margin: 10px 0 5px 0;
  color: var(--primary-green);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  max-height: 80vh;
  overflow-y: auto;
}

.large-modal {
  max-width: 800px;
}

.specimen-detail {
  text-align: left;
  margin: 20px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.specimen-id-large {
  background-color: var(--primary-green);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.detail-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
}

.detail-section h5 {
  margin: 0 0 10px 0;
  color: var(--primary-green);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
}

.detail-notes {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
}

.detail-notes h5 {
  margin: 0 0 10px 0;
  color: var(--primary-green);
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-select {
    min-width: auto;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
  
  .category-grid, .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>