import { ok, fail } from '@/lib/http';
import { db, getEbook, updateEbook } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    return ok({ ebook: await getEbook(id) });
  } catch (e) {
    return fail(e);
  }
}

const EDITABLE = ['title', 'subtitle', 'author', 'topic', 'settings', 'outline', 'chapters', 'design', 'kit', 'status'];

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const patch = Object.fromEntries(Object.entries(body).filter(([k]) => EDITABLE.includes(k)));
    return ok({ ebook: await updateEbook(id, patch) });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    await db().from('ebooks').delete().eq('id', id);
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
