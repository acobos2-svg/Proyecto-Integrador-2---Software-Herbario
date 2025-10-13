import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';

dotenv.config();

// Test Supabase connection
console.log('[Gest_Herb_service] Probando conexión a Supabase...');
console.log('[Gest_Herb_service] URL:', process.env.SUPABASE_URL);
console.log('[Gest_Herb_service] Key:', process.env.SUPABASE_ANON_KEY ? 'Configurada' : 'No configurada');

supabase.from('region').select('*').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('[Gest_Herb_service] Error conectando a Supabase (public):', error);
      console.error('[Gest_Herb_service] Detalles del error:', error.message);
      console.error('[Gest_Herb_service] Código del error:', error.code);
    } else {
      console.log(`[Gest_Herb_service] ✅ Conexión a Supabase exitosa!`);
      console.log(`[Gest_Herb_service] Datos de prueba:`, data);
    }
  })
  .catch(err => {
    console.error('[Gest_Herb_service] Error general:', err);
  });

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// ===== EVENTOS DE COLECCIÓN =====
app.post('/eventos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evento_coleccion')
      .insert(req.body)
      .select('id')
      .single();

    if (error) {
      console.error('Error creando evento:', error);
      return res.status(500).json({ error: 'Error creando evento de colección' });
    }

    res.status(201).json({ id: data.id });
  } catch (err) {
    console.error('Error en POST /eventos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/eventos/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('evento_coleccion')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /eventos/:id:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== PAQUETES =====
app.post('/paquetes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('paquete')
      .insert(req.body)
      .select('id')
      .single();

    if (error) {
      console.error('Error creando paquete:', error);
      return res.status(500).json({ error: 'Error creando paquete' });
    }

    res.status(201).json({ id: data.id });
  } catch (err) {
    console.error('Error en POST /paquetes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/paquetes', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('paquete')
      .select(`
        *,
        evento_coleccion!inner(
          id,
          fecha_coleccion_inicio,
          fecha_coleccion_fin,
          conglomerado!inner(
            id,
            codigo,
            municipio!inner(
              nombre,
              departamento!inner(
                nombre
              )
            )
          )
        )
      `)
      .order('id', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo paquetes:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Error obteniendo paquetes', details: error });
    }
    
    console.log('Paquetes obtenidos exitosamente:', data?.length || 0, 'registros');

    // Transformar datos para el frontend
    const paquetesTransformados = data.map(paquete => ({
      ...paquete,
      fecha_coleccion: paquete.evento_coleccion?.fecha_coleccion_inicio || paquete.fecha_envio || null,
      fecha_registro: paquete.fecha_recibido_herbario || null,
      total_muestras: paquete.cantidad_ejemplares || 0,
      conglomerado_nombre: paquete.evento_coleccion?.conglomerado ? 
        `${paquete.evento_coleccion.conglomerado.codigo} - ${paquete.evento_coleccion.conglomerado.municipio.nombre}, ${paquete.evento_coleccion.conglomerado.municipio.departamento.nombre}` : 
        'No especificado',
      estado: 'recibido',
      estado_texto: 'Recibido'
    }));

    res.json(paquetesTransformados);
  } catch (err) {
    console.error('Error en GET /paquetes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/paquetes/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('paquete')
      .select(`
        *,
        evento_coleccion(*),
        muestra_botanica(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /paquetes/:id:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== MUESTRAS BOTÁNICAS =====
app.post('/muestras', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('muestra_botanica')
      .insert(req.body)
      .select('id');

    if (error) {
      console.error('Error creando muestras:', error);
      return res.status(500).json({ error: 'Error creando muestras' });
    }

    res.status(201).json({ insertedIds: data.map(m => m.id) });
  } catch (err) {
    console.error('Error en POST /muestras:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/muestras/pendientes', async (req, res) => {
  try {
    const { conglomerado, limit = 50, offset = 0 } = req.query;
    
    // PASO 1: Obtener IDs de muestras que YA tienen clasificación
    const { data: muestrasConClasificacion, error: errorClasificadas } = await supabase
      .from('clasificacion_herbario')
      .select('id_muestra');

    if (errorClasificadas) {
      console.error('Error obteniendo muestras clasificadas:', errorClasificadas);
      return res.status(500).json({ error: 'Error obteniendo muestras' });
    }

    const idsConClasificacion = muestrasConClasificacion.map(c => c.id_muestra);

    // PASO 2: Consultar muestras que NO están en la lista de clasificadas
    let query = supabase
      .from('muestra_botanica')
      .select(`
        id,
        num_coleccion,
        num_individuo,
        colector,
        observaciones,
        fecha_coleccion,
        paquete!inner(
          id,
          num_paquete,
          fecha_recibido_herbario,
          evento_coleccion!inner(
            id,
            descripcion,
            fecha_coleccion_inicio,
            conglomerado!inner(
              codigo, 
              municipio!inner(
                nombre,
                departamento!inner(nombre)
              )
            )
          )
        )
      `)
      .order('id', { ascending: true });

    // Excluir muestras que ya tienen clasificación
    if (idsConClasificacion.length > 0) {
      query = query.not('id', 'in', `(${idsConClasificacion.join(',')})`);
    }

    // Filtro opcional por conglomerado
    if (conglomerado) {
      query = query.eq('paquete.evento_coleccion.conglomerado.codigo', conglomerado);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error obteniendo muestras pendientes:', error);
      return res.status(500).json({ error: 'Error obteniendo muestras' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /muestras/pendientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/muestras/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('muestra_botanica')
      .select(`
        *,
        paquete(*),
        clasificacion_taxonomica(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Muestra no encontrada' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /muestras/:id:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/muestras/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('muestra_botanica')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando muestra:', error);
      return res.status(500).json({ error: 'Error actualizando muestra' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en PUT /muestras/:id:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== CLASIFICACIONES TAXONÓMICAS =====
app.post('/clasificaciones', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clasificacion_herbario')
      .insert(req.body)
      .select('id')
      .single();

    if (error) {
      console.error('Error creando clasificación:', error);
      return res.status(500).json({ error: 'Error creando clasificación' });
    }

    res.status(201).json({ id: data.id });
  } catch (err) {
    console.error('Error en POST /clasificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/clasificaciones/muestra/:muestraId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clasificacion_taxonomica')
      .select('*')
      .eq('id_muestra_botanica', req.params.muestraId)
      .order('fecha_clasificacion', { ascending: false });

    if (error) {
      console.error('Error obteniendo clasificaciones:', error);
      return res.status(500).json({ error: 'Error obteniendo clasificaciones' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /clasificaciones/muestra/:muestraId:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== CATÁLOGO TAXONÓMICO =====
app.get('/taxonomia/familias', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('familia')
      .select('id, nombre')
      .order('nombre');

    if (error) {
      console.error('Error obteniendo familias:', error);
      return res.status(500).json({ error: 'Error obteniendo familias' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /taxonomia/familias:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/taxonomia/generos/:familiaId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('genero')
      .select('id, nombre')
      .eq('id_familia', req.params.familiaId)
      .order('nombre');

    if (error) {
      console.error('Error obteniendo géneros:', error);
      return res.status(500).json({ error: 'Error obteniendo géneros' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /taxonomia/generos/:familiaId:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/taxonomia/especies/:generoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('especie')
      .select('id, nombre, nombre_comun, tipo_amenaza')
      .eq('id_genero', req.params.generoId)
      .order('nombre');

    if (error) {
      console.error('Error obteniendo especies:', error);
      return res.status(500).json({ error: 'Error obteniendo especies' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /taxonomia/especies/:generoId:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/taxonomia/buscar', async (req, res) => {
  try {
    const { familia, genero, especie } = req.query;

    if (!familia && !genero && !especie) {
      return res.status(400).json({ error: 'Se requiere al menos un parámetro de búsqueda' });
    }

    let query = supabase
      .from('especie')
      .select(`
        id, nombre, nombre_comun, tipo_amenaza,
        genero!inner(id, nombre, familia!inner(id, nombre))
      `);

    if (familia) {
      query = query.ilike('genero.familia.nombre', `%${familia}%`);
    }
    if (genero) {
      query = query.ilike('genero.nombre', `%${genero}%`);
    }
    if (especie) {
      query = query.ilike('nombre', `%${especie}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('Error en búsqueda taxonómica:', error);
      return res.status(500).json({ error: 'Error en búsqueda taxonómica' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /taxonomia/buscar:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== herbario =====
app.get('/herbario', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('herbario')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error obteniendo herbario:', error);
      return res.status(500).json({ error: 'Error obteniendo herbario' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /herbario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== UBICACIONES GEOGRÁFICAS =====
app.get('/ubicaciones/conglomerados', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conglomerado')
      .select(`
        id, codigo, latitud_dec, longitud_dec,
        municipio!inner(id, nombre, departamento!inner(id, nombre, region!inner(nombre)))
      `)
      .order('codigo');

    if (error) {
      console.error('Error obteniendo conglomerados:', error);
      return res.status(500).json({ error: 'Error obteniendo conglomerados' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /ubicaciones/conglomerados:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/ubicaciones/subparcelas/:conglomeradoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subparcela')
      .select('id, num_subparcela')
      .eq('id_conglomerado', req.params.conglomeradoId)
      .order('num_subparcela');

    if (error) {
      console.error('Error obteniendo subparcelas:', error);
      return res.status(500).json({ error: 'Error obteniendo subparcelas' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /ubicaciones/subparcelas/:conglomeradoId:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ESTADÍSTICAS Y REPORTES =====
app.get('/estadisticas/resumen', async (req, res) => {
  try {
    // Conteos generales
    const [
      { count: totalMuestras },
      { count: muestrasPendientes },
      { count: muestrasClasificadas },
      { count: totalPaquetes }
    ] = await Promise.all([
      supabase.from('muestra_botanica').select('*', { count: 'exact', head: true }),
      supabase.from('muestra_botanica').select('*', { count: 'exact', head: true }).in('estado_muestra', ['pendiente', 'en_proceso']),
      supabase.from('muestra_botanica').select('*', { count: 'exact', head: true }).eq('estado_muestra', 'clasificada'),
      supabase.from('paquete').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      totalMuestras,
      muestrasPendientes,
      muestrasClasificadas,
      totalPaquetes,
      porcentajeAvance: totalMuestras > 0 ? Math.round((muestrasClasificadas / totalMuestras) * 100) : 0
    });

  } catch (err) {
    console.error('Error en GET /estadisticas/resumen:', err);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

app.get('/estadisticas/por-ubicacion', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('muestra_botanica')
      .select(`
        estado_muestra,
        paquete!inner(
          evento_coleccion!inner(
            conglomerado!inner(codigo, municipio!inner(nombre))
          )
        )
      `);

    if (error) {
      console.error('Error obteniendo estadísticas por ubicación:', error);
      return res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }

    // Agrupar por ubicación
    const estadisticas = {};
    data.forEach(muestra => {
      const ubicacion = muestra.paquete.evento_coleccion.conglomerado.codigo;
      if (!estadisticas[ubicacion]) {
        estadisticas[ubicacion] = {
          codigo_postal: ubicacion,
          municipio: muestra.paquete.evento_coleccion.conglomerado.municipio.nombre,
          total: 0,
          pendientes: 0,
          clasificadas: 0
        };
      }
      estadisticas[ubicacion].total++;
      if (['pendiente', 'en_proceso'].includes(muestra.estado_muestra)) {
        estadisticas[ubicacion].pendientes++;
      } else if (muestra.estado_muestra === 'clasificada') {
        estadisticas[ubicacion].clasificadas++;
      }
    });

    res.json(Object.values(estadisticas));
  } catch (err) {
    console.error('Error en GET /estadisticas/por-ubicacion:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ENDPOINTS DE ADMINISTRACIÓN =====

// Gestión de herbario
app.post('/admin/herbario', async (req, res) => {
  try {
    const { nombre, codigo_postal, direccion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const { data, error } = await supabase
      .from('herbario')
      .insert({
        nombre,
        codigo_postal,
        direccion
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creando herbario:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un herbario con ese código' });
      }
      return res.status(500).json({ error: 'Error creando herbario' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error en POST /admin/herbario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/admin/herbario', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('herbario')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error obteniendo herbario:', error);
      return res.status(500).json({ error: 'Error obteniendo herbario' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /admin/herbario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/admin/herbario/:id', async (req, res) => {
  try {
    const { nombre, codigo_postal, direccion } = req.body;

    const { data, error } = await supabase
      .from('herbario')
      .update({
        nombre,
        codigo_postal,
        direccion
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error actualizando herbario:', error);
      return res.status(500).json({ error: 'Error actualizando herbario' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Herbario no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en PUT /admin/herbario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/herbario/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('herbario')
      .delete()
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error eliminando herbario:', error);
      return res.status(500).json({ error: 'Error eliminando herbario' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Herbario no encontrado' });
    }

    res.json({ message: 'Herbario eliminado exitosamente' });
  } catch (err) {
    console.error('Error en DELETE /admin/herbario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Gestión de Usuarios de Herbario
app.post('/admin/usuarios', async (req, res) => {
  try {
    const { nombre, email, cedula, password, rol, id_herbario } = req.body;
    
    if (!nombre || !email || !cedula || !rol || !id_herbario) {
      return res.status(400).json({ 
        error: 'Nombre, email, cédula, rol y herbario son requeridos' 
      });
    }

    // Verificar que el herbario existe
    const { data: herbario, error: herbarioError } = await supabase
      .from('herbario')
      .select('id')
      .eq('id', id_herbario)
      .single();

    if (herbarioError || !herbario) {
      return res.status(400).json({ error: 'Herbario no encontrado' });
    }

    // Crear usuario en Supabase Auth primero (si se proporciona password)
    let userId;
    if (password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('Error creando usuario en auth:', authError);
        return res.status(400).json({ error: 'Error creando usuario de autenticación' });
      }
      
      userId = authData.user.id;
    }

    const { data, error } = await supabase
      .from('info_usuario')
      .insert({
        id_user: userId,
        nombre_completo: nombre,
        correo_electronico: email,
        cedula,
        rol,
        id_herbario
      })
      .select(`
        *,
        herbario:id_herbario (
          id,
          nombre,
          codigo_postal
        )
      `)
      .single();

    if (error) {
      console.error('Error creando usuario:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un usuario con esa cédula o email' });
      }
      return res.status(500).json({ error: 'Error creando usuario' });
    }

    // No retornar la contraseña
    const { password_hash, ...userResponse } = data;
    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Error en POST /admin/usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/admin/usuarios', async (req, res) => {
  try {
    const { id_herbario } = req.query;
    
    let query = supabase
      .from('info_usuario')
      .select(`
        *,
        herbario:id_herbario (
          id,
          nombre,
          codigo_postal
        )
      `)
      .order('id_user', { ascending: true });

    if (id_herbario) {
      query = query.eq('id_herbario', id_herbario);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return res.status(500).json({ error: 'Error obteniendo usuarios' });
    }

    // No retornar contraseñas
    const users = data.map(({ password_hash, ...user }) => user);
    res.json(users);
  } catch (err) {
    console.error('Error en GET /admin/usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/admin/usuarios/:id', async (req, res) => {
  try {
    const { nombre, email, rol, id_herbario } = req.body;

    const updateData = {
      nombre_completo: nombre,
      correo_electronico: email,
      rol,
      id_herbario
    };

    // Si se proporciona nueva contraseña, actualizar en Supabase Auth
    if (req.body.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        req.params.id,
        { password: req.body.password }
      );
      
      if (authError) {
        console.error('Error actualizando contraseña:', authError);
        return res.status(400).json({ error: 'Error actualizando contraseña' });
      }
    }

    const { data, error } = await supabase
      .from('info_usuario')
      .update(updateData)
      .eq('id_user', req.params.id)
      .select(`
        *,
        herbario:id_herbario (
          id,
          nombre,
          codigo_postal
        )
      `)
      .single();

    if (error) {
      console.error('Error actualizando usuario:', error);
      return res.status(500).json({ error: 'Error actualizando usuario' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No retornar la contraseña
    const { password_hash, ...userResponse } = data;
    res.json(userResponse);
  } catch (err) {
    console.error('Error en PUT /admin/usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/usuarios/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('info_usuario')
      .delete()
      .eq('id_user', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error eliminando usuario:', error);
      return res.status(500).json({ error: 'Error eliminando usuario' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error en DELETE /admin/usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Autenticación de administrador
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Credenciales hardcodeadas por el momento
    if (username === 'admin' && password === 'admin') {
      res.json({
        success: true,
        token: 'admin-token-' + Date.now(),
        user: {
          id: 1,
          username: 'admin',
          role: 'super_admin',
          permissions: ['create_herbario', 'manage_users', 'view_all']
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (err) {
    console.error('Error en POST /admin/login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== GESTIÓN DE UBICACIONES GEOGRÁFICAS =====

// Gestión de Regiones
app.get('/admin/regiones', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('region')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo regiones:', error);
      return res.status(500).json({ error: 'Error obteniendo regiones' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /admin/regiones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/admin/regiones', async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const { data, error } = await supabase
      .from('region')
      .insert({
        nombre
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creando región:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una región con ese nombre' });
      }
      return res.status(500).json({ error: 'Error creando región' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error en POST /admin/regiones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/admin/regiones/:id', async (req, res) => {
  try {
    const { nombre } = req.body;

    const { data, error } = await supabase
      .from('region')
      .update({
        nombre
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error actualizando región:', error);
      return res.status(500).json({ error: 'Error actualizando región' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Región no encontrada' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en PUT /admin/regiones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/regiones/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('region')
      .delete()
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error eliminando región:', error);
      return res.status(500).json({ error: 'Error eliminando región' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Región no encontrada' });
    }

    res.json({ message: 'Región eliminada exitosamente' });
  } catch (err) {
    console.error('Error en DELETE /admin/regiones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Gestión de Departamentos
app.get('/admin/departamentos', async (req, res) => {
  try {
    const { id_region } = req.query;
    
    let query = supabase
      .from('departamento')
      .select(`
        *,
        region:id_region (
          id,
          nombre
        )
      `)
      .order('nombre', { ascending: true });

    if (id_region) {
      query = query.eq('id_region', id_region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo departamentos:', error);
      return res.status(500).json({ error: 'Error obteniendo departamentos' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /admin/departamentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/admin/departamentos', async (req, res) => {
  try {
    const { nombre, id_region } = req.body;
    
    if (!nombre || !id_region) {
      return res.status(400).json({ 
        error: 'Nombre y región son requeridos' 
      });
    }

    // Verificar que la región existe
    const { data: region, error: regionError } = await supabase
      .from('region')
      .select('id')
      .eq('id', id_region)
      .single();

    if (regionError || !region) {
      return res.status(400).json({ error: 'Región no encontrada' });
    }

    const { data, error } = await supabase
      .from('departamento')
      .insert({
        nombre,
        id_region
      })
      .select(`
        *,
        region:region_id (
          id,
          nombre
        )
      `)
      .single();

    if (error) {
      console.error('Error creando departamento:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un departamento con ese nombre' });
      }
      return res.status(500).json({ error: 'Error creando departamento' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error en POST /admin/departamentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/admin/departamentos/:id', async (req, res) => {
  try {
    const { nombre, region_id } = req.body;

    const { data, error } = await supabase
      .from('departamento')
      .update({
        nombre,
        region_id
      })
      .eq('id', req.params.id)
      .select(`
        *,
        region:region_id (
          id,
          nombre
        )
      `)
      .single();

    if (error) {
      console.error('Error actualizando departamento:', error);
      return res.status(500).json({ error: 'Error actualizando departamento' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en PUT /admin/departamentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/departamentos/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departamento')
      .delete()
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error eliminando departamento:', error);
      return res.status(500).json({ error: 'Error eliminando departamento' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }

    res.json({ message: 'Departamento eliminado exitosamente' });
  } catch (err) {
    console.error('Error en DELETE /admin/departamentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Gestión de Municipios
app.get('/admin/municipios', async (req, res) => {
  try {
    const { id_departamento } = req.query;
    
    let query = supabase
      .from('municipio')
      .select(`
        *,
        departamento:id_departamento (
          id,
          nombre,
          region:id_region (
            id,
            nombre
          )
        )
      `)
      .order('nombre', { ascending: true });

    if (id_departamento) {
      query = query.eq('id_departamento', id_departamento);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo municipios:', error);
      return res.status(500).json({ error: 'Error obteniendo municipios' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /admin/municipios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/admin/municipios', async (req, res) => {
  try {
    const { nombre, id_departamento } = req.body;
    
    if (!nombre || !id_departamento) {
      return res.status(400).json({ 
        error: 'Nombre y departamento son requeridos' 
      });
    }

    // Verificar que el departamento existe
    const { data: departamento, error: departamentoError } = await supabase
      .from('departamento')
      .select('id')
      .eq('id', id_departamento)
      .single();

    if (departamentoError || !departamento) {
      return res.status(400).json({ error: 'Departamento no encontrado' });
    }

    const { data, error } = await supabase
      .from('municipio')
      .insert({
        nombre,
        id_departamento
      })
      .select(`
        *,
        departamento:id_departamento (
          id,
          nombre,
          region:id_region (
            id,
            nombre
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error creando municipio:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un municipio con ese nombre' });
      }
      return res.status(500).json({ error: 'Error creando municipio' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error en POST /admin/municipios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/admin/municipios/:id', async (req, res) => {
  try {
    const { nombre, departamento_id } = req.body;

    const { data, error } = await supabase
      .from('municipio')
      .update({
        nombre,
        departamento_id
      })
      .eq('id', req.params.id)
      .select(`
        *,
        departamento:departamento_id (
          id,
          nombre,
          region:region_id (
            id,
            nombre
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error actualizando municipio:', error);
      return res.status(500).json({ error: 'Error actualizando municipio' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Municipio no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en PUT /admin/municipios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/municipios/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('municipio')
      .delete()
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error eliminando municipio:', error);
      return res.status(500).json({ error: 'Error eliminando municipio' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Municipio no encontrado' });
    }

    res.json({ message: 'Municipio eliminado exitosamente' });
  } catch (err) {
    console.error('Error en DELETE /admin/municipios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas para administración
app.get('/admin/estadisticas', async (req, res) => {
  try {
    // Contar herbario
    const { count: totalherbario, error: herbarioError } = await supabase
      .from('herbario')
      .select('*', { count: 'exact', head: true });

    // Contar usuarios
    const { count: totalUsuarios, error: usuarioError } = await supabase
      .from('info_usuario')
      .select('*', { count: 'exact', head: true });

    // Contar herbarios activos (todos considerados activos)
    const herbarioActivos = totalherbario;
    const activosError = null;

    // Contar regiones
    const { count: totalRegiones, error: regionError } = await supabase
      .from('region')
      .select('*', { count: 'exact', head: true });

    // Contar departamentos
    const { count: totalDepartamentos, error: departamentoError } = await supabase
      .from('departamento')
      .select('*', { count: 'exact', head: true });

    // Contar municipios
    const { count: totalMunicipios, error: municipioError } = await supabase
      .from('municipio')
      .select('*', { count: 'exact', head: true });

    // Usuarios por rol (todos los usuarios)
    const { data: usuariosPorRol, error: rolError } = await supabase
      .from('info_usuario')
      .select('rol');

    if (herbarioError || usuarioError || activosError || rolError || 
        regionError || departamentoError || municipioError) {
      console.error('Error obteniendo estadísticas:', { 
        herbarioError, usuarioError, activosError, rolError,
        regionError, departamentoError, municipioError 
      });
      return res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }

    const roles = {};
    usuariosPorRol?.forEach(user => {
      roles[user.rol] = (roles[user.rol] || 0) + 1;
    });

    res.json({
      totalherbario: totalherbario || 0,
      herbarioActivos: herbarioActivos || 0,
      totalUsuarios: totalUsuarios || 0,
      totalRegiones: totalRegiones || 0,
      totalDepartamentos: totalDepartamentos || 0,
      totalMunicipios: totalMunicipios || 0,
      usuariosPorRol: roles
    });
  } catch (err) {
    console.error('Error en GET /admin/estadisticas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 3002;

// Add error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Gest_Herb_service] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ===== RUTAS DE TAXONOMÍA JERÁRQUICA =====

// Obtener todas las familias con conteo de géneros
app.get('/api/taxonomia/familias', async (req, res) => {
  try {
    const { data: familias, error } = await supabase
      .from('familia')
      .select(`
        id,
        nombre,
        genero:genero(count)
      `)
      .order('nombre');

    if (error) throw error;

    // Procesar el conteo de géneros
    const familiasConConteo = familias.map(familia => ({
      id: familia.id,
      nombre: familia.nombre,
      generos_count: familia.genero[0]?.count || 0
    }));

    res.json(familiasConConteo);
  } catch (error) {
    console.error('Error obteniendo familias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener géneros de una familia específica con conteo de especies
app.get('/api/taxonomia/familias/:familiaId/generos', async (req, res) => {
  try {
    const { familiaId } = req.params;

    const { data: generos, error } = await supabase
      .from('genero')
      .select(`
        id,
        nombre,
        especie:especie(count)
      `)
      .eq('id_familia', familiaId)
      .order('nombre');

    if (error) throw error;

    // Procesar el conteo de especies
    const generosConConteo = generos.map(genero => ({
      id: genero.id,
      nombre: genero.nombre,
      especies_count: genero.especie[0]?.count || 0
    }));

    res.json(generosConConteo);
  } catch (error) {
    console.error('Error obteniendo géneros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener especies de un género específico
app.get('/api/taxonomia/generos/:generoId/especies', async (req, res) => {
  try {
    const { generoId } = req.params;

    const { data: especies, error } = await supabase
      .from('especie')
      .select('id, nombre, nombre_comun, tipo_amenaza')
      .eq('id_genero', generoId)
      .order('nombre');

    if (error) throw error;

    res.json(especies);
  } catch (error) {
    console.error('Error obteniendo especies:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener información completa de una especie (con familia y género)
app.get('/api/taxonomia/especies/:especieId/completa', async (req, res) => {
  try {
    const { especieId } = req.params;

    const { data, error } = await supabase
      .from('especie')
      .select(`
        id,
        nombre,
        nombre_comun,
        tipo_amenaza,
        genero:genero(
          id,
          nombre,
          familia:familia(
            id,
            nombre
          )
        )
      `)
      .eq('id', especieId)
      .single();

    if (error) throw error;

    // Restructurar para el frontend
    const especieCompleta = {
      species: {
        id: data.id,
        nombre: data.nombre,
        nombre_comun: data.nombre_comun,
        tipo_amenaza: data.tipo_amenaza
      },
      genus: {
        id: data.genero.id,
        nombre: data.genero.nombre
      },
      family: {
        id: data.genero.familia.id,
        nombre: data.genero.familia.nombre
      }
    };

    res.json(especieCompleta);
  } catch (error) {
    console.error('Error obteniendo especie completa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== TAXONOMÍA JERÁRQUICA =====
app.get('/api/taxonomia/familias', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('familia')
      .select(`
        id,
        nombre,
        generos:genero(count)
      `)
      .order('nombre');

    if (error) throw error;

    // Formatear los datos con el conteo de géneros
    const familiasConConteo = data.map(familia => ({
      id: familia.id,
      nombre: familia.nombre,
      generos_count: familia.generos[0]?.count || 0
    }));

    res.json(familiasConConteo);
  } catch (error) {
    console.error('Error obteniendo familias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/taxonomia/familias/:familiaId/generos', async (req, res) => {
  try {
    const { familiaId } = req.params;
    
    const { data, error } = await supabase
      .from('genero')
      .select(`
        id,
        nombre,
        especies:especie(count)
      `)
      .eq('id_familia', familiaId)
      .order('nombre');

    if (error) throw error;

    // Formatear los datos con el conteo de especies
    const generosConConteo = data.map(genero => ({
      id: genero.id,
      nombre: genero.nombre,
      especies_count: genero.especies[0]?.count || 0
    }));

    res.json(generosConConteo);
  } catch (error) {
    console.error('Error obteniendo géneros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/taxonomia/generos/:generoId/especies', async (req, res) => {
  try {
    const { generoId } = req.params;
    
    const { data, error } = await supabase
      .from('especie')
      .select('id, nombre, nombre_comun, tipo_amenaza')
      .eq('id_genero', generoId)
      .order('nombre');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo especies:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener información completa de una especie
app.get('/api/taxonomia/especies/:especieId/completa', async (req, res) => {
  try {
    const { especieId } = req.params;
    
    const { data, error } = await supabase
      .from('especie')
      .select(`
        id,
        nombre,
        nombre_comun,
        tipo_amenaza,
        genero:genero!inner(
          id,
          nombre,
          familia:familia!inner(
            id,
            nombre
          )
        )
      `)
      .eq('id', especieId)
      .single();

    if (error) throw error;

    // Formatear la respuesta con la jerarquía completa
    const especieCompleta = {
      especie: {
        id: data.id,
        nombre: data.nombre,
        nombre_comun: data.nombre_comun,
        tipo_amenaza: data.tipo_amenaza
      },
      genero: {
        id: data.genero.id,
        nombre: data.genero.nombre
      },
      familia: {
        id: data.genero.familia.id,
        nombre: data.genero.familia.nombre
      }
    };

    res.json(especieCompleta);
  } catch (error) {
    console.error('Error obteniendo especie completa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Gest_Herb_service] Uncaught Exception:', error);
  process.exit(1);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Gest_Herb_service] Servidor ejecutándose en puerto ${PORT}`);
  console.log(`[Gest_Herb_service] Accesible en http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('[Gest_Herb_service] Error del servidor:', error);
});

export default app;
