import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { validatePaqueteDTO, createPaqueteInsert } from './dto.js';
import { HerbarioService } from './herbarioService.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Registrar paquete con muestras (lógica de negocio + delegación a Gestión Herbario)
app.post('/paquetes', async (req, res) => {
  try {
    // 1. VALIDACIÓN DE DATOS (Lógica de Negocio)
    const validation = validatePaqueteDTO(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Datos inválidos', details: validation.errors });
    }

    // 2. TRANSFORMACIÓN DE DATOS (Lógica de Negocio)
    const { evento, paquete, muestras } = createPaqueteInsert(req.body);

    // 3. VALIDACIONES ADICIONALES DE NEGOCIO
    if (muestras.length === 0) {
      return res.status(400).json({ error: 'El paquete debe contener al menos una muestra' });
    }

    if (muestras.length > 100) {
      return res.status(400).json({ error: 'El paquete no puede exceder 100 muestras por razones de procesamiento' });
    }

    // 4. CÁLCULOS DERIVADOS (Lógica de Negocio)
    paquete.cantidad_ejemplares = muestras.length;
    paquete.fecha_recibido_herbario = new Date().toISOString();

    // 6. DELEGACIÓN A GESTIÓN HERBARIO: evento -> paquete -> muestras
    const eventoResult = await HerbarioService.crearEvento(evento);
    if (!eventoResult.success) {
      return res.status(500).json({ error: eventoResult.error });
    }

    paquete.id_evento_coleccion = eventoResult.data.id;
    const paqueteResult = await HerbarioService.crearPaquete(paquete);
    if (!paqueteResult.success) {
      return res.status(500).json({ error: paqueteResult.error });
    }

    const muestrasConPaquete = muestras.map(muestra => ({
      ...muestra,
      id_paquete: paqueteResult.data.id
    }));

    const muestrasResult = await HerbarioService.crearMuestras(muestrasConPaquete);
    if (!muestrasResult.success) {
      return res.status(500).json({ error: muestrasResult.error });
    }

    // 7. RESPUESTA CON DATOS PROCESADOS (Lógica de Negocio)
    res.status(201).json({
      ok: true,
      mensaje: 'Paquete registrado exitosamente',
      evento_id: eventoResult.data.id,
      paquete_id: paqueteResult.data.id,
      muestras_creadas: muestras.length,
      fecha_procesamiento: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error en POST /paquetes:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener paquetes recibidos (con filtros y lógica de presentación)
app.get('/paquetes', async (req, res) => {
  try {
    // 1. VALIDACIÓN DE PARÁMETROS (Lógica de Negocio)
    const { desde, hasta, conglomerado, page = 1, limit = 50 } = req.query;
    
    // Validar formato de fechas
    if (desde && isNaN(Date.parse(desde))) {
      return res.status(400).json({ error: 'Formato de fecha "desde" inválido' });
    }
    if (hasta && isNaN(Date.parse(hasta))) {
      return res.status(400).json({ error: 'Formato de fecha "hasta" inválido' });
    }

    // 2. PREPARAR FILTROS (Lógica de Negocio)
    const filtros = { page, limit };
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;  
    if (conglomerado) filtros.conglomerado = conglomerado;

    // 3. DELEGACIÓN A GESTIÓN HERBARIO
    const result = await HerbarioService.obtenerPaquetes(filtros);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // 4. PROCESAMIENTO DE RESPUESTA (Lógica de Negocio)
    const paquetes = result.data.map(paquete => ({
      ...paquete,
      // Cálculos derivados
      dias_desde_recepcion: paquete.fecha_recibido_herbario 
        ? Math.floor((new Date() - new Date(paquete.fecha_recibido_herbario)) / (1000 * 60 * 60 * 24))
        : null,
      ubicacion_completa: paquete.evento_coleccion?.conglomerado 
        ? `${paquete.evento_coleccion.conglomerado.municipio.nombre} - ${paquete.evento_coleccion.conglomerado.codigo}`
        : 'Sin ubicación'
    }));

    // 5. ESTADÍSTICAS AGREGADAS (Lógica de Negocio)
    const estadisticas = {
      total_paquetes: paquetes.length,
      promedio_muestras_por_paquete: paquetes.length > 0 
        ? Math.round(paquetes.reduce((sum, p) => sum + (p.cantidad_ejemplares || 0), 0) / paquetes.length)
        : 0,
      ubicaciones_unicas: [...new Set(paquetes.map(p => p.ubicacion_completa))].length
    };

    res.json({ 
      paquetes,
      estadisticas,
      filtros_aplicados: filtros,
      fecha_consulta: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error en GET /paquetes:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener conglomerados disponibles
app.get('/conglomerados', async (req, res) => {
  try {
    const result = await HerbarioService.obtenerConglomerados();
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Transformar para vista de recepción
    const conglomerados = result.data.map(c => ({
      id: c.id,
      codigo: c.codigo,
      nombre_completo: `${c.codigo} - ${c.municipio.nombre}, ${c.municipio.departamento.nombre}`,
      municipio: c.municipio.nombre,
      departamento: c.municipio.departamento.nombre,
      region: c.municipio.departamento.region.nombre,
      latitud: c.latitud_dec,
      longitud: c.longitud_dec
    }));

    res.json(conglomerados);
  } catch (e) {
    console.error('Error en GET /conglomerados:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener subparcelas de un conglomerado
app.get('/conglomerados/:id/subparcelas', async (req, res) => {
  try {
    const result = await HerbarioService.obtenerSubparcelas(req.params.id);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (e) {
    console.error('Error en GET /conglomerados/:id/subparcelas:', e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const port = process.env.PORT || 3004;
app.listen(port, () => {
  console.log(`[Recepcion_Service] listening on port ${port}`);
});