'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { PLATFORMS } from '@/lib/platforms';

function Copy({ label, text }) {
  const [ok, setOk] = useState(false);
  if (!text) return null;
  return (
    <div className="copy" style={{ marginBottom: 14 }}>
      <div className="row spread" style={{ marginBottom: 5 }}>
        <label style={{ margin: 0 }}>{label}</label>
        <button className="btn sm" onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? 'Copiado' : 'Copiar'}</button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}

const FILES = [
  ['zip', 'Todo en un ZIP', 'PDF + EPUB + Word + portada + kit'],
  ['pdf', 'PDF', 'Hotmart, Gumroad, Payhip'],
  ['epub', 'EPUB', 'Amazon KDP, Apple, Google, Kobo'],
  ['docx', 'Word (DOCX)', 'Para editar o Draft2Digital'],
  ['cover', 'Portada JPG', '1600x2560, lista para KDP'],
  ['md', 'Markdown', 'Texto plano'],
];

export default function Publish({ eb, setEb }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const k = eb.kit;
  const sp = k?.sales_page || {};

  async function makeKit() {
    setBusy('kit'); setErr('');
    try { const j = await api(`/api/ebooks/${eb.id}/kit`, { method: 'POST' }); setEb(j.ebook); } catch (e) { setErr(e.message); }
    setBusy('');
  }

  async function download(fmt) {
    setBusy(fmt); setErr('');
    try {
      const r = await fetch(`/api/ebooks/${eb.id}/export?format=${fmt}`);
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Error al exportar'); }
      const blob = await r.blob();
      const name = (r.headers.get('Content-Disposition') || '').match(/filename="(.+?)"/)?.[1] || `ebook.${fmt}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { setErr(e.message); }
    setBusy('');
  }

  async function markPublished() {
    const j = await api(`/api/ebooks/${eb.id}`, { method: 'PATCH', body: { status: 'publicado' } });
    setEb(j.ebook);
  }

  const salesText = k ? [sp.headline, sp.subheadline, '', ...(sp.bullets || []).map((b) => `✔ ${b}`), '', 'Para quién es:', ...(sp.for_who || []).map((b) => `- ${b}`), '', `Garantía: ${sp.guarantee || ''}`, '', sp.cta, '', ...(sp.faq || []).map((f) => `${f.q}\n${f.a}\n`)].join('\n') : '';

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Descargar archivos</h2>
        <div className="grid g3" style={{ gap: 10 }}>
          {FILES.map(([fmt, label, hint]) => (
            <button key={fmt} className={`btn ${fmt === 'zip' ? 'primary' : ''}`} onClick={() => download(fmt)} disabled={!!busy} style={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '12px 14px' }}>
              <span>{busy === fmt ? <span className="spin" /> : label}</span>
              <span style={{ fontWeight: 400, fontSize: 12, opacity: .8 }}>{hint}</span>
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>El PDF y el ZIP pueden tardar entre 10 y 30 segundos.</p>
        {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row spread">
          <h2 style={{ margin: 0 }}>Kit de publicación</h2>
          <button className="btn sm" onClick={makeKit} disabled={!!busy}>{busy === 'kit' ? <span className="spin" /> : k ? 'Regenerar' : 'Generar kit con IA'}</button>
        </div>
        {!k && <p className="muted">La IA escribe descripción, palabras clave, categorías, precios, página de ventas, contraportada, posts y email.</p>}
        {k && (
          <div style={{ marginTop: 14 }}>
            <Copy label="Título" text={eb.title} />
            <Copy label="Subtítulo" text={eb.subtitle} />
            <Copy label="Descripción corta" text={k.short_description} />
            <Copy label="Descripción larga (Hotmart / KDP / Gumroad)" text={k.long_description} />
            <Copy label="7 palabras clave (Amazon KDP)" text={(k.keywords || []).join('\n')} />
            <Copy label="Categorías Amazon" text={(k.kdp_categories || []).join('\n')} />
            <Copy label="Categoría Hotmart" text={k.hotmart_category} />
            <Copy label="Etiquetas" text={(k.tags || []).join(', ')} />
            <Copy label="Precios sugeridos (USD)" text={Object.entries(k.prices || {}).map(([p, v]) => `${p}: ${v}`).join('\n')} />
            <Copy label="Página de ventas" text={salesText} />
            <Copy label="Contraportada" text={k.back_cover} />
            <Copy label="Biografía del autor" text={k.author_bio} />
            <Copy label="Posts para redes" text={(k.social_posts || []).join('\n\n---\n\n')} />
            <Copy label="Email de lanzamiento" text={k.email} />
            <button className="btn sm" onClick={() => download('kit')}>Descargar kit (.md)</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="row spread"><h2 style={{ margin: 0 }}>Publicar en plataformas</h2>{eb.status !== 'publicado' ? <button className="btn sm" onClick={markPublished}>Marcar como publicado</button> : <span className="pill ok">Publicado</span>}</div>
        <p className="small muted">Estas plataformas no permiten publicar por API, así que abre cada una, copia el kit y sube los archivos. Toma unos 5 minutos por plataforma.</p>
        <div className="grid g2" style={{ gap: 10 }}>
          {PLATFORMS.map((p) => (
            <div key={p.id} className="chapter-item">
              <div className="row spread"><b>{p.name}</b><a className="btn sm primary" href={p.url} target="_blank" rel="noreferrer">Abrir</a></div>
              <div className="small muted" style={{ margin: '6px 0' }}>Archivos: {p.files}{k?.prices?.[p.priceKey] ? ` · Precio: ${k.prices[p.priceKey]}` : ''}</div>
              <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
