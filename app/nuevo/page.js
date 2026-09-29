'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

const THEMES = [['elegante', 'Elegante'], ['moderno', 'Moderno'], ['minimal', 'Minimal'], ['vibrante', 'Vibrante'], ['premium', 'Premium'], ['natural', 'Natural']];

export default function Nuevo() {
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  const [f, setF] = useState({
    topic: '', title: '', subtitle: '', author: '', audience: '', language: 'Español', tone: 'Cercano, motivador y práctico',
    chapters: 8, words: 1800, notes: '', theme: 'elegante', pageSize: '6x9', polish: false, engine: '', ideaId: null,
    imageStyle: 'ilustracion', imagesPerChapter: 1, aiCover: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    try {
      if (window.location.search.includes('fromIdea')) {
        const idea = JSON.parse(sessionStorage.getItem('idea') || 'null');
        if (idea) {
          setF((p) => ({
            ...p, topic: `${idea.title}. ${idea.problem || ''} Enfoque: ${idea.angle || ''}`.trim(), title: idea.title, subtitle: idea.subtitle || '',
            audience: idea.audience || '', ideaId: idea.ideaId,
          }));
        }
      }
      const a = localStorage.getItem('author');
      if (a) setF((p) => ({ ...p, author: p.author || a }));
    } catch {}
    api('/api/status').then((j) => setProviders(j.providers.filter((p) => p.configured))).catch(() => {});
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function create(e) {
    e.preventDefault();
    if (!f.topic.trim()) { setErr('Escribe el tema del ebook'); return; }
    setBusy(true); setErr('');
    try {
      try { localStorage.setItem('author', f.author); } catch {}
      const j = await api('/api/ebooks', { method: 'POST', body: f });
      router.push(`/ebook/${j.ebook.id}?auto=1`);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  const pages = Math.round(((Number(f.chapters) + 2) * Number(f.words)) / 280);

  return (
    <form onSubmit={create}>
      <h1>Nuevo ebook</h1>
      <p className="sub">Describe tu tema y la IA arma el índice. Luego escribe cada capítulo y lo diseña.</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <div className="card">
          <h2>Contenido</h2>
          <div className="field"><label>Tema del ebook *</label><textarea value={f.topic} onChange={set('topic')} placeholder="Ej: Cómo empezar un negocio de bordado desde casa y conseguir tus primeros 20 clientes" /></div>
          <div className="field"><label>Título (opcional, la IA lo propone)</label><input value={f.title} onChange={set('title')} /></div>
          <div className="field"><label>Subtítulo (opcional)</label><input value={f.subtitle} onChange={set('subtitle')} /></div>
          <div className="field"><label>Nombre del autor</label><input value={f.author} onChange={set('author')} placeholder="Tu nombre o seudónimo" /></div>
          <div className="field"><label>Público objetivo</label><input value={f.audience} onChange={set('audience')} placeholder="Ej: mamás emprendedoras principiantes" /></div>
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="field"><label>Idioma</label><select value={f.language} onChange={set('language')}>{['Español', 'English', 'Português'].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div className="field"><label>Tono</label><select value={f.tone} onChange={set('tone')}>{['Cercano, motivador y práctico', 'Profesional y experto', 'Sencillo, para principiantes', 'Inspirador y emocional', 'Directo y sin rodeos'].map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>
          <div className="field"><label>Indicaciones extra (opcional)</label><textarea value={f.notes} onChange={set('notes')} placeholder="Ej: incluye plantillas, ejemplos de Nicaragua, un capítulo de errores comunes…" style={{ minHeight: 70 }} /></div>
        </div>
        <div className="card">
          <h2>Extensión y motor</h2>
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="field"><label>Capítulos</label><select value={f.chapters} onChange={set('chapters')}>{[5, 6, 7, 8, 10, 12, 15].map((n) => <option key={n}>{n}</option>)}</select></div>
            <div className="field"><label>Palabras por capítulo</label><select value={f.words} onChange={set('words')}>{[[1000, 'Corto (1000)'], [1800, 'Medio (1800)'], [2500, 'Largo (2500)'], [3500, 'Muy largo (3500)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <p className="hint" style={{ marginTop: -6 }}>Aprox. {pages} páginas en tamaño 6x9.</p>
          <div className="field"><label>Motor de IA preferido</label>
            <select value={f.engine} onChange={set('engine')}>
              <option value="">Automático (usa el orden de Ajustes)</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <div className="hint">Si el motor llega a su límite gratis, la app cambia sola al siguiente.</div>
          </div>
          <label className="row" style={{ fontWeight: 500, gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={f.polish} onChange={set('polish')} style={{ width: 18, height: 18 }} />
            Revisión cruzada: otro motor corrige y pule cada capítulo (mejor calidad, usa el doble de cuota)
          </label>
          <h2>Diseño</h2>
          <div className="grid g3" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
            {THEMES.map(([k, l]) => <div key={k} className={`theme-opt ${f.theme === k ? 'on' : ''}`} onClick={() => setF({ ...f, theme: k })}>{l}</div>)}
          </div>
          <h2>Imágenes con IA (gratis)</h2>
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="field"><label>Estilo de ilustraciones</label>
              <select value={f.imageStyle} onChange={set('imageStyle')}>
                {[['ilustracion', 'Ilustración plana moderna'], ['acuarela', 'Acuarela'], ['lapiz', 'Dibujo a lápiz / tinta'], ['realista', 'Foto realista'], ['3d', '3D suave'], ['minimal', 'Minimalista'], ['infantil', 'Infantil / cuento']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label>Imágenes por capítulo</label>
              <select value={f.imagesPerChapter} onChange={set('imagesPerChapter')}>
                <option value={0}>Ninguna</option><option value={1}>1 (al inicio)</option><option value={2}>2</option><option value={3}>3</option>
              </select>
            </div>
          </div>
          <label className="row" style={{ fontWeight: 500, gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={f.aiCover} onChange={set('aiCover')} style={{ width: 18, height: 18 }} />
            Portada con ilustración creada por IA
          </label>
          <div className="field"><label>Tamaño de página</label>
            <select value={f.pageSize} onChange={set('pageSize')}>
              <option value="6x9">6 x 9 in (Amazon KDP)</option><option value="letter">Carta (guías/workbooks)</option><option value="a4">A4</option><option value="a5">A5</option>
            </select>
          </div>
          {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
          <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? <span className="spin" /> : 'Crear y generar índice →'}</button>
        </div>
      </div>
    </form>
  );
}
