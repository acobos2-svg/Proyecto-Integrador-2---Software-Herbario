import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { 
  validateClasificacionDTO, 
  createClasificacionInsert, 
  validateFiltrosMuestras,
  calcularPorcentajeSimilitud,
  generarSugerenciasClasificacion,
  validarCoherenciaTaxonomica
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

// Obtener muestras pendientes de clasificación
app.get('/muestras/pendientes', async (req, res) => {
  try {
    const filtros = validateFiltrosMuestras(req.query);
    
    let query = supabase
      .from('muestra_botanica')
      .select(`
        id,
        numero_coleccion,
        numero_ejemplar,
        colector,
        familia_identificada,
        genero_identificado,
        especie_identificada,
        estado_muestra,
        observaciones,
        fecha_creacion,
        paquete!inner(
          id,
          num_paquete,
          fecha_recibido_herbario,
          evento_coleccion!inner(
            id,
            descripcion,
            fecha_coleccion_inicio,
            fecha_coleccion_fin,
            conglomerado!inner(
              id,
              codigo,
              latitud_dec,
              longitud_dec
            )
          )
        )
      `)
      .is('id_clasificacion_herbario', null) // Solo muestras sin clasificar
      .eq('estado_muestra', 'Activa');

    // Aplicar filtros
    if (filtros.conglomerado) {
      query = query.eq('paquete.evento_coleccion.id_conglomerado', filtros.conglomerado);
    }

    if (filtros.fecha_desde) {
      query = query.gte('paquete.fecha_recibido_herbario', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('paquete.fecha_recibido_herbario', filtros.fecha_hasta);
    }

    const { data, error } = await query
      .order('paquete.fecha_recibido_herbario', { ascending: false })
      .range(filtros.offset, filtros.offset + filtros.limit - 1);

    if (error) {
      console.error('Error obteniendo muestras pendientes:', error);
      return res.status(500).json({ error: 'Error consultando muestras pendientes' });
    }

    // Agrupar por conglomerado para mostrar en UI
    const muestrasPorConglomerado = data.reduce((acc, muestra) => {
      const conglomerado = muestra.paquete.evento_coleccion.conglomerado;
      const key = conglomerado.codigo;
      
      if (!acc[key]) {
        acc[key] = {
          conglomerado: conglomerado,
          muestras: []
        };
      }
      
      acc[key].muestras.push(muestra);
      return acc;
    }, {});

    res.json({ 
      muestras_pendientes: Object.values(muestrasPorConglomerado),
      total: data.length 
    });
  } catch (e) {
    console.error('Error en GET /muestras/pendientes:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar clasificación taxonómica
app.post('/clasificaciones', async (req, res) => {
  try {
    // Validar datos de entrada
    const validation = validateClasificacionDTO(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.errors });
    }

    // Obtener ID del usuario desde JWT (simulado por ahora)
    const userId = req.body.id_usuario_clasificador; // En producción vendría del token JWT

    // Verificar que la muestra existe y no está clasificada
    const { data: muestra, error: muestraError } = await supabase
      .from('muestra_botanica')
      .select('id, id_clasificacion_herbario')
      .eq('id', req.body.id_muestra)
      .single();

    if (muestraError || !muestra) {
      return res.status(404).json({ error: 'Muestra no encontrada' });
    }

    if (muestra.id_clasificacion_herbario) {
      return res.status(409).json({ error: 'La muestra ya está clasificada' });
    }

    // Crear objeto de clasificación
    const clasificacionData = createClasificacionInsert(req.body, userId);

    // Transacción: crear clasificación y actualizar muestra
    const { data: clasificacion, error: clasificacionError } = await supabase
      .from('clasificacion_herbario')
      .insert(clasificacionData)
      .select('id')
      .single();

    if (clasificacionError) {
      console.error('Error creando clasificación:', clasificacionError);
      return res.status(500).json({ error: 'Error creando clasificación' });
    }

    // Actualizar muestra con el ID de clasificación
    const { error: updateError } = await supabase
      .from('muestra_botanica')
      .update({ id_clasificacion_herbario: clasificacion.id })
      .eq('id', req.body.id_muestra);

    if (updateError) {
      console.error('Error actualizando muestra:', updateError);
      return res.status(500).json({ error: 'Error vinculando clasificación con muestra' });
    }

    res.status(201).json({
      ok: true,
      clasificacion_id: clasificacion.id,
      muestra_id: req.body.id_muestra,
      mensaje: 'Clasificación registrada exitosamente'
    });
  } catch (e) {
    console.error('Error en POST /clasificaciones:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener muestras clasificadas
app.get('/muestras/clasificadas', async (req, res) => {
  try {
    const filtros = validateFiltrosMuestras(req.query);
    
    let query = supabase
      .from('muestra_botanica')
      .select(`
        id,
        numero_coleccion,
        numero_ejemplar,
        colector,
        familia_identificada,
        genero_identificado,
        especie_identificada,
        observaciones,
        clasificacion_herbario!inner(
          id,
          familia_final,
          genero_final,
          especie_final,
          nombre_cientifico_final,
          tipo_amenaza,
          estado_reproductivo,
          observaciones_clasificacion,
          fecha_clasificacion,
          estado_clasificacion,
          info_usuario!inner(
            nombres,
            apellidos
          )
        ),
        paquete!inner(
          id,
          num_paquete,
          evento_coleccion!inner(
            descripcion,
            conglomerado!inner(
              codigo,
              latitud_dec,
              longitud_dec
            )
          )
        )
      `)
      .not('id_clasificacion_herbario', 'is', null); // Solo muestras clasificadas

    // Aplicar filtros
    if (filtros.conglomerado) {
      query = query.eq('paquete.evento_coleccion.id_conglomerado', filtros.conglomerado);
    }

    if (filtros.fecha_desde) {
      query = query.gte('clasificacion_herbario.fecha_clasificacion', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('clasificacion_herbario.fecha_clasificacion', filtros.fecha_hasta);
    }

    const { data, error } = await query
      .order('clasificacion_herbario.fecha_clasificacion', { ascending: false })
      .range(filtros.offset, filtros.offset + filtros.limit - 1);

    if (error) {
      console.error('Error obteniendo muestras clasificadas:', error);
      return res.status(500).json({ error: 'Error consultando muestras clasificadas' });
    }

    res.json({ 
      muestras_clasificadas: data,
      total: data.length 
    });
  } catch (e) {
    console.error('Error en GET /muestras/clasificadas:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de procesamiento de muestra
app.put('/muestras/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_procesamiento } = req.body;

    const estadosValidos = ['Pendiente', 'En análisis', 'Clasificada'];
    if (!estadosValidos.includes(estado_procesamiento)) {
      return res.status(400).json({ 
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` 
      });
    }

    const { data, error } = await supabase
      .from('muestra_botanica')
      .update({ estado_procesamiento })
      .eq('id', parseInt(id))
      .select('id, estado_procesamiento')
      .single();

    if (error) {
      console.error('Error actualizando estado:', error);
      return res.status(500).json({ error: 'Error actualizando estado de muestra' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Muestra no encontrada' });
    }

    res.json({ 
      ok: true, 
      muestra: data,
      mensaje: 'Estado actualizado exitosamente'
    });
  } catch (e) {
    console.error('Error en PUT /muestras/:id/estado:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Búsqueda en taxonomía (autocompletado)
app.get('/taxonomia/buscar', async (req, res) => {
  try {
    const { termino, tipo = 'especie' } = req.query;

    if (!termino || termino.trim().length < 2) {
      return res.status(400).json({ error: 'Término de búsqueda debe tener al menos 2 caracteres' });
    }

    const resultados = await buscarTaxonomia(termino.trim(), tipo);
    
    res.json({ 
      resultados,
      tipo,
      termino: termino.trim()
    });
  } catch (e) {
    console.error('Error en GET /taxonomia/buscar:', e);
    res.status(500).json({ error: 'Error en búsqueda taxonómica' });
  }
});

// Obtener detalle completo de una muestra
app.get('/muestras/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('muestra_botanica')
      .select(`
        *,
        clasificacion_herbario(
          *,
          info_usuario(nombres, apellidos)
        ),
        paquete!inner(
          *,
          evento_coleccion!inner(
            *,
            conglomerado!inner(*)
          )
        )
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('Error obteniendo detalle de muestra:', error);
      return res.status(500).json({ error: 'Error consultando muestra' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Muestra no encontrada' });
    }

    res.json({ muestra: data });
  } catch (e) {
    console.error('Error en GET /muestras/:id:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const port = process.env.PORT || 3005;
app.listen(port, () => {
  console.log(`[Lab_Service] listening on port ${port}`);
});