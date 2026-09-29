import { marked } from 'marked';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  ImageRun, TableOfContents, Footer, PageNumber, BorderStyle, ShadingType,
} from 'docx';
import { chapterLabels } from './render';
import { resolveDesign } from './themes';
import { fetchBuffer } from './images';

function decode(s = '') {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function inlineRuns(tokens = [], style = {}) {
  const runs = [];
  for (const t of tokens) {
    if (t.type === 'strong') runs.push(...inlineRuns(t.tokens, { ...style, bold: true }));
    else if (t.type === 'em') runs.push(...inlineRuns(t.tokens, { ...style, italics: true }));
    else if (t.type === 'codespan') runs.push(new TextRun({ text: decode(t.text), font: 'Consolas', ...style }));
    else if (t.type === 'link') runs.push(...inlineRuns(t.tokens, { ...style, underline: {} }));
    else if (t.type === 'br') runs.push(new TextRun({ text: '', break: 1 }));
    else if (t.tokens) runs.push(...inlineRuns(t.tokens, style));
    else runs.push(new TextRun({ text: decode(t.text || t.raw || ''), ...style }));
  }
  return runs;
}

function imgPara(buf, width = 460) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 240 }, children: [new ImageRun({ type: 'jpg', data: buf, transformation: { width, height: Math.round(width * 0.75) } })] });
}

function blocks(md, accent, extra = []) {
  const out = [];
  const tokens = marked.lexer(md.replace(/^\s*#\s+.*\n/, ''));
  const walk = (toks, ctx = {}) => {
    for (const t of toks) {
      if (t.type === 'heading') {
        const hp = new Paragraph({ heading: t.depth <= 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, children: inlineRuns(t.tokens), spacing: { before: 240, after: 120 } });
        if (t.depth <= 2) hp.__h2 = true;
        out.push(hp);
      } else if (t.type === 'paragraph' || t.type === 'text') {
        out.push(new Paragraph({
          children: inlineRuns(t.tokens || [{ type: 'text', text: t.text }]),
          spacing: { after: 140, line: 320 },
          alignment: ctx.quote ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
          ...(ctx.quote ? { shading: { type: ShadingType.CLEAR, fill: 'F3F0E8' }, border: { left: { style: BorderStyle.SINGLE, size: 24, color: accent, space: 8 } }, indent: { left: 240, right: 240 } } : {}),
        }));
      } else if (t.type === 'list') {
        t.items.forEach((item, idx) => {
          const inner = item.tokens.find((x) => x.type === 'text' || x.type === 'paragraph');
          const prefix = t.ordered ? `${(t.start || 1) + idx}. ` : '• ';
          out.push(new Paragraph({
            children: [new TextRun({ text: prefix, bold: true, color: accent }), ...inlineRuns(inner?.tokens || [{ type: 'text', text: item.text }])],
            indent: { left: 420, hanging: 280 },
            spacing: { after: 80 },
          }));
          const nested = item.tokens.filter((x) => x.type === 'list');
          if (nested.length) walk(nested, ctx);
        });
      } else if (t.type === 'blockquote') {
        walk(t.tokens, { quote: true });
      } else if (t.type === 'table') {
        const rows = [t.header.map((h) => h.text).join(' | '), ...t.rows.map((r) => r.map((c) => c.text).join(' | '))];
        rows.forEach((r, i) => out.push(new Paragraph({ children: [new TextRun({ text: decode(r), bold: i === 0 })], spacing: { after: 60 } })));
      } else if (t.type === 'hr') {
        out.push(new Paragraph({ text: '' }));
      }
    }
  };
  walk(tokens);
  if (extra.length) {
    // repartir imágenes extra antes de los subtítulos
    const hIdx = out.map((p, i) => (p.__h2 ? i : -1)).filter((i) => i > 0);
    const res = [...out];
    const positions = hIdx.length ? extra.map((_, k) => hIdx[Math.min(hIdx.length - 1, Math.round(((k + 1) * hIdx.length) / (extra.length + 1)))]) : extra.map(() => res.length);
    positions.map((pos, k) => [pos, k]).sort((a, b) => b[0] - a[0]).forEach(([pos, k]) => res.splice(pos, 0, imgPara(extra[k], 380)));
    return res;
  }
  return out;
}

export async function buildDocx(ebook, coverJpg) {
  const d = resolveDesign(ebook.design);
  const accent = d.accent.replace('#', '').toUpperCase();
  const head = d.theme.fonts.head;
  const bodyFont = d.theme.fonts.body;
  const labels = chapterLabels(ebook.outline || []);
  const children = [];

  if (coverJpg) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'jpg', data: coverJpg, transformation: { width: 400, height: 640 } })] }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
  children.push(new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: ebook.title || '', bold: true, size: 52, font: head })] }));
  if (ebook.subtitle) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: ebook.subtitle, italics: true, size: 28 })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: (ebook.author || '').toUpperCase(), size: 22, characterSpacing: 60 })] }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ spacing: { before: 6000 }, children: [new TextRun({ text: `© ${new Date().getFullYear()} ${ebook.author || ''}. Todos los derechos reservados.`, size: 18, color: '666666' })] }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Contenido')] }));
  children.push(new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-1' }));

  const imgBufs = await Promise.all(
    (ebook.outline || []).map(async (_, i) => {
      const list = (ebook.chapters?.[i]?.images || []).filter((x) => x?.url);
      return (await Promise.all(list.map((im) => fetchBuffer(im.url)))).filter(Boolean);
    })
  );

  (ebook.outline || []).forEach((c, i) => {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    if (labels[i]) children.push(new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: labels[i].toUpperCase(), color: accent, bold: true, size: 20, characterSpacing: 80, font: head })] }));
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: labels[i] ? 120 : 600, after: 400 }, children: [new TextRun(c.title)] }));
    const imgs = imgBufs[i] || [];
    if (imgs[0]) children.push(imgPara(imgs[0]));
    children.push(...blocks(ebook.chapters?.[i]?.content || '', accent, imgs.slice(1)));
  });

  if (ebook.kit?.author_bio) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Sobre el autor')] }));
    children.push(new Paragraph({ children: [new TextRun(ebook.kit.author_bio)] }));
  }

  const doc = new Document({
    creator: ebook.author || 'Ebook Studio',
    title: ebook.title,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: bodyFont, size: 23 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: head, size: 44, bold: true, color: '222222' } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: head, size: 30, bold: true, color: accent } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: head, size: 25, bold: true } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 8640, height: 12960 }, margin: { top: 1200, bottom: 1200, left: 1100, right: 1100 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888' })] })] }) },
      children,
    }],
  });
  return Packer.toBuffer(doc);
}
