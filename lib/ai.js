// Capa de IA: motores gratis con respaldo automático.
// Todos usan formato compatible con OpenAI (chat/completions).
import { getSettings } from './db';

export const PROVIDERS = {
  gemini: {
    label: 'Google Gemini',
    signup: 'https://aistudio.google.com/apikey',
    key: () => process.env.GEMINI_API_KEY,
    url: () => 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    fallbackModel: 'gemini-2.5-flash',
  },
  groq: {
    label: 'Groq',
    signup: 'https://console.groq.com/keys',
    key: () => process.env.GROQ_API_KEY,
    url: () => 'https://api.groq.com/openai/v1/chat/completions',
    fallbackModel: 'openai/gpt-oss-120b',
  },
  openrouter: {
    label: 'OpenRouter (modelos gratis)',
    signup: 'https://openrouter.ai/keys',
    key: () => process.env.OPENROUTER_API_KEY,
    url: () => 'https://openrouter.ai/api/v1/chat/completions',
    fallbackModel: 'openrouter/free',
  },
  cloudflare: {
    label: 'Cloudflare Workers AI',
    signup: 'https://dash.cloudflare.com/?to=/:account/ai/workers-ai',
    key: () => (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN ? process.env.CLOUDFLARE_API_TOKEN : ''),
    url: () => `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
    fallbackModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  },
};

export const DEFAULT_ORDER = ['gemini', 'groq', 'openrouter', 'cloudflare'];

export function configuredProviders() {
  return Object.keys(PROVIDERS).filter((p) => !!PROVIDERS[p].key());
}

// ---------- Listado de modelos (para elegir en Ajustes) ----------
const modelCache = {};

export async function listModels(provider) {
  const cached = modelCache[provider];
  if (cached && Date.now() - cached.t < 30 * 60 * 1000) return cached.list;
  const key = PROVIDERS[provider].key();
  if (!key) return [];
  let list = [];
  try {
    if (provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${key}`);
      const j = await r.json();
      list = (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace('models/', ''))
        .filter((n) => n.startsWith('gemini') && !/(image|tts|audio|live|embedding|robotics|computer)/i.test(n));
    } else if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
      const j = await r.json();
      list = (j.data || []).map((m) => m.id).filter((id) => !/(whisper|guard|tts|orpheus|safeguard)/i.test(id));
    } else if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/models');
      const j = await r.json();
      list = (j.data || [])
        .filter((m) => m.id === 'openrouter/free' || m.id.endsWith(':free'))
        .filter((m) => !/(safety|code|guard)/i.test(m.id))
        .map((m) => m.id);
      if (!list.includes('openrouter/free')) list.unshift('openrouter/free');
    } else if (provider === 'cloudflare') {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/models/search?task=Text%20Generation&per_page=100`,
        { headers: { Authorization: `Bearer ${key}` } }
      );
      const j = await r.json();
      list = (j.result || []).map((m) => m.name).filter((n) => !/(guard|coder|math)/i.test(n));
    }
  } catch {
    list = [];
  }
  modelCache[provider] = { t: Date.now(), list };
  return list;
}

function versionScore(name) {
  const m = name.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

export async function pickModel(provider, settings) {
  const chosen = settings?.models?.[provider];
  if (chosen) return chosen;
  const list = await listModels(provider);
  if (provider === 'gemini' && list.length) {
    const flash = list.filter((n) => /flash/i.test(n) && !/lite/i.test(n) && !/-\d{3,}$/.test(n));
    const pool = flash.length ? flash : list;
    const stable = pool.filter((n) => !/(preview|exp)/i.test(n));
    const sorted = (stable.length ? stable : pool).sort((a, b) => versionScore(b) - versionScore(a));
    return sorted[0];
  }
  if (provider === 'groq' && list.length) {
    return list.find((n) => n === 'openai/gpt-oss-120b') || list.find((n) => /120b|70b|qwen/i.test(n)) || list[0];
  }
  if (provider === 'cloudflare' && list.length) {
    return list.find((n) => n === PROVIDERS.cloudflare.fallbackModel) || list.find((n) => /70b|gpt-oss|qwen/i.test(n)) || list[0];
  }
  return PROVIDERS[provider].fallbackModel;
}

// ---------- Llamada con respaldo automático ----------
function cleanText(t) {
  return (t || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function callProvider(provider, model, { system, prompt, maxTokens, temperature }) {
  const p = PROVIDERS[provider];
  const body = {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature,
  };
  if (provider === 'groq' && /gpt-oss/.test(model)) {
    body.reasoning_effort = 'low';
    body.include_reasoning = false;
  }
  if (provider === 'gemini' && /2\.5|3/.test(model)) {
    body.reasoning_effort = 'low';
  }
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key()}` };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ebook-studio.app';
    headers['X-Title'] = 'Ebook Studio';
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 240000);
  try {
    const r = await fetch(p.url(), { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
    const raw = await r.text();
    if (!r.ok) {
      const err = new Error(`${p.label} (${r.status}): ${raw.slice(0, 300)}`);
      err.status = r.status;
      throw err;
    }
    const j = JSON.parse(raw);
    const text = cleanText(j.choices?.[0]?.message?.content);
    if (!text) throw new Error(`${p.label}: respuesta vacía`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Genera texto probando los motores en orden hasta que uno responda.
 * opts: { system, prompt, maxTokens, temperature, prefer, json }
 */
export async function generate(opts) {
  const settings = await getSettings();
  const order = (settings.order && settings.order.length ? settings.order : DEFAULT_ORDER).filter((p) => PROVIDERS[p]);
  let providers = order.filter((p) => PROVIDERS[p].key() && !(settings.disabled || []).includes(p));
  if (opts.prefer && providers.includes(opts.prefer)) {
    providers = [opts.prefer, ...providers.filter((p) => p !== opts.prefer)];
  }
  if (!providers.length) {
    throw new Error('No hay motores de IA configurados. Agrega al menos GEMINI_API_KEY (gratis) en las variables de entorno de Vercel.');
  }
  const errors = [];
  for (const provider of providers) {
    try {
      const model = await pickModel(provider, settings);
      const text = await callProvider(provider, model, {
        system: opts.system,
        prompt: opts.prompt,
        maxTokens: opts.maxTokens || 4000,
        temperature: opts.temperature ?? 0.8,
      });
      if (opts.json) {
        const data = parseJSON(text);
        return { data, text, provider, model };
      }
      return { text, provider, model };
    } catch (e) {
      errors.push(e.message);
    }
  }
  const err = new Error('Todos los motores fallaron o llegaron a su límite gratis por ahora. Espera unos minutos e intenta de nuevo.\n\n' + errors.join('\n'));
  err.status = 429;
  throw err;
}

export function parseJSON(text) {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(t);
  } catch {}
  const starts = [t.indexOf('{'), t.indexOf('[')].filter((i) => i >= 0);
  const start = Math.min(...starts);
  const end = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (start >= 0 && end > start) {
    const slice = t.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // limpiar comas finales
      return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1'));
    }
  }
  throw new Error('La IA no devolvió JSON válido');
}

// ---------- Búsqueda de tendencias con Google (Gemini + Google Search) ----------
export async function searchTrends(query) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const settings = await getSettings();
    const model = await pickModel('gemini', settings);
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ google_search: {} }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function testProvider(provider) {
  const settings = await getSettings();
  const model = await pickModel(provider, settings);
  const text = await callProvider(provider, model, { prompt: 'Responde solo con la palabra: listo', maxTokens: 200, temperature: 0 });
  return { model, text };
}
