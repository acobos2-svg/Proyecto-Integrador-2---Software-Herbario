import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { 
  validateClasificacionDTO, 
  createClasificacionInsert, 
  validateFiltrosMuestras,
  buscarTaxonomia
} from './dto.js';
import { HerbarioLabService } from './herbarioLabService.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// ===== OBTENER MUESTRAS PENDIENTES (con lógica de priorización) =====
app.get('/muestras/pendientes', async (req, res) => {
  try {
    // 1. VALIDACIÓN DE FILTROS (Lógica de Negocio)
    const filtros = validateFiltrosMuestras(req.query);
    
    // 2. OBTENER DATOS DEL SERVICIO DE GESTIÓN HERBARIO
    const result = await HerbarioLabService.obtenerMuestrasPendientes(filtros);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // 3. LÓGICA DE NEGOCIO: PRIORIZACIÓN Y AGRUPAMIENTO
    const muestras = result.data;

    // Calcular prioridad de cada muestra
    const muestrasConPrioridad = muestras.map(muestra => {
      let prioridad = 0;
      const diasDesdeRecepcion = Math.floor((new Date() - new Date(muestra.paquete.fecha_recibido_herbario)) / (1000 * 60 * 60 * 24));
      
      // Algoritmo de priorización (Lógica de Negocio)
      if (diasDesdeRecepcion > 30) prioridad += 50; // Muestras antiguas
      if (muestra.familia_identificada) prioridad += 20; // Ya tienen clasificación previa
      if (muestra.estado_muestra === 'en_proceso') prioridad += 30; // En proceso
      if (!muestra.observaciones || muestra.observaciones.trim() === '') prioridad -= 10; // Sin observaciones

      return {
        ...muestra,
        prioridad,
        dias_desde_recepcion: diasDesdeRecepcion,
        nivel_dificultad: determinarDificultadClasificacion(muestra),
        sugerencias_inicial: []
      };
    });

    // Agrupar por conglomerado y ordenar por prioridad
    const muestrasPorConglomerado = muestrasConPrioridad.reduce((acc, muestra) => {
      const conglomerado = muestra.paquete.evento_coleccion.conglomerado;
      const key = conglomerado.codigo;
      
      if (!acc[key]) {
        acc[key] = {
          conglomerado: {
            codigo: conglomerado.codigo,
            municipio: conglomerado.municipio.nombre,
            ubicacion: `${conglomerado.latitud_dec}, ${conglomerado.longitud_dec}`,
            prioridad_promedio: 0
          },
          muestras: [],
          estadisticas: {
            total: 0,
            alta_prioridad: 0,
            con_identificacion_previa: 0
          }
        };
      }
      
      acc[key].muestras.push(muestra);
      acc[key].estadisticas.total++;
      if (muestra.prioridad > 40) acc[key].estadisticas.alta_prioridad++;
      if (muestra.familia_identificada) acc[key].estadisticas.con_identificacion_previa++;
      
      return acc;
    }, {});

    // Calcular prioridad promedio por conglomerado
    Object.values(muestrasPorConglomerado).forEach(grupo => {
      grupo.conglomerado.prioridad_promedio = Math.round(
        grupo.muestras.reduce((sum, m) => sum + m.prioridad, 0) / grupo.muestras.length
      );
      // Ordenar muestras por prioridad
      grupo.muestras.sort((a, b) => b.prioridad - a.prioridad);
    });

    // 4. ESTADÍSTICAS AGREGADAS (Lógica de Negocio)
    const estadisticas = {
      total_muestras: muestras.length,
      promedio_dias_pendientes: muestras.length > 0 
        ? Math.round(muestrasConPrioridad.reduce((sum, m) => sum + m.dias_desde_recepcion, 0) / muestras.length)
        : 0,
      distribucion_dificultad: calcularDistribucionDificultad(muestrasConPrioridad),
      conglomerados_activos: Object.keys(muestrasPorConglomerado).length
    };

    res.json({ 
      muestras_pendientes: Object.values(muestrasPorConglomerado).sort((a, b) => 
        b.conglomerado.prioridad_promedio - a.conglomerado.prioridad_promedio
      ),
      estadisticas,
      filtros_aplicados: filtros
    });
  } catch (e) {
    console.error('Error en GET /muestras/pendientes:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== REGISTRAR CLASIFICACIÓN (con validaciones y algoritmos) =====
app.post('/clasificaciones', async (req, res) => {
  try {
    // 1. VALIDACIÓN DE DATOS (Lógica de Negocio)
    const validation = validateClasificacionDTO(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.errors });
    }

    // 2. OBTENER MUESTRA PARA VALIDACIÓN
    const muestraResult = await HerbarioLabService.obtenerMuestra(req.body.id_muestra_botanica);
    if (!muestraResult.success) {
      return res.status(404).json({ error: 'Muestra no encontrada' });
    }

    const muestra = muestraResult.data;
    if (muestra.clasificacion_taxonomica && muestra.clasificacion_taxonomica.length > 0) {
      return res.status(409).json({ error: 'La muestra ya tiene clasificaciones registradas' });
    }

    // 3. VALIDACIÓN TAXONÓMICA BÁSICA
    if (!req.body.familia_final || !req.body.genero_final || !req.body.especie_final) {
      return res.status(400).json({ 
        error: 'Se requiere familia, género y especie para la clasificación'
      });
    }

    // 4. CÁLCULO DE CONFIANZA (Algoritmo de Negocio)
    const nivelConfianza = calcularNivelConfianza(req.body, muestra);
    
    // 5. CREAR OBJETO DE CLASIFICACIÓN
    const clasificacionData = createClasificacionInsert({
      ...req.body,
      nivel_confianza: nivelConfianza,
      fecha_clasificacion: new Date().toISOString(),
      observaciones_algoritmo: generarObservacionesAlgoritmo(req.body, muestra)
    });

    // 6. GUARDAR EN GESTIÓN HERBARIO
    const clasificacionResult = await HerbarioLabService.crearClasificacion(clasificacionData);
    if (!clasificacionResult.success) {
      return res.status(500).json({ error: clasificacionResult.error });
    }

    // 7. ACTUALIZAR ESTADO DE MUESTRA
    const updateData = {
      estado_muestra: 'clasificada',
      familia_identificada: req.body.familia,
      genero_identificado: req.body.genero,
      especie_identificada: req.body.especie,
      fecha_actualizacion: new Date().toISOString()
    };

    const updateResult = await HerbarioLabService.actualizarMuestra(req.body.id_muestra_botanica, updateData);
    if (!updateResult.success) {
      console.error('Error actualizando muestra:', updateResult.error);
      // No fallar la operación, solo loguear
    }

    // 8. GENERAR RECOMENDACIONES PARA SIGUIENTE CLASIFICACIÓN
    const recomendaciones = await generarRecomendacionesSiguiente(req.body);

    res.status(201).json({
      ok: true,
      clasificacion_id: clasificacionResult.data.id,
      muestra_id: req.body.id_muestra_botanica,
      nivel_confianza: nivelConfianza,
      recomendaciones,
      mensaje: 'Clasificación registrada exitosamente'
    });
  } catch (e) {
    console.error('Error en POST /clasificaciones:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ASISTENTE DE CLASIFICACIÓN (búsquedas inteligentes) =====
app.get('/asistente/buscar', async (req, res) => {
  try {
    const { familia, genero, especie, region, tipo_busqueda = 'exacta' } = req.query;

    if (!familia && !genero && !especie) {
      return res.status(400).json({ error: 'Se requiere al menos un criterio de búsqueda' });
    }

    // 1. BÚSQUEDA PRINCIPAL
    const criterios = { familia, genero, especie };
    const resultados = await HerbarioLabService.buscarTaxonomia(criterios);
    
    if (!resultados.success) {
      return res.status(500).json({ error: resultados.error });
    }

    // 2. ALGORITMOS DE SUGERENCIAS (Lógica de Negocio)
    let sugerencias = resultados.data;

    if (tipo_busqueda === 'difusa' && sugerencias.length < 5) {
      // Búsqueda difusa si hay pocos resultados exactos
      const sugerenciasDifusas = await buscarSugerenciasDifusas({ familia, genero, especie });
      sugerencias = [...sugerencias, ...sugerenciasDifusas];
    }

    // 3. ENRIQUECIMIENTO CON DATOS GEOGRÁFICOS
    if (region) {
      sugerencias = sugerencias.filter(s => 
        s.distribuciones_geograficas?.includes(region) || 
        !s.distribuciones_geograficas
      );
    }

    // 4. CÁLCULO DE SIMILITUD Y RANKING
    sugerencias = sugerencias.map(sugerencia => ({
      ...sugerencia,
      similitud: 0.85, // Valor por defecto para MVP
      frecuencia_clasificacion: obtenerFrecuenciaClasificacion(sugerencia.id)
    })).sort((a, b) => b.similitud - a.similitud);

    res.json({
      resultados: sugerencias.slice(0, 20), // Limitar a top 20
      criterios_busqueda: criterios,
      tipo_busqueda,
      total_encontrados: sugerencias.length
    });
  } catch (e) {
    console.error('Error en GET /asistente/buscar:', e);
    res.status(500).json({ error: 'Error en búsqueda asistida' });
  }
});

// ===== ESTADÍSTICAS DE LABORATORIO =====
app.get('/estadisticas', async (req, res) => {
  try {
    const { periodo = '30d' } = req.query;

    // Delegar estadísticas básicas a Gestión Herbario
    const estadisticasResult = await HerbarioLabService.obtenerEstadisticas();
    if (!estadisticasResult.success) {
      return res.status(500).json({ error: estadisticasResult.error });
    }

    // Cálculos específicos del laboratorio (Lógica de Negocio)
    const estadisticasLab = {
      ...estadisticasResult.data,
      productividad: calcularProductividad(periodo),
      tiempo_promedio_clasificacion: calcularTiempoPromedioClasificacion(periodo),
      distribucion_confianza: await calcularDistribucionConfianza(periodo),
      tendencias: await calcularTendenciasClasificacion(periodo)
    };

    res.json(estadisticasLab);
  } catch (e) {
    console.error('Error en GET /estadisticas:', e);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ===== FUNCIONES AUXILIARES (Lógica de Negocio) =====

function determinarDificultadClasificacion(muestra) {
  let puntos = 0;
  
  // Factores que aumentan dificultad
  if (!muestra.familia_identificada) puntos += 30;
  if (!muestra.genero_identificado) puntos += 20;
  if (!muestra.observaciones || muestra.observaciones.length < 10) puntos += 15;
  
  // Factores que disminuyen dificultad
  if (muestra.familia_identificada && muestra.genero_identificado) puntos -= 25;
  if (muestra.observaciones && muestra.observaciones.length > 50) puntos -= 10;
  
  if (puntos < 20) return 'Fácil';
  if (puntos < 40) return 'Moderada';
  return 'Difícil';
}

function calcularDistribucionDificultad(muestras) {
  const distribucion = { 'Fácil': 0, 'Moderada': 0, 'Difícil': 0 };
  muestras.forEach(m => distribucion[m.nivel_dificultad]++);
  return distribucion;
}

function calcularNivelConfianza(clasificacion, muestra) {
  let confianza = 50; // Base
  
  // Factores que aumentan confianza
  if (clasificacion.estado_reproductivo) confianza += 15;
  if (clasificacion.observaciones_clasificacion && clasificacion.observaciones_clasificacion.length > 20) confianza += 10;
  if (muestra.familia_identificada === clasificacion.familia) confianza += 20;
  
  // Limitar entre 0 y 100
  return Math.max(0, Math.min(100, confianza));
}

function generarObservacionesAlgoritmo(clasificacion, muestra) {
  const observaciones = [];
  
  if (muestra.familia_identificada && muestra.familia_identificada !== clasificacion.familia) {
    observaciones.push(`Discrepancia con identificación previa: ${muestra.familia_identificada} → ${clasificacion.familia}`);
  }
  
  if (clasificacion.nivel_confianza < 70) {
    observaciones.push('Clasificación requiere revisión por nivel de confianza bajo');
  }
  
  return observaciones.join('; ');
}

async function generarRecomendacionesSiguiente(clasificacionActual) {
  // Lógica para sugerir próximas muestras similares o relacionadas
  return {
    muestras_similares: `Buscar muestras de la familia ${clasificacionActual.familia}`,
    areas_enfoque: ['Revisar clasificaciones con baja confianza', 'Priorizar muestras antiguas']
  };
}

async function buscarSugerenciasDifusas(criterios) {
  // Implementar búsqueda difusa usando algoritmos de similitud
  return []; // Placeholder
}

function obtenerFrecuenciaClasificacion(especieId) {
  // Retornar qué tan frecuentemente se clasifica esta especie
  return Math.floor(Math.random() * 100); // Placeholder
}

function calcularProductividad(periodo) {
  // Calcular clasificaciones por día/semana
  return { clasificaciones_por_dia: 15 }; // Placeholder
}

function calcularTiempoPromedioClasificacion(periodo) {
  return { minutos: 45 }; // Placeholder
}

async function calcularDistribucionConfianza(periodo) {
  return { alta: 60, media: 25, baja: 15 }; // Placeholder
}

async function calcularTendenciasClasificacion(periodo) {
  return { tendencia: 'creciente', porcentaje: 12 }; // Placeholder
}

// Instalar axios y configurar
const port = process.env.PORT || 3005;
app.listen(port, () => {
  console.log(`[Lab_Service] Servidor refactorizado ejecutándose en puerto ${port}`);
  console.log('[Lab_Service] Configurado para usar Gestión Herbario en:', process.env.GESTION_HERBARIO_URL || 'http://localhost:3002');
});

export default app;