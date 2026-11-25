export type Report = {
  id: string;
  title: string;
  body: string;
  location: string;
  category: string;
  author: string;
  status: string;
  created: number;
  canManage?: boolean;
  /** Publicado desde este navegador. */
  mine?: boolean;
  imageUrl?: string | null;
  /** Entidad a la que se reenvía (id de lib/entities.ts). */
  entity?: string | null;
  forwardStatus?: string;
  forwardedAt?: number | null;
};

export type Comment = {
  id: string;
  reportId: string;
  author: string;
  body: string;
  created: number;
  canManage?: boolean;
};

export type Flag = { id: string; targetId: string; kind: string; reason: string };

export type PublicationKind = "Aviso" | "He perdido algo" | "He encontrado algo";

export type SubmitAction = "create" | "comment" | "status";
export type ModerateAction = "flag" | "hide";

export const categories = ["Transporte", "Servicios", "Calles y espacios", "Otros", "Objetos perdidos", "Objetos encontrados"];
export const statuses = ["Pendiente", "En seguimiento", "Resuelto"];

export const formatDate = (n: number) => new Date(n).toLocaleDateString("es-BO", { day: "numeric", month: "short" });

/**
 * Clave de edición antigua guardada en localStorage. Los avisos nuevos se
 * recuerdan con la cookie «bolivia_owner» que pone el servidor; esto solo
 * mantiene el acceso a avisos publicados antes de ese cambio.
 */
export function readKey(id: string) {
  try {
    return localStorage.getItem("bolivia-edit:" + id) || "";
  } catch {
    return "";
  }
}
