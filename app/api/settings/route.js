import { ok, fail } from '@/lib/http';
import { db } from '@/lib/db';

export async function POST(req) {
  try {
    const data = await req.json();
    const { error } = await db().from('app_settings').upsert({ id: 1, data });
    if (error) throw new Error(error.message);
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
