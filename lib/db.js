import { createClient } from '@supabase/supabase-js';

let client;
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export async function getEbook(id) {
  const { data, error } = await db().from('ebooks').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEbook(id, patch) {
  const { data, error } = await db()
    .from('ebooks')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getSettings() {
  try {
    const { data } = await db().from('app_settings').select('data').eq('id', 1).single();
    return data?.data || {};
  } catch {
    return {};
  }
}
