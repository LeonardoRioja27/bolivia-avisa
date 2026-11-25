# Proxy de Cloudflare para tu dominio

Este Worker sirve Bolivia Avisa desde **tu dominio de Cloudflare** mientras los
datos (avisos, comentarios, fotos) siguen guardados en **ChatGPT Sites**.

```
Visitante ──► tu-dominio.com (este Worker) ──► web en ChatGPT Sites (API + base de datos)
```

Para el navegador todo viene de tu dominio, así que la cookie que recuerda
«Mis avisos» funciona normalmente. El Worker:

- comprueba que los envíos vienen de tu propia web (protección CSRF);
- reenvía solo la cookie de la app (`bolivia_owner`), no las demás de tu dominio;
- pasa la IP real del visitante a Sites, firmada con un secreto compartido,
  para que el límite de participación por persona siga funcionando.

## Puesta en marcha

Necesitas: Node.js 22+, acceso a tu cuenta de Cloudflare y poder publicar en el
proyecto de ChatGPT Sites. Los comandos se ejecutan desde la raíz del repositorio.

1. **Genera un secreto compartido** (guárdalo, lo usarás dos veces):

   ```bash
   openssl rand -hex 32
   ```

2. **En ChatGPT Sites**: añade la variable secreta `PROXY_SECRET` con ese valor
   y vuelve a publicar la web (con este código). Apunta la dirección pública de
   la web de Sites (por ejemplo `https://algo.….`).

3. **Configura el Worker** en `proxy/wrangler.jsonc`:
   - `SITES_ORIGIN`: la dirección de la web de Sites, sin barra final.
   - `routes`: descomenta la línea y pon tu dominio.
     - `tu-dominio.com/*` → toda la web se sirve desde tu dominio (lo normal).
     - `tu-dominio.com/api/*` → solo la API, si las páginas las sirves tú.

4. **Inicia sesión en Cloudflare y guarda el secreto en el Worker**:

   ```bash
   npx wrangler login
   ```

   ```bash
   npx wrangler secret put PROXY_SECRET --config proxy/wrangler.jsonc
   ```

5. **Despliega**:

   ```bash
   npx wrangler deploy --config proxy/wrangler.jsonc
   ```

6. **Prueba**: abre tu dominio, publica un aviso de prueba, recarga y mira que
   aparezca en «Mis avisos».

## Cosas a tener en cuenta

- **Moderación**: el inicio de sesión con ChatGPT («Moderación» en el pie de
  página) pertenece a Sites y no funciona a través del proxy. Para moderar,
  entra directamente en la dirección de Sites.
- **Si tu dominio ya sirve otra web** en Cloudflare (Pages u otro Worker), la
  ruta del Worker tiene prioridad en las direcciones que cubra. Usa `/api/*` si
  solo quieres el proxy para la API.
- **Secreto**: si el secreto no coincide en los dos lados, la web sigue
  funcionando, pero todos los visitantes compartirían el mismo límite de
  participación (10 envíos cada 10 minutos). Debe tener al menos 32 caracteres.
- **Prueba local**: `proxy/.dev.vars` con `PROXY_SECRET` y
  `SITES_ORIGIN=http://localhost:5173`, el mismo `PROXY_SECRET` en `.dev.vars`
  de la raíz, `npm run dev` y luego
  `npx wrangler dev --config proxy/wrangler.jsonc --port 8787`.
