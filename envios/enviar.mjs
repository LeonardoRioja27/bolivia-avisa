#!/usr/bin/env node
/**
 * Reenvía por correo los avisos pendientes a la entidad que eligió Claude.
 *
 *   node envios/enviar.mjs                    simulación: muestra los correos, no envía nada
 *   node envios/enviar.mjs --prueba tu@correo  envía todos a tu correo, sin marcarlos como enviados
 *   node envios/enviar.mjs --enviar           envía a las entidades y los marca como enviados
 *
 * Lee la configuración de envios/.env (copia envios/.env.example) y los
 * correos de envios/contactos.csv. Ninguno de los dos se sube a GitHub.
 * Si un envío falla, el aviso se reintenta en la siguiente ejecución (hasta 5 veces).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const dir = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(dir, ".env");
if (!fs.existsSync(envFile)) fail(`Falta ${envFile}. Copia envios/.env.example y rellénalo.`);
process.loadEnvFile(envFile);

const args = process.argv.slice(2);
const real = args.includes("--enviar");
const testTo = args.includes("--prueba") ? args[args.indexOf("--prueba") + 1] : null;
if (args.includes("--prueba") && !testTo?.includes("@")) fail("Uso: --prueba tu@correo");
if (real && testTo) fail("Usa --enviar o --prueba, no los dos.");
const mode = real ? "envío real" : testTo ? `prueba (todo a ${testTo})` : "simulación";

const cfg = {
  site: need("SITIO_URL").replace(/\/+$/, ""),
  secret: need("FORWARD_SECRET"),
  minAge: process.env.ESPERA_MINUTOS ?? "10",
};

function need(name) {
  const v = process.env[name]?.trim();
  if (!v) fail(`Falta ${name} en envios/.env`);
  return v;
}

function fail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

/** CSV con comillas dobles (RFC 4180), suficiente para contactos.csv. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...data] = rows.filter((r) => r.some((f) => f.trim()));
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const contacts = new Map(
  parseCsv(fs.readFileSync(path.join(dir, "contactos.csv"), "utf8")).map((c) => [c.id, c]),
);

async function api(method, body) {
  const res = await fetch(`${cfg.site}/api/forwarding${method === "GET" ? `?minAgeMinutes=${cfg.minAge}` : ""}`, {
    method,
    headers: { authorization: `Bearer ${cfg.secret}`, ...(body && { "content-type": "application/json" }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(`${method} /api/forwarding → ${res.status} ${data.error ?? ""}`);
  return data;
}

const date = (ms) =>
  new Date(ms).toLocaleString("es-BO", { timeZone: "America/La_Paz", dateStyle: "long", timeStyle: "short" });

function compose(r, contact) {
  const lines = [
    `Estimados señores de ${contact.nombre}:`,
    "",
    "Un ciudadano publicó la siguiente queja en Bolivia Avisa, una web comunitaria donde vecinos de Bolivia",
    "comparten problemas de su zona. Se la reenviamos porque corresponde a su institución.",
    "",
  ];
  // Sin resumen propio, el título es el comienzo de la descripción: no se repite.
  const derived = r.body && r.body.startsWith(r.title.replace(/…$/, ""));
  if (!derived) lines.push(`Resumen: ${r.title}`);
  if (r.body && r.body !== r.title) lines.push(...(derived ? [] : [""]), "Descripción:", r.body);
  lines.push(
    "",
    `Lugar: ${r.location || "no indicado"}`,
    `Fecha: ${date(r.created)}`,
    `Publicado por: ${r.author}`,
  );
  if (r.photoUrl) lines.push(`Foto: adjunta (también en ${r.photoUrl})`);
  lines.push(
    "",
    `Ver la queja y su seguimiento: ${r.reportUrl}`,
    "",
    "Si esta queja no es de su competencia, les agradecemos responder a este correo para no volver a enviarles casos similares.",
    "",
    "Atentamente,",
    "Bolivia Avisa",
  );
  return { subject: `Queja ciudadana: ${r.title}`, text: lines.join("\n") };
}

async function photo(r) {
  if (!r.photoUrl) return [];
  try {
    const res = await fetch(r.photoUrl);
    if (!res.ok) return [];
    return [{ filename: "foto.jpg", content: Buffer.from(await res.arrayBuffer()), contentType: "image/jpeg" }];
  } catch {
    return []; // la foto también va como enlace en el texto
  }
}

const { reports } = await api("GET");
console.log(`Modo: ${mode}. Avisos pendientes: ${reports.length}.`);
if (!reports.length) process.exit(0);

let transport = null;
if (real || testTo) {
  const port = Number(process.env.SMTP_PUERTO ?? 465);
  transport = nodemailer.createTransport({
    host: need("SMTP_SERVIDOR"),
    port,
    secure: port === 465,
    auth: { user: need("SMTP_USUARIO"), pass: need("SMTP_CONTRASENA") },
  });
  await transport.verify().catch((e) => fail(`No se pudo conectar al correo: ${e.message}`));
}
const from = process.env.REMITENTE?.trim() || process.env.SMTP_USUARIO;

let sent = 0, failed = 0, skipped = 0;
for (const r of reports) {
  const contact = contacts.get(r.entity);
  if (!contact?.correo) {
    console.warn(`⚠ ${r.id}: la entidad «${r.entity}» no tiene correo en contactos.csv. Se omite.`);
    skipped++;
    continue;
  }
  const { subject, text } = compose(r, contact);
  const to = testTo ?? contact.correo;
  if (!transport) {
    console.log(`\n──── Para: ${contact.correo} (${contact.id})\nAsunto: ${subject}\n\n${text}`);
    continue;
  }
  try {
    await transport.sendMail({ from, to, replyTo: from, subject, text, attachments: await photo(r) });
    console.log(`✓ ${r.id} → ${to}${testTo ? ` (en vez de ${contact.correo})` : ""}`);
    if (real) await api("POST", { id: r.id, ok: true });
    sent++;
  } catch (e) {
    console.error(`✗ ${r.id} → ${to}: ${e.message}`);
    if (real) await api("POST", { id: r.id, ok: false, error: e.message }).catch(() => {});
    failed++;
  }
  await new Promise((done) => setTimeout(done, 2000)); // sin saturar el servidor de correo
}
console.log(`\nEnviados: ${sent}. Fallidos: ${failed}. Sin correo: ${skipped}.`);
if (!transport) console.log("Simulación: no se envió nada. Usa --prueba tu@correo o --enviar.");
