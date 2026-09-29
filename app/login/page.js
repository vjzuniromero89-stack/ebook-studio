'use client';
import { useState } from 'react';

export default function Login() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) window.location.href = '/';
    else { setErr('Contraseña incorrecta'); setBusy(false); }
  }
  return (
    <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={go} className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div className="logo" style={{ marginBottom: 14 }}><i />Ebook Studio</div>
        <div className="field"><label>Contraseña</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></div>
        {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? <span className="spin" /> : 'Entrar'}</button>
      </form>
    </div>
  );
}
