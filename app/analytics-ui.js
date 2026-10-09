/* Session telemetry, local history, review and exports. No data leaves the browser. */
function startSession(){S.session={started:Date.now(),screenAt:Date.now(),screenTimes:{},log:[],saved:false}}
function track(type,data={}){if(!S.session||S.session.log.length>=500)return;S.session.log.push({at:Date.now()-S.session.started,screen:S.screen,type,data})}
function recordScreenTime(){if(!S.session)return;const now=Date.now(),key=S.screen;S.session.screenTimes[key]=(S.session.screenTimes[key]||0)+Math.max(0,now-S.session.screenAt);S.session.screenAt=now}
function sessionMetrics(){
  const log=S.session?.log||[],times=S.session?.screenTimes||{};
  const fields=log.filter(x=>x.type==='answer'&&x.data.field).map(x=>x.data.field),revisions=fields.length-new Set(fields).size;
  const tabs=log.filter(x=>x.type==='tab').map(x=>x.data.value),backtracks=tabs.filter((x,i)=>i>0&&tabs.slice(0,i-1).includes(x)).length;
  const decisions=log.filter(x=>x.type==='action'&&['cat','prospect','sfl-answer','team-support','adaptive-choice','drill-cat','drill-answer'].includes(x.data.name));
  const gaps=decisions.slice(1).map((x,i)=>x.screen===decisions[i].screen&&x.data.site===decisions[i].data.site&&x.data.day===decisions[i].data.day?x.at-decisions[i].at:null).filter(x=>x!==null&&x>=0&&x<600000);
  return{actions:log.filter(x=>x.type==='action').length,journal:log.filter(x=>x.type==='journal').length,filterEdits:log.filter(x=>x.type==='filter').length,tabSwitches:tabs.length,backtracks,answers:log.filter(x=>x.type==='answer').length,revisions,decisions:decisions.length,avgDecisionSeconds:gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length/1000):null,screenTimes:times};
}
function finalizeSession(){
  if(!S.session||S.session.saved)return;
  S.session.saved=true;
  const entry={id:Date.now()+'-'+S.seed,date:new Date().toISOString(),seed:S.seed,mode:S.mode,difficulty:S.difficulty,
    rr:S.res.rr?.total??null,sw:S.res.sw?S.res.sw.reduce((a,x)=>a+x.sc.score,0):null,
    sfl:S.res.sfl?.score.total??null,math:S.res.math?.total??null,drill:S.drill?.results?.total??null,drillMax:S.drill?.results?.max??null,
    durationSeconds:Math.round((Date.now()-S.session.started)/1000),source:'local',metrics:sessionMetrics(),skillStats:sessionSkillStats(),adaptiveFocus:S.drill?.kind==='adaptive'?S.drill.focus.id:null,spacedFocus:S.drill?.kind==='spaced'?S.drill.focus.id:null,
    phaseSeconds:Object.fromEntries(S.marks.map(x=>[x.game+' '+x.name,Math.round(x.ms/1000)])),
    mistakes:{redrock:S.res.rr?.items.filter(x=>x.pts<x.max).reduce((a,x)=>(a[x.sec]=(a[x.sec]||0)+1,a),{})||{},
      seaWolf:S.res.sw?.flatMap(x=>x.sc.ded).length||0,sfl:S.res.sfl?.score.items.filter(x=>x.pts<x.max).length||0,drill:S.drill?.results?.items.filter(x=>!x.ok).length||0},
    log:S.session.log};
  S.session.entry=entry;S.session.spacingSaved=updateSpaced(entry.skillStats);S.session.persisted=saveHistory(entry);
}
function processHTML(){
  if(!S.session)return'';
  const m=sessionMetrics(),screens=Object.entries(m.screenTimes).sort((a,b)=>b[1]-a[1]);
  return`<section class="card stack"><h2>How you worked</h2><div class="row"><span class="chip">${m.actions} actions</span><span class="chip">${m.journal} journal saves</span><span class="chip">${m.filterEdits} filter edits</span><span class="chip">${m.tabSwitches} tab switches</span><span class="chip">${m.backtracks} tab returns</span><span class="chip">${m.revisions} answer revisions</span><span class="chip">${m.decisions} timed decisions</span></div>
  ${screens.length?`<p class="mute">Most time on ${esc(screens[0][0].replaceAll('-',' '))}: ${mmss(screens[0][1]/1000)}.</p>`:''}
  ${m.avgDecisionSeconds!==null?`<p class="mute">Average gap between recorded decisions: ${m.avgDecisionSeconds} seconds.</p>`:''}
  <p class="mute">These are self-review signals only. The real assessment's process score is not published.</p></section>`;
}
function historyHTML(){
  const rows=readHistory(),rr=rows.filter(x=>Number.isFinite(x.rr)).map(x=>x.rr/175*100),sw=rows.filter(x=>Number.isFinite(x.sw)).map(x=>x.sw/300*100),sfl=rows.filter(x=>Number.isFinite(x.sfl)).map(x=>x.sfl);
  const av=x=>x.length?Math.round(x.reduce((a,b)=>a+b,0)/x.length):null;
  const trends=[['Redrock',av(rr)],['Sea Wolf',av(sw)],['SFL',av(sfl)]].filter(x=>x[1]!==null);
  const weakest=trends.slice().sort((a,b)=>a[1]-b[1])[0];
  const recent=rows.slice(0,20).reverse(),pts=recent.map((x,i)=>{const scores=[Number.isFinite(x.rr)?x.rr/175*100:null,Number.isFinite(x.sw)?x.sw/300*100:null,Number.isFinite(x.sfl)?x.sfl:null,Number.isFinite(x.drill)&&Number.isFinite(x.drillMax)&&x.drillMax>0?x.drill/x.drillMax*100:null].filter(Number.isFinite);const y=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;return(i*34+12)+','+(112-y)});
  return`<div class="stack"><div class="row" style="justify-content:space-between"><h1>Practice history</h1><button class="btn ghost" data-act="home">Back to modes</button></div>${spacedPanelHTML()}
  <div class="card stack"><span class="eyebrow">Saved on this device</span><h2>${rows.length} completed run${rows.length===1?'':'s'}</h2>${weakest?`<p>Lowest average: <b>${weakest[0]}</b> at ${weakest[1]}% across saved runs.</p>`:''}
  ${recent.length>1?`<svg class="trend" viewBox="0 0 ${recent.length*34+20} 125" role="img" aria-label="Recent overall practice scores"><path d="M0 112H${recent.length*34+20}" stroke="currentColor" opacity=".3"/><polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="3"/>${pts.map(p=>`<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="currentColor"/>`).join('')}</svg>`:''}
  <button class="btn ghost sm" data-act="history-csv" ${rows.length?'':'disabled'}>Export history CSV</button></div>
  <div class="card tblbox"><table><thead><tr><th>Date / details</th><th>Mode</th><th>Seed</th><th>Difficulty</th><th class="n">Redrock</th><th class="n">Sea Wolf</th><th class="n">SFL / drill</th></tr></thead><tbody>${rows.map(x=>`<tr><td><details><summary>${esc(new Date(x.date).toLocaleDateString())}</summary><small>Duration: ${mmss(x.durationSeconds||0)}<br>Phases: ${esc(Object.entries(x.phaseSeconds||{}).map(([k,v])=>k+' '+mmss(v)).join(' · ')||'—')}<br>Mistakes: ${esc(JSON.stringify(x.mistakes||{}))}<br>Actions: ${x.metrics?.actions??'—'}; answer revisions: ${x.metrics?.revisions??'—'}</small></details></td><td>${esc(x.mode)}</td><td class="mono">${x.seed}</td><td>${esc(x.difficulty)}</td><td class="n">${x.rr??'—'}</td><td class="n">${x.sw??'—'}</td><td class="n">${x.sfl??(x.drill!==null&&x.drill!==undefined?x.drill+'/'+x.drillMax:'—')}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function calibrationHTML(){
  const a=readFeedback(),n=a.length;
  if(!n)return`<p class="mute">Difficulty is a practice setting. If you have taken the real assessment, you can compare a run on the results screen; your feedback stays on this device.</p>`;
  const counts={easier:a.filter(x=>x.rating==='easier').length,similar:a.filter(x=>x.rating==='similar').length,harder:a.filter(x=>x.rating==='harder').length};
  const byPart=[...new Set(a.map(x=>x.game))].map(k=>{const rows=a.filter(x=>x.game===k),easy=rows.filter(x=>x.rating==='easier').length,hard=rows.filter(x=>x.rating==='harder').length;return esc(k)+': '+rows.length+' notes'+(easy>hard?' · try Hard':hard>easy?' · try Standard':'')});
  return`<p class="mute">Your ${n} comparison${n===1?'':'s'}: ${counts.easier} easier, ${counts.similar} similar, ${counts.harder} harder than the real game. ${byPart.join(' · ')}. These are personal observations, not population calibration.</p>`;
}
function feedbackHTML(){
  const games=[S.res.rr&&['rr-analysis','Redrock analysis'],S.res.rr&&['rr-report','Redrock report'],S.res.rr&&['rr-cases','Redrock cases'],S.res.sw&&['sw-site-1','Sea Wolf site 1'],S.res.sw&&['sw-site-2','Sea Wolf site 2'],S.res.sw&&['sw-site-3','Sea Wolf site 3'],S.res.sfl&&['sfl','SFL']].filter(Boolean);
  if(!games.length)return'';
  return`<section class="card stack"><h2>Compare difficulty</h2><p class="mute">Only if you have taken the real assessment. Your answers stay in this browser and help you choose Standard or Hard next time.</p><div class="row">${games.map(([id,name])=>`<label>${name}<select data-feedback="${id}"><option value="">No comparison</option><option value="easier">This felt easier</option><option value="similar">About similar</option><option value="harder">This felt harder</option></select></label>`).join('')}</div><button class="btn ghost" data-act="feedback-save">Save comparison</button><p class="mute" id="feedback-status"></p></section>`;
}
function shareHTML(){
  const share=challengeShareText(S.seed,S.mode),same=readHistory().filter(x=>x.seed===S.seed&&x.mode===S.mode),best=same.length?Math.max(...same.map(x=>(x.rr||0)+(x.sw||0)+(x.sfl||0))):null;
  return`<section class="card stack"><h2>Seed challenge</h2><p class="mute">${location.protocol==='file:'?'Share this seed and mode with a friend who has their own copy of the lab.':'Share this link so a friend can play the same seed and mode.'} Your local runs on this seed: ${same.length}${best!==null?' · best combined points '+best:''}.</p><div class="row"><input id="challenge-url" readonly value="${esc(share)}" style="flex:1;min-width:220px"><button class="btn ghost" data-act="copy-challenge">Copy challenge</button></div><p id="share-status" class="mute"></p></section>`;
}
function rrStepForItem(item,index){
  const d=S.rr.d;
  if(index===0)return"Add the four Year 4 figures: "+d.y4.join(" + ")+" = "+d.totals[3]+" "+d.theme.unit+".";
  if(index===1){const name=d.an[0].parts[1].text.match(/did (.+?) hold/)?.[1];const i=d.names.indexOf(name);return"Divide "+d.y4[i]+" by the Year 4 total "+d.totals[3]+", then multiply by 100."}
  if(index===2)return"Use the starting year as denominator: ("+d.totals[3]+" − "+d.totals[0]+") ÷ "+d.totals[0]+" × 100.";
  if(index===3)return"Take the named "+d.theme.group+"'s Year 4 value minus Year 1, then divide by the three year-to-year intervals.";
  if(index===4)return"For each "+d.theme.group+", multiply its Year 4 value by (1 + Proposal A percent ÷ 100), then add the four results.";
  if(index===5)return"Calculate both proposal totals, subtract the smaller from the larger, and report "+d.theme.unit+".";
  if(item.sec==='Report'&&item.label.startsWith('Written'))return d.blanks[index-6]?.why||"Use the relevant exhibit value or the calculation from Analysis.";
  if(item.sec==='Report'&&item.label==='Chart type')return"Use a bar chart for category comparison, a line for change over time, a pie for shares, and a waterfall for a bridge between totals.";
  if(item.sec==='Report'&&item.label.startsWith('Chart ')){const name=item.label.slice(6),i=d.vis.labels.indexOf(name);if(d.vis.kind==='compare')return"Read "+name+"'s Year 4 "+d.theme.measure+" directly from Exhibit 1: "+d.y4[i]+" "+d.theme.unit+".";if(d.vis.kind==='share')return"Divide "+name+"'s Year 4 "+d.theme.measure+" ("+d.y4[i]+") by the total ("+d.totals[3]+"), then multiply by 100.";if(d.vis.kind==='waterfall')return"Read "+name+"'s Proposal B adjustment in Exhibit 2: "+d.kmB[i]+" "+d.theme.unit+".";return"Add the four "+name+" group values: "+d.terr.map(x=>x[i]).join(" + ")+" = "+d.totals[i]+" "+d.theme.unit+"."}
  if(item.sec==='Cases'){const i=Number(item.label.match(/Case (\d+)/)?.[1])-1;return d.cases[i]?.explain||"Recheck the inputs and units."}
  return"Revisit the source figures and calculation.";
}
function workedReviewHTML(){
  let out='';
  if(S.res.rr){const misses=S.res.rr.items.map((x,i)=>[x,i]).filter(([x])=>x.pts<x.max);out+=`<section class="card stack rr-scope"><h2>Redrock worked review</h2>${misses.length?misses.map(([x,i])=>`<div class="card flat"><b>${esc(x.sec)} · ${esc(x.label)}</b><p>Your answer: ${esc(x.your)} · Correct: ${esc(x.correct)}</p><p class="mute">${esc(rrStepForItem(x,i))}</p></div>`).join(''):'<p class="ok">No missed Redrock items.</p>'}</section>`}
  if(S.res.sw)out+=`<section class="card stack"><h2>Sea Wolf decision replay</h2>${S.res.sw.map((r,i)=>{const v=r.review||{},site=r.site,hidden=v.filtered?site.planted.filter(id=>!v.filtered.includes(id)):[],misfiled=(v.shown||[]).filter(id=>site.planted.includes(id)&&v.cat?.[id]!=='cur'),miss=r.sc.ded||[],calcs=r.trio.length===3?'<div class="pace">'+ATTRS.map((name,j)=>{const vals=r.trio.map(m=>m.a[j]),sum=vals.reduce((a,b)=>a+b,0),range=site.ranges[j];return '<p>'+esc(name)+': '+vals.join(' + ')+' = '+sum+'; / 3 = '+fmt(sum/3)+' (target '+range.join('-')+')</p>'}).join('')+'</div>':'';return`<div class="card flat stack"><h3>${esc(site.name)} · ${r.sc.score}/100</h3><p>${v.timeMs!==undefined?'Time: '+mmss(v.timeMs/1000)+' · ':''}Filtered matches: ${v.filtered?.length??'—'} · Categorised: ${v.shown?.length??'—'} · Prospects kept: ${v.picks?.length??'—'}.</p><p>Reference-team microbes hidden by your filter: <b>${hidden.length}</b>${hidden.length?' ('+hidden.map(id=>esc(S.sw.data.byId[id].name)).join(', ')+')':''}. Promising microbes sent away: <b>${misfiled.length}</b>${misfiled.length?' ('+misfiled.map(id=>esc(S.sw.data.byId[id].name)+' → '+esc(v.cat[id])).join(', ')+')':''}.</p><p>Best treatment available from your choices: <b>${r.bestPool.score}</b>/100. ${r.bestPool.score>r.sc.score?'Recheck the three final selections; the pool contained a stronger trio.':''}</p>${calcs}${miss.length?`<ul>${miss.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="ok">All treatment requirements met.</p>'}${v.timeMs>600000?'<p class="pace">This site took over ten minutes; protect time for later sites.</p>':''}</div>`}).join('')}</section>`;
  return out;
}
