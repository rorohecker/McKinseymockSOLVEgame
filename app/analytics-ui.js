/* Session telemetry, local history, review and exports. No data leaves the browser. */
function startSession(){S.session={started:Date.now(),screenAt:Date.now(),screenTimes:{},pausedMs:0,log:[],saved:false}}
function track(type,data={}){if(!S.session||S.session.log.length>=500)return;const now=Date.now(),openPause=S.clock?.paused?Math.max(0,now-S.clock.pausedAt):0;S.session.log.push({at:now-S.session.started-(S.session.pausedMs||0)-openPause,screen:S.screen,type,data})}
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
  const entry={id:Date.now()+'-'+S.seed,date:new Date().toISOString(),seed:S.seed,mode:S.mode,difficulty:S.difficulty,scoringVersion:SCORING_VERSION,
    rr:S.res.rr?.total??null,sw:S.res.sw?Math.round(S.res.sw.reduce((a,x)=>a+x.sc.score,0)*10)/10:null,
    sfl:S.res.sfl?.score.total??null,math:S.res.math?.total??null,drill:S.drill?.results?.total??null,drillMax:S.drill?.results?.max??null,
    durationSeconds:Math.round((Date.now()-S.session.started-(S.session.pausedMs||0))/1000),source:'local',metrics:sessionMetrics(),skillStats:sessionSkillStats(),adaptiveFocus:S.drill?.kind==='adaptive'?S.drill.focus.id:null,spacedFocus:S.drill?.kind==='spaced'?S.drill.focus.id:null,
    phaseSeconds:Object.fromEntries(S.marks.map(x=>[x.game+' '+x.name,Math.round(x.ms/1000)])),
    mistakes:{redrock:S.res.rr?.items.filter(x=>x.pts<x.max).reduce((a,x)=>(a[x.sec]=(a[x.sec]||0)+1,a),{})||{},
      seaWolf:S.res.sw?.reduce((n,x)=>n+x.sc.ded.length+(x.sc.penalties?.length||0),0)||0,sfl:S.res.sfl?.score.items.filter(x=>x.pts<x.max).length||0,drill:S.drill?.results?.items.filter(x=>!x.ok).length||0},
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
  const rows=readHistory(),comparable=rows.filter(x=>x.scoringVersion===SCORING_VERSION&&x.difficulty===S.difficulty);
  const rr=comparable.filter(x=>Number.isFinite(x.rr)).map(x=>x.rr/175*100),sw=comparable.filter(x=>Number.isFinite(x.sw)).map(x=>x.sw/300*100),sfl=comparable.filter(x=>Number.isFinite(x.sfl)).map(x=>x.sfl);
  const av=x=>x.length?Math.round(x.reduce((a,b)=>a+b,0)/x.length):null;
  const trends=[['Redrock',av(rr)],['Sea Wolf',av(sw)],['SFL',av(sfl)]].filter(x=>x[1]!==null);
  const weakest=trends.slice().sort((a,b)=>a[1]-b[1])[0];
  const recent=comparable.slice(0,20).reverse(),pts=recent.map((x,i)=>{const scores=[Number.isFinite(x.rr)?x.rr/175*100:null,Number.isFinite(x.sw)?x.sw/300*100:null,Number.isFinite(x.sfl)?x.sfl:null,Number.isFinite(x.drill)&&Number.isFinite(x.drillMax)&&x.drillMax>0?x.drill/x.drillMax*100:null].filter(Number.isFinite);const y=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;return(i*34+12)+','+(112-y)});
  return`<div class="stack"><div class="row" style="justify-content:space-between"><h1>Practice history</h1><button class="btn ghost" data-act="home">Back to modes</button></div>${spacedPanelHTML()}
  <div class="card stack"><span class="eyebrow">Saved on this device</span><h2>${rows.length} completed run${rows.length===1?'':'s'}</h2><p class="mute">Averages and trend use ${comparable.length} run${comparable.length===1?'':'s'} from scoring model ${SCORING_VERSION} on ${esc(S.difficulty)} difficulty. Older scores remain in the table.</p>${weakest?`<p>Lowest average: <b>${weakest[0]}</b> at ${weakest[1]}% across comparable runs.</p>`:''}
  ${recent.length>1?`<svg class="trend" viewBox="0 0 ${recent.length*34+20} 125" role="img" aria-label="Recent overall practice scores"><path d="M0 112H${recent.length*34+20}" stroke="currentColor" opacity=".3"/><polyline points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="3"/>${pts.map(p=>`<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="currentColor"/>`).join('')}</svg>`:''}
  <button class="btn ghost sm" data-act="history-csv" ${rows.length?'':'disabled'}>Export history CSV</button></div>
  <div class="card tblbox"><table><thead><tr><th>Date / details</th><th>Mode</th><th>Seed</th><th>Difficulty</th><th class="n">Redrock</th><th class="n">Sea Wolf</th><th class="n">SFL / drill</th></tr></thead><tbody>${rows.map(x=>`<tr><td><details><summary>${esc(new Date(x.date).toLocaleDateString())}</summary><small>Scoring model: ${x.scoringVersion??'legacy'}<br>Duration: ${mmss(x.durationSeconds||0)}<br>Phases: ${esc(Object.entries(x.phaseSeconds||{}).map(([k,v])=>k+' '+mmss(v)).join(' · ')||'—')}<br>Mistakes: ${esc(JSON.stringify(x.mistakes||{}))}<br>Actions: ${x.metrics?.actions??'—'}; answer revisions: ${x.metrics?.revisions??'—'}</small></details></td><td>${esc(x.mode)}</td><td class="mono">${x.seed}</td><td>${esc(x.difficulty)}</td><td class="n">${x.rr??'—'}</td><td class="n">${x.sw??'—'}</td><td class="n">${x.sfl??(x.drill!==null&&x.drill!==undefined?x.drill+'/'+x.drillMax:'—')}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function calibrationHTML(){
  const all=readFeedback(),rows=all.filter(x=>x.difficulty===S.difficulty),n=rows.length;
  if(!n)return`<p class="mute">No comparisons saved for ${esc(S.difficulty)} difficulty yet.${all.length?' Your comparisons at other levels remain saved.':''} This is a personal practice setting, not a population calibration.</p>`;
  const counts={easier:rows.filter(x=>x.rating==='easier').length,similar:rows.filter(x=>x.rating==='similar').length,harder:rows.filter(x=>x.rating==='harder').length};
  const index=DIFFICULTIES.indexOf(S.difficulty),up=DIFFICULTIES[Math.min(DIFFICULTIES.length-1,index+1)],down=DIFFICULTIES[Math.max(0,index-1)];
  const byPart=[...new Set(rows.map(x=>x.game))].map(k=>{const partRows=rows.filter(x=>x.game===k),easy=partRows.filter(x=>x.rating==='easier').length,hard=partRows.filter(x=>x.rating==='harder').length,suggestion=easy>hard&&up!==S.difficulty?` - try ${up} next`:hard>easy&&down!==S.difficulty?` - try ${down} next`:'';return esc(k)+': '+partRows.length+' notes'+suggestion});
  return`<p class="mute">Your ${n} comparison${n===1?'':'s'} at ${esc(S.difficulty)} difficulty: ${counts.easier} easier, ${counts.similar} similar, ${counts.harder} harder than the real game. ${byPart.join('; ')}. These are personal observations, not population calibration.</p>`;
}
function feedbackHTML(){
  const games=[S.res.rr&&['rr-analysis','Redrock analysis'],S.res.rr&&['rr-report','Redrock report'],S.res.rr&&['rr-cases','Redrock cases'],S.res.sw&&['sw-site-1','Sea Wolf site 1'],S.res.sw&&['sw-site-2','Sea Wolf site 2'],S.res.sw&&['sw-site-3','Sea Wolf site 3'],S.res.sfl&&['sfl','SFL']].filter(Boolean);
  if(!games.length)return'';
  return`<section class="card stack"><h2>Compare difficulty</h2><p class="mute">Only if you have taken the real assessment. Your answers stay in this browser and help you choose a practice level next time.</p><div class="row">${games.map(([id,name])=>`<label>${name}<select data-feedback="${id}"><option value="">No comparison</option><option value="easier">This felt easier</option><option value="similar">About similar</option><option value="harder">This felt harder</option></select></label>`).join('')}</div><button class="btn ghost" data-act="feedback-save">Save comparison</button><p class="mute" id="feedback-status"></p></section>`;
}
function shareHTML(){
  const share=challengeShareText(S.seed,S.mode,S.difficulty),same=readHistory().filter(x=>x.seed===S.seed&&x.mode===S.mode&&x.difficulty===S.difficulty&&x.scoringVersion===SCORING_VERSION),best=same.length?Math.round(Math.max(...same.map(x=>(x.rr||0)+(x.sw||0)+(x.sfl||0)))*100)/100:null;
  return`<section class="card stack"><h2>Seed challenge</h2><p class="mute">${location.protocol==='file:'?'Share this seed and mode with a friend who has their own copy of the lab.':'Share this link so a friend can play the same seed and mode.'} Your comparable local runs on this seed, ${esc(S.difficulty)} difficulty and model ${SCORING_VERSION}: ${same.length}${best!==null?' · best combined points '+best:''}.</p><label for="challenge-url" class="eyebrow">Challenge to share</label><div class="row"><input id="challenge-url" readonly value="${esc(share)}" style="flex:1;min-width:220px"><button class="btn ghost" data-act="copy-challenge">Copy challenge</button></div><p id="share-status" class="mute"></p></section>`;
}
function rrStepForItem(item,index){
  const d=S.rr.d;
  if(index===0)return"Add the four Year 4 figures: "+d.y4.join(" + ")+" = "+d.totals[3]+" "+d.theme.unit+".";
  if(index===1)return"Target: "+d.resource+" × "+d.targetPct+"% = "+d.targetArea+" "+d.theme.unit+". Subtract the Year 4 baseline of "+d.totals[3]+".";
  if(index>=2&&index<6){const i=index-2;return d.names[i]+": apply "+d.aRules[i]+" to the Year 4 baseline of "+d.y4[i]+" = "+d.aValues[i]+" "+d.theme.unit+"."}
  if(index===6)return"Add the four updated Proposal A values: "+d.aValues.join(" + ")+" = "+d.an[2].parts[0].ans+" "+d.theme.unit+".";
  if(index===7)return"Apply each Proposal B rule to its Year 4 baseline: "+d.bValues.join(" + ")+" = "+d.an[2].parts[1].ans+" "+d.theme.unit+".";
  if(item.sec==='Report'&&item.label.startsWith('Written'))return d.blanks[index-8]?.why||"Use the relevant exhibit value or the calculation from Analysis.";
  if(item.sec==='Report'&&item.label==='Chart type')return"Use a bar chart for category comparison, a line for change over time, a pie for shares, and a waterfall for a bridge between totals.";
  if(item.sec==='Report'&&item.label.startsWith('Chart ')){const name=item.label.slice(6),i=d.vis.labels.indexOf(name);if(d.vis.kind==='compare'){const group=Math.floor(i/2);return i%2?"Apply "+d.names[group]+"'s Proposal A rule ("+d.aRules[group]+") to "+d.y4[group]+" = "+d.aValues[group]+" "+d.theme.unit+".":"Read "+d.names[group]+"'s baseline from Exhibit 1: "+d.y4[group]+" "+d.theme.unit+"."}if(d.vis.kind==='share')return"Divide "+name+"'s Year 4 "+d.theme.measure+" ("+d.y4[i]+") by the total ("+d.totals[3]+"), then multiply by 100.";if(d.vis.kind==='waterfall')return"Apply "+name+"'s Proposal B rule ("+d.bRules[i]+") to its Year 4 baseline: adjustment "+d.kmB[i]+" "+d.theme.unit+".";return"Add the four "+name+" group values: "+d.terr.map(x=>x[i]).join(" + ")+" = "+d.totals[i]+" "+d.theme.unit+"."}
  if(item.sec==='Cases'){const i=Number(item.label.match(/Case (\d+)/)?.[1])-1,c=d.cases[i];return c?.type==='mc'?caseChoiceReason(c,item.your):c?.explain||"Recheck the inputs and units."}
  return"Revisit the source figures and calculation.";
}
function reviewPool(ids){return[...new Set(ids)].map(id=>S.sw?.data.byId[id]).filter(Boolean)}
function midpointGap(site,trio){return[0,1,2].reduce((sum,i)=>sum+Math.abs(trio.reduce((n,m)=>n+m.a[i],0)/3-(site.ranges[i][0]+site.ranges[i][1])/2),0)}
function bestReviewTreatment(site,ids){
  const pool=reviewPool(ids);let best={score:0,trio:null,gap:Infinity};
  for(let a=0;a<pool.length-2;a++)for(let b=a+1;b<pool.length-1;b++)for(let c=b+1;c<pool.length;c++){
    const trio=[pool[a],pool[b],pool[c]],score=scoreSite(site,trio).score,gap=midpointGap(site,trio);
    if(!best.trio||score>best.score||score===best.score&&gap<best.gap)best={score,trio,gap};
  }
  return best;
}
function treatmentReviewHTML(site,trio){
  if(!trio?.length)return'<p class="mute">No treatment submitted.</p>';
  const cards=`<div class="mgrid">${trio.map(m=>mbHTML(m,site)).join('')}</div>`;
  if(trio.length!==3)return cards+'<p class="mute">A treatment needs three microbes.</p>';
  const summary=ATTRS.map((name,i)=>{const sum=trio.reduce((n,m)=>n+m.a[i],0),avg=sum/3,[lo,hi]=site.ranges[i],ok=avg>=lo&&avg<=hi;return`<span class="chip ${ok?'good':'bad'}">${esc(name)} ${fmt(avg)} / target ${lo}–${hi}</span>`}).join('');
  return cards+`<div class="row">${summary}</div>`;
}
function seaWolfReplayHTML(r,i){
  const v=r.review||{},site=r.site,byId=S.sw?.data.byId||{},selected=v.filter?.selected||[];
  const chosen=selected.map(key=>key[0]==='a'?`${ATTRS[Number(key[1])]} ${v.filter.r[Number(key[1])].join('–')}`:`${traitSymbol(key.slice(2))}: ${v.filter.traitModes[key.slice(2)]==='no'?'Avoid':'Include'}`);
  const submitted=Array.isArray(v.filtered),shown=v.shown||[];
  const excluded=submitted?site.planted.filter(id=>!v.filtered.includes(id)):[];
  const beyondDisplay=submitted?site.planted.filter(id=>v.filtered.includes(id)&&!shown.includes(id)):[];
  const profileNote=!submitted?'No profile was submitted before time ran out.':excluded.length?`${excluded.length} microbe${excluded.length===1?'':'s'} from one compliant reference trio did not match your profile.`:beyondDisplay.length?`${beyondDisplay.length} reference-trio microbe${beyondDisplay.length===1?'':'s'} matched, but fell beyond the first ten shown.`:'One compliant reference trio was shown.';
  const categories=[['cur','This site'],['next','Next site'],['rej','Returned'],['','Unsorted']].map(([key,label])=>{const ids=shown.filter(id=>(v.cat?.[id]||'')===key);return`<div class="review-bucket"><b>${label} · ${ids.length}</b><p>${ids.length?ids.map(id=>esc(byId[id]?.name||id)).join(', '):'None'}</p></div>`}).filter((_,j)=>j<3||shown.some(id=>!v.cat?.[id])).join('');
  const moved=shown.filter(id=>site.planted.includes(id)&&v.cat?.[id]!=='cur');
  const core=shown.filter(id=>v.cat?.[id]==='cur').concat(v.kept||[]),picks=v.picks||[],poolIds=core.concat(picks),best=bestReviewTreatment(site,poolIds);
  const rounds=picks.map((id,j)=>{
    const offer=v.offerHistory?.[j]||[],other=core.concat(picks.filter((_,k)=>k!==j));
    const candidates=offer.map(candidate=>({id:candidate,score:bestReviewTreatment(site,other.concat(candidate)).score}));
    const picked=candidates.find(x=>x.id===id)?.score??0,better=candidates.filter(x=>x.id!==id&&x.score>picked).sort((a,b)=>b.score-a.score)[0];
    return`<div class="review-round"><b>Round ${j+1} · ${esc(byId[id]?.name||id)}</b><p>${better?`With your other choices fixed, ${esc(byId[better.id]?.name||better.id)} would raise the best available treatment from ${picked} to ${better.score}/100.`:'No offered alternative improves the best available practice score with your other choices fixed.'}</p></div>`;
  }).join('');
  let comparison='';
  if(best.trio&&r.trio.length===3){comparison=best.score>(r.sc.treatmentScore??r.sc.score)?`Your available pool contained a ${best.score}/100 treatment.`:'Your treatment matches the best available treatment quality in your pool.'}
  const missed=r.sc.ded||[];
  return`<details class="card sw-review-site" ${i===0?'open':''}><summary>${esc(site.name)} · ${r.sc.score}/100 · ${v.timeMs!==undefined?mmss(v.timeMs/1000):'not reached'}</summary><div class="stack">
    <div class="phase-review"><h4>01 · Profile</h4><p>${submitted?`Selected: <b>${chosen.map(esc).join(' + ')}</b>. ${v.filtered.length} of ${site.pool.length} microbes matched; ${shown.length} were shown.`:'No profile submitted.'}</p><p class="mute">${profileNote} ${submitted?'Another strong trio may still exist. ':''}This pool matching is specific to this practice model.</p></div>
    <div class="phase-review"><h4>02 · Categorise</h4><div class="review-buckets">${categories}</div><p class="mute">${!shown.length?'No categorisation recorded.':moved.length?`Reference-trio microbes sent elsewhere: ${moved.map(id=>esc(byId[id]?.name||id)).join(', ')}. This is one possible strong trio, not the only valid choice.`:'No members of one reference trio were sent elsewhere.'}</p></div>
    <div class="phase-review"><h4>03 · Prospects</h4>${rounds||'<p class="mute">No prospect rounds completed.</p>'}</div>
    <div class="phase-review"><h4>04 · Treatment</h4><p>${comparison||'No three-microbe comparison is available.'}</p><div class="review-teams"><div><h5>Your treatment</h5>${treatmentReviewHTML(site,r.trio)}</div><div><h5>Best available example</h5>${treatmentReviewHTML(site,best.trio)}</div></div>${missed.length?`<ul>${missed.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="ok">All practice treatment requirements met.</p>'}</div>
    ${v.timeMs>600000?'<p class="pace">This site took over ten minutes; protect time for later sites.</p>':''}
  </div></details>`;
}
function workedReviewHTML(){
  let out='';
  if(S.res.rr){const misses=S.res.rr.items.map((x,i)=>[x,i]).filter(([x])=>x.pts<x.max);out+=`<section class="card stack rr-scope"><h2>Redrock worked review</h2>${misses.length?misses.map(([x,i])=>`<div class="card flat"><b>${esc(x.sec)} · ${esc(x.label)}</b><p>Your answer: ${esc(x.your)} · Correct: ${esc(x.correct)}</p><p class="mute">${esc(rrStepForItem(x,i))}</p></div>`).join(''):'<p class="ok">No missed Redrock items.</p>'}</section>`}
  if(S.res.sw)out+=`<section class="card stack"><h2>Sea Wolf phase review</h2><p class="mute">Practice feedback for profiling, categorising, prospects and treatment. Closer target averages improve treatment quality.</p>${S.res.sw.map(seaWolfReplayHTML).join('')}</section>`;
  return out;
}
