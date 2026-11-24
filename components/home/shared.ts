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
  imageUrl?: string | null;
};

export type Comment = {
  id: string;
  reportId: string;
  author: string;
  body: string;
  created: number;
};

export type Flag = { id: string; targetId: string; kind: string; reason: string };

export type PublicationKind = "Aviso" | "He perdido algo" | "He encontrado algo";

export type SubmitAction = "create" | "comment" | "status";
export type ModerateAction = "flag" | "hide";

export const categories = ["Transporte", "Servicios", "Calles y espacios", "Otros", "Objetos perdidos", "Objetos encontrados"];
export const statuses = ["Pendiente", "En seguimiento", "Resuelto"];

export const formatDate = (n: number) => new Date(n).toLocaleDateString("es-BO", { day: "numeric", month: "short" });

/** Clave de edición guardada en este navegador para un aviso o comentario. */
export function readKey(id: string) {
  try {
    return localStorage.getItem("bolivia-edit:" + id) || "";
  } catch {
    return "";
  }
}

/** Genera una clave nueva y comprueba que localStorage funciona antes de usarla. */
export function newKey() {
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) => x.toString(16).padStart(2, "0")).join("");
  localStorage.setItem("bolivia-storage-check", "ok");
  localStorage.removeItem("bolivia-storage-check");
  return key;
}

export function saveKey(id: string, key: string) {
  localStorage.setItem("bolivia-edit:" + id, key);
}
