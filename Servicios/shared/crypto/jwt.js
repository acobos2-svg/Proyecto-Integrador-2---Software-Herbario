import { importSPKI, jwtVerify, createRemoteJWKSet } from 'jose';

let publicKey;
let algorithm = 'ES256';
let remoteJwks;

export async function initJwtFromEnv() {
  algorithm = process.env.JWT_ALG || 'ES256';
  const jwksUrl = process.env.AUTH_JWKS_URL;
  if (jwksUrl) {
    remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
    return;
  }
  const publicPem = process.env.JWT_PUBLIC_KEY_PEM;
  if (!publicPem) throw new Error('Configura AUTH_JWKS_URL o JWT_PUBLIC_KEY_PEM');
  publicKey = await importSPKI(publicPem, algorithm);
}

export async function verifyAccessToken(token, opts = {}) {
  if (!publicKey) {
    await initJwtFromEnv();
  }
  const { issuer = 'ideam', audience = 'ideam-services' } = opts;
  if (remoteJwks) {
    return jwtVerify(token, remoteJwks, { issuer, audience });
  }
  return jwtVerify(token, publicKey, { issuer, audience });
}
