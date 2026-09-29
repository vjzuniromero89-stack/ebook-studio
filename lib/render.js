import { marked } from 'marked';
import { resolveDesign } from './themes';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

marked.setOptions({ gfm: true, breaks: false });

export function mdToHtml(md = '') {
  // Quita un H1 inicial si la IA repitió el título
  const clean = md.replace(/^\s*#\s+.*\n/, '');
  return marked.parse(clean);
}

// Inserta imágenes extra dentro del capítulo, antes de subtítulos repartidos
export function injectImages(html, extra = [], imgTag) {
  if (!extra.length) return html;
  const parts = html.split(/(?=<h2)/);
  if (parts.length < 2) return html + extra.map(imgTag).join('');
  const step = parts.length / (extra.length + 1);
  const at = extra.map((_, k) => Math.max(1, Math.round(step * (k + 1))));
  return parts.map((p, i) => { const k = at.indexOf(i); return (k >= 0 ? imgTag(extra[k]) : '') + p; }).join('');
}

export function isFrontOrBack(title = '') {
  return /^(introducci[oó]n|conclusi[oó]n|pr[oó]logo|ep[ií]logo|introduction|conclusion|prologue|epilogue|bonus|anexo)/i.test(title.trim());
}

export function chapterLabels(outline = []) {
  let n = 0;
  return outline.map((c) => (isFrontOrBack(c.title) ? '' : `Capítulo ${++n}`));
}

// ---------- PORTADA ----------
export function coverCSS(d) {
  const c = d.cover;
  const H = d.theme.fonts.head;
  return `
.cover{position:relative;width:100%;height:100%;container-type:size;overflow:hidden;background:${c.bg};color:${c.fg};font-family:'${H}',serif;}
.cover .img{position:absolute;inset:0;background-size:cover;background-position:center;}
.cover .shade{position:absolute;inset:0;}
.cover .inner{position:absolute;inset:0;display:flex;flex-direction:column;padding:9cqw;}
.cover h1,.cover h2{color:inherit}
.cover h1{margin:0;font-weight:800;line-height:1.02;letter-spacing:-.01em;font-size:11cqw;text-wrap:balance;}
.cover h2{margin:0;font-weight:400;line-height:1.3;font-size:4.2cqw;opacity:.92;text-wrap:balance;font-family:'${d.theme.fonts.body}',serif;}
.cover .author{font-size:4.2cqw;letter-spacing:.18em;text-transform:uppercase;font-weight:600;}
.cover .rule{height:.6cqw;width:22cqw;background:${c.accent};}

/* elegante */
.cover.l-elegante .frame{position:absolute;inset:5cqw;border:.5cqw solid ${c.accent};}
.cover.l-elegante .frame:after{content:'';position:absolute;inset:1.6cqw;border:.2cqw solid ${c.accent};opacity:.6}
.cover.l-elegante .inner{align-items:center;text-align:center;justify-content:center;gap:5cqh;padding:16cqw}
.cover.l-elegante h1{font-size:10.5cqw}
.cover.l-elegante .orn{color:${c.accent};font-size:6cqw;letter-spacing:.5em}
.cover.l-elegante .author{position:absolute;bottom:13cqw;left:0;right:0;text-align:center;color:${c.accent}}

/* moderno */
.cover.l-moderno .c1{position:absolute;width:95cqw;height:95cqw;border-radius:50%;right:-40cqw;top:-30cqw;background:rgba(255,255,255,.12)}
.cover.l-moderno .c2{position:absolute;width:55cqw;height:55cqw;border-radius:50%;right:-16cqw;bottom:-12cqw;background:${c.accent};opacity:.95}
.cover.l-moderno .inner{justify-content:flex-end;gap:4cqw;padding-bottom:30cqh}
.cover.l-moderno h1{font-size:12.5cqw;font-weight:900;text-transform:uppercase;position:relative}
.cover.l-moderno .author{position:absolute;bottom:8cqw;left:9cqw}
.cover.l-moderno .band{display:none}

/* minimal */
.cover.l-minimal .inner{justify-content:space-between;padding:11cqw}
.cover.l-minimal .bar{position:absolute;left:0;top:0;bottom:0;width:4cqw;background:${c.accent}}
.cover.l-minimal h1{font-size:13cqw;font-weight:900;letter-spacing:-.03em}
.cover.l-minimal .rule{width:30cqw;height:1.2cqw}
.cover.l-minimal .dot{position:absolute;right:11cqw;top:11cqw;width:12cqw;height:12cqw;border-radius:50%;background:${c.accent}}

/* vibrante */
.cover.l-vibrante{background:linear-gradient(155deg, ${c.bg} 0%, ${c.bg2 || c.bg} 100%)}
.cover.l-vibrante .s1{position:absolute;width:120cqw;height:40cqw;background:rgba(255,255,255,.1);transform:rotate(-18deg);top:18cqh;left:-10cqw}
.cover.l-vibrante .s2{position:absolute;width:40cqw;height:40cqw;border:2.2cqw solid ${c.accent};border-radius:50%;right:-10cqw;bottom:-6cqw}
.cover.l-vibrante .inner{justify-content:center;gap:5cqw}
.cover.l-vibrante h1{font-size:13cqw;font-weight:900}
.cover.l-vibrante .tag{align-self:flex-start;background:${c.accent};color:#1d1433;font-family:inherit;font-weight:800;font-size:3.6cqw;padding:1.4cqw 3.4cqw;border-radius:10cqw;letter-spacing:.08em;text-transform:uppercase}
.cover.l-vibrante .author{position:absolute;bottom:9cqw;left:9cqw}

/* premium */
.cover.l-premium .glow{position:absolute;width:140cqw;height:140cqw;left:-20cqw;top:25cqh;background:radial-gradient(circle, ${c.accent}55 0%, transparent 60%)}
.cover.l-premium .inner{align-items:center;text-align:center;justify-content:center;gap:6cqw}
.cover.l-premium h1{font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:10cqw;line-height:1.1}
.cover.l-premium .line{width:1px;height:14cqh;background:${c.accent}}
.cover.l-premium .author{position:absolute;bottom:10cqw;left:0;right:0;text-align:center;color:${c.accent};letter-spacing:.35em}
.cover.l-premium h2{font-style:italic}

/* natural */
.cover.l-natural .arch{position:absolute;left:12cqw;right:12cqw;top:10cqw;height:58cqh;border-radius:40cqw 40cqw 0 0;background:rgba(255,255,255,.08);border:.4cqw solid ${c.accent}}
.cover.l-natural .sun{position:absolute;width:22cqw;height:22cqw;border-radius:50%;background:${c.accent};left:39cqw;top:22cqw}
.cover.l-natural .inner{justify-content:flex-end;align-items:center;text-align:center;gap:4cqw;padding-bottom:22cqh}
.cover.l-natural h1{font-weight:400;font-size:12cqw}
.cover.l-natural .author{position:absolute;bottom:9cqw;left:0;right:0;text-align:center}

/* con imagen */
.cover.has-img .shade{background:linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.75) 100%)}
.cover.has-img{color:#fff}
.cover.has-img .c1,.cover.has-img .c2,.cover.has-img .s1,.cover.has-img .s2,.cover.has-img .sun,.cover.has-img .arch,.cover.has-img .dot,.cover.has-img .glow{display:none}
`;
}

export function coverMarkup(ebook, d) {
  const layout = d.layout === 'auto' ? d.key : d.layout;
  const title = esc(ebook.title || 'Título del ebook');
  const sub = esc(ebook.subtitle || '');
  const author = esc(ebook.author || '');
  const img = d.image ? `<div class="img" style="background-image:url('${esc(d.image)}')"></div><div class="shade"></div>` : '';
  const cls = `cover l-${layout}${d.image ? ' has-img' : ''}`;
  const blocks = {
    elegante: `<div class="frame"></div><div class="inner"><div class="orn">✦ ✦ ✦</div><h1>${title}</h1><div class="rule"></div>${sub ? `<h2>${sub}</h2>` : ''}</div><div class="author">${author}</div>`,
    moderno: `<div class="c1"></div><div class="c2"></div><div class="band"></div><div class="inner"><h1>${title}</h1><div class="rule"></div>${sub ? `<h2>${sub}</h2>` : ''}</div><div class="author">${author}</div>`,
    minimal: `<div class="bar"></div><div class="dot"></div><div class="inner"><div style="height:14cqh"></div><div style="display:flex;flex-direction:column;gap:5cqw"><h1>${title}</h1><div class="rule"></div>${sub ? `<h2>${sub}</h2>` : ''}</div><div class="author">${author}</div></div>`,
    vibrante: `<div class="s1"></div><div class="s2"></div><div class="inner"><div class="tag">Guía práctica</div><h1>${title}</h1>${sub ? `<h2>${sub}</h2>` : ''}</div><div class="author">${author}</div>`,
    premium: `<div class="glow"></div><div class="inner"><div class="line"></div><h1>${title}</h1>${sub ? `<h2>${sub}</h2>` : ''}<div class="line"></div></div><div class="author">${author}</div>`,
    natural: `<div class="arch"></div><div class="sun"></div><div class="inner"><h1>${title}</h1><div class="rule"></div>${sub ? `<h2>${sub}</h2>` : ''}</div><div class="author">${author}</div>`,
  };
  return `<div class="${cls}">${img}${blocks[layout] || blocks.elegante}</div>`;
}

function fontsLink(d) {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=${d.theme.googleFonts}&display=swap" rel="stylesheet">`;
}

// Portada sola (para JPG 1600x2560 de Amazon KDP y EPUB)
export function coverPageHTML(ebook, design) {
  const d = resolveDesign(design);
  return `<!doctype html><html><head><meta charset="utf-8">${fontsLink(d)}
<style>html,body{margin:0;width:100%;height:100%}${coverCSS(d)}</style></head>
<body>${coverMarkup(ebook, d)}</body></html>`;
}

// ---------- LIBRO COMPLETO ----------
export function bookHTML(ebook, { mode = 'print' } = {}) {
  const d = resolveDesign(ebook.design);
  const t = d.theme;
  const outline = ebook.outline || [];
  const chapters = ebook.chapters || [];
  const labels = chapterLabels(outline);
  const year = new Date().getFullYear();
  const kit = ebook.kit || {};

  const toc = outline
    .map((c, i) => `<li><a href="#ch${i}"><span class="n">${labels[i] ? labels[i].replace('Capítulo ', '') : ''}</span><span class="t">${esc(c.title)}</span></a></li>`)
    .join('');

  const body = outline
    .map((c, i) => {
      const content = chapters[i]?.content;
      const imgs = (chapters[i]?.images || []).filter((x) => x && x.url);
      const hero = imgs[0] ? `<figure class="hero"><img src="${esc(imgs[0].url)}" alt=""></figure>` : '';
      const inner = content ? injectImages(mdToHtml(content), imgs.slice(1), (im) => `<figure class="inline-img"><img src="${esc(im.url)}" alt=""></figure>`) : '<p class="empty">(Capítulo pendiente de generar)</p>';
      return `<section class="chapter${hero ? ' has-hero' : ''}" id="ch${i}">
  <header class="opener">${labels[i] ? `<div class="label">${labels[i]}</div>` : '<div class="label">&nbsp;</div>'}<h1>${esc(c.title)}</h1><div class="orn"></div></header>
  ${hero}
  <div class="content">${inner}</div>
</section>`;
    })
    .join('\n');

  const screen = mode === 'screen';

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ebook.title || 'Ebook')}</title>${fontsLink(d)}
<style>
@page{size:${d.page.width} ${d.page.height};margin:22mm 18mm 22mm 18mm;
  @bottom-center{content:counter(page);font-family:'${t.fonts.head}',serif;font-size:9pt;color:#888}}
@page cover{margin:0;@bottom-center{content:none}}
@page front{@bottom-center{content:none}}
:root{--accent:${d.accent};--ink:${t.ink};--paper:${t.paper};--soft:${t.soft}}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;color:var(--ink);font-family:'${t.fonts.body}',Georgia,serif;font-size:11pt;line-height:1.62;hyphens:auto;-webkit-hyphens:auto}
h1,h2,h3,h4{font-family:'${t.fonts.head}',serif;color:var(--ink);line-height:1.2;break-after:avoid}
${coverCSS(d)}
.cover-page{page:cover;width:${d.page.width};height:${d.page.height};break-after:page}
.front{page:front;break-after:page;min-height:60vh}
.titlepage{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:calc(${d.page.height} - 44mm)}
.titlepage h1{font-size:26pt;margin:0 0 10pt}
.titlepage h2{font-weight:400;font-size:13pt;margin:0 0 30pt;font-family:'${t.fonts.body}',serif;font-style:italic;opacity:.85}
.titlepage .rule{width:60pt;height:3pt;background:var(--accent);margin:0 auto 30pt}
.titlepage .by{letter-spacing:.2em;text-transform:uppercase;font-size:10pt}
.copyright{display:flex;flex-direction:column;justify-content:flex-end;height:calc(${d.page.height} - 44mm);font-size:8.5pt;color:#555;line-height:1.5}
.toc h2{font-size:22pt;margin:0 0 18pt}
.toc ol{list-style:none;padding:0;margin:0}
.toc li{border-bottom:1px solid rgba(0,0,0,.08)}
.toc a{display:flex;gap:12pt;padding:8pt 0;color:inherit;text-decoration:none}
.toc .n{width:22pt;color:var(--accent);font-family:'${t.fonts.head}',serif;font-weight:700}
.chapter{break-before:page}
.opener{padding:40pt 0 26pt;margin-bottom:18pt}
.opener .label{font-family:'${t.fonts.head}',serif;color:var(--accent);text-transform:uppercase;letter-spacing:.25em;font-size:9.5pt;font-weight:700;margin-bottom:10pt}
.opener h1{font-size:25pt;margin:0}
.opener .orn{width:50pt;height:3pt;background:var(--accent);margin-top:16pt}
.content>p:first-child::first-letter{float:left;font-family:'${t.fonts.head}',serif;font-size:3.4em;line-height:.9;padding:4pt 6pt 0 0;color:var(--accent);font-weight:700}
.content h2{font-size:15pt;margin:22pt 0 8pt}
.content h3{font-size:12.5pt;margin:16pt 0 6pt}
.content p{margin:0 0 9pt;text-align:justify;orphans:3;widows:3}
.content ul,.content ol{padding-left:18pt;margin:0 0 10pt}
.content li{margin:3pt 0}
.content li::marker{color:var(--accent);font-weight:700}
.content strong{color:var(--ink)}
.content blockquote{margin:14pt 0;padding:11pt 14pt;background:var(--soft);border-left:4pt solid var(--accent);border-radius:0 6pt 6pt 0;break-inside:avoid}
.content blockquote p{margin:0;text-align:left}
.content table{border-collapse:collapse;width:100%;margin:10pt 0;font-size:9.5pt}
.content th,.content td{border:1px solid #ddd;padding:5pt 7pt;text-align:left}
.content th{background:var(--soft)}
.content hr{border:0;border-top:1px solid #ddd;margin:18pt 0}
.empty{color:#999;font-style:italic}
.has-hero .opener{padding-top:10pt;margin-bottom:12pt}
.hero{margin:0 0 18pt;break-inside:avoid}
.hero img{display:block;width:100%;aspect-ratio:4/3;max-height:calc(${d.page.height} * 0.36);object-fit:cover;border-radius:8pt}
.inline-img{margin:16pt auto;break-inside:avoid;text-align:center}
.inline-img img{display:block;width:82%;margin:0 auto;aspect-ratio:4/3;max-height:calc(${d.page.height} * 0.32);object-fit:cover;border-radius:8pt}
.about{break-before:page;page:front}
.about h2{font-size:18pt}
${screen ? `
body{background:#e9e9ee;padding:16px 0}
.cover-page{width:min(92vw,520px);height:auto;aspect-ratio:${parseFloat(d.page.width)}/${parseFloat(d.page.height)};margin:0 auto 18px;box-shadow:0 10px 30px rgba(0,0,0,.25);border-radius:4px;overflow:hidden}
.front,.chapter,.about{background:var(--paper);width:min(92vw,720px);margin:0 auto 18px;padding:clamp(20px,5vw,56px);box-shadow:0 4px 16px rgba(0,0,0,.1);border-radius:4px;min-height:0}
.titlepage,.copyright{height:auto;min-height:320px}
` : ''}
</style></head><body>
<div class="cover-page">${coverMarkup(ebook, d)}</div>
<div class="front titlepage">
  <h1>${esc(ebook.title || '')}</h1>
  ${ebook.subtitle ? `<h2>${esc(ebook.subtitle)}</h2>` : '<div style="height:20pt"></div>'}
  <div class="rule"></div>
  <div class="by">${esc(ebook.author || '')}</div>
</div>
<div class="front copyright">
  <p><strong>${esc(ebook.title || '')}</strong><br>© ${year} ${esc(ebook.author || '')}. Todos los derechos reservados.</p>
  <p>Ninguna parte de esta publicación puede ser reproducida, distribuida o transmitida por ningún medio sin el permiso previo por escrito del autor.</p>
  <p>La información de este libro tiene fines educativos e informativos. El autor no se hace responsable del uso que se le dé.</p>
</div>
<div class="front toc"><h2>Contenido</h2><ol>${toc}</ol></div>
${body}
${kit.author_bio ? `<section class="about"><h2>Sobre el autor</h2><p>${esc(kit.author_bio)}</p></section>` : ''}
</body></html>`;
}
