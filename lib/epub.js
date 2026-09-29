import JSZip from 'jszip';
import { esc, mdToHtml, chapterLabels, injectImages } from './render';
import { fetchBuffer } from './images';
import { getLang } from './languages';
import { resolveDesign } from './themes';

// Convierte HTML de marked a XHTML válido (cerrar etiquetas vacías)
function xhtml(html) {
  return html
    .replace(/<br>/g, '<br/>')
    .replace(/<hr>/g, '<hr/>')
    .replace(/<img([^>]*?)(?<!\/)>/g, '<img$1/>')
    .replace(/<input([^>]*?)(?<!\/)>/g, '<input$1/>')
    .replace(/&nbsp;/g, '&#160;');
}

function page(title, body, lang) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${body}</body></html>`;
}

export async function buildEpub(ebook, coverJpg) {
  const d = resolveDesign(ebook.design);
  const L = getLang(ebook.settings?.language);
  const lang = L.code;
  const outline = ebook.outline || [];
  const labels = chapterLabels(outline, lang);
  const id = 'urn:uuid:' + ebook.id;
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.folder('META-INF').file(
    'container.xml',
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
  );
  const o = zip.folder('OEBPS');
  o.file(
    'style.css',
    `body{font-family:serif;line-height:1.6;margin:0 5%}
h1,h2,h3{font-family:sans-serif;line-height:1.25}
.label{color:${d.accent};text-transform:uppercase;letter-spacing:.2em;font-size:.8em;font-weight:bold;margin-top:2em;font-family:sans-serif}
h1.ch{margin-top:.3em;margin-bottom:1.2em}
blockquote{margin:1.2em 0;padding:.8em 1em;background:${d.theme.soft};border-left:4px solid ${d.accent}}
li::marker{color:${d.accent}}
.titlepage{text-align:center;margin-top:30%}
.hero,.inline-img{margin:1em 0;text-align:center}.hero img,.inline-img img{max-width:100%;height:auto;border-radius:6px}
.cover{margin:0;padding:0;text-align:center}.cover img{max-width:100%;height:auto}
table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px}`
  );

  const items = [];
  const spine = [];
  if (coverJpg) {
    o.file('cover.jpg', coverJpg);
    o.file('cover.xhtml', page('Portada', `<div class="cover"><img src="cover.jpg" alt="${esc(ebook.title)}"/></div>`, lang));
    items.push(`<item id="cover-img" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>`);
    items.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push('<itemref idref="cover"/>');
  }
  o.file(
    'title.xhtml',
    page(ebook.title, `<div class="titlepage"><h1>${esc(ebook.title)}</h1>${ebook.subtitle ? `<p><em>${esc(ebook.subtitle)}</em></p>` : ''}<p>${esc(ebook.author || '')}</p><p style="margin-top:4em;font-size:.8em">© ${new Date().getFullYear()} ${esc(ebook.author || '')}. ${esc(L.t.rights)}</p></div>`, lang)
  );
  items.push(`<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`);
  spine.push('<itemref idref="title"/>');

  // Descargar ilustraciones de los capítulos
  const imgMap = {};
  await Promise.all(
    outline.flatMap((_, i) =>
      (ebook.chapters?.[i]?.images || []).filter((x) => x?.url).map(async (im, k) => {
        const buf = await fetchBuffer(im.url);
        if (!buf) return;
        const name = `img/ch${i}-${k}.jpg`;
        o.file(name, buf);
        items.push(`<item id="img-${i}-${k}" href="${name}" media-type="image/jpeg"/>`);
        imgMap[`${i}-${k}`] = name;
      })
    )
  );

  const navLis = [];
  outline.forEach((c, i) => {
    const content = ebook.chapters?.[i]?.content || '';
    const imgs = (ebook.chapters?.[i]?.images || []).map((_, k) => imgMap[`${i}-${k}`]).filter(Boolean);
    const hero = imgs[0] ? `<div class="hero"><img src="${imgs[0]}" alt=""/></div>` : '';
    const inner = injectImages(mdToHtml(content), imgs.slice(1), (src) => `<div class="inline-img"><img src="${src}" alt=""/></div>`);
    const body = `${labels[i] ? `<p class="label">${labels[i]}</p>` : ''}<h1 class="ch">${esc(c.title)}</h1>${hero}${xhtml(inner)}`;
    o.file(`ch${i}.xhtml`, page(c.title, body, lang));
    items.push(`<item id="ch${i}" href="ch${i}.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="ch${i}"/>`);
    navLis.push(`<li><a href="ch${i}.xhtml">${esc((labels[i] ? labels[i] + ': ' : '') + c.title)}</a></li>`);
  });

  o.file('nav.xhtml', page(L.t.contents, `<nav epub:type="toc" id="toc"><h1>${esc(L.t.contents)}</h1><ol>${navLis.join('')}</ol></nav>`, lang));
  items.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);
  items.push(`<item id="css" href="style.css" media-type="text/css"/>`);

  o.file(
    'content.opf',
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${id}</dc:identifier>
<dc:title>${esc(ebook.title)}</dc:title>
<dc:creator>${esc(ebook.author || 'Autor')}</dc:creator>
<dc:language>${lang}</dc:language>
${ebook.kit?.short_description ? `<dc:description>${esc(ebook.kit.short_description)}</dc:description>` : ''}
<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
${coverJpg ? '<meta name="cover" content="cover-img"/>' : ''}
</metadata>
<manifest>${items.join('\n')}</manifest>
<spine>${spine.join('')}</spine>
</package>`
  );
  return zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' });
}
