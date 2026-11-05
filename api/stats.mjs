import { databaseConfigured, redisBatch, PREFIX, utcDay } from '../lib/redis.mjs';
const respond = (res, body, status=200) => res.status(status).setHeader('Cache-Control','public, max-age=0, s-maxage=30, stale-while-revalidate=60').json(body);
const safeCount = value => (value == null ? null : Math.max(0,Number(value)||0));
const utcDays = () => Array.from({length:7},(_,i) => utcDay(new Date(Date.now()-(6-i)*86400000)));
function nameCounts(value) {
  const obj = {};
  if (Array.isArray(value)) {for(let i=0;i<value.length-1;i+=2) obj[value[i]]=Number(value[i+1])||0;}
  else if (value && typeof value === 'object') {for(const [k,v] of Object.entries(value)) obj[k]=Number(v)||0;}
  return Object.entries(obj).filter(([k,v])=>/^[a-z][a-z\d-]{0,31}$/.test(k)&&v>0)
    .sort((a,b)=>b[1]-a[1]).slice(0,5).map(([command,count])=>({command,count}));
}
export default async function handler(req,res) {
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return respond(res,{error:'Method not allowed'},405); }
  if (!databaseConfigured()) return respond(res,{configured:false,reason:'Analytics data source has not been connected.'});
  const days=utcDays();
  try {
    const values=await redisBatch([
      ['GET',`${PREFIX}commands:all`],['PFCOUNT',`${PREFIX}users:hll`],
      ['GET',`${PREFIX}guilds:current`],['GET',`${PREFIX}last:heartbeat`],['GET',`${PREFIX}last:event`],
      ['HGETALL',`${PREFIX}commands:byname`],...days.map(day=>['GET',`${PREFIX}day:${day}`])
    ]);
    const lastHeartbeat=values[3]?new Date(values[3]).getTime():0;
    const isGuildFresh=Number.isFinite(lastHeartbeat) && Date.now()-lastHeartbeat<30*60*1000;
    const current=values[0]!==null;
    const activity=days.map((day,i)=>({day,count:safeCount(values[6+i])??0}));
    return respond(res,{
      configured:true,hasData:current,
      commands:current?safeCount(values[0]):null,users:current?safeCount(values[1]):null,
      servers:isGuildFresh?safeCount(values[2]):null,
      weekly:current?activity.reduce((sum,x)=>sum+x.count,0):null,
      activity:current?activity:[], topCommands:current?nameCounts(values[5]):[],
      lastEvent:values[4]||null,lastHeartbeat:isGuildFresh?values[3]:null,
      serverFresh:isGuildFresh,uniqueUsersApproximate:true
    });
  } catch(error) {console.error('[ANALYTICS STATS]',error.message);return respond(res,{configured:false,reason:'Analytics temporarily unavailable.'},503);}
}
