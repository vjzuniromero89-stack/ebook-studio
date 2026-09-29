import { ok, fail } from '@/lib/http';
import { getEbook, updateEbook } from '@/lib/db';
import { generate } from '@/lib/ai';
import { outlinePrompt } from '@/lib/prompts';

export const maxDuration = 300;

export async function POST(_req, { params }) {
  try {
    const { id } = await params;
    const eb = await getEbook(id);
    const p = outlinePrompt({ ...eb.settings, topic: eb.topic, title: eb.title });
    const { data, provider, model } = await generate({ ...p, json: true, maxTokens: 5000, prefer: eb.settings?.engine });
    const chapters = (data.chapters || []).filter((c) => c && c.title);
    if (!chapters.length) throw new Error('La IA no devolvió capítulos. Intenta de nuevo.');
    const updated = await updateEbook(id, {
      title: eb.title || data.title,
      subtitle: eb.subtitle || data.subtitle,
      outline: chapters.map((c) => ({ title: c.title, summary: c.summary || '', points: c.points || [] })),
      chapters: [],
      status: 'indice',
      settings: { ...eb.settings, description: data.description || '' },
    });
    return ok({ ebook: updated, provider, model });
  } catch (e) {
    return fail(e);
  }
}
