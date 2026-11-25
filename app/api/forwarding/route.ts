/**
 * API privada para el script de reenvío por correo (envios/enviar.mjs).
 *
 * GET  → avisos pendientes de enviar a su entidad.
 * POST → el script informa el resultado de un envío: { id, ok, error? }.
 *
 * Requiere la cabecera «Authorization: Bearer <FORWARD_SECRET>». Sin ese
 * secreto configurado (mínimo 32 caracteres), la API está desactivada.
 */
import { env } from "cloudflare:workers";
import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { sameSecret } from "@/lib/proxy";

export const dynamic = "force-dynamic";

/** Tras estos intentos fallidos, el aviso deja de reintentarse. */
const MAX_ATTEMPTS = 5;
/** Espera por defecto antes de enviar, para que el autor pueda retirar el aviso. */
const DEFAULT_MIN_AGE_MINUTES = 10;

const json = (v: unknown, status = 200) => Response.json(v, { status, headers: { "Cache-Control": "no-store" } });

async function authorized(req: Request) {
  const secret = (env as { FORWARD_SECRET?: string }).FORWARD_SECRET;
  if (!secret || secret.length < 32) return false;
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") && sameSecret(header.slice(7), secret);
}

export async function GET(req: Request) {
  if (!(await authorized(req))) return json({ error: "No autorizado" }, 401);
  const url = new URL(req.url);
  const minutes = Number(url.searchParams.get("minAgeMinutes") ?? DEFAULT_MIN_AGE_MINUTES);
  const minAge = Number.isFinite(minutes) && minutes >= 0 ? minutes * 60_000 : DEFAULT_MIN_AGE_MINUTES * 60_000;
  const rows = await getDb()
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.hidden, 0),
        inArray(reports.forwardStatus, ["pendiente", "fallido"]),
        lt(reports.forwardAttempts, MAX_ATTEMPTS),
        lt(reports.created, Date.now() - minAge),
      ),
    )
    .orderBy(reports.created)
    .limit(50);
  return json({
    reports: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      location: r.location,
      category: r.category,
      author: r.author,
      created: r.created,
      entity: r.entity,
      attempts: r.forwardAttempts,
      photoUrl: r.imageKey ? `${url.origin}/api/photos/${r.id}` : null,
      reportUrl: `${url.origin}/?aviso=${encodeURIComponent(r.id)}`,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await authorized(req))) return json({ error: "No autorizado" }, 401);
  let x: { id?: unknown; ok?: unknown; error?: unknown };
  try {
    x = await req.json();
  } catch {
    return json({ error: "Solicitud no válida" }, 400);
  }
  if (typeof x.id !== "string" || typeof x.ok !== "boolean") return json({ error: "Faltan id u ok" }, 400);
  const db = getDb();
  const report = await db.select().from(reports).where(eq(reports.id, x.id)).get();
  if (!report || !["pendiente", "fallido"].includes(report.forwardStatus)) {
    return json({ error: "Este aviso no está pendiente de envío" }, 409);
  }
  await db
    .update(reports)
    .set(
      x.ok
        ? { forwardStatus: "enviado", forwardedAt: Date.now(), forwardError: null }
        : {
            forwardStatus: "fallido",
            forwardAttempts: report.forwardAttempts + 1,
            forwardError: String(x.error ?? "Error desconocido").slice(0, 500),
          },
    )
    .where(eq(reports.id, x.id));
  return json({ ok: true });
}
