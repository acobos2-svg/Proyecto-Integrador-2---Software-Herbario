import { importPKCS8, exportJWK, calculateJwkThumbprint, importSPKI } from 'jose';

let privateKey;
let publicKey;
let jwk;
let kid;

export async function initKeys() {
  if (jwk && kid && privateKey && publicKey) return { alg: process.env.JWT_ALG || 'ES256', kid, jwk, privateKey, publicKey };

  const alg = process.env.JWT_ALG || 'ES256';
  const privPem = process.env.JWT_PRIVATE_KEY_PEM;
  const pubPem = process.env.JWT_PUBLIC_KEY_PEM; // opcional si quieres fijarla

  if (!privPem) throw new Error('JWT_PRIVATE_KEY_PEM no configurada');

  privateKey = await importPKCS8(privPem, alg);
  if (pubPem) {
    publicKey = await importSPKI(pubPem, alg);
  } else {
    // Derivar JWK pública a partir de la privada exportándola
    const pubJwk = await exportJWK(privateKey);
    delete pubJwk.d; // eliminar parte privada si aparece
    jwk = pubJwk;
    kid = await calculateJwkThumbprint(pubJwk, 'sha256');
    return { alg, kid, jwk: pubJwk, privateKey };
  }

  // Si tienes publicPem, exporta JWK pública desde ella
  const pubJwk = await exportJWK(publicKey);
  jwk = pubJwk;
  kid = await calculateJwkThumbprint(pubJwk, 'sha256');
  return { alg, kid, jwk: pubJwk, privateKey, publicKey };
}

export function getKid() {
  if (!kid) throw new Error('Keys not initialized');
  return kid;
}

export function getAlg() {
  return process.env.JWT_ALG || 'ES256';
}
