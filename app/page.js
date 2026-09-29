'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import CoverThumb from '@/components/CoverThumb';

const STATUS = { borrador: ['Borrador', ''], indice: ['Índice listo', 'warn'], escribiendo: ['Escribiendo', 'warn'], escrito: ['Listo', 'ok'], publicado: ['Publicado', 'ok'] };

export default function Home() {
  const [books, setBooks] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/api/ebooks').then((j) => setBooks(j.ebooks)).catch((e) => setErr(e.message)); }, []);

  return (
    <>
      <div className="row spread">
        <div>
          <h1>Mis ebooks</h1>
          <p className="sub">Crea, diseña y exporta ebooks profesionales con IA gratis.</p>
        </div>
        <div className="row">
          <Link href="/ideas" className="btn">Buscar ideas</Link>
          <Link href="/nuevo" className="btn primary">+ Nuevo ebook</Link>
        </div>
      </div>
      {err && <div className="err">{err}{'\n\n'}Revisa Ajustes: puede faltar configurar Supabase.</div>}
      {books && !books.length && (
        <div className="card empty-state">
          <h2>Aún no tienes ebooks</h2>
          <p className="muted">Empieza pidiéndole a la IA ideas de temas que se venden, o crea uno con tu propio tema.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link href="/ideas" className="btn primary">Recomiéndame temas</Link>
            <Link href="/nuevo" className="btn">Tengo mi tema</Link>
          </div>
        </div>
      )}
      {!books && !err && <p className="muted"><span className="spin" /> Cargando…</p>}
      <div className="grid g3">
        {(books || []).map((b) => {
          const [label, cls] = STATUS[b.status] || STATUS.borrador;
          return (
            <Link key={b.id} href={`/ebook/${b.id}`} className="card" style={{ textDecoration: 'none', display: 'flex', gap: 14 }}>
              <div style={{ width: 84, flexShrink: 0 }}><CoverThumb id={b.id} v={b.updated_at} /></div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ marginBottom: 4 }}>{b.title || 'Sin título'}</h3>
                <div className="small muted" style={{ marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.subtitle}</div>
                <span className={`pill ${cls}`}>{label}</span>
                {b.total > 0 && <div className="small muted" style={{ marginTop: 6 }}>{b.done}/{b.total} capítulos</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
