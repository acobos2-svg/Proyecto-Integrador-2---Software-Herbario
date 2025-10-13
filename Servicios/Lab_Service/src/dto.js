// DTO y validaciones para clasificación taxonómica
import { supabase, supabaseCatalog } from './supabase.js';

// Validar datos de clasificación taxonómica
export function validateClasificacionDTO(data) {
  const errors = [];
  
  // Validaciones requeridas
  if (!data.id_muestra || typeof data.id_muestra !== 'number') {
    errors.push('id_muestra es requerido y debe ser un número');
  }

  if (!data.familia_final || typeof data.familia_final !== 'string' || data.familia_final.trim().length === 0) {
    errors.push('familia_final es requerida');
  }

  if (!data.genero_final || typeof data.genero_final !== 'string' || data.genero_final.trim().length === 0) {
    errors.push('genero_final es requerido');
  }

  if (!data.especie_final || typeof data.especie_final !== 'string' || data.especie_final.trim().length === 0) {
    errors.push('especie_final es requerida');
  }

  // Validar nombre científico completo
  if (data.nombre_cientifico_final && typeof data.nombre_cientifico_final !== 'string') {
    errors.push('nombre_cientifico_final debe ser un string');
  }

  // Validar estado de amenaza
  const tiposAmenaza = ['CR', 'EN', 'VU', 'NN'];
  if (data.tipo_amenaza && !tiposAmenaza.includes(data.tipo_amenaza)) {
    errors.push('tipo_amenaza debe ser uno de: CR, EN, VU, NN');
  }

  // Validar estado reproductivo
  const estadosReproductivos = [
    'Vegetativo', 
    'Floración', 
    'Fructificación', 
    'Floración y Fructificación', 
    'Estéril'
  ];
  if (data.estado_reproductivo && !estadosReproductivos.includes(data.estado_reproductivo)) {
    errors.push(`estado_reproductivo debe ser uno de: ${estadosReproductivos.join(', ')}`);
  }

  // Validar ID usuario clasificador
  if (!data.id_usuario_clasificador || typeof data.id_usuario_clasificador !== 'number') {
    errors.push('id_usuario_clasificador es requerido y debe ser un número');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Crear objeto para inserción en clasificacion_herbario
export function createClasificacionInsert(data, userId) {
  const clasificacion = {
    id_muestra_botanica: data.id_muestra,
    familia_final: data.familia_final.trim(),
    genero_final: data.genero_final.trim(),
    especie_final: data.especie_final.trim(),
    nombre_cientifico_final: data.nombre_cientifico_final?.trim() || 
      `${data.genero_final.trim()} ${data.especie_final.trim()}`,
    tipo_amenaza: data.tipo_amenaza || 'NN',
    estado_reproductivo: data.estado_reproductivo || 'Vegetativo',
    observaciones_clasificacion: data.observaciones_clasificacion?.trim() || '',
    id_usuario_clasificador: userId,
    fecha_clasificacion: new Date().toISOString(),
    estado_clasificacion: 'Clasificada'
  };

  return clasificacion;
}

// Validar filtros para búsqueda de muestras
export function validateFiltrosMuestras(query) {
  const filtros = {};

  // Estado de muestra
  const estadosValidos = ['Pendiente', 'En análisis', 'Clasificada'];
  if (query.estado && estadosValidos.includes(query.estado)) {
    filtros.estado = query.estado;
  }

  // Conglomerado
  if (query.conglomerado) {
    const conglomeradoId = parseInt(query.conglomerado);
    if (!isNaN(conglomeradoId)) {
      filtros.conglomerado = conglomeradoId;
    }
  }

  // Rango de fechas
  if (query.fecha_desde) {
    const fechaDesde = new Date(query.fecha_desde);
    if (!isNaN(fechaDesde.getTime())) {
      filtros.fecha_desde = fechaDesde.toISOString().split('T')[0];
    }
  }

  if (query.fecha_hasta) {
    const fechaHasta = new Date(query.fecha_hasta);
    if (!isNaN(fechaHasta.getTime())) {
      filtros.fecha_hasta = fechaHasta.toISOString().split('T')[0];
    }
  }

  // Paginación
  const limit = parseInt(query.limit) || 20;
  const offset = parseInt(query.offset) || 0;
  
  filtros.limit = Math.min(limit, 100); // Máximo 100 registros
  filtros.offset = Math.max(offset, 0);

  return filtros;
}

// Buscar en taxonomía con autocompletado
export async function buscarTaxonomia(termino, tipo = 'especie') {
  try {
    let query;
    
    switch (tipo) {
      case 'familia':
        query = supabaseCatalog
          .from('familia')
          .select('id, nombre')
          .ilike('nombre', `%${termino}%`)
          .limit(10);
        break;

      case 'genero':
        query = supabaseCatalog
          .from('genero')
          .select(`
            id, 
            nombre,
            familia!inner(id, nombre)
          `)
          .ilike('nombre', `%${termino}%`)
          .limit(10);
        break;

      case 'especie':
      default:
        query = supabaseCatalog
          .from('especie')
          .select(`
            id, 
            nombre,
            nombre_comun,
            tipo_amenaza,
            genero!inner(
              id, 
              nombre,
              familia!inner(id, nombre)
            )
          `)
          .ilike('nombre', `%${termino}%`)
          .limit(10);
        break;
    }

    const { data, error } = await query;
    
    if (error) {
      console.error(`Error buscando ${tipo}:`, error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error(`Error en búsqueda taxonómica:`, e);
    return [];
  }
}