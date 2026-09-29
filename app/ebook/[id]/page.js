'use client';
import { useCallback, useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api, sleep } from '@/lib/client';
import Design from './Design';
import Publish from './Publish';

export default function EbookPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [eb, setEb] = useState(null);
  const [tab, setTab] = useState('contenido');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [log, setLog] = useState('');
  const [open, setOpen] = useState(null);
  const [dirty, setDirty] = useState(false);
  const stopRef = useRef(false);
  const startedRef = useRef(false);

  const load = useCallback(async () => {
    const j = await api(`/api/ebooks/${id}`);
    setEb(j.ebook);
    return j.ebook;
  }, [id]);

  useEffect(() => {
    load().then((b) => {
      if (!startedRef.current && window.location.search.includes('auto=1') && !(b.outline || []).length) {
        startedRef.current = true;
        window.history.replaceState(null, '', `/ebook/${id}`);
        makeOutline();
      }
    }).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save(patch) {
    const j = await api(`/api/ebooks/${id}`, { method: 'PATCH', body: patch });
    setEb(j.ebook);
    setDirty(false);
    return j.ebook;
  }

  async function makeOutline() {
    setBusy('outline'); setErr(''); setLog('Creando el índice del libro…');
    try {
      const j = await api(`/api/ebooks/${id}/outline`, { method: 'POST' });
      setEb(j.ebook);
      setLog(`Índice creado con ${j.provider}. Revísalo y luego pulsa "Escribir todo el libro".`);
    } catch (e) { setErr(e.message); setLog(''); }
    setBusy('');
  }

  async function writeChapter(i, polishOnly = false) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const j = await api(`/api/ebooks/${id}/chapter`, { method: 'POST', body: { index: i, polishOnly } });
        setEb(j.ebook);
        return j;
      } catch (e) {
        if (attempt === 4 || stopRef.current) throw e;
        const wait = 20 * attempt;
        setLog(`Límite temporal alcanzado. Reintentando en ${wait} s… (intento ${attempt + 1}/4)`);
        await sleep(wait * 1000);
      }
    }
  }

  async function makeImages(i, extra = {}) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const j = await api(`/api/ebooks/${id}/image`, { method: 'POST', body: { target: 'chapter', index: i, ...extra } });
        setEb(j.ebook);
        return j.ebook;
      } catch (e) {
        if (attempt === 3 || stopRef.current) throw e;
        await sleep(15000 * attempt);
      }
    }
  }

  async function makeCover() {
    const j = await api(`/api/ebooks/${id}/image`, { method: 'POST', body: { target: 'cover' } });
    setEb(j.ebook);
    return j.ebook;
  }

  async function fillImages() {
    stopRef.current = false;
    setBusy('images'); setErr('');
    try {
      let b = await load();
      const per = Number(b.design?.imagesPerChapter ?? 1) || 1;
      for (let i = 0; i < b.outline.length; i++) {
        if (stopRef.current) break;
        if ((b.chapters?.[i]?.images || []).length >= per) continue;
        setLog(`Creando ilustración ${i + 1}/${b.outline.length}: ${b.outline[i].title}…`);
        b = await makeImages(i);
      }
      if (!b.design?.coverImage && b.design?.aiCover !== false) { setLog('Creando la ilustración de la portada…'); await makeCover(); }
      setLog('Imágenes listas.');
    } catch (e) { setErr(e.message); }
    setBusy('');
  }

  async function oneImage(i, extra = {}) {
    setBusy('img' + i); setErr('');
    setLog(extra.remove ? 'Quitando imagen…' : `Creando ilustración para: ${eb.outline[i].title}…`);
    try { await makeImages(i, extra); setLog('Listo.'); } catch (e) { setErr(e.message); }
    setBusy('');
  }

  async function writeAll() {
    if (dirty) await save({ outline: eb.outline, title: eb.title, subtitle: eb.subtitle, author: eb.author });
    stopRef.current = false;
    setBusy('write'); setErr('');
    const total = eb.outline.length;
    try {
      for (let i = 0; i < total; i++) {
        if (stopRef.current) break;
        const current = (await load()).chapters?.[i];
        if (current?.content) continue;
        setLog(`Escribiendo ${i + 1}/${total}: ${eb.outline[i].title}…`);
        const r = await writeChapter(i);
        setLog(`Listo ${i + 1}/${total} (${r.provider}${r.polishedBy ? ` + pulido por ${r.polishedBy}` : ''})`);
      }
      // Ilustraciones
      let b = await load();
      const per = Number(b.design?.imagesPerChapter ?? 0);
      if (per > 0) {
        for (let i = 0; i < total; i++) {
          if (stopRef.current) break;
          if (!b.chapters?.[i]?.content || (b.chapters?.[i]?.images || []).length >= per) continue;
          setLog(`Creando ilustración ${i + 1}/${total}: ${b.outline[i].title}…`);
          try { b = await makeImages(i); } catch (e) { setErr('Algunas imágenes no se pudieron crear: ' + e.message); break; }
        }
      }
      if (!stopRef.current && b.design?.aiCover !== false && !b.design?.coverImage) {
        setLog('Creando la ilustración de la portada…');
        try { await makeCover(); } catch (e) { setErr('La portada con IA no se pudo crear: ' + e.message); }
      }
      const fin = await load();
      const done = (fin.chapters || []).filter((c) => c?.content).length;
      if (done === total) {
        setLog('Libro completo. Generando el kit de publicación…');
        try { const k = await api(`/api/ebooks/${id}/kit`, { method: 'POST' }); setEb(k.ebook); } catch {}
        setLog('¡Libro completo! Revisa el diseño y descarga tus archivos.');
      } else if (stopRef.current) setLog('Pausado. Puedes continuar cuando quieras.');
    } catch (e) { setErr(e.message); }
    setBusy('');
  }

  async function one(i, polishOnly) {
    setBusy('one' + i); setErr('');
    setLog(`${polishOnly ? 'Puliendo' : 'Reescribiendo'}: ${eb.outline[i].title}…`);
    try { await writeChapter(i, polishOnly); setLog('Listo.'); } catch (e) { setErr(e.message); }
    setBusy('');
  }

  function editOutline(i, key, value) {
    const outline = eb.outline.map((c, j) => (j === i ? { ...c, [key]: value } : c));
    setEb({ ...eb, outline }); setDirty(true);
  }
  function moveCh(i, d) {
    const j = i + d;
    if (j < 0 || j >= eb.outline.length) return;
    const outline = [...eb.outline]; const chapters = [...(eb.chapters || [])];
    [outline[i], outline[j]] = [outline[j], outline[i]];
    [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
    setEb({ ...eb, outline, chapters }); setDirty(true);
  }
  function removeCh(i) {
    if (!confirm('¿Eliminar este capítulo?')) return;
    const outline = eb.outline.filter((_, j) => j !== i);
    const chapters = (eb.chapters || []).filter((_, j) => j !== i);
    setEb({ ...eb, outline, chapters }); setDirty(true);
  }
  function addCh() {
    const outline = [...eb.outline];
    outline.splice(Math.max(outline.length - 1, 0), 0, { title: 'Nuevo capítulo', summary: '', points: [] });
    const chapters = [...(eb.chapters || [])];
    while (chapters.length < eb.outline.length) chapters.push(null);
    chapters.splice(Math.max(outline.length - 2, 0), 0, null);
    setEb({ ...eb, outline, chapters }); setDirty(true);
  }
  function editContent(i, content) {
    const chapters = [...(eb.chapters || [])];
    while (chapters.length < eb.outline.length) chapters.push(null);
    chapters[i] = { ...(chapters[i] || {}), content };
    setEb({ ...eb, chapters }); setDirty(true);
  }

  async function del() {
    if (!confirm('¿Eliminar este ebook para siempre?')) return;
    await api(`/api/ebooks/${id}`, { method: 'DELETE' });
    router.push('/');
  }

  if (!eb) return err ? <div className="err">{err}</div> : <p className="muted"><span className="spin" /> Cargando…</p>;

  const total = (eb.outline || []).length;
  const done = (eb.chapters || []).filter((c) => c?.content).length;
  const words = (eb.chapters || []).reduce((a, c) => a + (c?.content ? c.content.split(/\s+/).length : 0), 0);

  return (
    <>
      <div className="row spread" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <input value={eb.title || ''} onChange={(e) => { setEb({ ...eb, title: e.target.value }); setDirty(true); }} placeholder="Título"
            style={{ fontSize: 22, fontWeight: 800, border: 0, background: 'transparent', padding: '4px 0' }} />
          <input value={eb.subtitle || ''} onChange={(e) => { setEb({ ...eb, subtitle: e.target.value }); setDirty(true); }} placeholder="Subtítulo"
            style={{ border: 0, background: 'transparent', padding: '2px 0', color: 'var(--muted)' }} />
          <input value={eb.author || ''} onChange={(e) => { setEb({ ...eb, author: e.target.value }); setDirty(true); }} placeholder="Autor"
            style={{ border: 0, background: 'transparent', padding: '2px 0', fontSize: 13 }} />
        </div>
        <div className="row">
          {dirty && <button className="btn primary sm" onClick={() => save({ title: eb.title, subtitle: eb.subtitle, author: eb.author, outline: eb.outline, chapters: eb.chapters })}>Guardar cambios</button>}
          <button className="btn ghost sm danger" onClick={del}>Eliminar</button>
        </div>
      </div>

      {total > 0 && (
        <div style={{ margin: '10px 0 4px' }}>
          <div className="row spread small muted" style={{ marginBottom: 5 }}><span>{done}/{total} capítulos · {words.toLocaleString()} palabras · ~{Math.round(words / 280)} págs.</span></div>
          <div className="bar"><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        </div>
      )}
      {log && <div className="note small" style={{ marginTop: 10 }}>{busy && <span className="spin" style={{ marginRight: 8, verticalAlign: -3 }} />}{log}</div>}
      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}

      <div className="tabs">
        {[['contenido', 'Contenido'], ['diseno', 'Diseño y portada'], ['vista', 'Vista previa'], ['publicar', 'Descargar y publicar']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'contenido' && (
        <>
          {!total && (
            <div className="card empty-state">
              <h2>Paso 1: crear el índice</h2>
              <p className="muted">La IA diseña la estructura del libro a partir de tu tema.</p>
              <button className="btn primary" onClick={makeOutline} disabled={!!busy}>{busy === 'outline' ? <span className="spin" /> : 'Generar índice'}</button>
            </div>
          )}
          {total > 0 && (
            <>
              <div className="row" style={{ marginBottom: 14 }}>
                {busy === 'write' || busy === 'images'
                  ? <button className="btn" onClick={() => { stopRef.current = true; setLog('Pausando después del capítulo actual…'); }}>Pausar</button>
                  : <button className="btn primary" onClick={writeAll} disabled={!!busy || done === total}>{done === 0 ? 'Escribir todo el libro' : done === total ? 'Libro completo' : 'Continuar escribiendo'}</button>}
                {done > 0 && <button className="btn" onClick={fillImages} disabled={!!busy}>Crear imágenes que faltan</button>}
                <button className="btn" onClick={addCh} disabled={!!busy}>+ Capítulo</button>
                <button className="btn ghost" onClick={() => { if (confirm('Esto rehace el índice y borra los capítulos escritos. ¿Continuar?')) makeOutline(); }} disabled={!!busy}>Rehacer índice</button>
              </div>
              <div className="grid" style={{ gap: 10 }}>
                {eb.outline.map((c, i) => {
                  const ch = eb.chapters?.[i];
                  const isOpen = open === i;
                  return (
                    <div key={i} className="chapter-item">
                      <div className="row spread" style={{ alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div className="row" style={{ gap: 8 }}>
                            <span className={`pill ${ch?.content ? 'ok' : ''}`}>{i + 1}</span>
                            <input value={c.title} onChange={(e) => editOutline(i, 'title', e.target.value)} style={{ fontWeight: 700, flex: 1, minWidth: 150, padding: '6px 8px' }} />
                          </div>
                          {isOpen && (
                            <textarea value={c.summary || ''} onChange={(e) => editOutline(i, 'summary', e.target.value)} placeholder="Resumen / instrucciones para este capítulo" style={{ marginTop: 8, minHeight: 60 }} />
                          )}
                          {!isOpen && c.summary && <div className="small muted" style={{ marginTop: 6 }}>{c.summary}</div>}
                          {ch?.content && <div className="small muted" style={{ marginTop: 4 }}>{ch.content.split(/\s+/).length} palabras · {ch.provider}{ch.polishedBy ? ` + ${ch.polishedBy}` : ''}</div>}
                          {(ch?.images || []).length > 0 && (
                            <div className="row" style={{ marginTop: 8, gap: 8 }}>
                              {ch.images.map((im, k) => (
                                <div key={k} style={{ position: 'relative' }}>
                                  <img src={im.url} alt="" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                                  <div className="row" style={{ gap: 4, marginTop: 4 }}>
                                    <button className="btn sm" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => oneImage(i, { slot: k })} disabled={!!busy}>Otra</button>
                                    <button className="btn sm ghost danger" style={{ padding: '3px 7px', fontSize: 11 }} onClick={() => oneImage(i, { remove: true, slot: k })} disabled={!!busy}>Quitar</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="row" style={{ gap: 4 }}>
                          <button className="btn sm" onClick={() => setOpen(isOpen ? null : i)}>{isOpen ? 'Cerrar' : ch?.content ? 'Editar' : 'Detalles'}</button>
                          <button className="btn sm" onClick={() => one(i)} disabled={!!busy}>{busy === 'one' + i ? <span className="spin" /> : ch?.content ? 'Reescribir' : 'Escribir'}</button>
                          {ch?.content && <button className="btn sm" onClick={() => oneImage(i, { slot: (ch.images || []).length })} disabled={!!busy || (ch.images || []).length >= 3}>{busy === 'img' + i ? <span className="spin" /> : '+ Imagen'}</button>}
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 10 }}>
                          <label>Texto del capítulo (Markdown: ## subtítulo, **negrita**, - lista, &gt; consejo)</label>
                          <textarea value={ch?.content || ''} onChange={(e) => editContent(i, e.target.value)} style={{ minHeight: 360, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13 }} />
                          <div className="row" style={{ marginTop: 8 }}>
                            <button className="btn sm primary" onClick={() => save({ outline: eb.outline, chapters: eb.chapters })}>Guardar</button>
                            {ch?.content && <button className="btn sm" onClick={() => one(i, true)} disabled={!!busy}>Pulir con IA</button>}
                            <button className="btn sm" onClick={() => moveCh(i, -1)}>↑</button>
                            <button className="btn sm" onClick={() => moveCh(i, 1)}>↓</button>
                            <button className="btn sm ghost danger" onClick={() => removeCh(i)}>Quitar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'diseno' && <Design eb={eb} save={save} setEb={setEb} busy={busy} onFillImages={fillImages} onCover={async () => { setBusy('cover'); setErr(''); setLog('Creando la ilustración de la portada…'); try { await makeCover(); setLog('Portada lista.'); } catch (e) { setErr(e.message); } setBusy(''); }} />}

      {tab === 'vista' && (
        <>
          <div className="row" style={{ marginBottom: 10 }}>
            <a className="btn sm" href={`/api/ebooks/${id}/preview`} target="_blank" rel="noreferrer">Abrir en pantalla completa</a>
            <span className="small muted">Así se verá tu libro. El PDF final tiene números de página.</span>
          </div>
          <iframe className="preview-frame" src={`/api/ebooks/${id}/preview?v=${eb.updated_at}`} title="Vista previa" />
        </>
      )}

      {tab === 'publicar' && <Publish eb={eb} setEb={setEb} />}
    </>
  );
}
