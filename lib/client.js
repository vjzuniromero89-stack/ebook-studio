'use client';
export async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
  });
  let j = {};
  try { j = await r.json(); } catch {}
  if (r.status === 401 && typeof window !== 'undefined') { window.location.href = '/login'; }
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
  return j;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
