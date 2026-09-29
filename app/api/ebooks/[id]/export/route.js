import JSZip from 'jszip';
import { getEbook } from '@/lib/db';
import { bookHTML, coverPageHTML } from '@/lib/render';
import { withPage, htmlToPdf, htmlToJpg } from '@/lib/browser';
import { buildEpub } from '@/lib/epub';
import { buildDocx } from '@/lib/docx';
import { kitMarkdown } from '@/lib/platforms';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function slug(s = 'ebook') {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'ebook';
}

function markdown(eb) {
  return [`# ${eb.title}`, eb.subtitle ? `## ${eb.subtitle}` : '', eb.author ? `*${eb.author}*` : '', '',
    ...(eb.outline || []).map((c, i) => `\n# ${c.title}\n\n${eb.chapters?.[i]?.content || ''}`)].join('\n');
}

const TYPES = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  cover: 'image/jpeg',
  md: 'text/markdown; charset=utf-8',
  kit: 'text/markdown; charset=utf-8',
  zip: 'application/zip',
};

export async function GET(req, { params }) {
  const { id } = await params;
  const format = new URL(req.url).searchParams.get('format') || 'pdf';
  try {
    const eb = await getEbook(id);
    const name = slug(eb.title);
    let buf;
    let ext = format;

    if (format === 'pdf') {
      buf = await withPage((p) => htmlToPdf(p, bookHTML(eb)));
    } else if (format === 'cover') {
      buf = await withPage((p) => htmlToJpg(p, coverPageHTML(eb, eb.design)));
      ext = 'jpg';
    } else if (format === 'epub') {
      const cover = await withPage((p) => htmlToJpg(p, coverPageHTML(eb, eb.design)));
      buf = await buildEpub(eb, cover);
    } else if (format === 'docx') {
      const cover = await withPage((p) => htmlToJpg(p, coverPageHTML(eb, eb.design)));
      buf = await buildDocx(eb, cover);
    } else if (format === 'md') {
      buf = Buffer.from(markdown(eb), 'utf8');
    } else if (format === 'kit') {
      buf = Buffer.from(kitMarkdown(eb), 'utf8');
      ext = 'md';
    } else if (format === 'zip') {
      const { pdf, cover } = await withPage(async (p) => {
        const pdf = await htmlToPdf(p, bookHTML(eb));
        const cover = await htmlToJpg(p, coverPageHTML(eb, eb.design));
        return { pdf, cover };
      });
      const zip = new JSZip();
      zip.file(`${name}.pdf`, pdf);
      zip.file(`${name}-portada.jpg`, cover);
      zip.file(`${name}.epub`, await buildEpub(eb, cover));
      zip.file(`${name}.docx`, await buildDocx(eb, cover));
      zip.file(`${name}.md`, markdown(eb));
      if (eb.kit) zip.file(`kit-de-publicacion.md`, kitMarkdown(eb));
      buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    } else {
      return new Response('Formato no válido', { status: 400 });
    }

    const filename = format === 'kit' ? 'kit-de-publicacion.md' : format === 'cover' ? `${name}-portada.jpg` : format === 'zip' ? `${name}-todo.zip` : `${name}.${ext}`;
    return new Response(buf, {
      headers: { 'Content-Type': TYPES[format], 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
