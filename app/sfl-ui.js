/* Sustainable Futures Lab practice UI. The scenario engine lives in sfl.js. */
function initSFL(format){
  S.sfl=format==='team'
    ?{format,data:genSFLTeam(S.seed),day:0,phase:'explore',records:[0,1,2].map(()=>({asked:[],assign:{},reasons:{},support:[],reflect:{}})),notice:'',done:false}
    :{format:'project',data:genSFLProject(S.seed),rank:[],rankLocked:false,step:0,phase:'rank',answers:[],state:{evidence:0,trust:0,pressure:0},trace:[],done:false};
  if(format==='project')S.sfl.rank=S.sfl.data.rank.map(x=>x.id);
}
function breakHTML(){
  const next=S.pendingGame==='sw'?'Sea Wolf':S.pendingGame==='sfl30'?'Sustainable Futures Lab · Team Lab':'Sustainable Futures Lab · Project Lead';
  return`<section class="mission-intro stack" style="max-width:760px"><span class="eyebrow">Between-game break</span><h1>Take a breath.</h1><p>Your previous game's clock has stopped. The next game's clock starts only when you choose to continue.</p><div class="card"><h2>Next: ${next}</h2></div><div class="row"><button class="btn" data-act="break-next">Continue to briefing</button><button class="btn ghost" data-act="results-now">End sitting and view results</button></div></section>`;
}
function sflIntroHTML(){
  const team=S.sfl.format==='team',mins=team?30:20;
  const guide=team
    ?'<p><b>Explore:</b> Ask up to three questions each day and track what you learn.</p><p><b>Assign:</b> Drag researchers to workstations or use the selectors, then explain each placement.</p><p><b>Support:</b> Respond to two requests. <b>Reflect:</b> Assess each person from the day’s evidence.</p><p class="mute">Review explains the practice score after the run.</p>'
    :'<p><b>Ranking:</b> Order four first actions. Drag rows or use the arrow buttons.</p><p><b>Decisions:</b> Make twelve linked choices. Earlier decisions change later context.</p><p><b>Review:</b> The full practice score and reasoning appear after the mission.</p>';
  return`<section class="mission-intro stack sfl-scope" style="max-width:820px"><span class="eyebrow">Mission 03 // untimed briefing</span><h1>Sustainable Futures Lab</h1><span class="chip">${team?'Team Lab · 30 minutes':'Project Lead · 20 minutes'}</span>
  <p>${team?'Guide four researchers through three project days. Each day you explore, assign, support and reflect.':'Rank four first actions, then make twelve linked decisions in one environmental project. Earlier choices change later context.'}</p>
  <div class="card stack"><h3>Practice reconstruction</h3><p>This module uses original scenarios and a transparent practice score. The real tasks and scoring are not published.</p>${guide}</div>
  <div class="row"><button class="btn" data-act="sfl-begin">Start the ${mins}-minute clock</button><button class="btn ghost" data-act="home">Back</button></div></section>`;
}
const SFL_BACKGROUNDS={
  'Burn-scar watershed':{situation:'A recent wildfire left exposed slopes above several drinking-water intakes. Rain has begun carrying sediment into side streams, but monitoring is uneven between communities.',mission:'A storm is forecast in two days. The team must prioritize the largest water-quality risk, coordinate access with local crews and recommend a response that can start before the rain.'},
  'Tidal wetland recovery':{situation:'Parts of a coastal marsh have lost nursery habitat while other basins are beginning to recover. Salinity readings and local observations disagree about the worst area.',mission:'The next high tide limits field access. The team must choose where to verify conditions first and fit an initial restoration step within available crews and permits.'},
  'Urban heat corridor':{situation:'Several neighborhoods report dangerous afternoon heat, especially near schools and transit stops. A city map, resident reports and sensor readings describe different patterns.',mission:'A heat wave is approaching. The team must identify the most exposed residents, confirm feasible sites and recommend a measure that can be deployed quickly.'},
  'Alpine slope restoration':{situation:'An early thaw is opening new erosion channels above the valley. Existing slope records cover different seasons, and local land managers disagree about where sediment will move next.',mission:'The team has a short access window. It must focus its checks, compare the likely downstream harm and choose a first response within the available crew capacity.'},
  'River migration corridor':{situation:'Fish passage has become unreliable along the lower river. Gauge readings, habitat surveys and partner observations point to different bottlenecks.',mission:'A low-flow period is approaching. The team must find the most consequential barrier, test whether it is accessible and recommend a practical first intervention.'},
  'Coastal dune protection':{situation:'Storm damage has left uneven gaps in the dunes near nesting areas. Shoreline surveys and local reports cover different stretches of coast.',mission:'The next storm is close. The team must decide which gaps threaten the most habitat, check access and propose work that available crews can complete in time.'},
  'Urban flood response':{situation:'Repeated floods have damaged homes and public services in several districts. Older drainage maps, resident accounts and maintenance records give an incomplete picture of where the next storm will cause the most harm.',mission:'The storm season begins soon. The team must identify the most exposed residents, work with engineers and local groups, and recommend an affordable first action while trust in past plans remains low.'}
};
function sflProjectHTML(){
  const f=S.sfl,d=f.data;
  if(f.phase==='rank'){const bg=SFL_BACKGROUNDS[d.theme.title];return`<div class="stack sfl-scope"><div class="card stack sfl-background"><span class="eyebrow">Background</span><h1>${esc(d.theme.title)}</h1><section><b class="eyebrow">Situation</b><p>${esc(bg.situation)}</p></section><section><b class="eyebrow">Mission</b><p>${esc(bg.mission)}</p></section></div><div class="card stack"><span class="eyebrow">Decision 01 / 13 · ${esc(d.theme.title)}</span><h2>Set priorities</h2><p>The team has a risk map, field logs, past-intervention notes and a summary of crews and budget. There is more material than you can review before the first partner meeting tomorrow. Order the four preparation tasks from highest priority to lowest.</p>
  <ol class="rank-list">${f.rank.map((id,i)=>{const a=d.rank.find(x=>x.id===id);return`<li class="rank-row" draggable="true" data-rank-row="${i}"><span class="rank-num">${i+1}</span><span>${esc(a.text)}</span><span class="rank-controls"><button class="btn ghost sm" data-act="rank-up" data-v="${i}" aria-label="Move ${esc(a.text)} up" ${i===0?'disabled':''}>↑</button><button class="btn ghost sm" data-act="rank-down" data-v="${i}" aria-label="Move ${esc(a.text)} down" ${i===3?'disabled':''}>↓</button></span></li>`}).join('')}</ol>
  <div class="row"><button class="btn" data-act="rank-done">Lock ranking and continue</button><span class="mute">Drag rows or use the arrow buttons.</span></div></div></div>`}
  if(f.phase==='outcome'){const q=d.questions[f.step],choice=q.options.find(x=>x.id===f.answers[f.step]);return`<div class="stack sfl-scope"><div class="card stack"><span class="eyebrow">Consequence // ${f.step+1} of 12</span><h2>What followed</h2><p>${esc(sflConsequence(choice))}</p><p class="mute">The project continues from this decision. The final review explains the trade-off.</p></div><button class="btn" data-act="sfl-next">${f.step===11?'Finish Project Lead':'Next decision'}</button></div>`}
  const q=d.questions[f.step];return`<div class="stack sfl-scope"><div class="card stack"><span class="eyebrow">Decision ${f.step+2} / 13 · ${esc(q.phase)}</span><h2>${esc(sflProjectPrompt(d,f.step,f.state))}</h2><div class="stack">${q.options.map((o,i)=>`<button class="choice" data-act="sfl-answer" data-v="${o.id}"><b>${'ABC'[i]}.</b> ${esc(o.text)}</button>`).join('')}</div>${S.learning?'<p class="pace">Hint: favour clear priorities, check material uncertainty, and explain trade-offs.</p>':''}</div></div>`;
}
function sflConsequence(choice){
  if(!choice)return'No response was submitted.';
  const effects=choice.effects||[],sentences=[];
  for(let i=0;i<effects.length;i+=2){const key=effects[i],value=effects[i+1];
    if(key==='evidence')sentences.push(value>0?'A new check enters the working evidence.':'The team still has an evidence gap to manage.');
    if(key==='trust')sentences.push(value>0?'Partners have a clearer basis for the plan.':'Partners ask for a firmer explanation.');
    if(key==='pressure')sentences.push(value>0?'The next decision has less schedule room.':'The team keeps some flexibility for the next step.');
  }
  return sentences.join(' ')||'The team records the decision and prepares the next step.';
}
function teamNote(f,id){
  if(id.startsWith('p')){const p=f.data.people.find(x=>x.id===id);return p.name+' works best in '+p.skill.toLowerCase()+' and prefers '+p.preference.toLowerCase()+'.'}
  const w=f.data.days[f.day].stations.find(x=>x.id===id);return w.name+' needs '+w.skill.toLowerCase()+' today.'
}
function teamFieldNotesHTML(f,r){
  return`<section class="card flat stack team-notes" aria-label="Today's field notes"><span class="eyebrow">Field notes · ${r.asked.length}/3 questions</span>${r.asked.length?r.asked.map(id=>`<p>• ${esc(teamNote(f,id))}</p>`).join(''):'<p class="mute">No questions asked today.</p>'}</section>`;
}
function sflTeamHTML(){
  const f=S.sfl,d=f.data,day=d.days[f.day],r=f.records[f.day],phase=f.phase;
  const head=`<div class="card stack sfl-scope"><span class="eyebrow">Team Lab // day ${f.day+1} of 3</span><h2>${esc(d.theme?.title||['Plan the fieldwork','Respond to change','Deliver the recommendation'][f.day])}</h2><div class="steps">${['Explore','Assign','Support','Reflect'].map(x=>`<span class="${x.toLowerCase()===phase?'on':''}">${x}</span>`).join('')}</div></div>`;
  let body='';
  if(phase==='explore'){
    const prompts=[...d.people.map(p=>({id:p.id,text:'Ask '+p.name+' about strengths and working style'})),...day.stations.map(w=>({id:w.id,text:'Inspect '+w.name+' requirements'}))];
    body=`<div class="card stack"><h3>Explore · ${r.asked.length}/3 questions used</h3><p>Choose up to three questions. Each question earns one practice point and its note stays visible for today's decisions.</p><div class="modes team-questions">${prompts.map(p=>`<button class="choice" data-act="team-ask" data-v="${p.id}" ${r.asked.includes(p.id)||r.asked.length>=3?'disabled':''}>${esc(p.text)}</button>`).join('')}</div>${teamFieldNotesHTML(f,r)}<button class="btn" data-act="team-next">Continue to assignments</button></div>`;
  }else if(phase==='assign'){
    body=`<div class="card stack"><h3>Assign researchers</h3><p>Place all four researchers. Each workstation can hold up to two people. Drag a researcher onto a workstation or use the selector, then choose your main reason.</p>
    <div class="team-stations" aria-label="Today's workstation requirements">${day.stations.map(w=>`<div class="team-station" data-team-station="${w.id}" aria-label="Drop researcher at ${esc(w.name)}"><b>${esc(w.name)}</b><span>Needs: ${esc(w.skill)}</span><small>${esc(w.task)}</small><small>Assigned: ${esc(d.people.filter(p=>r.assign[p.id]===w.id).map(p=>p.name).join(', ')||'none')}</small></div>`).join('')}</div>
    <div class="team-assign">${d.people.map(p=>`<div class="team-row"><div class="team-person" draggable="true" data-team-person="${p.id}" title="Drag ${esc(p.name)} to a workstation"><b>${esc(p.name)} ↗</b><small>Known strength: ${esc(p.skill)}</small></div><label>Workstation<select data-team-assign="${p.id}"><option value="">Choose station</option>${day.stations.map(w=>`<option value="${w.id}" ${r.assign[p.id]===w.id?'selected':''}>${esc(w.name)} · ${esc(w.skill)}</option>`).join('')}</select></label><label>Reason<select data-team-reason="${p.id}"><option value="">Choose reason</option>${['Skill fit','Speed','Preference','Spread workload'].map(x=>`<option ${r.reasons[p.id]===x?'selected':''}>${x}</option>`).join('')}</select></label></div>`).join('')}</div>
    ${f.notice?`<p class="no" role="alert">${esc(f.notice)}</p>`:''}<button class="btn" data-act="team-next">Lock assignments</button></div>`;
  }else if(phase==='support'){
    const i=r.support.length,request=day.requests[i];
    body=`<div class="card stack"><span class="eyebrow">Support request ${i+1} of 2</span><h3>${esc(request.prompt)}</h3><div class="stack">${request.options.map((o,j)=>`<button class="choice" data-act="team-support" data-v="${j}"><b>${'ABC'[j]}.</b> ${esc(o.text)}</button>`).join('')}</div></div>`;
  }else{
    const support=sflTeamSupportScore(day,r.support),signal=support>=3?'mostly constructive':'limited';
    body=`<div class="card stack"><h3>Reflect on the team</h3><p>Consider each person's assignment, working style and the support you provided. Today's support was ${signal}.</p><div class="team-assign">${d.people.map(p=>`<label class="team-row"><b>${esc(p.name)}</b><select data-team-reflect="${p.id}"><option value="">Choose state</option>${['confident','steady','strained'].map(x=>`<option ${r.reflect[p.id]===x?'selected':''}>${x}</option>`).join('')}</select></label>`).join('')}</div>${f.notice?`<p class="no" role="alert">${esc(f.notice)}</p>`:''}<button class="btn" data-act="team-next">${f.day<2?'Begin next day':'Finish Team Lab'}</button></div>`;
  }
  return`<div class="stack sfl-scope">${head}${phase==='explore'?'':teamFieldNotesHTML(f,r)}${body}</div>`;
}
function sflRankMove(index,to){
  const rank=S.sfl.rank;if(!Number.isInteger(index)||!Number.isInteger(to)||index<0||index>=rank.length||to<0||to>=rank.length||index===to)return;
  rank.splice(to,0,rank.splice(index,1)[0]);render(false);
}
function sflAnswer(id){
  const f=S.sfl,q=f.data.questions[f.step],choice=q.options.find(x=>x.id===id);if(!choice)return;
  f.answers[f.step]=id;
  for(let i=0;i<choice.effects.length;i+=2)f.state[choice.effects[i]]+=choice.effects[i+1];
  f.trace.push({step:f.step,choice:id,state:{...f.state},at:Date.now()});
  f.phase='outcome';render(true);
}
function sflNext(){
  const f=S.sfl;if(f.step===11){finishSFL();return}
  f.step++;f.phase='decision';render(true);
}
function teamAsk(id){
  const f=S.sfl,r=f.records[f.day];if(r.asked.length>=3||r.asked.includes(id))return;
  r.asked.push(id);render(false);
}
function teamNext(){
  const f=S.sfl,r=f.records[f.day];f.notice='';
  if(f.phase==='explore')f.phase='assign';
  else if(f.phase==='assign'){
    const assigned=Object.values(r.assign),counts={};for(const id of assigned)counts[id]=(counts[id]||0)+1;
    if(assigned.length!==4||assigned.some(x=>!x)||Object.values(r.reasons).length!==4||Object.values(r.reasons).some(x=>!x)||Object.values(counts).some(n=>n>2)){f.notice='Assign all four researchers, give each a reason, and keep no more than two at one station.';render(false);return}
    f.phase='support';
  }else if(f.phase==='reflect'){
    if(Object.values(r.reflect).length!==4||Object.values(r.reflect).some(x=>!x)){f.notice='Rate all four researchers before continuing.';render(false);return}
    if(f.day===2){finishSFL();return}
    f.day++;f.phase='explore';
  }
  render(true);
}
function teamSupport(index){
  const f=S.sfl,r=f.records[f.day],i=r.support.length;if(i>=2)return;
  r.support.push(Number(index));if(r.support.length===2)f.phase='reflect';render(true);
}
function finishSFL(){
  const f=S.sfl;if(!f||f.done)return;f.done=true;
  if(S.clock)mark('sfl',f.format==='team'?'Team Lab':'Project Lead');
  S.res.sfl=f.format==='team'?{format:'team',data:f.data,records:f.records,score:scoreSFLTeam(f.data,f.records)}:{format:'project',data:f.data,rank:f.rank,answers:f.answers,trace:f.trace,score:scoreSFLProject(f.data,f.rank,f.answers,f.rankLocked)};
  stopClock();go('results');
}
function sflResults(){
  const r=S.res.sfl,sc=r.score;
  return`<section class="card stack sfl-scope"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">Sustainable Futures Lab · ${r.format==='team'?'Team Lab':'Project Lead'}</span><div class="score">${sc.total}<span class="mute" style="font-size:1.2rem"> / 100</span></div></div><span class="chip">Practice score</span></div>${phaseTimes('sfl')}
  <p class="mute">The score below is an original learning model. It is not a McKinsey score or pass prediction.</p>
  <details><summary>Review every decision</summary><div class="stack" style="margin-top:14px">${sc.items.map(item=>`<div class="card flat"><div class="row" style="justify-content:space-between"><b>${esc(item.label)}</b><span class="mono">${item.pts}/${item.max}</span></div>${item.your?`<p>Your choice: ${esc(item.your)}. Strongest: ${esc(item.correct)}.</p>`:''}<p class="mute">${esc(item.why)}</p></div>`).join('')}</div></details></section>`;
}
document.addEventListener('dragstart',e=>{const row=e.target.closest?.('[data-rank-row]');if(row&&e.dataTransfer)e.dataTransfer.setData('application/x-solve-rank',row.dataset.rankRow)});
document.addEventListener('dragstart',e=>{const person=e.target.closest?.('[data-team-person]');if(person&&e.dataTransfer&&S.screen==='sfl-team'&&S.sfl?.phase==='assign')e.dataTransfer.setData('application/x-solve-team-person',person.dataset.teamPerson)});
document.addEventListener('dragover',e=>{if(e.target.closest?.('[data-rank-row]'))e.preventDefault()});
document.addEventListener('dragover',e=>{if(S.screen==='sfl-team'&&S.sfl?.phase==='assign'&&e.target.closest?.('[data-team-station]'))e.preventDefault()});
document.addEventListener('drop',e=>{const row=e.target.closest?.('[data-rank-row]');if(!row||S.screen!=='sfl-project')return;e.preventDefault();const raw=e.dataTransfer?.getData('application/x-solve-rank')||'',to=Number(row.dataset.rankRow);if(/^[0-3]$/.test(raw))sflRankMove(Number(raw),to)});
document.addEventListener('drop',e=>{const station=e.target.closest?.('[data-team-station]');if(!station||S.screen!=='sfl-team'||S.sfl?.phase!=='assign')return;const person=e.dataTransfer?.getData('application/x-solve-team-person');if(!S.sfl.data.people.some(p=>p.id===person))return;e.preventDefault();const r=S.sfl.records[S.sfl.day],id=station.dataset.teamStation;if(Object.entries(r.assign).filter(([p,w])=>p!==person&&w===id).length>=2){S.sfl.notice='This workstation already has two researchers.';render(false);return}r.assign[person]=id;S.sfl.notice='';render(false)});
