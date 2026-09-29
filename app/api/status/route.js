import { ok, fail } from '@/lib/http';
import { PROVIDERS, DEFAULT_ORDER, listModels, pickModel } from '@/lib/ai';
import { getSettings } from '@/lib/db';
import { imageEngines } from '@/lib/images';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    const providers = await Promise.all(
      Object.entries(PROVIDERS).map(async ([id, p]) => {
        const configured = !!p.key();
        const models = configured ? await listModels(id) : [];
        const model = configured ? await pickModel(id, settings) : null;
        return { id, label: p.label, signup: p.signup, configured, models, model };
      })
    );
    const supabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    return ok({ providers, settings: { order: DEFAULT_ORDER, ...settings }, supabase, images: imageEngines() });
  } catch (e) {
    return fail(e);
  }
}
