import crypto from 'crypto';

export function signMessage(message, base64Key) {
  return crypto.createHmac('sha256', Buffer.from(base64Key, 'base64'))
    .update(message, 'utf8')
    .digest('base64');
}

export function verifyMessage(message, base64Signature, base64Key) {
  const expected = signMessage(message, base64Key);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(base64Signature));
}
