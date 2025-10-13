<template>
  <div>
    <!-- Header -->
    <div class="view-header">📊 Panel de Estadísticas - IDEAM</div>

    <div class="container">
      <!-- Resumen ejecutivo -->
      <div class="executive-summary">
        <h3>📈 Resumen Ejecutivo</h3>
        <div class="summary-grid">
          <div class="summary-card total">
            <div class="summary-icon">📦</div>
            <div class="summary-content">
              <div class="summary-number">{{ executiveSummary.totalPackages }}</div>
              <div class="summary-label">Total Paquetes</div>
              <div class="summary-trend positive">+{{ executiveSummary.packagesTrend }}%</div>
            </div>
          </div>
          
          <div class="summary-card specimens">
            <div class="summary-icon">🌿</div>
            <div class="summary-content">
              <div class="summary-number">{{ executiveSummary.totalSpecimens }}</div>
              <div class="summary-label">Total Especímenes</div>
              <div class="summary-trend positive">+{{ executiveSummary.specimensTrend }}%</div>
            </div>
          </div>
          
          <div class="summary-card classified">
            <div class="summary-icon">✅</div>
            <div class="summary-content">
              <div class="summary-number">{{ executiveSummary.classifiedSpecimens }}</div>
              <div class="summary-label">Especímenes Clasificados</div>
              <div class="summary-trend positive">+{{ executiveSummary.classifiedTrend }}%</div>
            </div>
          </div>
          
          <div class="summary-card efficiency">
            <div class="summary-icon">⚡</div>
            <div class="summary-content">
              <div class="summary-number">{{ executiveSummary.efficiency }}%</div>
              <div class="summary-label">Eficiencia</div>
              <div class="summary-trend positive">+{{ executiveSummary.efficiencyTrend }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas por módulo -->
      <div class="module-stats mt-40">
        <h3>🏢 Estadísticas por Módulo</h3>
        <div class="modules-grid">
          <!-- Recepción -->
          <div class="module-card">
            <div class="module-header">
              <h4>🗂️ Recepción</h4>
              <div class="module-status active">Activo</div>
            </div>
            <div class="module-metrics">
              <div class="metric">
                <span class="metric-label">Paquetes Hoy:</span>
                <span class="metric-value">{{ moduleStats.reception.packagesToday }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Tiempo Promedio:</span>
                <span class="metric-value">{{ moduleStats.reception.averageTime }}min</span>
              </div>
              <div class="metric">
                <span class="metric-label">Pendientes:</span>
                <span class="metric-value">{{ moduleStats.reception.pending }}</span>
              </div>
            </div>
          </div>

          <!-- Laboratorio -->
          <div class="module-card">
            <div class="module-header">
              <h4>🔬 Laboratorio</h4>
              <div class="module-status active">Activo</div>
            </div>
            <div class="module-metrics">
              <div class="metric">
                <span class="metric-label">Clasificaciones Hoy:</span>
                <span class="metric-value">{{ moduleStats.laboratory.classificationsToday }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Confiabilidad:</span>
                <span class="metric-value">{{ moduleStats.laboratory.reliability }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">En Proceso:</span>
                <span class="metric-value">{{ moduleStats.laboratory.inProcess }}</span>
              </div>
            </div>
          </div>

          <!-- Herbario -->
          <div class="module-card">
            <div class="module-header">
              <h4>🌿 Herbario Digital - Tax-IFN</h4>
              <div class="module-status active">Activo</div>
            </div>
            <div class="module-metrics">
              <div class="metric">
                <span class="metric-label">Consultas Hoy:</span>
                <span class="metric-value">{{ moduleStats.herbarium.queriesToday }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Descargas:</span>
                <span class="metric-value">{{ moduleStats.herbarium.downloads }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Usuarios Activos:</span>
                <span class="metric-value">{{ moduleStats.herbarium.activeUsers }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos y análisis -->
      <div class="charts-section mt-40">
        <h3>📊 Análisis de Tendencias</h3>
        <div class="charts-grid">
          <!-- Gráfico de actividad mensual -->
          <div class="chart-container">
            <h4>📈 Actividad Mensual</h4>
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div class="bar" style="height: 60%">
                  <span class="bar-label">Ene</span>
                </div>
                <div class="bar" style="height: 75%">
                  <span class="bar-label">Feb</span>
                </div>
                <div class="bar" style="height: 90%">
                  <span class="bar-label">Mar</span>
                </div>
                <div class="bar" style="height: 85%">
                  <span class="bar-label">Abr</span>
                </div>
                <div class="bar" style="height: 100%">
                  <span class="bar-label">May</span>
                </div>
                <div class="bar" style="height: 95%">
                  <span class="bar-label">Jun</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Distribución por familias -->
          <div class="chart-container">
            <h4>🌿 Distribución por Familias</h4>
            <div class="family-distribution">
              <div class="family-item">
                <span class="family-name">Asteraceae</span>
                <div class="family-bar">
                  <div class="family-progress" style="width: 35%"></div>
                </div>
                <span class="family-percentage">35%</span>
              </div>
              <div class="family-item">
                <span class="family-name">Fabaceae</span>
                <div class="family-bar">
                  <div class="family-progress" style="width: 25%"></div>
                </div>
                <span class="family-percentage">25%</span>
              </div>
              <div class="family-item">
                <span class="family-name">Rosaceae</span>
                <div class="family-bar">
                  <div class="family-progress" style="width: 20%"></div>
                </div>
                <span class="family-percentage">20%</span>
              </div>
              <div class="family-item">
                <span class="family-name">Poaceae</span>
                <div class="family-bar">
                  <div class="family-progress" style="width: 15%"></div>
                </div>
                <span class="family-percentage">15%</span>
              </div>
              <div class="family-item">
                <span class="family-name">Otras</span>
                <div class="family-bar">
                  <div class="family-progress" style="width: 5%"></div>
                </div>
                <span class="family-percentage">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribución geográfica -->
      <div class="geographic-section mt-40">
        <h3>🗺️ Distribución Geográfica</h3>
        <div class="geographic-grid">
          <div v-for="department in geographicData" :key="department.name" class="geographic-item">
            <div class="department-info">
              <h4>{{ department.name }}</h4>
              <div class="department-stats">
                <span>{{ department.specimens }} especímenes</span>
                <span class="department-percentage">{{ department.percentage }}%</span>
              </div>
            </div>
            <div class="department-bar">
              <div class="department-progress" :style="{ width: department.percentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métricas de calidad -->
      <div class="quality-metrics mt-40">
        <h3>✨ Métricas de Calidad</h3>
        <div class="quality-grid">
          <div class="quality-card">
            <h4>🎯 Precisión de Clasificación</h4>
            <div class="quality-circle">
              <div class="quality-percentage">{{ qualityMetrics.accuracy }}%</div>
            </div>
            <p>Nivel de confianza promedio en las clasificaciones</p>
          </div>
          
          <div class="quality-card">
            <h4>⏱️ Tiempo de Procesamiento</h4>
            <div class="quality-circle">
              <div class="quality-percentage">{{ qualityMetrics.processingTime }}min</div>
            </div>
            <p>Tiempo promedio desde recepción hasta clasificación</p>
          </div>
          
          <div class="quality-card">
            <h4>🔄 Tasa de Revisión</h4>
            <div class="quality-circle">
              <div class="quality-percentage">{{ qualityMetrics.reviewRate }}%</div>
            </div>
            <p>Porcentaje de especímenes que requieren revisión</p>
          </div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div class="recent-activity mt-40">
        <h3>🕐 Actividad Reciente del Sistema</h3>
        <div class="activity-timeline">
          <div v-for="activity in recentActivities" :key="activity.id" class="timeline-item">
            <div class="timeline-icon" :class="activity.type">{{ activity.icon }}</div>
            <div class="timeline-content">
              <div class="timeline-title">{{ activity.title }}</div>
              <div class="timeline-description">{{ activity.description }}</div>
              <div class="timeline-time">{{ activity.timeAgo }}</div>
            </div>
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
  </div>
</template>

<script setup>
import { reactive } from 'vue'

// Eventos
const emit = defineEmits(['navigate'])

// Datos del resumen ejecutivo
const executiveSummary = reactive({
  totalPackages: 1247,
  packagesTrend: 12,
  totalSpecimens: 4892,
  specimensTrend: 18,
  classifiedSpecimens: 4235,
  classifiedTrend: 15,
  efficiency: 87,
  efficiencyTrend: 5
})

// Estadísticas por módulo
const moduleStats = reactive({
  reception: {
    packagesToday: 23,
    averageTime: 15,
    pending: 7
  },
  laboratory: {
    classificationsToday: 45,
    reliability: 92,
    inProcess: 12
  },
  herbarium: {
    queriesToday: 156,
    downloads: 89,
    activeUsers: 34
  }
})

// Datos geográficos
const geographicData = reactive([
  { name: 'Cundinamarca', specimens: 1456, percentage: 30 },
  { name: 'Antioquia', specimens: 1234, percentage: 25 },
  { name: 'Valle del Cauca', specimens: 987, percentage: 20 },
  { name: 'Boyacá', specimens: 654, percentage: 13 },
  { name: 'Santander', specimens: 432, percentage: 9 },
  { name: 'Otros', specimens: 129, percentage: 3 }
])

// Métricas de calidad
const qualityMetrics = reactive({
  accuracy: 92,
  processingTime: 45,
  reviewRate: 8
})

// Actividades recientes
const recentActivities = reactive([
  {
    id: 1,
    type: 'reception',
    icon: '📦',
    title: 'Nuevo paquete registrado',
    description: 'PKG-2024-156 recibido desde Boyacá con 12 especímenes',
    timeAgo: 'Hace 15 minutos'
  },
  {
    id: 2,
    type: 'laboratory',
    icon: '🔬',
    title: 'Clasificación completada',
    description: 'Espécimen MST-2024-789 clasificado como Asteraceae',
    timeAgo: 'Hace 32 minutos'
  },
  {
    id: 3,
    type: 'herbarium',
    icon: '🌿',
    title: 'Consulta realizada',
    description: 'Usuario externo consultó 25 registros de Fabaceae',
    timeAgo: 'Hace 1 hora'
  },
  {
    id: 4,
    type: 'system',
    icon: '⚙️',
    title: 'Backup completado',
    description: 'Respaldo automático de la base de datos ejecutado',
    timeAgo: 'Hace 2 horas'
  },
  {
    id: 5,
    type: 'quality',
    icon: '✅',
    title: 'Revisión de calidad',
    description: '15 especímenes aprobados tras revisión por experto',
    timeAgo: 'Hace 3 horas'
  }
])
</script>

<style scoped>
.executive-summary {
  max-width: 1200px;
  margin: 0 auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background-color: #fcfcfc;
  box-shadow: var(--shadow-light);
}

.summary-icon {
  font-size: 2.5rem;
  margin-right: 20px;
}

.summary-content {
  flex: 1;
}

.summary-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-green);
  margin-bottom: 5px;
}

.summary-label {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 5px;
}

.summary-trend {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
}

.summary-trend.positive {
  background-color: #d4edda;
  color: #155724;
}

.module-stats {
  max-width: 1200px;
  margin: 0 auto;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.module-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fcfcfc;
  overflow: hidden;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--primary-green);
  color: white;
}

.module-header h4 {
  margin: 0;
}

.module-status {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.module-status.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.module-metrics {
  padding: 20px;
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.metric:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.metric-label {
  color: var(--text-light);
}

.metric-value {
  font-weight: 600;
  color: var(--primary-green);
}

.charts-section {
  max-width: 1200px;
  margin: 0 auto;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.chart-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background-color: #fcfcfc;
}

.chart-container h4 {
  margin: 0 0 20px 0;
  color: var(--primary-green);
}

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: end;
  justify-content: center;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 10px;
  height: 150px;
}

.bar {
  width: 30px;
  background-color: var(--primary-green);
  border-radius: 3px 3px 0 0;
  position: relative;
  transition: all 0.3s ease;
}

.bar:hover {
  opacity: 0.8;
}

.bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  color: var(--text-light);
}

.family-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.family-name {
  min-width: 100px;
  font-weight: 600;
}

.family-bar {
  flex: 1;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.family-progress {
  height: 100%;
  background-color: var(--primary-green);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.family-percentage {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  color: var(--primary-green);
}

.geographic-section {
  max-width: 800px;
  margin: 0 auto;
}

.geographic-grid {
  margin-top: 20px;
}

.geographic-item {
  margin-bottom: 15px;
}

.department-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.department-info h4 {
  margin: 0;
  color: var(--primary-green);
}

.department-stats {
  display: flex;
  gap: 15px;
  align-items: center;
}

.department-percentage {
  font-weight: 600;
  color: var(--primary-green);
}

.department-bar {
  height: 12px;
  background-color: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.department-progress {
  height: 100%;
  background-color: var(--primary-green);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.quality-metrics {
  max-width: 1000px;
  margin: 0 auto;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

.quality-card {
  text-align: center;
  padding: 30px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fcfcfc;
}

.quality-card h4 {
  margin: 0 0 20px 0;
  color: var(--primary-green);
}

.quality-circle {
  width: 100px;
  height: 100px;
  border: 5px solid var(--primary-green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px auto;
  background-color: rgba(76, 175, 80, 0.1);
}

.quality-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-green);
}

.recent-activity {
  max-width: 800px;
  margin: 0 auto;
}

.activity-timeline {
  margin-top: 20px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #fcfcfc;
}

.timeline-icon {
  font-size: 1.5rem;
  margin-right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-icon.reception {
  background-color: rgba(33, 150, 243, 0.1);
}

.timeline-icon.laboratory {
  background-color: rgba(156, 39, 176, 0.1);
}

.timeline-icon.herbarium {
  background-color: rgba(76, 175, 80, 0.1);
}

.timeline-icon.system {
  background-color: rgba(255, 152, 0, 0.1);
}

.timeline-icon.quality {
  background-color: rgba(0, 150, 136, 0.1);
}

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-weight: 600;
  color: var(--primary-green);
  margin-bottom: 5px;
}

.timeline-description {
  color: var(--text-color);
  margin-bottom: 5px;
}

.timeline-time {
  font-size: 0.9rem;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .quality-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-card {
    flex-direction: column;
    text-align: center;
  }
  
  .summary-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .department-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .department-stats {
    gap: 10px;
  }
}
</style>