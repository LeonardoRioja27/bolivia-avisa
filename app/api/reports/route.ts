import { getDb } from "@/db";
import { reports, comments, flags } from "@/db/schema";
import { desc, eq, and, inArray } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {challenge,validChallenge,guestOwner,signed,RATE_SQL} from "@/lib/public-guard";
import {decodePhoto,readReportBody} from "@/lib/report-photo";
import {newOwnerToken,ownerCookie,readOwnerToken} from "@/lib/owner-cookie";
import {POW_BITS,powPayload,validPow} from "@/lib/pow";
import {clientNetwork} from "@/lib/proxy";
export const dynamic="force-dynamic";
const statuses=["Pendiente","En seguimiento","Resuelto"],categories=["Transporte","Servicios","Calles y espacios","Otros","Objetos perdidos","Objetos encontrados"];
/** Nombre que se muestra cuando la persona no escribe un alias. */
const ANONYMOUS="anónimo";
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store"}});
async function identity(){const user=await getChatGPTUser();const moderator=!!user && !!(env as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL && user.email.toLowerCase()===(env as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL?.toLowerCase();return {user,moderator};}
export async function GET(req:Request){try{const db=getDb();const {user,moderator}=await identity();const guest=await guestOwner(readOwnerToken(req));const owns=(ownerId:string|null)=>!!ownerId&&(ownerId===user?.userId||ownerId===guest);const rows=await db.select().from(reports).where(eq(reports.hidden,0)).orderBy(desc(reports.created)).limit(200);const ids=rows.map(r=>r.id);const replies=ids.length?await db.select().from(comments).where(and(eq(comments.hidden,0),inArray(comments.reportId,ids))).orderBy(comments.created).limit(2000):[];const guard=(env as {PUBLIC_GUARD_SECRET?:string}).PUBLIC_GUARD_SECRET;return json({signedIn:!!guard,moderator,challenge:guard?await challenge(guard):null,reports:rows.map(({ownerId,hidden,imageKey,...r})=>({...r,imageUrl:imageKey?"/api/photos/"+r.id:null,canManage:moderator||owns(ownerId),mine:owns(ownerId)})),comments:replies.map(({ownerId,hidden,...c})=>({...c,canManage:moderator||owns(ownerId)})),flags:moderator?await db.select({id:flags.id,targetId:flags.targetId,kind:flags.kind,reason:flags.reason,created:flags.created}).from(flags).orderBy(desc(flags.created)).limit(100):[]});}catch{return json({error:"No se pudieron cargar los avisos. Inténtalo de nuevo."},503)}}
export async function POST(req:Request){try{
if(req.headers.get("origin")!==new URL(req.url).origin)return json({error:"Origen no permitido"},403);
const {user,moderator}=await identity();
let raw:string;try{raw=await readReportBody(req)}catch{return json({error:"La publicación es demasiado grande. Reduce la foto e inténtalo de nuevo."},413)}
let x:Record<string,unknown>;try{x=JSON.parse(raw);if(!x||typeof x!=="object"||Array.isArray(x))throw Error();}catch{return json({error:"Solicitud no válida"},400)}
const str=(v:unknown,max:number)=>typeof v==="string"&&v.trim().length<=max?v.trim():"";
const action=str(x.action,20),id=str(x.id,50),author=str(x.author,50)||ANONYMOUS,body=str(x.body,2500),db=getDb();
if(!["create","comment","status","flag","hide"].includes(action))return json({error:"Acción no válida"},400);
const secret=(env as {PUBLIC_GUARD_SECRET?:string}).PUBLIC_GUARD_SECRET;
if(!secret)return json({error:"La participación está temporalmente desactivada."},503);
if(x.website || !await validChallenge(x.challenge,secret))return json({error:"Espera dos segundos e inténtalo de nuevo. Si persiste, recarga la página."},400);
// Prueba de trabajo atada al contenido, y cada challenge vale para un solo envío.
if(!await validPow(x.challenge,powPayload(x),x.pow,Number((env as {POW_BITS?:string}).POW_BITS)||POW_BITS))return json({error:"No se pudo verificar el envío. Recarga la página e inténtalo de nuevo."},400);
const [stamp,challengeNonce]=String(x.challenge).split(".");
if(!await env.DB!.prepare('INSERT INTO used_challenges(nonce,expires) VALUES (?, ?) ON CONFLICT(nonce) DO NOTHING RETURNING nonce').bind(challengeNonce,Number(stamp)+3600000).first())return json({error:"Este envío ya se procesó. Recarga la página si quieres enviar otro."},409);

// La cookie identifica al autor; ownerToken solo llega de claves antiguas guardadas en localStorage.
const creating=["create","comment"].includes(action),cookieToken=readOwnerToken(req),freshToken=!cookieToken&&creating?newOwnerToken():null;const cookieGuest=await guestOwner(cookieToken??freshToken),legacyGuest=await guestOwner(x.ownerToken),ownerId=cookieGuest??legacyGuest??user?.userId;const owns=(id:string|null)=>!!id&&(id===user?.userId||id===cookieGuest||id===legacyGuest);const remember=(res:Response)=>{if(freshToken)res.headers.append("Set-Cookie",ownerCookie(freshToken,req));return res};
if(creating&&!ownerId)return json({error:"No se ha podido preparar la clave de tu publicación. Recarga la página."},400);
const network=await clientNetwork(req,(env as {PROXY_SECRET?:string}).PROXY_SECRET);
const limiterId="network:"+await signed(new Date().toISOString().slice(0,10)+":"+network,secret);
const now=Date.now();
for(const [bucket,max] of [[limiterId,10],["global-public",100]] as const){const limited=await env.DB!.prepare(RATE_SQL).bind(bucket,now,now-600000,now-600000,now-600000,max).first();if(!limited)return json({error:"Se ha alcanzado el límite temporal de participación. Espera unos minutos."},429);}
await env.DB!.prepare('DELETE FROM write_limits WHERE window < ?').bind(now-86400000).run();await env.DB!.prepare('DELETE FROM used_challenges WHERE expires < ?').bind(now).run();
if(action==="hide"){const table=x.kind==="comment"?comments:reports;const target=await db.select().from(table).where(eq(table.id,id)).get();if(!target)return json({error:"Contenido no disponible"},404);if(!moderator&&!owns(target.ownerId))return json({error:"No tienes permiso para retirar este contenido."},403);await db.update(table).set({hidden:1}).where(eq(table.id,id));return json({ok:true})}
if(action==="flag"){const reason=str(x.reason,500),kind=x.kind==="comment"?"comment":"report";if(!id||!reason)return json({error:"Explica el motivo de la denuncia."},400);const table=kind==="comment"?comments:reports;if(!await db.select().from(table).where(and(eq(table.id,id),eq(table.hidden,0))).get())return json({error:"Contenido no disponible"},404);await db.insert(flags).values({id:crypto.randomUUID(),targetId:id,kind,reason,userId:user?.userId??limiterId,created:now});return json({ok:true})}
if(typeof x.author==="string"&&x.author.trim().length>50)return json({error:"El alias puede tener como máximo 50 caracteres."},400);
if(!body)return json({error:"Añade un texto válido."},400);
if(action==="create"){const title=str(x.title,120),location=str(x.location,100),category=str(x.category,30);if(!title||!location||!categories.includes(category))return json({error:"Completa todos los campos."},400);let photo:Uint8Array|null;try{photo=decodePhoto(x.photo)}catch{return json({error:"La foto no es válida. Elige una imagen JPEG, PNG o WebP desde el formulario."},400)}if(photo&&!env.BUCKET)return json({error:"No se pueden guardar fotos en este momento. Inténtalo de nuevo más tarde."},503);const reportId=crypto.randomUUID(),imageKey=photo?'lost-found/'+reportId+'.jpg':null;if(photo&&imageKey)await env.BUCKET!.put(imageKey,photo,{httpMetadata:{contentType:'image/jpeg'}});try{await db.insert(reports).values({id:reportId,title,body,location,author,category,imageKey,status:"Pendiente",ownerId:ownerId!,created:now})}catch(error){if(imageKey)await env.BUCKET!.delete(imageKey).catch(()=>{});throw error}return remember(json({ok:true,id:reportId}));}
else{const report=await db.select().from(reports).where(and(eq(reports.id,id),eq(reports.hidden,0))).get();if(!report)return json({error:"Este aviso no está disponible."},404);
if(action==="status"){if(!moderator&&!owns(report.ownerId))return json({error:"Solo quien publicó el aviso o moderación puede cambiar el estado."},403);const status=str(x.status,30);if(!statuses.includes(status))return json({error:"Estado no válido"},400);await db.batch([db.update(reports).set({status}).where(eq(reports.id,id)),db.insert(comments).values({id:crypto.randomUUID(),reportId:id,author,ownerId:ownerId!,body:"Estado actualizado a «"+status+"». "+body,created:now})]);}
else {const commentId=crypto.randomUUID();await db.insert(comments).values({id:commentId,reportId:id,author,body,ownerId:ownerId!,created:now});return remember(json({ok:true,id:commentId}));}}
return json({ok:true});}catch{return json({error:"No se pudo guardar. Inténtalo de nuevo."},500)}}