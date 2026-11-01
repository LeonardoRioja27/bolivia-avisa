import { getDb } from "@/db";
import { reports, comments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
export const dynamic="force-dynamic";
const statuses=["Pendiente","En seguimiento","Resuelto"];
const categories=["Transporte","Servicios","Calles y espacios","Otros"];
export async function GET(){try{const db=getDb();return Response.json({reports:await db.select().from(reports).orderBy(desc(reports.created)),comments:await db.select().from(comments).orderBy(comments.created)});}catch{return Response.json({error:"No se pudieron cargar los avisos. Inténtalo de nuevo."},{status:503})}}
export async function POST(req:Request){try{
if(req.headers.get("origin") && req.headers.get("origin")!==new URL(req.url).origin)return Response.json({error:"Origen no permitido"},{status:403});
if(Number(req.headers.get("content-length")||0)>16000)return Response.json({error:"Texto demasiado largo"},{status:413});
const x=await req.json() as Record<string,string>;const db=getDb();const str=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
if(x.action==="create"){const title=str(x.title,120),body=str(x.body,2500),location=str(x.location,100),author=str(x.author,50);if(!title||!body||!location||!author||!categories.includes(x.category))return Response.json({error:"Completa todos los campos."},{status:400});await db.insert(reports).values({id:crypto.randomUUID(),title,body,location,author,category:x.category,status:"Pendiente",created:Date.now()});}
else {const id=str(x.id,50);const report=await db.select().from(reports).where(eq(reports.id,id)).get();if(!report)return Response.json({error:"Este aviso ya no está disponible."},{status:404});const author=str(x.author,50),body=str(x.body,2500);if(!author||!body)return Response.json({error:"Añade tu nombre y una actualización."},{status:400});if(x.action==="status"){if(!statuses.includes(x.status))return Response.json({error:"Estado no válido"},{status:400});await db.batch([db.update(reports).set({status:x.status}).where(eq(reports.id,id)),db.insert(comments).values({id:crypto.randomUUID(),reportId:id,author,body:"Estado actualizado a «"+x.status+"». "+body,created:Date.now()})]);}else if(x.action==="comment")await db.insert(comments).values({id:crypto.randomUUID(),reportId:id,author,body,created:Date.now()});else return Response.json({error:"Acción no válida"},{status:400});}
return Response.json({ok:true});}catch{return Response.json({error:"No se pudo guardar. Revisa tu conexión y vuelve a intentarlo."},{status:500})}}
