# Api_Gateway — Puerta de entrada y autenticación

Gateway HTTP para orquestar y proteger el acceso a los microservicios de IDEAM.

## Resumen
- Express + Helmet + Rate Limiting.
- Middleware `requireAuth` para validar JWT (soporta JWKS remoto o PEM local).
- Healthcheck en `/health` y ejemplo de ruta protegida `/secure/ping`.

---

## Estructura
```
Api_Gateway/
├── src/
│   ├── app.js                  # App Express con rutas básicas y ejemplo protegido
│   └── middleware/
│       └── auth.js             # requireAuth: valida Bearer JWT
├── .env.example                # Variables de entorno
├── package.json                # Dependencias y scripts (ESM habilitado)
└── README.md                   # Este documento
```

---

## Variables de entorno
Copia `.env.example` a `.env` y completa UNA de las dos opciones de verificación:

```
PORT=3000
JWT_ALG=ES256

# Opción A: JWKS remoto (recomendada)
AUTH_JWKS_URL=http://localhost:3001/.well-known/jwks.json

# Opción B: PEM local (si no usas JWKS)
# JWT_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
```

Notas:
- El algoritmo debe coincidir con el usado en Auth_Service (`ES256` o `RS256`).
- Con JWKS, el gateway obtiene automáticamente la clave pública y respeta `kid`.

---

## Middleware de autenticación
`src/middleware/auth.js` verifica el header `Authorization: Bearer <token>` y valida el JWT usando:
- `Servicios/shared/crypto/jwt.js` que soporta JWKS remoto (`AUTH_JWKS_URL`) o PEM (`JWT_PUBLIC_KEY_PEM`).
- Validaciones estándar: `issuer=ideam`, `audience=ideam-services`.

Uso en rutas (ejemplo):
```js
import { requireAuth } from './middleware/auth.js';

app.get('/secure/ping', requireAuth, (req, res) => {
  res.json({ ok: true, service: 'api-gateway' });
});
```

---

## Ejecutar
```powershell
cd "C:\Users\joan-\Downloads\IDEAM\Proyecto\Servicios\Api_Gateway"
npm install
npm run start
```

Healthcheck:
```powershell
Invoke-RestMethod -Uri http://localhost:3000/health
```

Ruta protegida (requiere token válido del Auth_Service):
```powershell
Invoke-RestMethod -Headers @{Authorization="Bearer $token"} -Uri http://localhost:3000/secure/ping
```

---

## Integración con Auth_Service
- Auth_Service expone JWKS en `/.well-known/jwks.json`.
- El JWT emitido incluye `kid` y se firma con `alg` definido en env.
- Configura `AUTH_JWKS_URL` para auto-descubrir la clave pública y facilitar rotación.

---

## Seguridad y mejores prácticas
- Aplica `requireAuth` en todas las rutas que enrutan a microservicios.
- Considera autorización por roles/claims en el gateway o en cada servicio.
- Expiración corta de tokens (15m) y refresh tokens gestionados en Auth_Service.
- HTTPS/mTLS en entornos de producción.

---

## Próximos pasos
- Añadir tests de integración para `/secure/ping` con token real.
- Añadir autorización basada en roles/claims.
- Configurar proxies hacia servicios internos (LAB, GH, REC, etc.).

---

## Proteger rutas que enrutan a microservicios

Ejemplo de cómo proteger y rutear a servicios internos (se asume librería de proxy como `http-proxy-middleware` o `express-http-proxy`). Aquí se muestra la idea lógica:

```js
import { requireAuth } from './middleware/auth.js';
import proxy from 'express-http-proxy';

// Variables de entorno con URLs internas
const LAB_URL = process.env.LAB_SERVICE_URL || 'http://localhost:3002';
const GH_URL = process.env.GH_SERVICE_URL || 'http://localhost:3003';
const REC_URL = process.env.REC_SERVICE_URL || 'http://localhost:3004';

// Proteger por autenticación
app.use('/lab', requireAuth, proxy(LAB_URL));
app.use('/herbario', requireAuth, proxy(GH_URL));
app.use('/recepcion', requireAuth, proxy(REC_URL));

// Si deseas autorización por rol
function requireRole(role) {
  return (req, res, next) => {
    try {
      // En una versión más completa, `requireAuth` adjuntaría claims al req
      const auth = req.headers['authorization'] || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      // Decodifica/verifica y revisa claims (pseudo-código)
      // const { payload } = await verifyAccessToken(token);
      // if (!payload.roles?.includes(role)) return res.status(403).json({ error: 'forbidden' });
      next();
    } catch {
      return res.status(403).json({ error: 'forbidden' });
    }
  };
}

// Ejemplo: solo roles 'admin' para ciertas rutas
// app.use('/herbario/admin', requireAuth, requireRole('admin'), proxy(GH_URL));
```

Variables recomendadas en `.env`:

```
LAB_SERVICE_URL=http://localhost:3002
GH_SERVICE_URL=http://localhost:3003
REC_SERVICE_URL=http://localhost:3004
```

Notas:
- El ejemplo requiere instalar un middleware de proxy (p.ej. `npm i express-http-proxy`).
- Para autorización por roles/claims de forma limpia, ajusta `requireAuth` para adjuntar `req.user` con el payload del JWT ya verificado.
