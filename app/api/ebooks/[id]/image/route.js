import { ok, fail } from '@/lib/http';
import { getEbook, updateEbook } from '@/lib/db';
import { generate } from '@/lib/ai';
import { imagePromptsPrompt, coverImagePromptPrompt } from '@/lib/prompts';
import { generateImage, saveImage, stylePrompt } from '@/lib/images';

export const maxDuration = 300;

/**
 * body: { target: 'chapter', index, remove?: true, slot?: number }  -> genera/reemplaza/quita imágenes del capítulo
 *       { target: 'cover', remove?: true }                          -> portada ilustrada con IA
 */
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const eb = await getEbook(id);
    const design = eb.design || {};
    const style = design.imageStyle || 'ilustracion';

    if (body.target === 'cover') {
      if (body.remove) return ok({ ebook: await updateEbook(id, { design: { ...design, coverImage: '', coverImageAI: false } }) });
      let desc = `symbolic artwork representing: ${eb.title}`;
      try {
        const r = await generate({ ...coverImagePromptPrompt(eb), json: true, temperature: 0.9 });
        if (r.data?.prompt) desc = r.data.prompt;
      } catch {}
      const { buf, engine } = await generateImage(stylePrompt(desc, style), { width: 1024, height: 1600 });
      const url = await saveImage(buf, `covers/${id}-ai-${Date.now()}.jpg`);
      const fresh = await getEbook(id);
      const updated = await updateEbook(id, { design: { ...fresh.design, coverImage: url, coverImageAI: true, coverPrompt: desc } });
      return ok({ ebook: updated, engine });
    }

    const index = Number(body.index);
    if (!eb.outline?.[index]) throw new Error('Capítulo no existe');

    const chapters = [...(eb.chapters || [])];
    while (chapters.length < eb.outline.length) chapters.push(null);
    const current = chapters[index] || {};
    let images = [...(current.images || [])];

    if (body.remove) {
      images = typeof body.slot === 'number' ? images.filter((_, i) => i !== body.slot) : [];
    } else {
      const wanted = Math.max(1, Math.min(3, Number(design.imagesPerChapter ?? 1) || 1));
      const slots = typeof body.slot === 'number' ? [body.slot] : Array.from({ length: wanted }, (_, i) => i).filter((i) => !images[i]);
      if (!slots.length) return ok({ ebook: eb });

      let prompts = [];
      try {
        const r = await generate({ ...imagePromptsPrompt(eb, index, slots.length), json: true, temperature: 0.9 });
        prompts = (r.data?.prompts || []).filter(Boolean);
      } catch {}
      let engine;
      for (let k = 0; k < slots.length; k++) {
        const desc = prompts[k] || `${eb.outline[index].title}, scene related to ${eb.title}`;
        const res = await generateImage(stylePrompt(desc, style), { width: 1024, height: 768 });
        engine = res.engine;
        const url = await saveImage(res.buf, `chapters/${id}/${index}-${slots[k]}-${Date.now()}.jpg`);
        images[slots[k]] = { url, prompt: desc, engine };
      }
      images = images.filter(Boolean);
    }

    // Releer para no pisar texto que se haya escrito mientras tanto
    const fresh = await getEbook(id);
    const fc = [...(fresh.chapters || [])];
    while (fc.length < fresh.outline.length) fc.push(null);
    fc[index] = { ...(fc[index] || {}), images };
    return ok({ ebook: await updateEbook(id, { chapters: fc }) });
  } catch (e) {
    return fail(e);
  }
}
