export const PLATFORMS = [
  {
    id: 'hotmart', name: 'Hotmart', url: 'https://app.hotmart.com/products/add',
    files: 'PDF (y EPUB como bono)', priceKey: 'hotmart',
    steps: ['Productos > Crear producto > Ebook', 'Pega nombre y descripción larga', 'Sube la portada JPG como imagen del producto', 'Sube el PDF en "Contenido"', 'Pon el precio sugerido y la categoría', 'Usa la página de ventas del kit para tu página de ventas'],
  },
  {
    id: 'kdp', name: 'Amazon KDP', url: 'https://kdp.amazon.com/es_ES/bookshelf',
    files: 'EPUB + portada JPG (1600x2560)', priceKey: 'kdp',
    steps: ['Crear > Ebook Kindle', 'Pega título, subtítulo, autor y descripción larga', 'Pega las 7 palabras clave y elige las 3 categorías', 'Declara si el contenido fue generado con IA (obligatorio)', 'Sube el EPUB como manuscrito y la portada JPG', 'Precio entre 2.99 y 9.99 USD para 70% de regalías'],
  },
  {
    id: 'gumroad', name: 'Gumroad', url: 'https://app.gumroad.com/products/new',
    files: 'PDF + EPUB + DOCX (ofrece todos los formatos)', priceKey: 'gumroad',
    steps: ['New product > Digital product', 'Pega nombre, precio y descripción', 'Sube la portada JPG como imagen', 'Sube PDF y EPUB en el contenido', 'Publish'],
  },
  {
    id: 'payhip', name: 'Payhip', url: 'https://payhip.com/product/add/digital',
    files: 'PDF + EPUB', priceKey: 'gumroad',
    steps: ['Add product > Digital download', 'Sube PDF/EPUB y la portada', 'Pega descripción y precio', 'Publish'],
  },
  {
    id: 'd2d', name: 'Draft2Digital (Apple Books, Kobo, B&N, Scribd y más)', url: 'https://www.draft2digital.com/',
    files: 'EPUB o DOCX + portada JPG', priceKey: 'kdp',
    steps: ['Una sola subida distribuye a muchas tiendas', 'Add new book > sube el EPUB o DOCX', 'Sube la portada JPG', 'Pega descripción y palabras clave', 'Elige las tiendas y el precio'],
  },
  {
    id: 'gplay', name: 'Google Play Libros', url: 'https://play.google.com/books/publish/',
    files: 'EPUB + PDF + portada JPG', priceKey: 'kdp',
    steps: ['Añadir libro', 'Pega detalles y descripción', 'Sube EPUB y PDF en "Contenido"', 'Configura precio y países'],
  },
];

export function kitMarkdown(ebook) {
  const k = ebook.kit || {};
  const sp = k.sales_page || {};
  const lines = [];
  lines.push(`# Kit de publicación: ${ebook.title}`, '');
  lines.push(`**Título:** ${ebook.title}`, `**Subtítulo:** ${ebook.subtitle || ''}`, `**Autor:** ${ebook.author || ''}`, '');
  lines.push('## Descripción corta', k.short_description || '', '');
  lines.push('## Descripción larga', k.long_description || '', '');
  lines.push('## Palabras clave (Amazon KDP)', ...(k.keywords || []).map((x) => `- ${x}`), '');
  lines.push('## Etiquetas', (k.tags || []).join(', '), '');
  lines.push('## Categorías Amazon', ...(k.kdp_categories || []).map((x) => `- ${x}`), '');
  lines.push(`## Categoría Hotmart`, k.hotmart_category || '', '');
  lines.push('## Precios sugeridos', ...Object.entries(k.prices || {}).map(([p, v]) => `- ${p}: ${v}`), '');
  lines.push('## Página de ventas', `### ${sp.headline || ''}`, sp.subheadline || '', '', ...(sp.bullets || []).map((b) => `- ${b}`), '', '**Para quién es:**', ...(sp.for_who || []).map((b) => `- ${b}`), '', `**Garantía:** ${sp.guarantee || ''}`, '', `**Botón:** ${sp.cta || ''}`, '');
  if (sp.faq?.length) lines.push('### Preguntas frecuentes', ...sp.faq.map((f) => `**${f.q}**\n${f.a}\n`), '');
  lines.push('## Contraportada', k.back_cover || '', '');
  lines.push('## Biografía del autor', k.author_bio || '', '');
  lines.push('## Publicaciones para redes', ...(k.social_posts || []).map((p, i) => `${i + 1}. ${p}\n`), '');
  lines.push('## Email de lanzamiento', k.email || '', '');
  lines.push('---', '## Cómo publicar en cada plataforma', '');
  for (const p of PLATFORMS) {
    lines.push(`### ${p.name}`, `Enlace: ${p.url}`, `Archivos: ${p.files}`, `Precio sugerido: ${k.prices?.[p.priceKey] || ''}`, ...p.steps.map((s, i) => `${i + 1}. ${s}`), '');
  }
  return lines.join('\n');
}
