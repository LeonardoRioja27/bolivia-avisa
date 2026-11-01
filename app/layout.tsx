import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Bolivia Avisa · Lo que pasa, lo resolvemos juntos",description:"Avisos de la comunidad. Publica un problema, comparte novedades y sigue su resolución."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
