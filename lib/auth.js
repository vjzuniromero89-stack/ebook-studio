export const COOKIE = 'es_auth';

export async function tokenFor(password) {
  const bytes = new TextEncoder().encode('ebook-studio:' + password);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
