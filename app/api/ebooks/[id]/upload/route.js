import { ok, fail } from '@/lib/http';
import { db, getEbook, updateEbook } from '@/lib/db';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') throw new Error('Sin archivo');
    if (file.size > 8 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 8 MB');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `covers/${id}-${Date.now()}.${ext}`;
    const { error } = await db().storage.from('ebooks').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (error) throw new Error(error.message);
    const { data } = db().storage.from('ebooks').getPublicUrl(path);
    const eb = await getEbook(id);
    const updated = await updateEbook(id, { design: { ...eb.design, coverImage: data.publicUrl } });
    return ok({ ebook: updated });
  } catch (e) {
    return fail(e);
  }
}
