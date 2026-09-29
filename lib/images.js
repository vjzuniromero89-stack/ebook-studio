// Generación de imágenes GRATIS:
// 1) Cloudflare Workers AI - FLUX.1 schnell (licencia Apache 2.0, uso comercial OK, ~230 imágenes/día gratis)
// 2) Pollinations.ai (sin cuenta, más lento) como respaldo
import { db } from './db';

export const IMAGE_STYLES = {
  ilustracion: { label: 'Ilustración plana moderna', suffix: 'modern flat vector illustration, clean shapes, harmonious soft color palette, editorial book illustration, professional' },
  acuarela: { label: 'Acuarela', suffix: 'delicate watercolor painting, soft washes, subtle paper texture, artistic editorial book illustration' },
  lapiz: { label: 'Dibujo a lápiz / tinta', suffix: 'elegant hand-drawn pencil and ink sketch, fine line art, black ink on white paper, classic book illustration' },
  realista: { label: 'Foto realista', suffix: 'professional editorial photograph, natural light, high detail, shallow depth of field, magazine quality' },
  '3d': { label: '3D suave', suffix: 'soft 3D render, clay style, pastel colors, cute and friendly, studio lighting, high quality' },
  minimal: { label: 'Minimalista', suffix: 'minimalist line illustration, one accent color, generous white space, elegant and simple' },
  infantil: { label: 'Infantil / cuento', suffix: "whimsical children's storybook illustration, warm colors, gentle shapes, charming" },
};

const NO_TEXT = ', no text, no letters, no words, no typography, no watermark, no logo';

export function stylePrompt(prompt, style) {
  const s = IMAGE_STYLES[style] || IMAGE_STYLES.ilustracion;
  return `${prompt}. ${s.suffix}${NO_TEXT}`;
}

export function imageEngines() {
  const cf = !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
  return { cloudflare: cf, pollinations: true };
}

async function cloudflareFlux(prompt) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.slice(0, 2000), steps: 8 }),
    }
  );
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.result?.image) throw new Error(`Cloudflare imagen (${r.status}): ${JSON.stringify(j.errors || j).slice(0, 200)}`);
  return Buffer.from(j.result.image, 'base64');
}

async function pollinations(prompt, width, height) {
  const seed = Math.floor(Math.random() * 1e9);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 900))}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !type.startsWith('image/')) throw new Error(`Pollinations (${r.status})`);
    return Buffer.from(await r.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

/** Devuelve { buf, engine } */
export async function generateImage(prompt, { width = 1024, height = 1024 } = {}) {
  const errors = [];
  if (imageEngines().cloudflare) {
    try {
      return { buf: await cloudflareFlux(prompt), engine: 'cloudflare-flux' };
    } catch (e) {
      errors.push(e.message);
    }
  }
  for (let i = 0; i < 2; i++) {
    try {
      return { buf: await pollinations(prompt, width, height), engine: 'pollinations' };
    } catch (e) {
      errors.push(e.message);
    }
  }
  const err = new Error('No se pudo generar la imagen ahora. ' + errors.join(' | '));
  err.status = 429;
  throw err;
}

export async function saveImage(buf, path) {
  const { error } = await db().storage.from('ebooks').upload(path, buf, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error('Supabase Storage: ' + error.message);
  return db().storage.from('ebooks').getPublicUrl(path).data.publicUrl;
}

export async function fetchBuffer(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}
