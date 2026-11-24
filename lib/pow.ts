/**
 * Prueba de trabajo (estilo hashcash) contra el spam.
 *
 * El navegador debe encontrar un número `nonce` tal que
 *   SHA-256(challenge + "\n" + contenido + "\n" + nonce)
 * empiece por POW_BITS bits a cero. Encontrarlo cuesta de media 2^POW_BITS
 * intentos; comprobarlo en el servidor, uno solo. El contenido va dentro del
 * hash, así que una solución no sirve para otro mensaje, y cada challenge
 * solo se acepta una vez (ver used_challenges).
 *
 * Este archivo lo usan el servidor y el navegador: no debe importar nada.
 */

/** 17 bits ≈ 131.000 intentos de media: ~0,4 s en un portátil, 1-2 s en un móvil. */
export const POW_BITS = 17;

type PowFields = { action?: unknown; id?: unknown; title?: unknown; body?: unknown; reason?: unknown };

/** Texto que se firma con el trabajo. Servidor y navegador deben construirlo igual. */
export function powPayload(fields: PowFields) {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return [fields.action, fields.id, fields.title, fields.body, fields.reason].map(text).join("\n");
}

const encoder = new TextEncoder();

function leadingZeroBits(bytes: Uint8Array) {
  let bits = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    return bits + Math.clz32(byte) - 24;
  }
  return bits;
}

async function powHash(challenge: string, payload: string, nonce: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(challenge + "\n" + payload + "\n" + nonce)));
}

export async function validPow(challenge: unknown, payload: string, nonce: unknown, bits = POW_BITS) {
  if (typeof challenge !== "string" || typeof nonce !== "string" || !/^\d{1,12}$/.test(nonce)) return false;
  return leadingZeroBits(await powHash(challenge, payload, nonce)) >= bits;
}

/** Busca un nonce válido. Calcula en lotes para no bloquear la página. */
export async function solvePow(challenge: string, payload: string, bits = POW_BITS) {
  const batch = 256;
  for (let start = 0; ; start += batch) {
    const hashes = await Promise.all(
      Array.from({ length: batch }, (_, i) => powHash(challenge, payload, String(start + i))),
    );
    const found = hashes.findIndex((h) => leadingZeroBits(h) >= bits);
    if (found >= 0) return String(start + found);
    if (start % 16384 === 0) await new Promise((resolve) => setTimeout(resolve));
  }
}
