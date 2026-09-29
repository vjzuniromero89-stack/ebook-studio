import { ok, fail } from '@/lib/http';
import { getEbook, updateEbook } from '@/lib/db';
import { generate } from '@/lib/ai';
import { kitPrompt } from '@/lib/prompts';

export const maxDuration = 300;

export async function POST(_req, { params }) {
  try {
    const { id } = await params;
    const eb = await getEbook(id);
    const { data, provider } = await generate({ ...kitPrompt(eb), json: true, prefer: eb.settings?.engine, temperature: 0.7 });
    const updated = await updateEbook(id, { kit: { ...data, provider, at: new Date().toISOString() } });
    return ok({ ebook: updated });
  } catch (e) {
    return fail(e);
  }
}
