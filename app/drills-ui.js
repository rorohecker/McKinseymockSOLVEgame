/* Short, scored practice sessions. */
function startDrill(kind){
  if(S.screen==='home'){const input=$('#seed');if(input?.value.trim()){const raw=input.value.trim(),n=Number(raw);S.seed=/^[+-]?\d+$/.test(raw)&&Number.isSafeInteger(n)?n>>>0:hash(raw)>>>0}}
  const focus=kind==='adaptive'?adaptiveRecommendation():kind==='spaced'?spacedRecommendation():null,family=focus?.family||kind;
  S.mode='drill-'+kind;S.res={};S.rr=null;S.sw=null;S.sfl=null;S.marks=[];startSession();
  const d={kind,family,focus,i:0,answers:[],done:false};
  if(family==='math')d.items=focus?adaptiveMathItems(S.seed,focus):genMath(S.seed);
  else if(family==='cases')d.items=focus?adaptiveCaseItems(S.seed):genRedrock(S.seed).cases;
  else if(family==='sfl'){const data=genSFLProject(S.seed);d.items=RNG(S.seed*41+9).shuffle(data.questions).slice(0,6).map(q=>({q,theme:data.theme}))}
  else{
    const data=genSeaWolf(S.seed);if(S.difficulty==='hard')hardenSeaWolf(data);
    d.data=data;d.site=data.sites[0];d.filter=profileBlank(d.site);d.shown=null;d.answers={};d.phase='filter';d.notice='';
  }
  S.drill=d;go('drill-'+kind);startClock(kind==='cases'?2:5,()=>kind==='cases'?advanceCase(true):finishDrill());render(false);
}
function mathDrillHTML(){const d=S.drill,q=d.items[d.i];return `<div class="stack mission-intro"><span class="eyebrow">${d.kind==='spaced'?'Scheduled skill review':d.kind==='adaptive'?'Adaptive skill drill':'Five-minute warm-up'}</span><h1>${esc(d.focus?.label||'Mental math')}</h1><div class="card stack"><span class="chip">${q.kind} · ${d.i+1}/${d.items.length}</span><h2>${esc(q.prompt)}</h2><label>Answer <input class="num" id="drill-answer" type="number" step="any" inputmode="decimal" autofocus> ${esc(q.unit)}</label><p class="no" id="drill-notice" role="alert"></p><div class="row"><button class="btn" data-act="drill-answer">Submit and continue</button><button class="btn ghost" data-act="drill-skip">Skip</button><span class="mute">Enter also submits.</span></div></div></div>`}
function caseDrillHTML(){const d=S.drill,c=d.items[d.i],options=c.type==='mc'?`<div class="stack">${c.options.map(o=>`<label class="opt"><input type="radio" name="case-drill" value="${o.id}">${esc(o.text)}</label>`).join('')}</div>`:`<label for="drill-answer" class="eyebrow">Your answer</label><input class="num" type="number" step="any" id="drill-answer" inputmode="decimal"><p class="mute">Enter a number in the requested units. Accepted within ±${Math.min(c.tol,S.difficulty==='hard'?.25:.5)} in this practice mode.</p>`;
  return `<div class="stack mission-intro"><span class="eyebrow">${d.kind==='spaced'?'Scheduled case review':d.kind==='adaptive'?'Five-minute focused case set':'Two-minute mini-case'} · ${d.i+1}/${d.items.length}</span><h1>${esc(d.focus?.label||'Redrock cases')}</h1><div class="card stack"><h2>${esc(c.title)}</h2>${c.body}<p><b>${esc(c.q)}</b></p>${options}<p class="no" id="drill-notice" role="alert"></p><div class="row"><button class="btn" data-act="drill-answer">Lock answer</button><button class="btn ghost" data-act="drill-skip">Skip</button></div></div></div>`}
function adaptiveDrillHTML(){const d=S.drill;if(d.family==='math')return mathDrillHTML();if(d.family==='cases')return caseDrillHTML();if(d.family==='filter')return filterDrillHTML();
  const item=d.items[d.i],q=item.q;return `<div class="stack mission-intro sfl-scope"><span class="eyebrow">${d.kind==='spaced'?'Scheduled decision review':'Adaptive decision practice'} · ${d.i+1}/${d.items.length}</span><h1>${esc(item.theme.title)}</h1><div class="card stack"><span class="chip">${esc(q.phase)}</span><h2>${esc(q.prompt)}</h2><div class="stack">${q.options.map((o,i)=>`<button class="choice" data-act="adaptive-choice" data-v="${o.id}"><b>${'ABC'[i]}.</b> ${esc(o.text)}</button>`).join('')}</div><button class="btn ghost" data-act="adaptive-choice" data-v="">Skip decision</button></div></div>`}
function filterDrillRule(site){return `Sorting rule for this drill: ${site.undesired?'reject any microbe with the forbidden trait. Otherwise, ':''}keep a microbe if it ${site.desired?'has the desired trait or ':''}has at least two numeric values inside this site's ranges. This is a screening exercise; the final treatment is scored from the averages of three microbes.`}
function filterDrillKeep(site,m){if(site.undesired&&m.trait===site.undesired)return false;return !!(site.desired&&m.trait===site.desired)||m.a.filter((value,i)=>value>=site.ranges[i][0]&&value<=site.ranges[i][1]).length>=2}
function filterDrillHTML(){const d=S.drill,s=d.site;if(d.phase==='filter')return `<div class="stack mission-intro sw-drill"><span class="eyebrow">${d.kind==='spaced'?'Scheduled filter review':'Five-minute filter drill'}</span><h1>${esc(s.name)}</h1><p class="mute">Choose two characteristics, then classify the matching microbes.</p><div class="card stack">${siteRequirementsHTML(s)}<p>${esc(filterDrillRule(s))}</p></div>${profileFilterHTML(s,d.filter,d.notice,true)}</div>`;
  const m=d.data.byId[d.shown[d.i]];return `<div class="stack mission-intro"><span class="eyebrow">Categorise ${d.i+1}/${d.shown.length}</span><h1>${esc(s.name)}</h1><div class="card stack">${siteRequirementsHTML(s)}<p>${esc(filterDrillRule(s))}</p>${mbHTML(m,s)}<div class="row"><button class="btn" data-act="drill-cat" data-v="keep">Keep (1)</button><button class="btn ghost" data-act="drill-cat" data-v="reject">Reject (2)</button></div></div></div>`}
function drillAnswer(skip=false){
  const d=S.drill;if(!d||d.done)return;
  const c=d.items[d.i],el=$('#drill-answer'),v=skip?'':d.family==='cases'&&c.type==='mc'?document.querySelector('input[name="case-drill"]:checked')?.value:el?.value;
  if(!skip&&(v===undefined||v==='')){const note=$('#drill-notice');if(note)note.textContent='Enter an answer or choose Skip.';return}
  d.answers[d.i]=v;track('answer',{kind:d.kind,focus:d.focus?.id,index:d.i,skipped:skip});
  if(d.kind==='cases')advanceCase(false);else{d.i++;if(d.i>=d.items.length)finishDrill();else render(true)}
}
function adaptiveChoice(id){
  const d=S.drill;if(!d||d.done||!['adaptive','spaced'].includes(d.kind)||d.family!=='sfl')return;
  const q=d.items[d.i]?.q;if(id&&!q.options.some(x=>x.id===id))return;
  d.answers[d.i]=id||'';track('answer',{kind:d.kind,focus:'sfl',index:d.i,skipped:!id});
  d.i++;if(d.i>=d.items.length)finishDrill();else render(true);
}
function advanceCase(timedOut){
  const d=S.drill;if(!d||d.done||d.kind!=='cases')return;
  if(timedOut&&d.answers[d.i]===undefined)d.answers[d.i]='';
  mark('drill','Case '+(d.i+1));
  d.i++;if(d.i>=6){finishDrill();return}
  go('drill-cases');startClock(2,()=>advanceCase(true));
}
function applyDrillFilter(){
  const d=S.drill,s=d.site,problem=profileError(s,d.filter);if(problem){d.notice=problem;render(false);return}
  d.shown=filterPool(s,s.pool,d.filter).slice(0,10).map(m=>m.id);d.i=0;
  if(!d.shown.length){d.notice='No microbes match. Widen a range or change a trait preference.';render(false);return}
  d.notice='';
  d.phase='classify';render(true);
}
function drillCategorise(v){
  const d=S.drill;if(!d||d.done||d.family!=='filter')return;d.answers[d.shown[d.i]]=v;track('answer',{kind:'filter',index:d.i,choice:v});
  d.i++;if(d.i>=d.shown.length)finishDrill();else render(true);
}
function finishDrill(){
  const d=S.drill;if(!d||d.done)return;d.done=true;if(d.kind!=='cases')mark('drill',d.focus?.label|| (d.kind==='math'?'Mental math':'Filter and categorise'));stopClock();
  let items=[];
  if(d.family==='math')items=d.items.map((q,i)=>({label:q.kind+' '+(i+1),your:d.answers[i]??'—',correct:q.ans,ok:near(d.answers[i],q.ans,.1),why:q.why}));
  else if(d.family==='cases')items=d.items.map((q,i)=>({label:'Case '+(i+1)+' · '+q.kind,your:d.answers[i]??'—',correct:q.type==='mc'?q.options.find(o=>o.id===q.ans)?.text:q.ans,ok:q.type==='mc'?d.answers[i]===q.ans:near(d.answers[i],q.ans,Math.min(q.tol,S.difficulty==='hard'?.25:.5)),why:q.explain}));
  else if(d.family==='sfl')items=d.items.map(({q},i)=>{const choice=q.options.find(x=>x.id===d.answers[i]),best=q.options.find(x=>x.quality===2);return{label:q.phase+' · decision '+(i+1),your:choice?.text||'Skipped',correct:best?.text||'—',ok:choice?.quality===2,why:(choice?.why||'No answer submitted.')+' Best response: '+(best?.why||'')}});
  else{
    const s=d.site;
    items=(d.shown||[]).map(id=>{const m=d.data.byId[id],good=filterDrillKeep(s,m),inside=m.a.filter((value,i)=>value>=s.ranges[i][0]&&value<=s.ranges[i][1]).length,reason=s.undesired&&m.trait===s.undesired?`Reject: ${m.trait} is forbidden at this site.`:s.desired&&m.trait===s.desired?`Keep: ${m.trait} is the desired trait.`:`${inside} of 3 numeric values are in range; the sorting rule needs at least 2.`;return{label:m.name,your:d.answers[id]||'—',correct:good?'Keep':'Reject',ok:d.answers[id]===(good?'keep':'reject'),why:reason}});
  }
  d.results={items,total:items.filter(x=>x.ok).length,max:items.length};S.res.math=d.kind==='math'?{total:d.results.total,max:d.results.max}:null;
  go('drill-results');
}
function drillResultsHTML(){
  const d=S.drill,r=d.results,title=d.focus?.label||(d.kind==='math'?'Mental math':d.kind==='cases'?'Redrock cases':'Sea Wolf filters');
  const followup=d.kind==='spaced'?`<p>${S.session?.spacingSaved===false?'Review plan could not be saved in this browser.':esc(spacedDueText(readSpaced()[d.focus.id]))+' for this skill.'}</p>`:
    d.kind==='adaptive'?'<p>Next adaptive target will use this result and your recent history.</p>':'';
  return `<div class="stack"><div class="row" style="justify-content:space-between"><h1>${esc(title)} review</h1><button class="btn ghost" data-act="home">Back to modes</button></div><div class="card stack"><div class="score">${r.total} / ${r.max}</div><p class="mute">${S.session?.persisted===false?'Browser storage is full or unavailable. Export this result now to keep a copy.':'Saved to practice history.'} Missed questions include the calculation or decision reason.</p>${followup}</div>${r.items.map(x=>`<div class="card flat"><b>${esc(x.label)}</b> · <span class="${x.ok?'ok':'no'}">${x.ok?'Correct':'Review'}</span><p>Your answer: ${esc(x.your)} · Correct: ${esc(x.correct)}</p>${!x.ok?`<p class="mute">${esc(x.why)}</p>`:''}</div>`).join('')}<div class="row"><button class="btn" data-act="drill-start" data-v="${d.kind}">Try another seed</button><button class="btn ghost" data-act="results-csv">Download CSV</button><button class="btn ghost" data-act="print-results">Print or save as PDF</button></div></div>`;
}
