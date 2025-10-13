import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { hashPassword, verifyPassword } from '../../shared/crypto/password.js';
import { SignJWT } from 'jose';
import { initKeys, getKid, getAlg } from './keys.js';
import { supabase } from './supabase.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Registro
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, nombres, apellidos, rol = 'consulta', herbario_id } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });
    if (!nombres || !apellidos) return res.status(400).json({ error: 'nombres y apellidos requeridos' });

    // Registrar en auth.users
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'Usuario ya existe' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Por ahora saltamos el perfil extendido y usamos rol básico
    console.log(`Usuario registrado: ${email} con rol: ${rol}`);

    if (profileError) {
      console.error('Error creando perfil:', profileError);
      // Opcional: eliminar el usuario de auth si falla el perfil
    }

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('Error en registro:', e);
    res.status(500).json({ error: 'error registrando usuario' });
  }
});

// Login -> emite JWT
await initKeys();

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

    // Autenticar con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'credenciales inválidas' });

    // Por ahora usamos rol hardcodeado basado en email para pruebas
    let userRole = 'consulta';
    if (email.includes('recepcionista') || email.includes('maria.rodriguez')) {
      userRole = 'recepcionista';
    } else if (email.includes('laboratorista') || email.includes('carlos.vargas')) {
      userRole = 'laboratorista';
    }

    const { alg } = await initKeys();
    const pk = (await initKeys()).privateKey;
    const claims = {
      sub: data.user.id,
      email: data.user.email,
      role: userRole,
      herbario_id: null
    };

    const token = await new SignJWT(claims)
      .setProtectedHeader({ alg, kid: getKid() })
      .setIssuer('ideam')
      .setAudience('ideam-services')
      .setExpirationTime('15m')
      .sign(pk);

    res.json({ 
      access_token: token, 
      token_type: 'Bearer', 
      expires_in: 900,
      user: {
        id: data.user.id,
        email: data.user.email,
        nombre: `Usuario ${userRole}`,
        rol: userRole
      }
    });
  } catch (e) {
    console.error('Error en login:', e);
    res.status(500).json({ error: 'error autenticando' });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// JWKS endpoint
app.get('/.well-known/jwks.json', async (req, res) => {
  try {
    const { jwk } = await initKeys();
    res.json({ keys: [{ kid: getKid(), alg: getAlg(), use: 'sig', kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, n: jwk.n, e: jwk.e }] });
  } catch (e) {
    res.status(500).json({ error: 'jwks error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[Auth_Service] listening on port ${port}`);
});
