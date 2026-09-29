import { NextResponse } from 'next/server';
export const ok = (data) => NextResponse.json(data);
export const fail = (e, status) => NextResponse.json({ error: e?.message || String(e) }, { status: status || e?.status || 500 });
