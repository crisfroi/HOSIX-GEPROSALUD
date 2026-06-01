// Simple digital signature utilities using Web Crypto API (ECDSA P-256)

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
  return keyPair;
}

export async function exportPublicKeyJwk(publicKey: CryptoKey) {
  const jwk = await crypto.subtle.exportKey('jwk', publicKey);
  return jwk as JsonWebKey;
}

export async function importPublicKeyJwk(jwk: JsonWebKey) {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

export async function signContent(privateKey: CryptoKey, content: string) {
  const enc = new TextEncoder();
  const data = enc.encode(content);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, privateKey, data);
  const sigBase64 = bufferToBase64(signature);
  const hash = await digestSHA256Hex(data);
  return { signature: sigBase64, hash };
}

export async function verifySignature(publicKey: CryptoKey, content: string, signatureBase64: string) {
  const enc = new TextEncoder();
  const data = enc.encode(content);
  const signature = base64ToArrayBuffer(signatureBase64);
  return await crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, publicKey, signature, data);
}

async function digestSHA256Hex(data: Uint8Array | ArrayBuffer) {
  const buf = data instanceof Uint8Array ? data.buffer : data;
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
