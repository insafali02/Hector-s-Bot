import { timingSafeEqual } from 'node:crypto';
import { databaseConfigured, redisBatch, PREFIX, utcDay } from '../lib/redis.mjs';
const json = (res, status, object) => res.status(status).setHeader('Cache-Control', 'no-store').json(object);
const validHash = h => typeof h === 'string' && /^[a-f\d]{64}$/.test(h);
const validCommand = c => typeof c === 'string' && /^[a-z][a-z\d-]{0,31}$/.test(c);
function authorized(header, secret) {
  if (!secret || typeof header !== 'string') return false;
  const supplied = header.replace(/^Bearer\s+/i,'');
  const a = Buffer.from(supplied); const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a,b);
}
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return json(res,405,{error:'Method not allowed'}); }
  if (!authorized(req.headers.authorization,process.env.ANALYTICS_WRITE_TOKEN)) return json(res,401,{error:'Unauthorized'});
  if (!databaseConfigured()) return json(res,503,{error:'Analytics storage not configured'});
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 1000) return json(res,400,{error:'Invalid request'});
  const now = new Date().toISOString();
  try {
    if (body.type === 'command') {
      if (!validHash(body.userHash) || !validCommand(body.command)) return json(res,400,{error:'Invalid analytics event'});
      const today = utcDay();
      await redisBatch([
        ['INCR',`${PREFIX}commands:all`],
        ['PFADD',`${PREFIX}users:hll`,body.userHash],
        ['HINCRBY',`${PREFIX}commands:byname`,body.command,1],
        ['INCR',`${PREFIX}day:${today}`],
        ['EXPIRE',`${PREFIX}day:${today}`,45*86400],
        ['SET',`${PREFIX}last:event`,now],
      ],'multi-exec');
      return json(res,202,{accepted:true});
    }
    if (body.type === 'heartbeat') {
      if (!Number.isInteger(body.guildCount) || body.guildCount < 0 || body.guildCount > 5000000) return json(res,400,{error:'Invalid server count'});
      await redisBatch([
        ['SET',`${PREFIX}guilds:current`,body.guildCount],
        ['SET',`${PREFIX}last:heartbeat`,now]
      ],'multi-exec');
      return json(res,202,{accepted:true});
    }
    return json(res,400,{error:'Unknown event type'});
  } catch (error) { console.error('[ANALYTICS INGEST]',error.message); return json(res,503,{error:'Storage temporarily unavailable'}); }
}
