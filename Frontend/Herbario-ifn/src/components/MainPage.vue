<template>
  <div>
    <!-- Header principal -->
    <div class="view-header">Herbario Digital - Tax-IFN</div>
    
    <div class="container">
      <!-- Sección introductoria -->
      <section class="intro text-center mb-40">
        <p>Sistema integral para la gestión taxonómica del Inventario Forestal Nacional</p>
        <img 
          src="/imagen representativa.jpg" 
          alt="Imagen Representativa IFN" 
          class="intro-image"
        >
        
        <!-- Cards informativos -->
        <div class="card-grid mt-40">
          <div class="card card-specimen">
            <img 
              src="/Metodologia IFN.png" 
              alt="Metodología"
            >
            <strong>Metodología IFN</strong>
            <p>Descripción del proceso de colección y clasificación botánica.</p>
          </div>
          
          <div class="card card-specimen">
            <img 
              src="/Publicaciones Recientes_acceso a documentos botanicos.png" 
              alt="Publicaciones Recientes"
            >
            <strong>Publicaciones Recientes</strong>
            <p>Acceso a documentos y investigaciones botánicas.</p>
          </div>
          
          <div class="card card-specimen">
            <img 
              src="/Apis y desarrolladores_Acceso programatico a datos del herbario.png" 
              alt="APIs"
            >
            <strong>APIs & Desarrolladores</strong>
            <p>Acceso programático a datos del Herbario.</p>
          </div>
        </div>
      </section>

      <!-- Navegación de acceso rápido -->
      <nav class="main-navigation">
        <div class="nav-header">
          <img 
            src="/favicon.svg" 
            alt="Acceso rápido"
            style="width: 48px; height: 48px;"
          >
          <h3>Puntos de Acceso Rápido</h3>
          <p>Navega fácilmente por los módulos principales</p>
        </div>
        
        <button 
          class="btn"
          @click="$emit('navigate', 'Estadisticas')"
        >
          <span style="font-size: 1.3em;">📊</span>
          Ir a Estadísticas (Panel de control)
        </button>
        
        <button 
          class="btn"
          @click="$emit('navigate', 'HerbarioDigital')"
        >
          <span style="font-size: 1.3em;">🌿</span>
          Ir a Herbario virtual
        </button>
        
        <button 
          class="btn"
          @click="$emit('navigate', 'ImageDemo')"
        >
          <span style="font-size: 1.3em;">🖼️</span>
          Demo de Componentes de Imagen
        </button>
        
        <button 
          class="btn btn-primary"
          @click="$emit('navigate', 'Login')"
        >
          <span style="font-size: 1.3em;">🔑</span>
          Iniciar Sesión de Gestión
        </button>
      </nav>

      <!-- Información adicional -->
      <section class="features mt-40">
        <div class="card-grid">
          <div class="card">
            <h3>🔬 Clasificación Científica</h3>
            <p>Sistema avanzado para la clasificación taxonómica de especímenes botánicos con validación científica.</p>
          </div>
          
          <div class="card">
            <h3>📍 Georeferenciación</h3>
            <p>Ubicación precisa de cada muestra recolectada con coordenadas geográficas y mapas interactivos.</p>
          </div>
          
          <div class="card">
            <h3>📊 Análisis Estadístico</h3>
            <p>Reportes y análisis estadísticos de la biodiversidad colombiana basados en datos reales.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// Eventos
defineEmits(['navigate'])
</script>

<style scoped>
.intro-image {
  width: 100%;
  max-width: 900px;
  height: 400px;
  object-fit: cover;
  object-position: center;
  border-radius: 12px;
  margin-top: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  filter: contrast(1.1) saturate(1.1) brightness(1.02);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.intro-image:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.card-specimen img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-specimen img:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.nav-header img {
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.features .card {
  text-align: center;
  padding: 25px;
}

.features .card h3 {
  color: var(--primary-green);
  margin-bottom: 15px;
  font-size: 1.3em;
}

.features .card p {
  color: var(--text-light);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .intro-image {
    max-width: 100%;
    height: 250px;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .intro-image {
    height: 200px;
    margin-top: 15px;
  }
}
</style>