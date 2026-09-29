'use client';
import { useState } from 'react';
import { api } from '@/lib/client';

const THEMES = [
  ['elegante', 'Elegante', '#14213d', '#d4a95a'], ['moderno', 'Moderno', '#2f6df6', '#ffd23f'], ['minimal', 'Minimal', '#f3f1ec', '#e4572e'],
  ['vibrante', 'Vibrante', '#ff5f6d', '#6a3df0'], ['premium', 'Premium', '#0b0b0f', '#c9a45c'], ['natural', 'Natural', '#2f5d46', '#e9c46a'],
];
const LAYOUTS = [['auto', 'Según plantilla'], ['elegante', 'Marco clásico'], ['moderno', 'Círculos'], ['minimal', 'Minimal'], ['vibrante', 'Dinámico'], ['premium', 'Lujo'], ['natural', 'Arco']];

const STYLES = [['ilustracion', 'Ilustración plana moderna'], ['acuarela', 'Acuarela'], ['lapiz', 'Dibujo a lápiz / tinta'], ['realista', 'Foto realista'], ['3d', '3D suave'], ['minimal', 'Minimalista'], ['infantil', 'Infantil / cuento']];

export default function Design({ eb, save, busy: parentBusy, onFillImages, onCover }) {
  const d = eb.design || {};
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function set(patch) {
    setBusy(true); setErr('');
    try { await save({ design: { ...d, ...patch } }); } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('file', file);
      await api(`/api/ebooks/${eb.id}/upload`, { method: 'POST', body: fd });
      window.location.reload();
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', alignItems: 'start' }}>
      <div className="card">
        <h2>Portada</h2>
        <div style={{ maxWidth: 300, margin: '0 auto 12px' }}>
          <div className="book-thumb" style={{ aspectRatio: '1600/2560' }}>
            <iframe src={`/api/ebooks/${eb.id}/preview?cover=1&v=${eb.updated_at}`} title="portada" />
          </div>
        </div>
        {busy && <p className="small muted" style={{ textAlign: 'center' }}><span className="spin" /> Actualizando…</p>}
        <a className="btn sm" style={{ width: '100%' }} href={`/api/ebooks/${eb.id}/export?format=cover`}>Descargar portada JPG (1600x2560)</a>
      </div>
      <div className="card">
        <h2>Plantilla</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          {THEMES.map(([k, l, c1, c2]) => (
            <div key={k} className={`theme-opt ${(d.theme || 'elegante') === k ? 'on' : ''}`} onClick={() => set({ theme: k, coverBg: '', coverAccent: '', accent: '' })}>
              <div style={{ height: 34, borderRadius: 6, background: `linear-gradient(135deg, ${c1} 60%, ${c2} 60%)`, marginBottom: 6 }} />{l}
            </div>
          ))}
        </div>
        <div className="field"><label>Estilo de portada</label>
          <select value={d.coverLayout || 'auto'} onChange={(e) => set({ coverLayout: e.target.value })}>{LAYOUTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <div className="field"><label>Fondo portada</label><input type="color" value={d.coverBg || '#14213d'} onChange={(e) => set({ coverBg: e.target.value })} style={{ height: 42, padding: 4 }} /></div>
          <div className="field"><label>Detalle portada</label><input type="color" value={d.coverAccent || '#d4a95a'} onChange={(e) => set({ coverAccent: e.target.value })} style={{ height: 42, padding: 4 }} /></div>
          <div className="field"><label>Color interior</label><input type="color" value={d.accent || '#b8893b'} onChange={(e) => set({ accent: e.target.value })} style={{ height: 42, padding: 4 }} /></div>
        </div>
        <button className="btn sm ghost" onClick={() => set({ coverBg: '', coverAccent: '', accent: '' })}>Restaurar colores de la plantilla</button>

        <h2 style={{ marginTop: 18 }}>Imágenes con IA (gratis)</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field"><label>Estilo</label>
            <select value={d.imageStyle || 'ilustracion'} onChange={(e) => set({ imageStyle: e.target.value })}>{STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          <div className="field"><label>Por capítulo</label>
            <select value={d.imagesPerChapter ?? 1} onChange={(e) => set({ imagesPerChapter: Number(e.target.value) })}>
              <option value={0}>Ninguna</option><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginBottom: 6 }}>
          <button className="btn sm primary" onClick={onCover} disabled={!!parentBusy || busy}>{parentBusy === 'cover' ? <span className="spin" /> : d.coverImage ? 'Nueva portada con IA' : 'Crear portada con IA'}</button>
          <button className="btn sm" onClick={onFillImages} disabled={!!parentBusy || busy}>{parentBusy === 'images' ? <span className="spin" /> : 'Crear imágenes de capítulos'}</button>
        </div>
        <p className="small muted">Para cambiar el estilo de imágenes ya creadas, usa &quot;Otra&quot; en cada capítulo (pestaña Contenido).</p>

        <h2 style={{ marginTop: 18 }}>O sube tu propia imagen de portada</h2>
        <p className="small muted">Por ejemplo, una hecha en Canva o de Unsplash/Pexels (gratis). Se aplica un degradado para que el título se lea bien.</p>
        <div className="row">
          <label className="btn sm" style={{ margin: 0 }}>Subir imagen<input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} /></label>
          {d.coverImage && <button className="btn sm ghost danger" onClick={() => set({ coverImage: '' })}>Quitar imagen</button>}
        </div>

        <h2 style={{ marginTop: 18 }}>Tamaño de página</h2>
        <select value={d.pageSize || '6x9'} onChange={(e) => set({ pageSize: e.target.value })}>
          <option value="6x9">6 x 9 in (Amazon KDP)</option><option value="letter">Carta 8.5 x 11 in</option><option value="a4">A4</option><option value="a5">A5</option>
        </select>
        {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      </div>
    </div>
  );
}
