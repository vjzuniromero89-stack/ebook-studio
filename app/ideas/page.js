'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { LANGUAGES } from '@/lib/languages';

function Meter({ value, label, invert }) {
  const v = Math.max(0, Math.min(10, Number(value) || 0));
  return (
    <div className="small">
      <div className="muted" style={{ marginBottom: 3 }}>{label}: <b style={{ color: 'var(--ink)' }}>{v}/10</b></div>
      <div className="meter">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < v ? 'on' : ''} style={invert && i < v ? { background: 'var(--warn)' } : undefined} />)}</div>
    </div>
  );
}

export default function Ideas() {
  const router = useRouter();
  const [form, setForm] = useState({ niche: '', language: 'es', platform: 'Hotmart y Amazon KDP', count: 8, useTrends: true });
  const [ideas, setIdeas] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => { api('/api/ideas').then((j) => setIdeas(j.ideas || [])).catch(() => {}); }, []);

  async function generate() {
    setBusy(true); setErr(''); setInfo('');
    try {
      const j = await api('/api/ideas', { method: 'POST', body: form });
      setIdeas((prev) => [...j.ideas, ...prev]);
      setInfo(`Generado con ${j.provider}${j.trends ? ' + búsqueda de tendencias en Google' : ''}.`);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function remove(id) {
    await api('/api/ideas', { method: 'DELETE', body: { id } });
    setIdeas((p) => p.filter((x) => x.id !== id));
  }

  function use(idea) {
    sessionStorage.setItem('idea', JSON.stringify({ language: form.language, ...idea.data, ideaId: idea.id }));
    router.push('/nuevo?fromIdea=1');
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <h1>Ideas de ebooks con IA</h1>
      <p className="sub">La IA analiza qué se vende y te recomienda temas con demanda, competencia y precio sugerido.</p>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="grid g2">
          <div className="field"><label>Tu nicho o intereses (opcional)</label><input value={form.niche} onChange={set('niche')} placeholder="Ej: mecánica automotriz, finanzas personales, bordado…" /><div className="hint">Déjalo vacío para que la IA explore nichos variados.</div></div>
          <div className="field"><label>Idioma</label><select value={form.language} onChange={set('language')}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          <div className="field"><label>Dónde vas a vender</label><input value={form.platform} onChange={set('platform')} /></div>
          <div className="field"><label>Cantidad de ideas</label><select value={form.count} onChange={set('count')}>{[5, 8, 10, 12].map((n) => <option key={n}>{n}</option>)}</select></div>
        </div>
        <label className="row" style={{ fontWeight: 500, gap: 8, marginBottom: 14 }}>
          <input type="checkbox" checked={form.useTrends} onChange={set('useTrends')} style={{ width: 18, height: 18 }} />
          Buscar tendencias actuales en Google (requiere Gemini)
        </label>
        <button className="btn primary" onClick={generate} disabled={busy}>{busy ? <><span className="spin" /> Analizando el mercado…</> : 'Recomiéndame temas'}</button>
        {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
        {info && <p className="small muted" style={{ marginBottom: 0 }}>{info}</p>}
      </div>

      <div className="grid g2">
        {ideas.map((it) => {
          const d = it.data || {};
          return (
            <div key={it.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="row spread">
                <span className="pill">{d.niche}</span>
                <div className="row">{it.used && <span className="pill ok">Usada</span>}<span className="pill ok" title="Puntuación de oportunidad">{d.score || '?'} pts</span></div>
              </div>
              <div>
                <h3 style={{ fontSize: 17 }}>{d.title}</h3>
                <div className="muted small">{d.subtitle}</div>
              </div>
              <div className="small"><b>Para:</b> {d.audience}</div>
              <div className="small"><b>Problema:</b> {d.problem}</div>
              {d.why_now && <div className="small"><b>Por qué ahora:</b> {d.why_now}</div>}
              {d.angle && <div className="small"><b>Tu ventaja:</b> {d.angle}</div>}
              <div className="row" style={{ gap: 18 }}>
                <Meter value={d.demand} label="Demanda" />
                <Meter value={d.competition} label="Competencia" invert />
              </div>
              <div className="small"><b>Precio sugerido:</b> ${d.price_usd} · <b>Plataformas:</b> {(d.best_platforms || []).join(', ')}</div>
              <div className="row" style={{ marginTop: 'auto' }}>
                <button className="btn primary sm" onClick={() => use(it)}>Crear este ebook</button>
                <button className="btn ghost sm danger" onClick={() => remove(it.id)}>Descartar</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
