import { ok, fail } from '@/lib/http';
import { testProvider } from '@/lib/ai';
export const maxDuration = 60;
export async function POST(req) {
  try {
    const { provider } = await req.json();
    return ok(await testProvider(provider));
  } catch (e) {
    return fail(e, 400);
  }
}
