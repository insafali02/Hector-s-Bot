// Upstash Redis REST calls live only in serverless functions, never in site-config.js.
export function databaseConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
export const PREFIX = 'ni:analytics:v1:';
export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);
export async function redisBatch(commands, mode='pipeline') {
  if (!databaseConfigured()) throw new Error('Analytics database not configured');
  const endpoint = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
  const res = await fetch(`${endpoint}/${mode}`, {
    method: 'POST', headers: { 'authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands), signal: AbortSignal.timeout(5000), cache:'no-store'
  });
  if (!res.ok) throw new Error(`Analytics storage error ${res.status}`);
  const items = await res.json();
  if (!Array.isArray(items) || items.some(i => i.error)) throw new Error('Analytics storage operation failed');
  return items.map(i => i.result);
}
