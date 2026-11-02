import { getDb } from "@/db";
import { reports, comments, flags } from "@/db/schema";
import { desc, eq, and, inArray } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {challenge,validChallenge,guestOwner,signed,RATE_SQL} from "@/lib/public-guard";
export const dynamic="force-dynamic";
const statuses=["Pendiente","En seguimiento","Resuelto"],categories=["Transporte","Servicios","Calles y espacios","Otros"];
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store"}});
async function identity(){const user=await getChatGPTUser();const moderator=!!user && !!(env as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL && user.email.toLowerCase()===(env as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL?.toLowerCase();return {user,moderator};}
export async function GET(){try{const db=getDb();const {user,moderator}=await identity();const rows=await db.select().from(reports).where(eq(reports.hidden,0)).orderBy(desc(reports.created)).limit(200);const ids=rows.map(r=>r.id);const replies=ids.length?await db.select().from(comments).where(and(eq(comments.hidden,0),inArray(comments.reportId,ids))).orderBy(comments.created).limit(2000):[];const guard=(env as {PUBLIC_GUARD_SECRET?:string}).PUBLIC_GUARD_SECRET;return json({signedIn:!!guard,moderator,challenge:guard?await challenge(guard):null,reports:rows.map(({ownerId,hidden,...r})=>({...r,canManage:moderator||!!user&&ownerId===user.userId})),comments:replies.map(({ownerId,hidden,...c})=>c),flags:moderator?await db.select({id:flags.id,targetId:flags.targetId,kind:flags.kind,reason:flags.reason,created:flags.created}).from(flags).orderBy(desc(flags.created)).limit(100):[]});}catch{return json({error:"No se pudieron cargar los avisos. Inténtalo de nuevo."},503)}}
export async function POST(req:Request){try{
if(req.headers.get("origin")!==new URL(req.url).origin)return json({error:"Origen no permitido"},403);
const {user,moderator}=await identity();
const raw=await req.text();if(raw.length>12000)return json({error:"Texto demasiado largo"},413);
let x:Record<string,unknown>;try{x=JSON.parse(raw);if(!x||typeof x!=="object"||Array.isArray(x))throw Error();}catch{return json({error:"Solicitud no válida"},400)}
const str=(v:unknown,max:number)=>typeof v==="string"&&v.trim().length<=max?v.trim():"";
const action=str(x.action,20),id=str(x.id,50),author=str(x.author,50),body=str(x.body,2500),db=getDb();
if(!["create","comment","status","flag","hide"].includes(action))return json({error:"Acción no válida"},400);
const secret=(env as {PUBLIC_GUARD_SECRET?:string}).PUBLIC_GUARD_SECRET;
if(!secret)return json({error:"La participación está temporalmente desactivada."},503);
if(x.website || !await validChallenge(x.challenge,secret))return json({error:"Espera dos segundos e inténtalo de nuevo. Si persiste, recarga la página."},400);
const guest=await guestOwner(x.ownerToken),ownerId=guest??user?.userId;
if(["create","comment"].includes(action)&&!ownerId)return json({error:"No se ha podido preparar la clave de tu publicación. Recarga la página."},400);
const network=req.headers.get("cf-connecting-ip")||"shared";
const limiterId="network:"+await signed(new Date().toISOString().slice(0,10)+":"+network,secret);
const now=Date.now();
for(const [bucket,max] of [[limiterId,10],["global-public",100]] as const){const limited=await env.DB!.prepare(RATE_SQL).bind(bucket,now,now-600000,now-600000,now-600000,max).first();if(!limited)return json({error:"Se ha alcanzado el límite temporal de participación. Espera unos minutos."},429);}
await env.DB!.prepare('DELETE FROM write_limits WHERE window < ?').bind(now-86400000).run();
if(action==="hide"){const table=x.kind==="comment"?comments:reports;const target=await db.select().from(table).where(eq(table.id,id)).get();if(!target)return json({error:"Contenido no disponible"},404);if(!moderator&&target.ownerId!==user?.userId&&(!guest||target.ownerId!==guest))return json({error:"No tienes permiso para retirar este contenido."},403);await db.update(table).set({hidden:1}).where(eq(table.id,id));return json({ok:true})}
if(action==="flag"){const reason=str(x.reason,500),kind=x.kind==="comment"?"comment":"report";if(!id||!reason)return json({error:"Explica el motivo de la denuncia."},400);const table=kind==="comment"?comments:reports;if(!await db.select().from(table).where(and(eq(table.id,id),eq(table.hidden,0))).get())return json({error:"Contenido no disponible"},404);await db.insert(flags).values({id:crypto.randomUUID(),targetId:id,kind,reason,userId:user?.userId??limiterId,created:now});return json({ok:true})}
if(x.accepted!=="yes")return json({error:"Acepta las normas y el aviso de privacidad."},400);
if(!author||!body)return json({error:"Añade un alias y un texto válido."},400);
if(action==="create"){const title=str(x.title,120),location=str(x.location,100),category=str(x.category,30);if(!title||!location||!categories.includes(category))return json({error:"Completa todos los campos."},400);const reportId=crypto.randomUUID();await db.insert(reports).values({id:reportId,title,body,location,author,category,status:"Pendiente",ownerId:ownerId!,created:now});return json({ok:true,id:reportId});}
else{const report=await db.select().from(reports).where(and(eq(reports.id,id),eq(reports.hidden,0))).get();if(!report)return json({error:"Este aviso no está disponible."},404);
if(action==="status"){if(!moderator&&report.ownerId!==user?.userId&&(!guest||report.ownerId!==guest))return json({error:"Solo quien publicó el aviso o moderación puede cambiar el estado."},403);const status=str(x.status,30);if(!statuses.includes(status))return json({error:"Estado no válido"},400);await db.batch([db.update(reports).set({status}).where(eq(reports.id,id)),db.insert(comments).values({id:crypto.randomUUID(),reportId:id,author,ownerId:ownerId!,body:"Estado actualizado a «"+status+"». "+body,created:now})]);}
else {const commentId=crypto.randomUUID();await db.insert(comments).values({id:commentId,reportId:id,author,body,ownerId:ownerId!,created:now});return json({ok:true,id:commentId});}}
return json({ok:true});}catch{return json({error:"No se pudo guardar. Inténtalo de nuevo."},500)}}