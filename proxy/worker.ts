/**
 * Proxy de Cloudflare: sirve Bolivia Avisa desde tu dominio y reenvía cada
 * petición a la web de ChatGPT Sites, donde están la base de datos y las fotos.
 *
 * Para el navegador todo viene de tu dominio, así que la cookie «bolivia_owner»
 * (Mis avisos) funciona sin cookies de terceros. Ver proxy/README.md.
 */
import { CLIENT_IP_HEADER, PROXY_SECRET_HEADER } from "../lib/proxy";

interface Env {
  /** Dirección de la web en ChatGPT Sites, p. ej. https://algo.sites.example */
  SITES_ORIGIN: string;
  /** Secreto compartido con la web de Sites (variable PROXY_SECRET en ambos lados). */
  PROXY_SECRET: string;
}

/** Solo se reenvían las cookies de la app, no las demás de tu dominio. */
const APP_COOKIES = ["bolivia_owner"];
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.SITES_ORIGIN || !env.PROXY_SECRET || env.PROXY_SECRET.length < 32) {
      return new Response("Proxy sin configurar: faltan SITES_ORIGIN o PROXY_SECRET.", { status: 500 });
    }
    const url = new URL(request.url);
    const sites = new URL(env.SITES_ORIGIN);
    const target = new URL(url.pathname + url.search, sites);
    const headers = new Headers(request.headers);
    const unsafe = !SAFE_METHODS.includes(request.method);

    if (unsafe) {
      // Misma protección que hace la API: solo se aceptan envíos desde esta web.
      // Comprobado aquí, se reescribe el Origin para que la API lo acepte.
      if (request.headers.get("origin") !== url.origin) {
        return Response.json({ error: "Origen no permitido" }, { status: 403 });
      }
      headers.set("origin", sites.origin);
    }

    const cookies = (request.headers.get("cookie") || "")
      .split(";")
      .map((c) => c.trim())
      .filter((c) => APP_COOKIES.includes(c.split("=")[0]));
    if (cookies.length) headers.set("cookie", cookies.join("; "));
    else headers.delete("cookie");

    // IP real del visitante para el límite de participación (ver lib/proxy.ts).
    headers.set(CLIENT_IP_HEADER, request.headers.get("cf-connecting-ip") || "");
    headers.set(PROXY_SECRET_HEADER, env.PROXY_SECRET);
    headers.delete("host");

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: unsafe ? request.body : undefined,
      redirect: "manual",
    });
    return new Response(upstream.body, upstream);
  },
};
