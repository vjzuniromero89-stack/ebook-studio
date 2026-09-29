import { getEbook } from '@/lib/db';
import { bookHTML, coverPageHTML } from '@/lib/render';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { id } = await params;
  const onlyCover = new URL(req.url).searchParams.get('cover');
  try {
    const eb = await getEbook(id);
    const html = onlyCover ? coverPageHTML(eb, eb.design) : bookHTML(eb, { mode: 'screen' });
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
