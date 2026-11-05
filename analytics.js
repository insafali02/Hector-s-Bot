(() => {
  'use strict';
  if (!document.getElementById('hero-usage-chart')) return;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const formatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat('en-US');
  let active = false;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setStat = (key, value) => {
    $$(`[data-stat="${key}"]`).forEach(el => {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        el.textContent = '—'; el.removeAttribute('title');
      } else {
        el.textContent = formatter.format(value); el.title = full.format(value);
      }
    });
  };
  const updateState = (state,text,timeText) => {
    const badge=$('[data-live-indicator]');
    if (badge) { badge.textContent = state === 'live' ? '● LIVE' : state === 'offline' ? '● NOT CONNECTED' : '● SYNCING'; badge.dataset.state=state; }
    const dot=$('.analytics-dot'); if (dot) dot.dataset.state=state;
    const h=$('[data-analytics-heading]'); if (h) h.textContent=text;
    const t=$('[data-analytics-updated]');if (t) t.textContent=timeText;
    const sync=$('[data-last-sync]');if (sync) sync.textContent=timeText;
  };
  function makeBars(days) {
    const hero=$('#hero-usage-chart'); const chart=$('#usage-chart');
    hero.replaceChildren();chart.replaceChildren();
    if (!days.length) {
      const p=document.createElement('p');p.className='analytics-empty';p.textContent='No activity data yet.';chart.append(p);
      const label=$('[data-chart-caption]'); if(label) label.textContent='Awaiting live data';return;
    }
    const max=Math.max(1,...days.map(d=>d.count));
    for(const row of days) {
      const value=Math.max(0,Number(row.count)||0);
      const tall=Math.max(4,Math.round((value/max)*120));
      const mini=document.createElement('div'); mini.className='live-mini-bar';mini.style.height=`${Math.max(4,Math.round(value/max*53))}px`;mini.title=`${row.day}: ${full.format(value)} command${value===1?'':'s'}`;hero.append(mini);
      const col=document.createElement('div');col.className='usage-col';
      const number=document.createElement('span');number.className='usage-value';number.textContent=formatter.format(value);
      const bar=document.createElement('div');bar.className='usage-bar';bar.style.height=`${tall}px`;
      const day=document.createElement('span');day.className='usage-day';day.textContent=new Date(`${row.day}T12:00:00Z`).toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'});
      col.append(number,bar,day);chart.append(col);
    }
    $('[data-chart-caption]').textContent='UTC daily totals';
  }
  function makeTopCommands(top) {
    const el=$('#top-commands');el.replaceChildren();
    if (!top.length) {const p=document.createElement('p');p.className='analytics-empty';p.textContent='No commands recorded yet.';el.append(p);return;}
    const max=Math.max(1,...top.map(x=>x.count));
    for(const cmd of top) {
      const row=document.createElement('div');row.className='top-command-row';
      const label=document.createElement('span');label.textContent=`/${cmd.command}`;
      const track=document.createElement('div');track.className='top-command-track';
      const fill=document.createElement('div');fill.className='top-command-fill';fill.style.width=`${Math.max(4,cmd.count/max*100)}%`;
      const number=document.createElement('span');number.textContent=formatter.format(cmd.count);number.title=full.format(cmd.count);
      track.append(fill);row.append(label,track,number);el.append(row);
    }
  }
  async function loadStats() {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch('/api/stats',{cache:'no-store',headers:{accept:'application/json'},signal:controller.signal});
      if (!response.ok) throw new Error('Stats service unavailable');
      const data=await response.json();
      if (!data.configured) {
        ['users','commands','servers','weekly'].forEach(k=>setStat(k,null));
        makeBars([]); makeTopCommands([]);
        updateState('offline','Analytics connection pending','Connect the bot to show real usage');
        active=false;return;
      }
      if (!data.hasData) {
        ['users','commands','weekly'].forEach(k=>setStat(k,null));
        setStat('servers',data.servers);makeBars([]);makeTopCommands([]);
        updateState('live','Connected · awaiting command events','Tracking starts with the next command');
        active=true;return;
      }
      setStat('users',data.users);setStat('commands',data.commands);setStat('servers',data.servers);setStat('weekly',data.weekly);
      makeBars(Array.isArray(data.activity)?data.activity:[]);
      makeTopCommands(Array.isArray(data.topCommands)?data.topCommands:[]);
      const syncTime=data.lastEvent?new Date(data.lastEvent):null;
      const display=syncTime && !isNaN(syncTime.getTime())
        ?`Updated ${syncTime.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`
        :'Live analytics connected';
      updateState('live', data.serverFresh?'Community data connected':'Command stats connected · server sync pending',display);
      active=true;
    } catch(error) {
      if(!active) {updateState('offline','Analytics temporarily unavailable','Stats will appear when the service responds');}
      else updateState('offline','Showing last received statistics','Connection temporarily unavailable');
    } finally {clearTimeout(timer);}
  }
  // Keep the cursor-reactive animation from the previous preview; disable motion for users requesting reduced motion.
  const tilt=$('#live-window');
  if(tilt && !isReducedMotion) {
    tilt.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch') return;
      const rect=tilt.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width-.5;const y=(e.clientY-rect.top)/rect.height-.5;
      tilt.style.transform=`perspective(1100px) rotateY(${x*6}deg) rotateX(${y*-5}deg)`;
    });
    tilt.addEventListener('pointerleave',()=>{tilt.style.transform='';});
  }
  loadStats();
  setInterval(()=>{if(!document.hidden) loadStats();},60000);
})();
