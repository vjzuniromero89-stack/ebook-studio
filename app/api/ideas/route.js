import { ok, fail } from '@/lib/http';
import { db } from '@/lib/db';
import { generate, searchTrends } from '@/lib/ai';
import { ideasPrompt } from '@/lib/prompts';
import { getLang } from '@/lib/languages';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await db().from('ideas').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return ok({ ideas: data });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    let trends = null;
    if (body.useTrends) {
      trends = await searchTrends(
        `Investiga en internet qué temas de ebooks e infoproductos se están vendiendo más en ${new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })} ` +
          `en ${body.platform || 'Hotmart y Amazon KDP'} para compradores que hablan ${getLang(body.language).ai}` +
          (body.niche ? `, dentro del nicho: ${body.niche}` : '') +
          '. Resume en viñetas los temas, problemas y tendencias con más demanda.'
      );
    }
    const p = ideasPrompt({ ...body, trends });
    const { data, provider, model } = await generate({ ...p, json: true, maxTokens: 6000, temperature: 0.9 });
    const ideas = (data.ideas || data || []).filter((x) => x && x.title);
    if (!ideas.length) throw new Error('La IA no devolvió ideas. Intenta de nuevo.');
    ideas.sort((a, b) => (b.score || 0) - (a.score || 0));
    const rows = ideas.map((d) => ({ data: { ...d, language: getLang(body.language).code, source: provider, trends: !!trends } }));
    const { data: saved, error } = await db().from('ideas').insert(rows).select('*');
    if (error) throw new Error(error.message);
    return ok({ ideas: saved, provider, model, trends: !!trends });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await db().from('ideas').delete().eq('id', id);
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
