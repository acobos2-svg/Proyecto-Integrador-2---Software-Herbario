import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { HerbarioControlService } from './herbarioControlService.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// ===== DASHBOARD PRINCIPAL =====
app.get('/dashboard', async (req, res) => {
  try {
    // 1. OBTENER DATOS BASE DEL SERVICIO DE GESTIÓN HERBARIO
    const [
      estadisticasResult,
      ubicacionesResult,
      paquetesResult,
      muestrasResult
    ] = await Promise.all([
      HerbarioControlService.obtenerEstadisticasGenerales(),
      HerbarioControlService.obtenerEstadisticasPorUbicacion(),
      HerbarioControlService.obtenerPaquetesRecientes(5),
      HerbarioControlService.obtenerMuestrasPendientes({ limit: 10 })
    ]);

    // Verificar que todas las consultas fueron exitosas
    if (!estadisticasResult.success) {
      return res.status(500).json({ error: estadisticasResult.error });
    }
    if (!ubicacionesResult.success) {
      return res.status(500).json({ error: ubicacionesResult.error });
    }

    // 2. LÓGICA DE NEGOCIO: ANÁLISIS Y CÁLCULOS DE CONTROL
    const estadisticas = estadisticasResult.data;
    const ubicaciones = ubicacionesResult.data;
    
    // Análisis de productividad
    const productividad = calcularProductividadGeneral(estadisticas);
    
    // Análisis de carga de trabajo por ubicación
    const analisisUbicaciones = analizarCargaTrabajoPorUbicacion(ubicaciones);
    
    // Identificar cuellos de botella
    const cuellosBottella = identificarCuellosBottella(estadisticas, ubicaciones);
    
    // Tendencias temporales (últimos 7 días)
    const tendencias = calcularTendenciasTemporales(estadisticas);
    
    // Alertas automáticas
    const alertas = generarAlertasAutomaticas(estadisticas, ubicaciones);

    // 3. INDICADORES CLAVE DE RENDIMIENTO (KPIs)
    const kpis = {
      eficiencia_clasificacion: Math.round((estadisticas.muestrasClasificadas / estadisticas.totalMuestras) * 100) || 0,
      tiempo_promedio_procesamiento: calcularTiempoPromedioSistema(estadisticas),
      distribucion_geografica: calcularDistribucionGeografica(ubicaciones),
      indice_saturacion: calcularIndiceSaturacion(estadisticas),
      velocidad_ingreso: calcularVelocidadIngreso(paquetesResult.success ? paquetesResult.data : [])
    };

    // 4. RESUMEN EJECUTIVO
    const resumenEjecutivo = {
      estado_general: determinarEstadoGeneral(kpis),
      prioridades: determinarPrioridades(alertas, cuellosBottella),
      recomendaciones: generarRecomendacionesGerenciales(kpis, tendencias),
      fecha_actualizacion: new Date().toISOString()
    };

    // 5. RESPUESTA CONSOLIDADA
    res.json({
      estadisticas_generales: estadisticas,
      kpis,
      productividad,
      analisis_ubicaciones: analisisUbicaciones,
      cuellos_botella: cuellosBottella,
      tendencias,
      alertas,
      resumen_ejecutivo: resumenEjecutivo,
      paquetes_recientes: paquetesResult.success ? paquetesResult.data.slice(0, 3) : [],
      muestras_criticas: muestrasPrioritarias(muestrasResult.success ? muestrasResult.data : [])
    });

  } catch (error) {
    console.error('Error en GET /dashboard:', error);
    res.status(500).json({ error: 'Error obteniendo datos del dashboard' });
  }
});

// ===== REPORTES AVANZADOS =====
app.get('/reportes/productividad', async (req, res) => {
  try {
    const { periodo = '30d', agrupacion = 'dia' } = req.query;

    // 1. OBTENER DATOS BASE
    const estadisticasResult = await HerbarioControlService.obtenerEstadisticasGenerales();
    const ubicacionesResult = await HerbarioControlService.obtenerEstadisticasPorUbicacion();
    
    if (!estadisticasResult.success || !ubicacionesResult.success) {
      return res.status(500).json({ error: 'Error obteniendo datos para reporte' });
    }

    // 2. ANÁLISIS DE PRODUCTIVIDAD TEMPORAL
    const analisisProductividad = {
      clasificaciones_por_periodo: calcularClasificacionesPorPeriodo(periodo, agrupacion),
      tendencia_productividad: calcularTendenciaProductividad(estadisticasResult.data, periodo),
      comparativa_ubicaciones: compararProductividadUbicaciones(ubicacionesResult.data),
      identificacion_patrones: identificarPatronesProductividad(estadisticasResult.data),
      benchmarks: calcularBenchmarks(estadisticasResult.data)
    };

    // 3. MÉTRICAS DE CALIDAD
    const metricas_calidad = {
      precision_clasificacion: calcularPrecisionClasificacion(),
      tiempo_promedio_por_muestra: calcularTiempoPromedioPorMuestra(),
      revision_requerida: calcularPorcentajeRevision(),
      satisfaccion_calidad: evaluarSatisfaccionCalidad()
    };

    res.json({
      periodo_analisis: periodo,
      fecha_generacion: new Date().toISOString(),
      analisis_productividad,
      metricas_calidad,
      recomendaciones_mejora: generarRecomendacionesMejora(analisisProductividad, metricas_calidad)
    });

  } catch (error) {
    console.error('Error en GET /reportes/productividad:', error);
    res.status(500).json({ error: 'Error generando reporte de productividad' });
  }
});

// ===== ALERTAS Y NOTIFICACIONES =====
app.get('/alertas', async (req, res) => {
  try {
    const { tipo, severidad, estado = 'todas' } = req.query;

    // 1. OBTENER DATOS ACTUALES
    const estadisticasResult = await HerbarioControlService.obtenerEstadisticasGenerales();
    const ubicacionesResult = await HerbarioControlService.obtenerEstadisticasPorUbicacion();
    
    if (!estadisticasResult.success || !ubicacionesResult.success) {
      return res.status(500).json({ error: 'Error obteniendo datos para alertas' });
    }

    // 2. GENERAR SISTEMA DE ALERTAS AUTOMÁTICAS
    const alertas = [];

    // Alertas de capacidad
    if (estadisticasResult.data.muestrasPendientes > 500) {
      alertas.push({
        id: `cap_${Date.now()}`,
        tipo: 'capacidad',
        severidad: 'alta',
        titulo: 'Sobrecarga de muestras pendientes',
        descripcion: `${estadisticasResult.data.muestrasPendientes} muestras esperando clasificación`,
        recomendacion: 'Considerar ampliar equipo de laboratorio o redistribuir carga',
        fecha_deteccion: new Date().toISOString(),
        estado: 'activa'
      });
    }

    // Alertas por ubicación crítica
    ubicacionesResult.data.forEach(ubicacion => {
      if (ubicacion.pendientes > ubicacion.total * 0.8) {
        alertas.push({
          id: `ubi_${ubicacion.codigo}_${Date.now()}`,
          tipo: 'ubicacion',
          severidad: 'media',
          titulo: `Retraso en ${ubicacion.codigo}`,
          descripcion: `${ubicacion.pendientes} de ${ubicacion.total} muestras sin clasificar`,
          recomendacion: `Priorizar muestras de ${ubicacion.municipio}`,
          fecha_deteccion: new Date().toISOString(),
          estado: 'activa',
          ubicacion: ubicacion.codigo
        });
      }
    });

    // Alertas de rendimiento
    const porcentajeAvance = estadisticasResult.data.porcentajeAvance;
    if (porcentajeAvance < 30) {
      alertas.push({
        id: `rend_${Date.now()}`,
        tipo: 'rendimiento',
        severidad: 'alta',
        titulo: 'Bajo porcentaje de clasificación',
        descripcion: `Solo ${porcentajeAvance}% de muestras clasificadas`,
        recomendacion: 'Revisar procesos y asignar más recursos al laboratorio',
        fecha_deteccion: new Date().toISOString(),
        estado: 'activa'
      });
    }

    // 3. FILTRAR ALERTAS SEGÚN PARÁMETROS
    let alertasFiltradas = alertas;
    if (tipo) alertasFiltradas = alertasFiltradas.filter(a => a.tipo === tipo);
    if (severidad) alertasFiltradas = alertasFiltradas.filter(a => a.severidad === severidad);
    if (estado !== 'todas') alertasFiltradas = alertasFiltradas.filter(a => a.estado === estado);

    // 4. ESTADÍSTICAS DE ALERTAS
    const estadisticasAlertas = {
      total: alertas.length,
      por_severidad: {
        alta: alertas.filter(a => a.severidad === 'alta').length,
        media: alertas.filter(a => a.severidad === 'media').length,
        baja: alertas.filter(a => a.severidad === 'baja').length
      },
      por_tipo: {
        capacidad: alertas.filter(a => a.tipo === 'capacidad').length,
        ubicacion: alertas.filter(a => a.tipo === 'ubicacion').length,
        rendimiento: alertas.filter(a => a.tipo === 'rendimiento').length
      }
    };

    res.json({
      alertas: alertasFiltradas,
      estadisticas: estadisticasAlertas,
      filtros_aplicados: { tipo, severidad, estado },
      fecha_consulta: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en GET /alertas:', error);
    res.status(500).json({ error: 'Error obteniendo alertas' });
  }
});

// ===== ANÁLISIS GEOGRÁFICO =====
app.get('/analisis-geografico', async (req, res) => {
  try {
    // 1. OBTENER DATOS GEOGRÁFICOS
    const [ubicacionesResult, conglomeradosResult] = await Promise.all([
      HerbarioControlService.obtenerEstadisticasPorUbicacion(),
      HerbarioControlService.obtenerConglomerados()
    ]);

    if (!ubicacionesResult.success || !conglomeradosResult.success) {
      return res.status(500).json({ error: 'Error obteniendo datos geográficos' });
    }

    // 2. ANÁLISIS ESPACIAL (Lógica de Negocio)
    const analisisEspacial = {
      distribucion_muestras: calcularDistribucionEspacialMuestras(ubicacionesResult.data),
      hotspots_actividad: identificarHotspotsActividad(ubicacionesResult.data),
      cobertura_geografica: calcularCoberturaGeografica(conglomeradosResult.data),
      eficiencia_por_region: calcularEficienciaPorRegion(ubicacionesResult.data)
    };

    // 3. RECOMENDACIONES LOGÍSTICAS
    const recomendacionesLogisticas = {
      optimizacion_rutas: generarOptimizacionRutas(conglomeradosResult.data),
      priorizacion_ubicaciones: priorizarUbicacionesPorEsfuerzo(ubicacionesResult.data),
      estrategia_expansion: sugerirEstrategiaExpansion(analisisEspacial)
    };

    res.json({
      analisis_espacial: analisisEspacial,
      recomendaciones_logisticas: recomendacionesLogisticas,
      mapa_calor_datos: generarDatosMapaCalor(ubicacionesResult.data),
      fecha_analisis: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en GET /analisis-geografico:', error);
    res.status(500).json({ error: 'Error en análisis geográfico' });
  }
});

// ===== FUNCIONES AUXILIARES (LÓGICA DE NEGOCIO) =====

function calcularProductividadGeneral(estadisticas) {
  const total = estadisticas.totalMuestras || 0;
  const clasificadas = estadisticas.muestrasClasificadas || 0;
  const pendientes = estadisticas.muestrasPendientes || 0;

  return {
    porcentaje_completado: total > 0 ? Math.round((clasificadas / total) * 100) : 0,
    velocidad_clasificacion: Math.round(clasificadas / 30), // Estimado por día en últimos 30 días
    carga_pendiente: pendientes,
    eficiencia: total > 0 ? Math.round((clasificadas / (clasificadas + pendientes)) * 100) : 0
  };
}

function analizarCargaTrabajoPorUbicacion(ubicaciones) {
  return ubicaciones.map(ubicacion => ({
    ...ubicacion,
    porcentaje_pendiente: ubicacion.total > 0 ? Math.round((ubicacion.pendientes / ubicacion.total) * 100) : 0,
    prioridad: ubicacion.pendientes > 50 ? 'alta' : ubicacion.pendientes > 20 ? 'media' : 'baja',
    tiempo_estimado_restante: Math.ceil(ubicacion.pendientes / 5) // 5 muestras por día estimado
  }));
}

function identificarCuellosBottella(estadisticas, ubicaciones) {
  const cuellos = [];
  
  // Cuello de botella general
  if (estadisticas.porcentajeAvance < 50) {
    cuellos.push({
      tipo: 'general',
      descripcion: 'Proceso general de clasificación lento',
      impacto: 'alto',
      solucion: 'Aumentar capacidad de laboratorio'
    });
  }

  // Cuellos por ubicación
  ubicaciones.forEach(ubicacion => {
    if (ubicacion.pendientes > ubicacion.clasificadas * 2) {
      cuellos.push({
        tipo: 'ubicacion',
        descripcion: `Acumulación excesiva en ${ubicacion.codigo}`,
        impacto: 'medio',
        solucion: `Priorizar clasificación de muestras de ${ubicacion.municipio}`,
        ubicacion: ubicacion.codigo
      });
    }
  });

  return cuellos;
}

function calcularTendenciasTemporales(estadisticas) {
  // Simulación de tendencias (en implementación real se calcularía con datos históricos)
  return {
    clasificaciones_diarias: {
      tendencia: 'creciente',
      porcentaje_cambio: 12,
      promedio_ultimos_7_dias: Math.round(estadisticas.muestrasClasificadas / 30)
    },
    ingreso_muestras: {
      tendencia: 'estable',
      porcentaje_cambio: 3,
      promedio_ultimos_7_dias: Math.round(estadisticas.totalMuestras / 30)
    }
  };
}

function generarAlertasAutomaticas(estadisticas, ubicaciones) {
  const alertas = [];
  
  if (estadisticas.muestrasPendientes > estadisticas.muestrasClasificadas) {
    alertas.push({
      nivel: 'warning',
      mensaje: 'Más muestras pendientes que clasificadas',
      accion_recomendada: 'Intensificar proceso de clasificación'
    });
  }

  const ubicacionesCriticas = ubicaciones.filter(u => u.pendientes > 100);
  if (ubicacionesCriticas.length > 0) {
    alertas.push({
      nivel: 'error',
      mensaje: `${ubicacionesCriticas.length} ubicaciones con alta acumulación`,
      accion_recomendada: 'Redistribuir carga de trabajo'
    });
  }

  return alertas;
}

function determinarEstadoGeneral(kpis) {
  const eficiencia = kpis.eficiencia_clasificacion;
  if (eficiencia >= 80) return 'excelente';
  if (eficiencia >= 60) return 'bueno';
  if (eficiencia >= 40) return 'regular';
  return 'critico';
}

function determinarPrioridades(alertas, cuellos) {
  const prioridades = [];
  
  if (alertas.some(a => a.nivel === 'error')) {
    prioridades.push('Resolver alertas críticas');
  }
  
  if (cuellos.some(c => c.impacto === 'alto')) {
    prioridades.push('Eliminar cuellos de botella principales');
  }
  
  prioridades.push('Mantener ritmo de clasificación');
  
  return prioridades;
}

function generarRecomendacionesGerenciales(kpis, tendencias) {
  const recomendaciones = [];
  
  if (kpis.eficiencia_clasificacion < 60) {
    recomendaciones.push('Considerar ampliación del equipo de laboratorio');
  }
  
  if (tendencias.clasificaciones_diarias.tendencia === 'decreciente') {
    recomendaciones.push('Investigar causas de disminución en productividad');
  }
  
  if (kpis.indice_saturacion > 0.8) {
    recomendaciones.push('Implementar turnos adicionales o procesamiento paralelo');
  }
  
  return recomendaciones;
}

function muestrasPrioritarias(muestras) {
  return muestras.slice(0, 5).map(m => ({
    id: m.id,
    codigo: m.numero_coleccion,
    dias_pendiente: Math.floor((new Date() - new Date(m.fecha_creacion)) / (1000 * 60 * 60 * 24)),
    ubicacion: m.paquete?.evento_coleccion?.conglomerado?.codigo || 'Sin ubicación'
  }));
}

// Funciones placeholder para cálculos avanzados
function calcularTiempoPromedioSistema(estadisticas) { return 2.5; }
function calcularDistribucionGeografica(ubicaciones) { return { regiones_activas: ubicaciones.length }; }
function calcularIndiceSaturacion(estadisticas) { 
  return estadisticas.muestrasPendientes / (estadisticas.totalMuestras || 1); 
}
function calcularVelocidadIngreso(paquetes) { return paquetes.length; }
function calcularClasificacionesPorPeriodo(periodo, agrupacion) { return { datos: [] }; }
function calcularTendenciaProductividad(estadisticas, periodo) { return 'estable'; }
function compararProductividadUbicaciones(ubicaciones) { return ubicaciones; }
function identificarPatronesProductividad(estadisticas) { return { patrones: [] }; }
function calcularBenchmarks(estadisticas) { return { benchmark_industria: 75 }; }
function calcularPrecisionClasificacion() { return 92; }
function calcularTiempoPromedioPorMuestra() { return 45; }
function calcularPorcentajeRevision() { return 8; }
function evaluarSatisfaccionCalidad() { return 87; }
function generarRecomendacionesMejora(productividad, calidad) { return ['Optimizar flujo de trabajo']; }
function calcularDistribucionEspacialMuestras(ubicaciones) { return ubicaciones; }
function identificarHotspotsActividad(ubicaciones) { return ubicaciones.slice(0, 3); }
function calcularCoberturaGeografica(conglomerados) { return { cobertura: '85%' }; }
function calcularEficienciaPorRegion(ubicaciones) { return ubicaciones; }
function generarOptimizacionRutas(conglomerados) { return { rutas_optimizadas: 3 }; }
function priorizarUbicacionesPorEsfuerzo(ubicaciones) { return ubicaciones; }
function sugerirEstrategiaExpansion(analisis) { return { sugerencias: ['Expandir hacia zona norte'] }; }
function generarDatosMapaCalor(ubicaciones) { return ubicaciones; }

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`[Tab_Control_Service] Servidor ejecutándose en puerto ${port}`);
  console.log('[Tab_Control_Service] Configurado para usar Gestión Herbario en:', process.env.GESTION_HERBARIO_URL || 'http://localhost:3002');
});

export default app;