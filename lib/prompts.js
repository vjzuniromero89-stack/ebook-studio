import { getLang } from './languages';

const langName = (v) => getLang(v).ai;

const SYSTEM_WRITER = `Eres un escritor profesional de ebooks de no ficción y un experto en marketing de infoproductos.
Escribes contenido original, práctico, claro y bien estructurado, que el lector puede aplicar de inmediato.
Nunca inventas estadísticas exactas ni citas de personas reales; si das datos, los presentas como aproximados.`;

export function ideasPrompt({ niche, language, platform, count = 8, trends }) {
  const lang = langName(language);
  return {
    system: SYSTEM_WRITER,
    prompt: `Necesito ideas de ebooks rentables para vender en ${platform || 'Hotmart, Amazon KDP y Gumroad'}.
Idioma de los ebooks y del público comprador: ${lang}. Piensa en lo que compran las personas que hablan ese idioma.
IMPORTANTE: escribe TODOS los textos del JSON (títulos, subtítulos, descripciones, palabras clave) en ${lang}.
${niche ? `Mis intereses o nicho: ${niche}.` : 'Sin nicho definido: propón nichos variados con alta demanda (dinero, salud y bienestar, relaciones, desarrollo personal, habilidades digitales, oficios, hobbies).'}
${trends ? `\nTendencias actuales encontradas en internet (úsalas como base):\n${trends}\n` : ''}
Genera ${count} ideas. Prioriza problemas urgentes por los que la gente ya paga, con enfoque específico (no temas genéricos).

Responde SOLO con JSON válido con esta forma exacta:
{"ideas":[{
 "title":"título atractivo y vendedor",
 "subtitle":"subtítulo con la promesa principal",
 "niche":"nicho",
 "audience":"a quién va dirigido exactamente",
 "problem":"problema doloroso que resuelve",
 "why_now":"por qué se vende hoy",
 "demand":1-10,
 "competition":1-10,
 "score":1-100,
 "price_usd":"rango de precio sugerido, ej. 9-17",
 "best_platforms":["Hotmart","Amazon KDP"],
 "keywords":["5 a 7 palabras clave"],
 "angle":"ángulo diferenciador para destacar frente a la competencia"
}]}`,
  };
}

export function outlinePrompt(s) {
  return {
    system: SYSTEM_WRITER,
    prompt: `Diseña la estructura de un ebook profesional.

Tema: ${s.topic}
${s.title ? `Título deseado: ${s.title}` : ''}
Público objetivo: ${s.audience || 'principiantes interesados en el tema'}
Idioma del libro: ${langName(s.language)} (escribe todo en este idioma)
Tono: ${s.tone || 'cercano, motivador y práctico'}
Número de capítulos principales: ${s.chapters || 8}
${s.notes ? `Indicaciones extra: ${s.notes}` : ''}

Incluye al inicio una "Introducción" y al final una "Conclusión" (además de los capítulos principales).
Cada capítulo debe tener un título atractivo y 3 a 5 puntos clave concretos.

Responde SOLO con JSON válido:
{"title":"título final vendedor","subtitle":"subtítulo con la promesa","description":"descripción breve de 2-3 frases",
"chapters":[{"title":"...","summary":"de qué trata en 1-2 frases","points":["...","..."]}]}`,
  };
}

export function chapterPrompt(ebook, index) {
  const s = ebook.settings || {};
  const outline = ebook.outline || [];
  const ch = outline[index];
  const words = s.words || 1800;
  const toc = outline.map((c, i) => `${i + 1}. ${c.title}`).join('\n');
  const isIntro = index === 0;
  const isEnd = index === outline.length - 1;
  return {
    system: SYSTEM_WRITER,
    prompt: `Estás escribiendo el ebook "${ebook.title}"${ebook.subtitle ? ` — ${ebook.subtitle}` : ''}.
Público: ${s.audience || 'general'}. Idioma: ${langName(s.language)}. Tono: ${s.tone || 'cercano y práctico'}.

Índice completo:
${toc}

Escribe AHORA la sección ${index + 1}: "${ch.title}".
Resumen: ${ch.summary || ''}
Puntos a cubrir: ${(ch.points || []).join('; ')}

Requisitos:
- Extensión aproximada: ${isIntro || isEnd ? Math.round(words * 0.6) : words} palabras.
- Formato Markdown. NO repitas el título del capítulo al inicio (ya se pone automáticamente).
- Usa subtítulos con "## ", párrafos cortos, listas con viñetas y **negritas** para ideas clave.
- Incluye al menos un recuadro de consejo escrito así, en una línea que empiece con: > **Consejo:** texto
${isIntro ? '- Engancha al lector desde la primera línea, explica qué va a lograr con el libro y cómo usarlo.' : ''}
${isEnd ? '- Resume las ideas principales, da un plan de acción paso a paso y cierra con un mensaje motivador.' : '- Incluye un ejemplo real o caso práctico y termina con una sección "## Pasos de acción" con una lista numerada.'}
- Escribe contenido completo, no un resumen. No uses emojis.
- Escribe TODO en ${langName(s.language)}, incluidos los subtítulos como "Pasos de acción" y la palabra "Consejo", traducidos a ese idioma.`,
    maxTokens: Math.min(8000, Math.round((words * 2.2) + 800)),
  };
}

export function polishPrompt(ebook, index, text) {
  const s = ebook.settings || {};
  return {
    system: 'Eres un editor profesional de libros. Mejoras la redacción sin cambiar el significado.',
    prompt: `Revisa y mejora este capítulo del ebook "${ebook.title}" (idioma: ${langName(s.language)}).
Corrige ortografía y gramática, mejora la fluidez, elimina repeticiones y haz el texto más claro y atractivo.
Mantén EXACTAMENTE el formato Markdown (## subtítulos, listas, > **Consejo:**). Mantén la misma extensión o un poco más.
Devuelve SOLO el capítulo mejorado, sin comentarios.

---
${text}`,
    maxTokens: 8000,
  };
}

export function kitPrompt(ebook) {
  const s = ebook.settings || {};
  const toc = (ebook.outline || []).map((c, i) => `${i + 1}. ${c.title}`).join('\n');
  return {
    system: SYSTEM_WRITER,
    prompt: `Prepara el kit de publicación y venta del ebook:
Título: ${ebook.title}
Subtítulo: ${ebook.subtitle || ''}
Autor: ${ebook.author || ''}
Público: ${s.audience || ''}
Idioma: ${langName(s.language)}
Índice:
${toc}

Escribe TODOS los textos en ${langName(s.language)} (el idioma del libro). Responde SOLO con JSON válido:
{
"short_description":"descripción de 1-2 frases (máx. 200 caracteres)",
"long_description":"descripción de venta de 150-250 palabras con beneficios en viñetas usando saltos de línea y guiones",
"keywords":["exactamente 7 frases de palabras clave para Amazon KDP"],
"tags":["10 etiquetas cortas"],
"kdp_categories":["3 categorías sugeridas de Amazon, ej. Negocios y Dinero > Pequeñas empresas"],
"hotmart_category":"categoría de Hotmart más adecuada",
"prices":{"hotmart":"precio sugerido USD","kdp":"precio sugerido USD (2.99-9.99 para regalías del 70%)","gumroad":"precio sugerido USD"},
"sales_page":{"headline":"titular","subheadline":"subtitular","bullets":["6 beneficios"],"for_who":["4 perfiles"],"guarantee":"texto de garantía","cta":"llamado a la acción","faq":[{"q":"...","a":"..."}]},
"back_cover":"texto de contraportada de 80-120 palabras",
"author_bio":"biografía breve genérica del autor en tercera persona (2-3 frases) que el usuario puede editar",
"social_posts":["3 publicaciones para redes sociales promocionando el ebook"],
"email":"correo de lanzamiento breve con asunto en la primera línea"
}`,
    maxTokens: 5000,
  };
}

export function imagePromptsPrompt(ebook, index, count) {
  const ch = ebook.outline?.[index];
  const content = (ebook.chapters?.[index]?.content || '').slice(0, 1500);
  return {
    system: 'You are an art director who writes prompts for an AI image generator for professional book illustrations.',
    prompt: `Book: "${ebook.title}"${ebook.subtitle ? ` — ${ebook.subtitle}` : ''}
Audience: ${ebook.settings?.audience || 'general'}
Chapter: "${ch?.title}"
Chapter summary: ${ch?.summary || ''}
${content ? `Chapter excerpt:\n${content}\n` : ''}
Write ${count} different image descriptions IN ENGLISH to illustrate this chapter.
Each one: a concrete, visual scene (subject, action, setting, mood) in 25-45 words. Show people or objects, not abstract concepts.
Never include text, signs, letters, logos, screens with words or brand names. Do not mention the art style.
Reply ONLY with valid JSON: {"prompts":["...","..."]}`,
    maxTokens: 1200,
  };
}

export function coverImagePromptPrompt(ebook) {
  return {
    system: 'You are an art director who designs best-selling book covers.',
    prompt: `Book: "${ebook.title}"${ebook.subtitle ? ` — ${ebook.subtitle}` : ''}
Audience: ${ebook.settings?.audience || 'general'}
Write ONE image description IN ENGLISH for the cover artwork: a single strong, symbolic and attractive central subject related to the book's promise,
vertical composition, calm uncluttered area in the upper half for the title, 30-50 words.
Never include text, letters, logos or brand names. Do not mention the art style.
Reply ONLY with valid JSON: {"prompt":"..."}`,
    maxTokens: 800,
  };
}
