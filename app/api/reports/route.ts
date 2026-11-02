import { getDb } from "@/db";
import { reports, comments, flags } from "@/db/schema";
import { desc, eq, and, inArray } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
const statuses=["Pendiente","En seguimiento","Resuelto"],categories=["Transporte","Servicios","Calles y espacios","Otros"];
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store"}});
async function identity(){const user=await getChatGPTUser();const moderator=!!user && !!(env as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL && user.email.toLowerCase()===(env as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL?.toLowerCase();return {user,moderator};}
export async function GET(){try{const db=getDb();const {user,moderator}=await identity();const rows=await db.select().from(reports).where(eq(reports.hidden,0)).orderBy(desc(reports.created)).limit(200);const ids=rows.map(r=>r.id);const replies=ids.length?await db.select().from(comments).where(and(eq(comments.hidden,0),inArray(comments.reportId,ids))).orderBy(comments.created).limit(2000):[];return json({signedIn:!!user,moderator,reports:rows.map(({ownerId,hidden,...r})=>({...r,canManage:moderator||!!user&&ownerId===user.userId})),comments:replies.map(({ownerId,hidden,...c})=>c),flags:moderator?await db.select({id:flags.id,targetId:flags.targetId,kind:flags.kind,reason:flags.reason,created:flags.created}).from(flags).orderBy(desc(flags.created)).limit(100):[]});}catch{return json({error:"No se pudieron cargar los avisos. Inténtalo de nuevo."},503)}}
export async function POST(req:Request){try{
if(req.headers.get("origin")!==new URL(req.url).origin)return json({error:"Origen no permitido"},403);
const {user,moderator}=await identity();if(!user)return json({error:"Inicia sesión para participar."},401);
const raw=await req.text();if(raw.length>12000)return json({error:"Texto demasiado largo"},413);
let x:Record<string,unknown>;try{x=JSON.parse(raw);if(!x||typeof x!=="object"||Array.isArray(x))throw Error();}catch{return json({error:"Solicitud no válida"},400)}
const str=(v:unknown,max:number)=>typeof v==="string"&&v.trim().length<=max?v.trim():"";
const action=str(x.action,20),id=str(x.id,50),author=str(x.author,50),body=str(x.body,2500),db=getDb();
if(!["create","comment","status","flag","hide"].includes(action))return json({error:"Acción no válida"},400);
if(action==="hide"&&!moderator)return json({error:"Solo moderación puede retirar contenido."},403);
const now=Date.now();const limited=await env.DB!.prepare('INSERT INTO write_limits(user_id,window,count) VALUES (?, ?, 1) ON CONFLICT(user_id) DO UPDATE SET count=CASE WHEN window < ? THEN 1 ELSE count+1 END, window=CASE WHEN window < ? THEN excluded.window ELSE window END WHERE window < ? OR count < 10 RETURNING count').bind(user.userId,now,now-600000,now-600000,now-600000).first();
if(!limited)return json({error:"Has alcanzado 10 acciones en 10 minutos. Espera un poco."},429);
if(action==="hide"){const table=x.kind==="comment"?comments:reports;await db.update(table).set({hidden:1}).where(eq(table.id,id));return json({ok:true})}
if(action==="flag"){const reason=str(x.reason,500),kind=x.kind==="comment"?"comment":"report";if(!id||!reason)return json({error:"Explica el motivo de la denuncia."},400);const table=kind==="comment"?comments:reports;if(!await db.select().from(table).where(and(eq(table.id,id),eq(table.hidden,0))).get())return json({error:"Contenido no disponible"},404);await db.insert(flags).values({id:crypto.randomUUID(),targetId:id,kind,reason,userId:user.userId,created:now});return json({ok:true})}
if(x.accepted!=="yes")return json({error:"Acepta las normas y el aviso de privacidad."},400);
if(!author||!body)return json({error:"Añade un alias y un texto válido."},400);
if(action==="create"){const title=str(x.title,120),location=str(x.location,100),category=str(x.category,30);if(!title||!location||!categories.includes(category))return json({error:"Completa todos los campos."},400);await db.insert(reports).values({id:crypto.randomUUID(),title,body,location,author,category,status:"Pendiente",ownerId:user.userId,created:now});}
else{const report=await db.select().from(reports).where(and(eq(reports.id,id),eq(reports.hidden,0))).get();if(!report)return json({error:"Este aviso no está disponible."},404);
if(action==="status"){if(!moderator&&report.ownerId!==user.userId)return json({error:"Solo quien publicó el aviso o moderación puede cambiar el estado."},403);const status=str(x.status,30);if(!statuses.includes(status))return json({error:"Estado no válido"},400);await db.batch([db.update(reports).set({status}).where(eq(reports.id,id)),db.insert(comments).values({id:crypto.randomUUID(),reportId:id,author,ownerId:user.userId,body:"Estado actualizado a «"+status+"». "+body,created:now})]);}
else await db.insert(comments).values({id:crypto.randomUUID(),reportId:id,author,body,ownerId:user.userId,created:now});}
return json({ok:true});}catch{return json({error:"No se pudo guardar. Inténtalo de nuevo."},500)}}