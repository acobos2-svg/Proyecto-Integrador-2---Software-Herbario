import { verifyAccessToken } from '../../../shared/crypto/jwt.js';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const { payload } = await verifyAccessToken(token);
    // Adjuntar claims al request para autorización posterior
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
