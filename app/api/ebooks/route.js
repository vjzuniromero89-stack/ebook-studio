import { ok, fail } from '@/lib/http';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await db()
      .from('ebooks')
      .select('id,created_at,updated_at,title,subtitle,author,status,design,outline,chapters')
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    const list = data.map((b) => ({
      id: b.id, title: b.title, subtitle: b.subtitle, author: b.author, status: b.status, design: b.design, updated_at: b.updated_at,
      total: (b.outline || []).length,
      done: (b.chapters || []).filter((c) => c && c.content).length,
    }));
    return ok({ ebooks: list });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    const row = {
      title: b.title || null,
      subtitle: b.subtitle || null,
      author: b.author || null,
      topic: b.topic,
      settings: {
        audience: b.audience, language: b.language, tone: b.tone, chapters: Number(b.chapters) || 8,
        words: Number(b.words) || 1800, notes: b.notes, polish: !!b.polish, engine: b.engine || '',
      },
      design: {
        theme: b.theme || 'elegante', pageSize: b.pageSize || '6x9', coverLayout: 'auto',
        imageStyle: b.imageStyle || 'ilustracion', imagesPerChapter: Number(b.imagesPerChapter ?? 1), aiCover: b.aiCover !== false,
      },
      status: 'borrador',
    };
    const { data, error } = await db().from('ebooks').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    if (b.ideaId) await db().from('ideas').update({ used: true }).eq('id', b.ideaId);
    return ok({ ebook: data });
  } catch (e) {
    return fail(e);
  }
}
