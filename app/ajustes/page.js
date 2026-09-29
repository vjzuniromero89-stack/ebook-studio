'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

export default function Ajustes() {
  const [st, setSt] = useState(null);
  const [order, setOrder] = useState([]);
  const [models, setModels] = useState({});
  const [disabled, setDisabled] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [tests, setTests] = useState({});

  useEffect(() => {
    api('/api/status').then((j) => {
      setSt(j);
      setOrder(j.settings.order || j.providers.map((p) => p.id));
      setModels(j.settings.models || {});
      setDisabled(j.settings.disabled || []);
    }).catch((e) => setErr(e.message));
  }, []);

  function move(id, dir) {
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o);
  }

  async function save() {
    setMsg(''); setErr('');
    try {
      await api('/api/settings', { method: 'POST', body: { order, models, disabled } });
      setMsg('Guardado');
    } catch (e) { setErr(e.message); }
  }

  async function test(id) {
    setTests((t) => ({ ...t, [id]: { busy: true } }));
    try {
      const r = await api('/api/test', { method: 'POST', body: { provider: id } });
      setTests((t) => ({ ...t, [id]: { ok: true, text: `Funciona (${r.model})` } }));
    } catch (e) {
      setTests((t) => ({ ...t, [id]: { ok: false, text: e.message } }));
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  if (!st) return <>{err ? <div className="err">{err}</div> : <p className="muted"><span className="spin" /> Cargando…</p>}</>;
  const byId = Object.fromEntries(st.providers.map((p) => [p.id, p]));

  return (
    <>
      <h1>Ajustes</h1>
      <p className="sub">Motores de IA gratis. La app los usa en este orden y salta al siguiente si uno llega a su límite.</p>
      {!st.supabase && <div className="err" style={{ marginBottom: 14 }}>Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.</div>}
      <div className="grid" style={{ gap: 12 }}>
        {order.filter((id) => byId[id]).map((id, idx) => {
          const p = byId[id];
          const t = tests[id];
          const off = disabled.includes(id);
          return (
            <div key={id} className="card">
              <div className="row spread">
                <div className="row">
                  <b style={{ fontSize: 16 }}>{idx + 1}. {p.label}</b>
                  {p.configured ? (off ? <span className="pill warn">Pausado</span> : <span className="pill ok">Conectado</span>) : <span className="pill bad">Sin API key</span>}
                </div>
                <div className="row">
                  <button className="btn sm" onClick={() => move(id, -1)} disabled={idx === 0}>↑</button>
                  <button className="btn sm" onClick={() => move(id, 1)} disabled={idx === order.length - 1}>↓</button>
                </div>
              </div>
              {p.configured ? (
                <div style={{ marginTop: 12 }}>
                  <label>Modelo</label>
                  <select value={models[id] || ''} onChange={(e) => setModels({ ...models, [id]: e.target.value })}>
                    <option value="">Automático ({p.model})</option>
                    {p.models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="row" style={{ marginTop: 10 }}>
                    <button className="btn sm" onClick={() => test(id)} disabled={t?.busy}>{t?.busy ? <span className="spin" /> : 'Probar'}</button>
                    <button className="btn sm ghost" onClick={() => setDisabled(off ? disabled.filter((x) => x !== id) : [...disabled, id])}>{off ? 'Activar' : 'Pausar'}</button>
                  </div>
                  {t && !t.busy && <div className={t.ok ? 'note small' : 'err'} style={{ marginTop: 10 }}>{t.text}</div>}
                </div>
              ) : (
                <p className="small muted" style={{ marginBottom: 0 }}>
                  Crea tu API key gratis en <a href={p.signup} target="_blank" rel="noreferrer">{p.signup.replace('https://', '').split('/')[0]}</a> y agrégala en Vercel &gt; Settings &gt; Environment Variables. Luego haz Redeploy.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <b style={{ fontSize: 16 }}>Imágenes con IA</b>
        <p className="small" style={{ marginBottom: 0 }}>
          {st.images?.cloudflare
            ? <><span className="pill ok">Cloudflare FLUX activo</span> Unas 230 imágenes gratis al día. Respaldo: Pollinations.ai.</>
            : <><span className="pill warn">Usando Pollinations.ai</span> Gratis pero más lento. Para imágenes rápidas y de mejor calidad, agrega CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (gratis, unas 230 imágenes al día).</>}
        </p>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={save}>Guardar ajustes</button>
        <button className="btn ghost" onClick={logout}>Cerrar sesión</button>
        {msg && <span className="pill ok">{msg}</span>}
      </div>
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
    </>
  );
}
