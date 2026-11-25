/**
 * Soporte para servir la API a través del proxy de Cloudflare (proxy/worker.ts).
 *
 * Detrás del proxy, todas las peticiones llegan desde las IP de Cloudflare, así
 * que el límite por IP las contaría como una sola persona. El proxy envía la IP
 * real del visitante en CLIENT_IP_HEADER junto con un secreto compartido; solo
 * se cree esa IP si el secreto coincide con PROXY_SECRET.
 */
export const CLIENT_IP_HEADER = "x-avisa-client-ip";
export const PROXY_SECRET_HEADER = "x-avisa-proxy-secret";

const encoder = new TextEncoder();

/** Compara en tiempo constante (vía hash) para no filtrar el secreto por tiempos. */
async function sameSecret(given: string, expected: string) {
  const [a, b] = await Promise.all(
    [given, expected].map(async (v) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(v)))),
  );
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** IP del visitante para el límite de participación. */
export async function clientNetwork(req: Request, proxySecret: string | undefined) {
  const claimed = req.headers.get(CLIENT_IP_HEADER);
  const given = req.headers.get(PROXY_SECRET_HEADER);
  if (proxySecret && proxySecret.length >= 32 && claimed && given && (await sameSecret(given, proxySecret))) {
    return claimed.slice(0, 64);
  }
  return req.headers.get("cf-connecting-ip") || "shared";
}
