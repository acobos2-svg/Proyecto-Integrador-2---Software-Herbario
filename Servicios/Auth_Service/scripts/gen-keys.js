import { generateKeyPair } from 'jose';

const { privateKey, publicKey } = await generateKeyPair(process.env.JWT_ALG || 'ES256');

console.log('-----BEGIN PRIVATE KEY-----');
console.log(Buffer.from(await privateKey.export({ type: 'pkcs8', format: 'der' })).toString('base64'));
console.log('-----END PRIVATE KEY-----');
console.log();
console.log('-----BEGIN PUBLIC KEY-----');
console.log(Buffer.from(await publicKey.export({ type: 'spki', format: 'der' })).toString('base64'));
console.log('-----END PUBLIC KEY-----');
