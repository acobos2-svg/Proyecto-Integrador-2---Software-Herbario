import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/auth.js';
import { initJwtFromEnv } from '../../shared/crypto/jwt.js';
import proxy from 'express-http-proxy';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting básico
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Healthcheck público
app.get('/health', (req, res) => res.json({ ok: true }));

// Ejemplo de proxy/ruta protegida (placeholder)
app.get('/secure/ping', requireAuth, (req, res) => {
  res.json({ ok: true, service: 'api-gateway' });
});

// Utilidad simple para autorización por roles
function requireRole(role) {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      if (userRole !== role) {
        return res.status(403).json({ error: `Role required: ${role}. Current role: ${userRole}` });
      }
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Role validation failed' });
    }
  };
}

// URLs de microservicios
const LAB_URL = process.env.LAB_SERVICE_URL || 'http://localhost:3005';
const RECEPCION_URL = process.env.RECEPCION_SERVICE_URL || 'http://localhost:3004';
const GESTION_HERBARIO_URL = process.env.GESTION_HERBARIO_URL || 'http://localhost:3002';
const TAB_CONTROL_URL = process.env.TAB_CONTROL_SERVICE_URL || 'http://localhost:3003';

// ===== RUTAS DE LABORATORIO (solo laboratoristas) =====
app.use('/laboratorio/muestras', requireAuth, requireRole('laboratorista'), proxy(LAB_URL, {
  proxyReqPathResolver: (req) => `/muestras${req.url}`
}));

app.use('/laboratorio/clasificaciones', requireAuth, requireRole('laboratorista'), proxy(LAB_URL, {
  proxyReqPathResolver: (req) => `/clasificaciones${req.url}`
}));

app.use('/laboratorio/asistente', requireAuth, requireRole('laboratorista'), proxy(LAB_URL, {
  proxyReqPathResolver: (req) => `/asistente${req.url}`
}));

app.use('/laboratorio/estadisticas', requireAuth, requireRole('laboratorista'), proxy(LAB_URL, {
  proxyReqPathResolver: (req) => `/estadisticas${req.url}`
}));

// ===== RUTAS DE RECEPCIÓN (solo recepcionistas) =====
app.use('/recepcion/paquetes', requireAuth, requireRole('recepcionista'), proxy(RECEPCION_URL, {
  proxyReqPathResolver: (req) => `/paquetes${req.url}`
}));

app.use('/recepcion/conglomerados', requireAuth, requireRole('recepcionista'), proxy(RECEPCION_URL, {
  proxyReqPathResolver: (req) => `/conglomerados${req.url}`
}));

// ===== RUTAS DE GESTIÓN HERBARIO (acceso directo limitado - principalmente para servicios internos) =====
// Solo operaciones de consulta para usuarios finales
app.use('/herbario/taxonomia', requireAuth, proxy(GESTION_HERBARIO_URL, {
  proxyReqPathResolver: (req) => `/taxonomia${req.url}`,
  filter: (req) => req.method === 'GET' // Solo lectura
}));

app.use('/herbario/herbarios', requireAuth, proxy(GESTION_HERBARIO_URL, {
  proxyReqPathResolver: (req) => `/herbarios${req.url}`,
  filter: (req) => req.method === 'GET' // Solo lectura
}));

app.use('/herbario/ubicaciones', requireAuth, proxy(GESTION_HERBARIO_URL, {
  proxyReqPathResolver: (req) => `/ubicaciones${req.url}`,
  filter: (req) => req.method === 'GET' // Solo lectura
}));

// ===== RUTAS DE TABLERO DE CONTROL (acceso según rol) =====
// Dashboard principal - ambos roles pueden ver
app.use('/control/dashboard', requireAuth, proxy(TAB_CONTROL_URL, {
  proxyReqPathResolver: (req) => `/dashboard${req.url}`
}));

// Reportes avanzados - solo laboratoristas (pueden analizar productividad)
app.use('/control/reportes', requireAuth, requireRole('laboratorista'), proxy(TAB_CONTROL_URL, {
  proxyReqPathResolver: (req) => `/reportes${req.url}`
}));

// Alertas - ambos roles pueden ver
app.use('/control/alertas', requireAuth, proxy(TAB_CONTROL_URL, {
  proxyReqPathResolver: (req) => `/alertas${req.url}`
}));

// Análisis geográfico - ambos roles pueden ver  
app.use('/control/analisis-geografico', requireAuth, proxy(TAB_CONTROL_URL, {
  proxyReqPathResolver: (req) => `/analisis-geografico${req.url}`
}));

// ===== RUTAS DE CONSULTA PÚBLICA (sin autenticación) =====
// Estadísticas generales para público
app.use('/publico/estadisticas', proxy(GESTION_HERBARIO_URL, {
  proxyReqPathResolver: (req) => `/estadisticas/resumen${req.url}`,
  filter: (req) => req.method === 'GET'
}));

// Búsqueda taxonómica pública
app.use('/publico/taxonomia', proxy(GESTION_HERBARIO_URL, {
  proxyReqPathResolver: (req) => `/taxonomia/buscar${req.url}`,
  filter: (req) => req.method === 'GET'
}));

// ===== RUTAS DE SALUD DE SERVICIOS =====
app.get('/health/all', async (req, res) => {
  try {
    const servicios = [
      { nombre: 'Lab_Service', url: LAB_URL },
      { nombre: 'Recepcion_Service', url: RECEPCION_URL },
      { nombre: 'Gestion_Herbario', url: GESTION_HERBARIO_URL },
      { nombre: 'Tab_Control_Service', url: TAB_CONTROL_URL }
    ];

    const estadoServicios = await Promise.allSettled(
      servicios.map(async servicio => {
        try {
          const response = await fetch(`${servicio.url}/health`);
          const data = await response.json();
          return {
            servicio: servicio.nombre,
            estado: response.ok ? 'activo' : 'error',
            url: servicio.url,
            respuesta: data
          };
        } catch (error) {
          return {
            servicio: servicio.nombre,
            estado: 'inactivo',
            url: servicio.url,
            error: error.message
          };
        }
      })
    );

    const resultados = estadoServicios.map(result => 
      result.status === 'fulfilled' ? result.value : {
        servicio: 'error',
        estado: 'error',
        error: result.reason
      }
    );

    const todosActivos = resultados.every(r => r.estado === 'activo');

    res.status(todosActivos ? 200 : 503).json({
      estado_general: todosActivos ? 'saludable' : 'degradado',
      servicios: resultados,
      fecha_verificacion: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error verificando estado de servicios',
      detalles: error.message 
    });
  }
});

const port = process.env.PORT || 3000;

// Inicializar JWT antes de empezar el servidor
async function startServer() {
  try {
    await initJwtFromEnv();
    console.log('[Api_Gateway] JWT initialized');
    app.listen(port, () => {
      console.log(`[Api_Gateway] listening on port ${port}`);
    });
  } catch (error) {
    console.error('[Api_Gateway] Error initializing JWT:', error);
    process.exit(1);
  }
}

startServer();
