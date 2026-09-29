# Ebook Studio

App web personal para crear ebooks profesionales con IA **gratis**:

- **Ideas con IA**: recomienda temas rentables con demanda, competencia, precio sugerido y búsqueda de tendencias en Google.
- **Generador**: índice editable → capítulos escritos uno por uno → revisión cruzada opcional (otro motor pule el texto).
- **4 motores gratis con respaldo automático**: Google Gemini, Groq, OpenRouter y Cloudflare Workers AI. Si uno llega a su límite, la app pasa al siguiente.
- **Imágenes con IA gratis**: ilustración por capítulo y portada ilustrada, en 7 estilos (ilustración plana, acuarela, lápiz, foto realista, 3D, minimalista, infantil). Motor: Cloudflare FLUX.1 schnell (licencia Apache 2.0, uso comercial permitido, unas 230 imágenes al día gratis); respaldo: Pollinations.ai.
- **Diseño**: 6 plantillas (Elegante, Moderno, Minimal, Vibrante, Premium, Natural), portada automática, colores y foto de fondo.
- **Exporta**: PDF (con números de página), EPUB (Amazon KDP, Apple, Google), Word (DOCX), portada JPG 1600x2560, Markdown y un ZIP con todo.
- **Kit de publicación**: descripción, 7 palabras clave, categorías, precios, página de ventas, contraportada, posts y email, más una guía paso a paso para Hotmart, Amazon KDP, Gumroad, Payhip, Draft2Digital y Google Play Libros.

---

## Instalación (unos 15 minutos)

### 1. Supabase (base de datos)
1. Entra a https://supabase.com y crea un proyecto nuevo (es gratis).
2. Ve a **SQL Editor** → **New query**, pega todo el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → será `SUPABASE_URL`
   - `service_role` (secret) → será `SUPABASE_SERVICE_ROLE_KEY`

### 2. API keys gratis (no piden tarjeta)
Pon al menos Gemini (texto) y Cloudflare (imágenes). Mientras más motores configures, más ebooks puedes hacer por día.

| Motor | Dónde crear la key | Variable |
|---|---|---|
| Google Gemini | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |
| Groq | https://console.groq.com/keys | `GROQ_API_KEY` |
| OpenRouter | https://openrouter.ai/keys | `OPENROUTER_API_KEY` |
| Cloudflare Workers AI (texto **e imágenes**) | dash.cloudflare.com → AI → Workers AI → "Use REST API" | `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` |

### 3. GitHub + Vercel
1. Sube esta carpeta a un repositorio nuevo en GitHub.
2. En https://vercel.com → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** agrega:
   - `APP_PASSWORD` (la contraseña para entrar a tu app)
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
   - Las API keys que creaste en el paso 2
4. Pulsa **Deploy**. Si agregas variables después, ve a **Deployments → ⋯ → Redeploy**.

### 4. Úsala
1. Abre tu app y entra con tu contraseña.
2. Ve a **Ajustes** y pulsa **Probar** en cada motor.
3. Ve a **Ideas IA** → **Recomiéndame temas** → **Crear este ebook**.
4. Revisa el índice → **Escribir todo el libro** (deja la pantalla abierta mientras escribe).
5. Elige el diseño → **Descargar y publicar** → **Todo en un ZIP**.

---

## Límites gratis (aproximados, cambian con el tiempo)
- **Gemini**: cientos de peticiones al día con los modelos Flash. En el plan gratis, Google puede usar los datos para mejorar sus productos.
- **Groq**: unas 1,000 peticiones al día y 200 mil tokens al día.
- **OpenRouter**: unas 200 peticiones al día con modelos `:free` (sube a 1,000 al día si recargas $10 una sola vez).
- **Cloudflare**: 10,000 "neuronas" al día (una imagen FLUX usa unas 43, o sea unas 230 imágenes al día).
- Sin Cloudflare, las imágenes se hacen con Pollinations.ai (gratis, sin cuenta, más lento).

Un ebook de 8 capítulos usa unas 12 peticiones (24 con revisión cruzada). Si todos los motores llegan a su límite, la app espera y reintenta sola; si no, sigue al día siguiente con **Continuar escribiendo**.

## Notas
- **Amazon KDP** exige declarar el contenido generado con IA. Revisa y personaliza cada libro antes de venderlo.
- Hotmart, KDP y Gumroad no permiten publicar por API, por eso la app prepara el kit para copiar y pegar.
- Para probar en tu computadora: `npm install`, crea `.env.local` con las variables y ejecuta `npm run dev`. Para exportar PDF en local, agrega `CHROME_PATH` con la ruta de tu Chrome.
