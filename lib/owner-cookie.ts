/**
 * Cookie que recuerda qué avisos y comentarios publicó este navegador.
 * Guarda una clave aleatoria; en la base de datos solo se guarda su hash
 * (ver guestOwner en public-guard.ts), así que la cookie no revela nada.
 */
const NAME = "bolivia_owner";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function readOwnerToken(req: Request): string | null {
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === NAME) {
      const token = value.join("=");
      return /^[a-f0-9]{64}$/.test(token) ? token : null;
    }
  }
  return null;
}

export function newOwnerToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) => x.toString(16).padStart(2, "0")).join("");
}

export function ownerCookie(token: string, req: Request) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${NAME}=${token}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; SameSite=Lax${secure}`;
}
