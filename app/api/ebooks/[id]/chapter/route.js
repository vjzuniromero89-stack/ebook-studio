import { ok, fail } from '@/lib/http';
import { getEbook, updateEbook } from '@/lib/db';
import { generate, configuredProviders } from '@/lib/ai';
import { chapterPrompt, polishPrompt } from '@/lib/prompts';

export const maxDuration = 300;

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { index, polishOnly } = await req.json();
    const eb = await getEbook(id);
    if (!eb.outline?.[index]) throw new Error('Capítulo no existe');

    let content = eb.chapters?.[index]?.content || '';
    let provider, model;
    if (!polishOnly) {
      const p = chapterPrompt(eb, index);
      const r = await generate({ ...p, prefer: eb.settings?.engine });
      content = r.text.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '');
      provider = r.provider;
      model = r.model;
    }

    // Revisión cruzada: otro motor pule el texto (si hay más de uno configurado)
    let polishedBy = null;
    if ((eb.settings?.polish || polishOnly) && content) {
      const others = configuredProviders().filter((p) => p !== provider);
      const prefer = others[0] || provider;
      try {
        const r2 = await generate({ ...polishPrompt(eb, index, content), prefer, temperature: 0.4 });
        if (r2.text && r2.text.length > content.length * 0.6) {
          content = r2.text.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '');
          polishedBy = r2.provider;
        }
      } catch {
        // si falla la revisión, se queda el texto original
      }
    }

    // Releer para no pisar otros capítulos
    const fresh = await getEbook(id);
    const chapters = [...(fresh.chapters || [])];
    while (chapters.length < fresh.outline.length) chapters.push(null);
    chapters[index] = { ...(chapters[index] || {}), content, provider: provider || chapters[index]?.provider, model: model || chapters[index]?.model, polishedBy, at: new Date().toISOString() };
    const done = chapters.filter((c) => c && c.content).length;
    const updated = await updateEbook(id, { chapters, status: done === fresh.outline.length ? 'escrito' : 'escribiendo' });
    return ok({ ebook: updated, provider, model, polishedBy });
  } catch (e) {
    return fail(e);
  }
}
