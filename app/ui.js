function savedTheme(){try{return localStorage.getItem('solve-lab-theme')==='light'?'light':'dark'}catch{return'dark'}}
document.documentElement.dataset.theme=savedTheme();
const INITIAL_SETTINGS=readSettings(),INITIAL_CHALLENGE=challengeParams();
const S={screen:'home',mode:'full',seed:INITIAL_CHALLENGE.seed??Math.floor(Math.random()*90000)+10000,challengeMode:INITIAL_CHALLENGE.mode,tab:'journal',calc:{expr:'',fresh:false},rr:null,sw:null,sfl:null,drill:null,pendingGame:null,clock:null,marks:[],lastMark:0,res:{},lastInput:null,difficulty:INITIAL_SETTINGS.difficulty,learning:INITIAL_SETTINGS.learning,notice:'',session:null};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mmss=s=>{s=Math.max(0,Math.ceil(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const isRR=()=>S.screen.startsWith('rr-');
const isSW=()=>S.screen.startsWith('sw-');
const isSFL=()=>S.screen.startsWith('sfl-');
const gameKey=()=>isRR()?'rr':isSW()?'sw':isSFL()?'sfl':'';

/* clock */
function startClock(min,onEnd){S.clock={end:Date.now()+min*60000,total:min*60000,onEnd,done:false,announced:[],paused:false,pausedMs:0};S.lastMark=Date.now();S.marks=S.marks.filter(m=>m.game!==gameKey());tick()}
function stopClock(){S.clock=null}
function mark(game,name){const now=Date.now();S.marks.push({game,name,ms:now-S.lastMark});S.lastMark=now}
function tick(){const c=S.clock,el=$('#clk');if(!c||!el)return;const rem=c.paused?c.remaining:Math.max(0,c.end-Date.now());el.textContent=mmss(rem/1000);
  const w=el.parentElement;w.classList.toggle('low',rem<300000&&rem>=60000);w.classList.toggle('urgent',rem<60000);
  const p=$('#prog');if(p)p.style.width=(rem/c.total*100)+'%';
  const due=[10,5,1].filter(m=>rem<=m*60000&&!c.announced.includes(m));
  if(!c.paused&&rem>0&&due.length){c.announced.push(...due);const m=due[due.length-1],live=$('#time-announcement');if(live)live.textContent=m+' minute'+(m===1?'':'s')+' remaining'}
  if(!c.paused&&rem<=0&&!c.done){c.done=true;c.onEnd()}}
setInterval(tick,250);

function freezeClock(){
  const c=S.clock;if(!c||c.paused)return;
  const now=Date.now();c.remaining=Math.max(0,c.end-now);c.pausedAt=now;c.paused=true;
  recordScreenTime();track('pause');tick();
}
function unfreezeClock(){
  const c=S.clock;if(!c||!c.paused)return;
  const now=Date.now(),elapsed=Math.max(0,now-c.pausedAt);
  c.end=now+c.remaining;c.paused=false;c.pausedAt=null;
  c.pausedMs+=elapsed;
  S.lastMark+=elapsed;
  if(S.session){S.session.pausedMs=(S.session.pausedMs||0)+elapsed;S.session.screenAt=now}
  track('resume');tick();
}
function runOverlayHTML(){
  if(S.quitConfirm)return`<section class="run-dialog card stack" role="dialog" aria-modal="true" aria-labelledby="run-dialog-title"><span class="eyebrow">Leave practice</span><h2 id="run-dialog-title">Quit this run?</h2><p>Your unfinished run will be discarded. Completed runs in your practice history stay saved.</p><div class="row"><button class="btn ghost" data-act="quit-cancel">Keep playing</button><button class="btn" data-act="quit-confirm">Quit to menu</button>${window.pywebview?.api?.quit?'<button class="btn ghost" data-act="exit-app">Close desktop app</button>':''}</div></section>`;
  return`<section class="run-dialog card stack" role="dialog" aria-modal="true" aria-labelledby="run-dialog-title"><span class="eyebrow">Break in progress</span><h2 id="run-dialog-title">Practice paused</h2><p>The clock and phase timing are stopped. Resume when you are ready.</p><div class="pause-clock mono">${mmss(S.clock.remaining/1000)}</div><div class="row"><button class="btn" data-act="resume">Resume practice</button><button class="btn ghost" data-act="quit">Quit run</button></div></section>`;
}
function showRunOverlay(){
  let overlay=$('#run-overlay');if(!overlay){S.overlayReturnFocus=document.activeElement;overlay=document.createElement('div');overlay.id='run-overlay';overlay.className='run-overlay';document.body.append(overlay)}
  overlay.innerHTML=runOverlayHTML();$('#app').inert=true;overlay.querySelector('button')?.focus();
}
function hideRunOverlay(restoreFocus=true){const overlay=$('#run-overlay'),prior=S.overlayReturnFocus;if(overlay)overlay.remove();$('#app').inert=false;S.overlayReturnFocus=null;if(restoreFocus&&prior?.isConnected)prior.focus({preventScroll:true})}
function pauseRun(){if(!S.clock||S.clock.paused)return;freezeClock();S.quitConfirm=false;showRunOverlay()}
function resumeRun(){if(!S.clock?.paused||S.quitConfirm)return;unfreezeClock();hideRunOverlay()}
function requestQuit(){
  S.quitResume=!!(S.clock&&!S.clock.paused);
  if(S.quitResume)freezeClock();
  S.quitConfirm=true;showRunOverlay();
}
function cancelQuit(){
  const resume=S.quitResume;S.quitConfirm=false;S.quitResume=false;
  if(resume){unfreezeClock();hideRunOverlay()}
  else if(S.clock?.paused)showRunOverlay();
  else hideRunOverlay();
}
function discardRun(){
  hideRunOverlay(false);stopClock();S.quitConfirm=false;S.quitResume=false;
  S.session=null;S.res={};S.rr=null;S.sw=null;S.sfl=null;S.drill=null;S.pendingGame=null;S.marks=[];
  go('home');
}

function go(s){recordScreenTime();track('screen',{to:s});S.screen=s;if(s==='results'||s==='drill-results')finalizeSession();render(true)}
function topbar(){
  const game=isRR()?'Redrock Study':isSW()?'Sea Wolf':isSFL()?'Sustainable Futures Lab':'';
  const timed=S.clock&&(isRR()&&S.screen!=='rr-intro'||isSW()&&S.screen==='sw-site'||isSFL()&&S.screen!=='sfl-intro'||S.screen.startsWith('drill-')&&S.screen!=='drill-results');
  const active=!!S.session&&!S.session.saved&&!['home','history','results','drill-results'].includes(S.screen);
  const theme=document.documentElement.dataset.theme;
  return`<div class="bar"><div class="bar-in"><div class="row" style="gap:14px"><span class="brand">SOLVE LAB<small>FIELD TERMINAL</small></span>${game?`<span class="crumb">${game}${crumb()}</span>`:''}</div><div class="top-actions"><details class="shortcut-menu"><summary>Keys</summary><div>Tab and Enter work on all controls.<br>Alt+P pauses or resumes. Escape resumes or closes the quit prompt.<br>Redrock: Alt+1 Journal, Alt+2 Exhibits, Alt+3 Calculator.<br>Sea Wolf: 1–3 to categorise or choose prospects.<br>SFL: A–C for decisions.<br>Drills: Enter to submit, 1–2 to categorise.</div></details><button class="theme-toggle" type="button" data-act="theme" aria-label="Switch to ${theme==='dark'?'day':'night'} mode">${theme==='dark'?'☀ DAY':'☾ NIGHT'}</button>${active?`${timed?'<button class="run-control" type="button" data-act="pause">Ⅱ Pause</button>':''}<button class="run-control quit-control" type="button" data-act="quit">Quit</button>`:''}${timed?`<div class="clockwrap row" style="gap:8px"><span class="eyebrow hide-sm">Time left</span><span class="clock" id="clk" role="timer">--:--</span><span id="time-announcement" class="sr-only" aria-live="polite"></span></div>`:''}</div></div>${timed?'<div class="prog"><i id="prog"></i></div>':''}</div>`}
function crumb(){
  const m={'rr-intro':' · Briefing','rr-inv':' · Investigation','rr-an':` · Analysis ${S.rr?S.rr.an+1:''}/3`,'rr-rep1':' · Report 1/2','rr-rep2':' · Report 2/2','rr-case':` · Case ${S.rr?S.rr.ci+1:''}/6`,'sw-intro':' · Briefing','sfl-intro':' · Briefing','sfl-project':S.sfl?` · Decision ${Math.min(13,S.sfl.step+2)}/13`:'','sfl-team':S.sfl?` · Day ${S.sfl.day+1}/3`:''};
  if(m[S.screen])return m[S.screen];if(S.screen==='sw-site'&&S.sw)return` · ${S.sw.data.sites[S.sw.i].name} of 3`;return''}

function render(scroll){
  const map={home:homeHTML,history:historyHTML,'drill-math':mathDrillHTML,'drill-cases':caseDrillHTML,'drill-filter':filterDrillHTML,'drill-adaptive':adaptiveDrillHTML,'drill-spaced':adaptiveDrillHTML,'drill-results':drillResultsHTML,'rr-intro':rrIntroHTML,'rr-inv':rrInvHTML,'rr-an':rrAnHTML,'rr-rep1':rrRep1HTML,'rr-rep2':rrRep2HTML,'rr-case':rrCaseHTML,'sw-intro':swIntroHTML,'sw-site':swHTML,'sfl-intro':sflIntroHTML,'sfl-project':sflProjectHTML,'sfl-team':sflTeamHTML,break:breakHTML,results:resultsHTML};
  const drillGame=S.screen.startsWith('drill-')&&S.screen!=='drill-results'?({cases:'rr',filter:'sw',sfl:'sfl'}[S.drill?.family]||''):'';
  const game=gameKey()||drillGame;
  document.documentElement.dataset.game=game;
  $('#app').innerHTML=topbar()+`<div class="wrap ${game==='rr'?'rr-scope':game==='sfl'?'sfl-scope':''}">${map[S.screen]()}</div>`;
  showDesktopExit();document.querySelectorAll('input.num[data-bind]').forEach(updateNumericValidity);tick();if($('#fcount'))updateCount();if(scroll)window.scrollTo(0,0)}
function updateNumericValidity(field){
  const invalid=field.value.trim()!==''&&num(field.value)===null;
  field.setAttribute('aria-invalid',String(invalid));
  field.title=invalid?'Enter one complete number, such as 12.5 or 1,250. Clear the field to skip.':'';
  let note=field.parentElement.querySelector('.field-error[data-for="'+field.id+'"]');
  if(invalid){
    if(!note){note=document.createElement('span');note.className='field-error';note.dataset.for=field.id;note.id=field.id+'-error';field.parentElement.append(note)}
    note.textContent='Enter one complete number, such as 12.5 or 1,250. Clear to skip.';
    field.setAttribute('aria-describedby',note.id);
  }else{note?.remove();field.removeAttribute('aria-describedby')}
}
function preventInvalidNumericAdvance(){
  const invalid=[...document.querySelectorAll('input.num[data-bind]')].find(field=>field.value.trim()!==''&&num(field.value)===null);
  if(!invalid)return false;
  updateNumericValidity(invalid);invalid.focus();return true;
}
function showDesktopExit(){
  if(S.screen!=='home'||!window.pywebview?.api?.quit)return;
  const actions=$('.top-actions');if(!actions||actions.querySelector('[data-act="exit-app"]'))return;
  const button=document.createElement('button');button.className='run-control quit-control';button.type='button';button.dataset.act='exit-app';button.textContent='Exit app';actions.append(button);
}
window.addEventListener('pywebviewready',showDesktopExit);

/* ---------- home ---------- */
function homeHTML(){const rec=adaptiveRecommendation();return`<div class="stack home-screen" style="gap:25px">
<section class="hero"><img class="hero-scene" src="assets/hero-scene.svg" alt=""><div class="hero-copy"><span class="hero-kicker">Field terminal // independent practice</span><h1>Choose your<br>expedition<span aria-hidden="true">_</span></h1><p>Study the island, explore the ocean, and guide a sustainable project. Every seed creates a fresh practice run.</p></div><div class="hero-hud"><span>▶ Select a route below</span><span>Redrock // Sea Wolf // Sustainable Futures</span></div></section>
${S.challengeMode?`<div class="card row"><span class="eyebrow">Shared seed #${S.seed} · ${esc(S.challengeMode)}</span><button class="btn" data-act="start" data-v="${S.challengeMode}" data-same="1">Play shared challenge</button></div>`:''}
<span class="section-label">01 / Select your route</span>
<div class="modes">
<button class="mode mode-full" data-act="start" data-v="full"><span class="mode-icon dual" aria-hidden="true">✦</span><span class="eyebrow">65 minutes // two missions</span><span class="big">Full run</span><span class="mute">Begin at Redrock Island, then dive into Sea Wolf. Each game has its own clock.</span></button>
<button class="mode mode-rr rr-scope" data-act="start" data-v="rr"><img class="mode-icon" src="assets/redrock-icon.svg" alt=""><span class="eyebrow rr-t">Game 01 // land</span><span class="big rr-t">Redrock</span><span class="mute">35 minutes of investigation, analysis, reporting and six cases.</span></button>
<button class="mode mode-sw" data-act="start" data-v="sw"><img class="mode-icon" src="assets/seawolf-icon.svg" alt=""><span class="eyebrow sw-t">Game 02 // sea</span><span class="big sw-t">Sea Wolf</span><span class="mute">30 minutes to build microbe treatments for three ocean sites.</span></button></div>
<span class="section-label">02 / Extended sittings</span>
<div class="modes"><button class="mode mode-sfl" data-act="start" data-v="full20"><img class="mode-icon" src="assets/sfl-icon.svg" alt=""><span class="eyebrow">85 minutes // three missions</span><span class="big">Full + Project</span><span class="mute">Redrock, Sea Wolf, then the 20-minute decision lab.</span></button>
<button class="mode mode-sfl" data-act="start" data-v="full30"><img class="mode-icon" src="assets/sfl-icon.svg" alt=""><span class="eyebrow">95 minutes // three missions</span><span class="big">Full + Team</span><span class="mute">Redrock, Sea Wolf, then the 30-minute team lab.</span></button>
<button class="mode mode-sfl" data-act="start" data-v="sfl20"><img class="mode-icon" src="assets/sfl-icon.svg" alt=""><span class="eyebrow">Standalone // 20 minutes</span><span class="big">Project Lead</span><span class="mute">Rank priorities and make twelve linked decisions.</span></button>
<button class="mode mode-sfl" data-act="start" data-v="sfl30"><img class="mode-icon" src="assets/sfl-icon.svg" alt=""><span class="eyebrow">Standalone // 30 minutes</span><span class="big">Team Lab</span><span class="mute">Guide four researchers through three days.</span></button></div>
<div class="card seed-panel"><div class="row"><label for="seed" class="eyebrow">Scenario seed</label><input id="seed" class="num" value="${S.seed}" autocomplete="off"><button class="btn ghost sm" data-act="reseed">Roll new seed</button></div><span class="mute" style="font-size:.9rem">Keep a seed to replay identical data.</span></div>
<div class="card row practice-options"><label>Difficulty <select data-pref="difficulty"><option value="standard" ${S.difficulty==='standard'?'selected':''}>Standard</option><option value="hard" ${S.difficulty==='hard'?'selected':''}>Hard</option></select></label><label><input type="checkbox" data-pref="learning" ${S.learning?'checked':''}> Learning hints</label><span class="mute">Hard narrows Sea Wolf ranges, adds distractors, and tightens Redrock numeric tolerance to +/-0.25.</span></div>
<span class="section-label">03 / Focused practice</span><button class="mode mode-adaptive" data-act="drill-start" data-v="adaptive"><span class="eyebrow">Five-minute adaptive drill // Coach's pick</span><span class="big">${esc(rec.label)}</span><span class="mute">${esc(rec.reason)}</span><span class="adaptive-play">Start focused session →</span></button><div class="modes"><button class="mode" data-act="drill-start" data-v="math"><span class="big">Mental math</span><span class="mute">Five minutes: percent change, weighted averages, and three-value range checks.</span></button><button class="mode mode-rr" data-act="drill-start" data-v="cases"><span class="big">Redrock cases</span><span class="mute">Six mini-cases with a two-minute clock for each.</span></button><button class="mode mode-sw" data-act="drill-start" data-v="filter"><span class="big">Sea Wolf filters</span><span class="mute">Five minutes of filtering and categorising one site.</span></button></div>
<span class="section-label">04 / Build retention</span>${spacedPanelHTML()}
<div class="row"><button class="btn ghost" data-act="history">Practice history</button></div><div class="card stack"><h3>Difficulty calibration</h3>${calibrationHTML()}</div>
<div class="card flat stack field-note" style="gap:8px;max-width:900px"><h3>Field guide // practice model</h3>
<p class="mute">Redrock: 6 analysis answers (10 points each, ±0.5 tolerance), a 5-blank written review, a chart choice with data, and six standalone cases. 175 points in total. Journal, on-screen calculator and exhibits are included.</p>
<p class="mute">Sea Wolf: each site starts at 100 and loses 20 for every average outside its range, 20 for a missing desired trait, and 20 per microbe with the undesired trait. Each profile asks for two characteristics, followed by categorising, four prospect rounds, and treatment. 300 practice points in total.</p>
<p class="mute">McKinsey does not publish scoring, so point values come from candidate reports. This is not affiliated with McKinsey, and tools like it are not allowed during the real assessment.</p></div></div>`}

/* ---------- Redrock ---------- */
function exhibitsHTML(d,click){
  const c=(lab,v)=>click?` class="n clk" data-j="${esc(lab)}|${esc(v)}" tabindex="0" role="button" aria-label="Save ${esc(lab)} to journal"`:' class="n"';
  const t1=d.names.map((n,i)=>`<tr><td>${esc(n)}</td>${d.terr[i].map((v,y)=>`<td${c(n+' · Year '+(y+1)+' '+d.theme.measure,v+' '+d.theme.unit)}>${v}</td>`).join('')}</tr>`).join('');
  const t2=d.names.map((n,i)=>`<tr><td>${esc(n)}</td><td${c(n+' · Proposal A change',(d.pctA[i]>0?'+':'')+d.pctA[i]+'%')}>${d.pctA[i]>0?'+':''}${d.pctA[i]}%</td><td${c(n+' · Proposal B change',(d.kmB[i]>0?'+':'')+d.kmB[i]+' '+d.theme.unit)}>${d.kmB[i]>0?'+':''}${d.kmB[i]} ${esc(d.theme.unit)}</td></tr>`).join('');
  return`<div class="stack"><div><h3>Exhibit 1 · ${esc(d.theme.name)} (${esc(d.theme.unit)})</h3><div class="tblbox"><table><tr><th>${esc(d.theme.group)}</th><th class="n">Year 1</th><th class="n">Year 2</th><th class="n">Year 3</th><th class="n">Year 4</th></tr>${t1}</table></div>${studyChartHTML(d)}</div>
  <div><h3>Exhibit 2 · Allocation proposals</h3><div class="tblbox"><table><tr><th>${esc(d.theme.group)}</th><th class="n">Proposal A (% of Year 4)</th><th class="n">Proposal B (${esc(d.theme.unit)})</th></tr>${t2}</table></div></div></div>`}
function studyChartHTML(d){const top=Math.max(...d.y4);return`<div class="study-chart" role="img" aria-label="Bar chart of Year 4 ${esc(d.theme.measure)}">${d.names.map((name,i)=>`<div class="study-bar"><span class="mono">${esc(name)}</span><div class="study-track"><i style="width:${Math.round(d.y4[i]/top*100)}%"></i></div><b>${d.y4[i]}</b></div>`).join('')}</div>`}
function panelHTML(){
  const inCase=S.screen==='rr-case';let tabs=[['journal','Journal'],['exh','Exhibits'],['calc','Calculator']];
  if(inCase)tabs=[['calc','Calculator']];else if(S.screen==='rr-inv')tabs=tabs.filter(t=>t[0]!=='exh');
  if(!tabs.some(t=>t[0]===S.tab))S.tab=tabs[0][0];
  let body='';
  if(S.tab==='journal'){const j=S.rr.journal;body=`<div>${j.length?j.map((x,i)=>`<div class="jrow"><span><input class="jname" data-jname="${i}" value="${esc(x.k)}" maxlength="80" aria-label="Rename journal entry"><small class="mute"> · ${esc(x.at||'saved')}</small></span><span>${esc(x.v)} <button class="tab" style="padding:0 4px" data-act="jdel" data-v="${i}" aria-label="Remove entry">×</button></span></div>`).join(''):'<p class="mute" style="font-size:.9rem">Click any dashed number or table cell to save it here.</p>'}</div><label class="eyebrow" for="notes">Scratch notes</label><textarea id="notes" rows="4" data-notes>${esc(S.rr.notes)}</textarea>`}
  else if(S.tab==='exh'){body=exhibitsHTML(S.rr.d,false)}
  else{const ks=['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','(',')','C','⌫','=','+'];
    body=`<div class="calc-d" id="cd" draggable="true" title="Drag this value to an answer field">${esc(S.calc.expr||'0')}</div><div class="keys">${ks.map(k=>`<button data-act="key" data-v="${k}">${k}</button>`).join('')}</div><button class="btn ghost sm" data-act="usecalc">Use result in answer field</button><p class="mute">Drag the result to a numeric answer, or focus one and use the button.</p>`}
  return`<div class="tabs" role="tablist">${tabs.map(t=>`<button class="tab" role="tab" aria-selected="${S.tab===t[0]}" data-act="tab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`}
function split(main){return`<div class="split"><div class="stack">${main}</div><aside class="side card" id="side">${panelHTML()}</aside></div>`}

function rrIntroHTML(){return`<div class="stack mission-intro rr-scope" style="max-width:760px"><img class="intro-sprite" src="assets/redrock-icon.svg" alt=""><span class="eyebrow rr-t">Mission 01 // untimed briefing</span><h1>Redrock Study</h1>
<p>You are a researcher on Redrock Island. The 35-minute clock covers a three-phase island study, then six independent mini-cases. Study themes and case topics vary by seed.</p>
<div class="card stack" style="gap:8px"><h3>Phases</h3>
<p><b>Investigation.</b> Read the objective, study text and exhibits. Click numbers to save them to your Journal.</p>
<p><b>Analysis.</b> Three questions, two answers each. Answers within ±0.5 count.</p>
<p><b>Report.</b> Fill a written review from your results, then pick a chart type and enter its data.</p>
<p><b>Cases.</b> Six standalone problems with their own data. You cannot go back to a finished case.</p></div>
<p class="pace">Suggested pacing: about 15 minutes for Investigation and Analysis, 10 for the Report, 10 for the cases. Reaching all six cases matters more than polishing the report.</p>
<div class="row"><button class="btn" data-act="rrbegin">Start the 35-minute clock</button><button class="btn ghost" data-act="home">Back</button></div></div>`}
function rrInvHTML(){const d=S.rr.d,j=(l,v,t)=>`<span class="clk" data-j="${esc(l)}|${esc(v)}" tabindex="0" role="button" aria-label="Save ${esc(l)} to journal">${t}</span>`;
  return split(`<div class="card stack"><span class="eyebrow">Research objective · ${esc(d.theme.name)}</span><p style="font-size:1.1rem">Decide whether either allocation proposal would increase total ${esc(d.theme.measure)} across Redrock Island's ${esc(d.theme.groups)}, and report what you find.</p></div>
<div class="card stack"><span class="eyebrow">Study information</span><p>Redrock Island has ${j('Study groups','4','four')} ${esc(d.theme.groups)}: ${d.names.map(esc).join(', ')}. The Island Research Authority has surveyed ${esc(d.theme.measure)} in ${esc(d.theme.unit)} for ${j('Survey years','4','four')} consecutive years. ${esc(d.theme.context)} ${esc(d.theme.contextLabel)}: ${j(d.theme.contextLabel,fmt(d.elk)+' '+d.theme.contextUnit,fmt(d.elk))} ${esc(d.theme.contextUnit)}. Under Proposal A, each ${esc(d.theme.group)}'s Year 4 value changes by a set percentage. Under Proposal B, each ${esc(d.theme.group)} gains or loses a fixed number of ${esc(d.theme.unit)}. Field teams cover ${j('Survey sectors','3','three')} sectors.</p></div>
<div class="card">${exhibitsHTML(d,true)}</div>
<div class="row"><button class="btn" data-act="to-an">Continue to Analysis</button><span class="mute" style="font-size:.9rem">The Journal and exhibits stay available in the next phases.</span></div>`)}
function numField(key,unit){return`<span class="row" style="gap:6px"><input class="num" inputmode="decimal" id="${key}" data-bind="${key}" value="${esc(S.rr.ans[key]||'')}" aria-label="Answer"><span class="mute">${unit}</span></span>`}
function rrAnHTML(){const q=S.rr.d.an[S.rr.an];
  return split(`<div class="card q"><span class="eyebrow">Question ${S.rr.an+1} of 3</span><h2>${q.title}</h2>${q.parts.map(p=>`<div class="part"><label class="lbl" for="${p.key}">${esc(p.text)}</label>${numField(p.key,p.unit)}</div>`).join('')}${S.learning?'<p class="pace">Quick check: confirm the requested unit, the percentage denominator, and whether the result is a total or a change.</p>':''}</div>
<div class="row"><button class="btn" data-act="an-next">${S.rr.an<2?'Next question':'Continue to Report'}</button></div>`)}
function rrRep1HTML(){const d=S.rr.d,A=S.rr.ans,b=d.blanks;
  const sel=(k,opts)=>`<select id="${k}" data-bind="${k}" aria-label="Choose"><option value="">select…</option>${opts.map(o=>`<option ${A[k]===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  const inp=k=>`<input class="num sm" style="width:8em" inputmode="decimal" id="${k}" data-bind="${k}" value="${esc(A[k]||'')}" aria-label="Value">`;
  return split(`<div class="card stack"><span class="eyebrow">Report · written review</span><h2>Complete the summary</h2>
<p class="mute">Use the exhibits and your Analysis calculations. This seed selects the order of the report fields.</p>${b.map(x=>`<div class="part"><label class="lbl" for="${x.key}">${esc(x.prompt)}</label>${x.type==='sel'?sel(x.key,x.options):inp(x.key)}</div>`).join('')}</div>
<div class="row"><button class="btn" data-act="to-rep2">Continue to chart</button></div>`)}
const ICON={bar:'<svg width="44" height="34" viewBox="0 0 44 34" fill="currentColor"><rect x="4" y="14" width="8" height="18"/><rect x="18" y="4" width="8" height="28"/><rect x="32" y="20" width="8" height="12"/></svg>',
 pie:'<svg width="44" height="34" viewBox="0 0 44 34"><circle cx="22" cy="17" r="15" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 17V2A15 15 0 0 1 36 23Z" fill="currentColor"/></svg>',
 line:'<svg width="44" height="34" viewBox="0 0 44 34" fill="none" stroke="currentColor" stroke-width="3"><polyline points="3,28 15,16 26,22 41,5"/></svg>',
 waterfall:'<svg width="44" height="34" viewBox="0 0 44 34" fill="currentColor"><rect x="3" y="15" width="8" height="17"/><rect x="13" y="8" width="8" height="14"/><rect x="23" y="18" width="8" height="13"/><rect x="33" y="11" width="8" height="20"/></svg>'};
function rrRep2HTML(){const d=S.rr.d,A=S.rr.ans,v=d.vis;
  return split(`<div class="card stack"><span class="eyebrow">Report · visual</span><h2>${esc(v.instr)}</h2>
<div class="row" role="radiogroup" aria-label="Chart type">${['bar','pie','line','waterfall'].map(t=>`<label class="opt" style="flex-direction:column;align-items:center;gap:4px"><input type="radio" name="vt" data-bind="vtype" value="${t}" ${A.vtype===t?'checked':''}>${ICON[t]}<span style="text-transform:capitalize">${t} chart</span></label>`).join('')}</div>
<div class="stack" style="gap:0">${v.labels.map((l,i)=>`<div class="part"><label class="lbl" for="v${i}">${esc(l)}</label>${numField('v'+i,v.kind==='share'?'%':d.theme.unit)}</div>`).join('')}</div></div>
<div class="row"><button class="btn" data-act="to-cases">Continue to Cases</button><span class="mute" style="font-size:.9rem">The Study ends here. You will not be able to return.</span></div>`)}
function rrCaseHTML(){const i=S.rr.ci,c=S.rr.d.cases[i],A=S.rr.ans;
  const ans=c.type==='mc'?`<div class="stack" style="gap:8px">${c.options.map(o=>`<label class="opt"><input type="radio" name="c${i}" data-bind="c${i}" value="${o.id}" ${A['c'+i]===o.id?'checked':''}><span>${esc(o.text)}</span></label>`).join('')}</div>`:`<div class="row"><label class="sr" for="c${i}" style="position:absolute;left:-9999px">Answer</label><input class="num" inputmode="decimal" id="c${i}" data-bind="c${i}" value="${esc(A['c'+i]||'')}"></div>`;
  return split(`<div class="card q"><span class="eyebrow">Case ${i+1} of 6</span><h2>${esc(c.title)}</h2>${c.body}<p><b>${esc(c.q)}</b></p>${ans}${S.learning?'<p class="pace">Before moving on, check the units and whether the question asks for a percent, percentage points, a total, or a rate.</p>':''}</div>
<div class="row"><button class="btn" data-act="case-next">${i<5?'Lock answer and continue':'Finish Redrock'}</button><span class="pace">About two minutes per case.</span></div>`)}
function finishRR(timeUp){
  if(!S.rr||S.rr.done)return;S.rr.done=true;const g=S.screen==='rr-case'?'Cases':S.screen==='rr-rep1'||S.screen==='rr-rep2'?'Report':S.screen==='rr-an'?'Analysis':'Investigation';
  mark('rr',g);S.rr.timeUp=timeUp;S.res.rr=scoreRedrock(S.rr.d,S.rr.ans,S.difficulty==='hard'?.25:.5);stopClock();
  if(S.mode.startsWith('full')){S.pendingGame='sw';go('break')}else go('results')}

/* ---------- Sea Wolf ---------- */
function swIntroHTML(){return`<div class="stack mission-intro" style="max-width:760px"><img class="intro-sprite" src="assets/seawolf-icon.svg" alt=""><span class="eyebrow sw-t">Mission 02 // untimed briefing</span><h1>Sea Wolf</h1>
<p>You command a research vessel. Three ocean sites are contaminated. For each site you build a treatment of three microbes whose combined profile fits the site brief. One 30-minute clock covers all three sites.</p>
<div class="card stack" style="gap:8px"><h3>Per site, five steps</h3>
<p><b>Carry-overs.</b> Microbes you tagged “Next site” earlier return for a keep-or-reject check.</p>
<p><b>Profile.</b> Choose exactly two characteristics: two numbers, two traits, or one of each. Set a 1–10 range for a number; mark a trait Include or Avoid. This practice model shows the first ten matches.</p>
<p><b>Categorise.</b> Send each one to this site, the next site, or reject it.</p>
<p><b>Prospects.</b> Four rounds of three microbes. Pick one each time.</p>
<p><b>Treatment.</b> Choose the final three. Their <i>averages</i> must land in the site's ranges.</p></div>
<div class="pace">Aim for under 10 minutes per site. Not every site is guaranteed to be easy to perfect. Make a strong choice, then move on.</div>
<div class="row"><button class="btn" data-act="swbegin">Start the 30-minute clock</button><button class="btn ghost" data-act="home">Back</button></div></div>`}
function mbHTML(m,site,o={}){const t=m.trait===site.desired?'good':m.trait===site.undesired?'bad':'';
  const tag=o.pick?'button':'div';
  return`<${tag} class="mb ${o.pick?'pick':''} ${o.sel?'sel':''}" ${o.pick?`data-act="${o.act}" data-v="${m.id}" aria-pressed="${!!o.sel}"`:''}><span class="mb-head"><span class="microbe-sprite ${t}" aria-hidden="true"></span><span class="nm">${esc(m.name)}</span></span><span class="trait ${t}">${esc(m.trait)}${t==='good'?' · desired':t==='bad'?' · undesired':''}</span>${ATTRS.map((a,i)=>`<span class="attr"><span>${a.slice(0,5)}.</span><span class="bar2"><i style="width:${m.a[i]*10}%"></i></span><span class="mono">${m.a[i]}</span></span>`).join('')}</${tag}>`}
function siteRequirementsHTML(s){return`<div class="req">${s.ranges.map((r,i)=>`<span class="chip" title="The average of the three selected microbes must fall within this range.">${ATTRS[i]} avg <b>${r[0]}–${r[1]}</b></span>`).join('')}${s.desired?`<span class="chip good" title="At least one selected microbe needs this trait.">Desired: <b>${esc(s.desired)}</b></span>`:''}${s.undesired?`<span class="chip bad" title="Every selected microbe with this trait loses 20 practice points.">Avoid: <b>${esc(s.undesired)}</b></span>`:''}</div>`}
function reqHTML(s){const sw=S.sw,next=sw.cur.step===2?sw.data.sites[sw.i+1]:null;return`<div class="card stack req-banner" style="gap:10px"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">${s.name}</span><h2>${esc(s.contam)}</h2></div><div class="steps">${['Carry-overs','Profile','Categorise','Prospects','Treatment'].map((x,i)=>{const st=sw.cur.step;return`<span class="${i===st?'on':i<st?'done':''}">${x}</span>`}).join('')}</div></div>
${next?`<div class="site-brief-grid"><section class="site-brief current-site-brief" aria-label="${s.name} requirements"><span class="eyebrow">This site · ${s.name}</span>${siteRequirementsHTML(s)}</section><aside class="site-brief next-site-brief" aria-label="${next.name} information"><span class="eyebrow">Next site · ${next.name}</span><h3>${esc(next.contam)}</h3>${siteRequirementsHTML(next)}<p class="mute">Use these targets when choosing “Next site.” You can confirm carry-overs when you arrive there.</p></aside></div>`:siteRequirementsHTML(s)}<details class="rule-help"><summary>Explain these rules</summary><p>For each attribute, average the three selected values and compare it with the displayed interval. Include at least one desired trait if listed. Avoid the forbidden trait on every selected microbe. The profile step lets you choose two characteristics to inspect the pool; its matching rule is a practice model.</p></details></div>`}
function profileFilterHTML(site,f,notice='',drill=false){
  const traits=profileTraits(site),chosen=f.selected.length;
  const numbers=ATTRS.map((name,i)=>{const key='a'+i,on=f.selected.includes(key),range=f.r[i];
    return`<div class="profile-option ${on?'selected':''}"><button class="profile-pick" type="button" data-act="profile-toggle" data-v="${key}" aria-pressed="${on}" aria-label="${on?'Remove':'Choose'} ${esc(name)}"><span class="profile-check">${on?'✓':'+'}</span><span><b>${esc(name)}</b><small>Site target ${site.ranges[i].join('–')}</small></span></button><div class="profile-controls"><label>From <input type="number" min="1" max="10" step="1" inputmode="numeric" data-profile-range="${i}:min" value="${range[0]??''}" ${on?'':'disabled'}></label><label>To <input type="number" min="1" max="10" step="1" inputmode="numeric" data-profile-range="${i}:max" value="${range[1]??''}" ${on?'':'disabled'}></label></div></div>`;
  }).join('');
  const traitRows=traits.map(trait=>{const key='t:'+trait,on=f.selected.includes(key),mode=f.traitModes[trait],cue=trait===site.desired?'Desired here':trait===site.undesired?'Avoid here':'Other trait';
    return`<div class="profile-option ${on?'selected':''}"><button class="profile-pick" type="button" data-act="profile-toggle" data-v="${esc(key)}" aria-pressed="${on}" aria-label="${on?'Remove':'Choose'} ${esc(trait)}"><span class="profile-check">${on?'✓':'+'}</span><span><b>${esc(trait)}</b><small>${cue}</small></span></button><div class="profile-controls"><label>Preference <select data-profile-trait="${esc(trait)}" aria-label="${esc(trait)} preference" ${on?'':'disabled'}><option value="yes" ${mode==='yes'?'selected':''}>Include</option><option value="no" ${mode==='no'?'selected':''}>Avoid</option></select></label></div></div>`;
  }).join('');
  return`<section class="profile-shell"><div class="profile-lede"><div><span class="eyebrow">Step 01 // microbe profile</span><h3>Choose two characteristics</h3><p>Pick any two numbers or traits. A number uses a 1–10 range; a trait can be included or avoided.</p></div><div class="profile-meter"><b>${chosen} / 2</b><span>selected</span></div></div><div class="profile-layout"><div class="profile-panel"><div class="profile-panel-title"><span class="profile-glyph">01</span><h4>Numeric attributes</h4></div>${numbers}</div><div class="profile-panel"><div class="profile-panel-title"><span class="profile-glyph">02</span><h4>Traits</h4></div><div class="profile-traits">${traitRows}</div></div></div><div class="profile-foot"><div><p class="mono" id="fcount" aria-live="polite"></p>${notice?'<p class="no" role="alert">'+esc(notice)+'</p>':''}<small class="mute">Practice matching: two numbers combine; an included trait can widen a match; an avoided trait removes matches. Exact assessment pool logic is unpublished.</small></div><button class="btn" data-act="${drill?'drill-filter-go':'filter-go'}" ${chosen===2?'':'disabled'}>Show matching microbes →</button></div></section>`;
}
function newCur(site){return{step:1,filter:profileBlank(site),notice:'',shown:[],cat:{},ci:0,rounds:0,offer:[],offerHistory:[],offered:new Set(),picks:[],keep:new Set(),carry:[],sel:[],done:false}}
function enterSite(i){const sw=S.sw;sw.i=i;sw.cur=newCur(sw.data.sites[i]);sw.cur.started=Date.now();sw.cur.pauseBase=S.clock?.pausedMs||0;sw.cur.carry=sw.nextCarry.slice();sw.nextCarry=[];sw.cur.step=sw.cur.carry.length?0:1}
function swHTML(){const sw=S.sw,D=sw.data,s=D.sites[sw.i],c=sw.cur;let body='';
  if(c.step===0){body=`<div class="card stack"><h3>Confirm carry-overs</h3><p class="mute">These microbes were tagged “Next site”. Keep the ones that fit ${s.name}; the rest are dropped.</p><div class="mgrid">${c.carry.map(id=>mbHTML(D.byId[id],s,{pick:true,act:'keep',sel:c.keep.has(id)})).join('')}</div></div><div class="row"><button class="btn" data-act="carry-done">Continue to profile</button><span class="mute">${c.keep.size} kept</span></div>`}
  else if(c.step===1){body=profileFilterHTML(s,c.filter,c.notice)}
  else if(c.step===2){const id=c.shown[c.ci],m=D.byId[id],n=k=>c.shown.filter(x=>c.cat[x]===k).length;
    body=`<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Categorise · ${c.ci+1} of ${c.shown.length}</h3><span class="mono mute">This site ${n('cur')} · Next ${n('next')} · Rejected ${n('rej')}</span></div><div class="big-mb" style="width:100%">${mbHTML(m,s)}</div>
<div class="row" style="justify-content:center"><button class="btn" data-act="cat" data-v="cur">This site <span class="hide-sm">(1)</span></button>${sw.i<2?'<button class="btn ghost" data-act="cat" data-v="next">Next site <span class="hide-sm">(2)</span></button>':''}<button class="btn ghost" data-act="cat" data-v="rej">Reject <span class="hide-sm">(3)</span></button></div></div>`}
  else if(c.step===3){body=`<div class="card stack"><h3>Prospects · round ${c.rounds+1} of 4</h3><p class="mute">Pick one of the three. The others are discarded.</p><div class="mgrid">${c.offer.map(m=>mbHTML(m,s,{pick:true,act:'prospect'})).join('')}</div></div>`}
  else if(c.step===5){const r=sw.results[sw.i];body=`<div class="card stack"><span class="eyebrow">Treatment submitted</span><div class="score">${r.sc.score}%</div><p class="mute">Effectiveness for ${s.name}. Candidates report seeing this figure right after submitting. The requirements you missed are listed in your results at the end.</p></div><div class="row"><button class="btn" data-act="site-next">${sw.i<2?'Continue to the next site':'Finish Sea Wolf'}</button></div>`}
  else{const pool=finalPool();const sums=[0,1,2].map(i=>c.sel.reduce((t,id)=>t+D.byId[id].a[i],0));const n=c.sel.length;
    const rows=ATTRS.map((a,i)=>{const avg=n?sums[i]/n:null;const ok=n===3&&sums[i]>=3*s.ranges[i][0]&&sums[i]<=3*s.ranges[i][1];return`<div class="avgrow"><span>${a}</span><span class="mono">${avg===null?'—':(Math.round(avg*100)/100)} <span class="mute">target ${s.ranges[i][0]}–${s.ranges[i][1]}</span></span><span class="${n===3?(ok?'ok':'no'):'mute'}">${n===3?(ok?'in range':'out of range'):'pick 3'}</span></div>`}).join('');
    const sel=c.sel.map(id=>D.byId[id]);const hasD=s.desired?sel.some(m=>m.trait===s.desired):null;const badN=s.undesired?sel.filter(m=>m.trait===s.undesired).length:0;
    body=`<div class="split"><div class="stack"><div class="card stack"><h3>Choose your treatment · ${pool.length} microbes available</h3>${S.learning&&s.undesired?`<p class="pace">Hint: forbidden-trait candidates: ${pool.filter(m=>m.trait===s.undesired).map(m=>esc(m.name)).join(', ')||'none in this pool'}.</p>`:''}<div class="mgrid">${pool.map(m=>mbHTML(m,s,{pick:true,act:'sel',sel:c.sel.includes(m.id)})).join('')}</div></div></div>
<aside class="side card"><span class="eyebrow">Treatment · ${n} of 3</span>${rows}${s.desired?`<div class="avgrow"><span>Desired</span><span>${esc(s.desired)}</span><span class="${n===3?(hasD?'ok':'no'):'mute'}">${n===3?(hasD?'present':'missing'):'—'}</span></div>`:''}${s.undesired?`<div class="avgrow"><span>Avoid</span><span>${esc(s.undesired)}</span><span class="${n===3?(badN?'no':'ok'):'mute'}">${n===3?(badN?badN+' present':'none'):'—'}</span></div>`:''}
<button class="btn" data-act="confirm" ${n===3?'':'disabled'}>Confirm treatment</button></aside></div>`}
  return reqHTML(s)+`<div class="stack" style="margin-top:16px">${body}</div>`}
function finalPool(){const c=S.sw.cur,D=S.sw.data,ids=[...c.shown.filter(x=>c.cat[x]==='cur'),...c.keep,...c.picks];return[...new Set(ids)].map(id=>D.byId[id])}
function makeOffer(){const sw=S.sw,D=sw.data,s=D.sites[sw.i],c=sw.cur;const R=RNG(D.seed*7+sw.i*31+c.rounds*5+1);
  const seen=new Set([...c.shown,...c.offered]);const un=s.pool.filter(m=>!seen.has(m.id));let cand=R.shuffle(un).slice(0,3);
  const pl=un.filter(m=>s.planted.includes(m.id));if(pl.length&&R.chance(.5)){const p=R.pick(pl);if(!cand.includes(p))cand[0]=p}
  cand.forEach(m=>c.offered.add(m.id));c.offer=cand;c.offerHistory.push(cand.map(m=>m.id))}
function activeProfile(){
  if(S.screen==='sw-site'&&S.sw?.cur.step===1){const site=S.sw.data.sites[S.sw.i];return{site,filter:S.sw.cur.filter,owner:S.sw.cur}}
  if(S.screen.startsWith('drill-')&&S.drill?.family==='filter'&&S.drill.phase==='filter')return{site:S.drill.site,filter:S.drill.filter,owner:S.drill};
  return null;
}
function profileToggle(key){
  const current=activeProfile();if(!current)return;
  const {site,filter,owner}=current,allowed=['a0','a1','a2',...profileTraits(site).map(x=>'t:'+x)];
  if(!allowed.includes(key))return;
  const at=filter.selected.indexOf(key);
  if(at>=0)filter.selected.splice(at,1);
  else if(filter.selected.length<2)filter.selected.push(key);
  else owner.notice='Remove one choice before adding another.';
  if(at>=0||filter.selected.includes(key))owner.notice='';
  render(false);
  [...document.querySelectorAll('[data-act="profile-toggle"]')].find(button=>button.dataset.v===key)?.focus({preventScroll:true});
}
function updateCount(){
  const current=activeProfile(),el=$('#fcount');if(!el||!current)return;
  const {site,filter}=current,problem=profileError(site,filter);
  if(filter.selected.length<2){el.textContent='Choose '+(2-filter.selected.length)+' more characteristic'+(filter.selected.length===1?'':'s')+'.';return}
  if(problem){el.textContent=problem;return}
  const n=filterPool(site,site.pool,filter).length;
  el.textContent=`${n} of ${site.pool.length} microbes match · ${Math.min(10,n)} will be shown${n===0?' · adjust the profile':''}.`;
}
function scoreCurrent(){const sw=S.sw,D=sw.data,s=D.sites[sw.i],c=sw.cur;const trio=c.sel.map(id=>D.byId[id]);const pool=finalPool();
  sw.results[sw.i]={site:s,trio,sc:trio.length===3?scoreSite(s,trio):{score:0,avg:[0,0,0],ded:['No treatment was submitted before time ran out']},bestPool:pool.length>=3?bestIn(s,pool):{score:0,trio:null},bestFull:bestIn(s,s.pool),review:{filtered:c.filtered?c.filtered.slice():null,shown:c.shown.slice(),cat:{...c.cat},picks:c.picks.slice(),kept:[...c.keep],offerHistory:c.offerHistory.map(x=>x.slice()),filter:JSON.parse(JSON.stringify(c.filter)),timeMs:Math.max(0,Date.now()-c.started-((S.clock?.pausedMs||0)-c.pauseBase))}};
  mark('sw',s.name);c.done=true}
function finishSW(){const sw=S.sw;if(sw.fin)return;sw.fin=true;for(let i=sw.i;i<3;i++){if(i===sw.i){if(!sw.results[i])scoreCurrent()}else{const s=sw.data.sites[i];sw.results[i]={site:s,trio:[],sc:{score:0,avg:[0,0,0],ded:['Site not reached']},bestPool:{score:0,trio:null},bestFull:bestIn(s,s.pool)}}}
  S.res.sw=sw.results;stopClock();if(S.mode==='full20'||S.mode==='full30'){S.pendingGame=S.mode==='full20'?'sfl20':'sfl30';go('break')}else go('results')}

/* ---------- results ---------- */
function resultsHTML(){let h='<div class="stack" style="gap:24px"><div class="row" style="justify-content:space-between"><div class="row"><h1>Results</h1><span class="chip">Seed #'+S.seed+'</span></div><div class="row"><button class="btn" data-act="start" data-v="'+S.mode+'" data-same="1">Replay this seed</button><button class="btn ghost" data-act="new-scenario">New scenario</button></div></div>';
  if(S.session?.persisted===false)h+='<p class="pace">Browser storage is full or unavailable. Export this result now to keep a copy.</p>';
  if(S.session?.spacingSaved===false)h+='<p class="pace">The review plan could not be saved in this browser.</p>';
  if(S.res.rr)h+=rrResults();if(S.res.sw)h+=swResults();if(S.res.sfl)h+=sflResults();
  h+='<details class="card"><summary>Worked review and decision replay</summary><div class="stack" style="margin-top:16px">'+workedReviewHTML()+'</div></details>';
  h+=processHTML()+feedbackHTML()+shareHTML();
  h+='<div class="row"><button class="btn ghost" data-act="results-csv">Download CSV</button><button class="btn ghost" data-act="print-results">Print or save as PDF</button><button class="btn ghost" data-act="history">View history</button></div>';
  h+='<p class="mute" style="max-width:720px">Scoring is reconstructed from candidate reports and practice-site descriptions. McKinsey publishes no pass mark, so treat these numbers as practice feedback only.</p></div>';return h}
function phaseTimes(g){const m=S.marks.filter(x=>x.game===g);return m.length?`<div class="row">${m.map(x=>`<span class="chip">${x.name} <b>${mmss(x.ms/1000)}</b></span>`).join('')}</div>`:''}
function rrResults(){const r=S.res.rr,secs=['Analysis','Report','Cases'];
  return`<section class="card stack rr-scope"><div class="row" style="justify-content:space-between"><div><span class="eyebrow rr-t">Redrock Study${S.rr.timeUp?' · time ran out':''}</span><div class="score rr-t">${Math.round(r.total*10)/10} <span class="mute" style="font-size:1.2rem">/ ${r.max}</span></div></div><div class="row">${secs.map(s=>{const it=r.items.filter(x=>x.sec===s);return`<span class="chip">${s} <b>${Math.round(it.reduce((a,b)=>a+b.pts,0)*10)/10}/${it.reduce((a,b)=>a+b.max,0)}</b></span>`}).join('')}</div></div>${phaseTimes('rr')}
<div class="tblbox"><table><tr><th>Item</th><th>Your answer</th><th>Correct</th><th class="n">Points</th></tr>${r.items.map(x=>`<tr><td>${esc(x.sec)} · ${esc(x.label)}</td><td class="mono">${esc(x.your)}</td><td class="mono">${esc(x.correct)}</td><td class="n ${x.pts===x.max?'ok':x.pts>0?'':'no'}">${x.pts}/${x.max}</td></tr>`).join('')}</table></div>
<details><summary>Case explanations</summary><div class="stack" style="margin-top:10px">${S.rr.d.cases.map((c,i)=>`<p><b>Case ${i+1} · ${c.kind}.</b> ${esc(c.explain)}</p>`).join('')}</div></details></section>`}
function swResults(){const R=S.res.sw,tot=R.reduce((a,b)=>a+b.sc.score,0);
  return`<section class="card stack"><div><span class="eyebrow sw-t">Sea Wolf</span><div class="score sw-t">${tot} <span class="mute" style="font-size:1.2rem">/ 300</span></div></div>${phaseTimes('sw')}
${R.map(r=>`<div class="stack card flat" style="gap:8px"><div class="row" style="justify-content:space-between"><h3>${r.site.name} · ${esc(r.site.contam)}</h3><span class="mono"><b>${r.sc.score}</b>/100</span></div>
<p>${r.trio.length?r.trio.map(m=>`${esc(m.name)} <span class="mute">(${esc(m.trait)})</span>`).join(', '):'<span class="mute">No treatment</span>'}</p>
${r.sc.ded.length?`<ul style="margin:0;padding-left:1.1rem">${r.sc.ded.map(d=>`<li class="no">${r.trio.length===3?'−20 · ':''}${esc(d)}</li>`).join('')}</ul>`:'<p class="ok">Every requirement met.</p>'}
<p class="mute" style="font-size:.9rem">Best from your pool: ${r.bestPool.score}. Full pool: ${r.site.pool.length} microbes, ${countPerfectTeams(r.site)} perfect teams. Target widths: ${r.site.ranges.map(x=>x[1]-x[0]).join(' / ')}. Reference perfect team: ${r.bestFull.trio?r.bestFull.trio.map(m=>esc(m.name)+' ('+esc(m.trait)+')').join(', '):'—'}.</p></div>`).join('')}</section>`}

/* ---------- actions ---------- */
function setBind(k,v){S.rr.ans[k]=v}
function randomSeed(){return Math.floor(Math.random()*90000)+10000}
const ACT={
  pause(){pauseRun()},
  resume(){resumeRun()},
  quit(){requestQuit()},
  'quit-cancel'(){cancelQuit()},
  'quit-confirm'(){discardRun()},
  'exit-app'(){const api=window.pywebview?.api;if(api?.quit)Promise.resolve(api.quit()).catch(()=>{const message=$('#run-dialog-title');if(message)message.textContent='Could not close the app';});else discardRun()},
  history(){stopClock();go('history')},
  'history-csv'(){downloadText('solve-lab-history.csv',historyCSV(readHistory()),'text/csv;charset=utf-8')},
  'spaced-csv'(){downloadText('solve-lab-review-plan.csv',spacedCSV(),'text/csv;charset=utf-8')},
  'results-csv'(){downloadText('solve-lab-'+S.seed+'.csv',resultsCSV(),'text/csv;charset=utf-8')},
  'print-results'(){document.querySelectorAll('details').forEach(x=>x.open=true);setTimeout(()=>window.print(),40)},
  'copy-challenge'(){const share=challengeShareText(S.seed,S.mode),status=$('#share-status'),field=$('#challenge-url');const fallback=()=>{field?.select();let ok=false;try{ok=document.execCommand('copy')}catch{}if(status)status.textContent=ok?'Copied.':'Challenge selected; press Ctrl+C to copy.'};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(share).then(()=>{if(status)status.textContent='Copied.'}).catch(fallback);else fallback()},
  'feedback-save'(){const selects=[...document.querySelectorAll('[data-feedback]')].filter(x=>x.value);for(const x of selects)addFeedback({at:new Date().toISOString(),seed:S.seed,game:x.dataset.feedback,rating:x.value,difficulty:S.difficulty});const status=$('#feedback-status');if(status)status.textContent=selects.length?'Saved on this device.':'Choose a comparison first.'},
  'drill-start'(v){if(S.screen==='drill-results')S.seed=randomSeed();startDrill(v)},
  'drill-answer'(){drillAnswer()},
  'drill-skip'(){drillAnswer(true)},
  'drill-filter-go'(){applyDrillFilter()},
  'profile-toggle'(v){profileToggle(v)},
  'drill-cat'(v){drillCategorise(v)},
  'adaptive-choice'(v){adaptiveChoice(v)},
  home(){if(S.session&&!S.session.saved&&S.screen!=='home')discardRun();else{stopClock();go('home')}},
  'new-scenario'(){stopClock();S.seed=randomSeed();S.challengeMode=null;go('home')},
  reseed(){S.seed=randomSeed();S.challengeMode=null;render(false)},
  theme(){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('solve-lab-theme',next)}catch{}render(false)},
  start(v,t){const same=t&&t.dataset.same;if(!same){const e=$('#seed');if(e&&e.value.trim()){const raw=e.value.trim(),n=Number(raw);S.seed=/^[+-]?\d+$/.test(raw)&&Number.isSafeInteger(n)?n>>>0:hash(raw)>>>0}}
    S.mode=v;S.res={};S.marks=[];S.rr=null;S.sw=null;S.sfl=null;S.drill=null;S.pendingGame=null;S.tab='journal';S.calc={expr:'',fresh:false};startSession();
    if(v==='sfl20'||v==='sfl30'){initSFL(v==='sfl30'?'team':'project');go('sfl-intro')}
    else if(v==='sw'){initSW();go('sw-intro')}
    else{initRR();if(v.startsWith('full'))initSW();go('rr-intro')}},
  rrbegin(){S.screen='rr-inv';startClock(35,()=>finishRR(true));render(true)},
  'break-next'(){const next=S.pendingGame;S.pendingGame=null;if(next==='sw')go('sw-intro');else{initSFL(next==='sfl30'?'team':'project');go('sfl-intro')}},
  'results-now'(){S.pendingGame=null;go('results')},
  'sfl-begin'(){S.screen=S.sfl.format==='team'?'sfl-team':'sfl-project';startClock(S.sfl.format==='team'?30:20,finishSFL);render(true)},
  'rank-up'(v){sflRankMove(Number(v),Number(v)-1)},
  'rank-down'(v){sflRankMove(Number(v),Number(v)+1)},
  'rank-done'(){S.sfl.rankLocked=true;S.sfl.phase='decision';render(true)},
  'sfl-answer'(v){sflAnswer(v)},
  'sfl-next'(){sflNext()},
  'team-ask'(v){teamAsk(v)},
  'team-next'(){teamNext()},
  'team-support'(v){teamSupport(v)},
  tab(v){S.tab=v;$('#side').innerHTML=panelHTML()},
  jdel(v){S.rr.journal.splice(+v,1);$('#side').innerHTML=panelHTML()},
  key(v){calcKey(v)},
  usecalc(){const el=S.lastInput;if(el&&document.contains(el)){const x=calcValue();if(x!==null){el.value=String(Math.round(x*100)/100);el.dispatchEvent(new Event('input',{bubbles:true}))}}},
  'to-an'(){mark('rr','Investigation');S.rr.an=0;go('rr-an')},
  'an-next'(){if(preventInvalidNumericAdvance())return;if(S.rr.an<2){S.rr.an++;render(true)}else{mark('rr','Analysis');go('rr-rep1')}},
  'to-rep2'(){if(preventInvalidNumericAdvance())return;go('rr-rep2')},
  'to-cases'(){if(preventInvalidNumericAdvance())return;mark('rr','Report');S.rr.ci=0;S.calc={expr:'',fresh:false};S.rr.journal=[];go('rr-case')},
  'case-next'(){if(preventInvalidNumericAdvance())return;if(S.rr.ci<5){S.rr.ci++;render(true)}else finishRR(false)},
  swbegin(){S.screen='sw-site';startClock(30,()=>{if(S.sw&&!S.sw.fin){finishSW()}});enterSite(0);render(true)},
  keep(v){const k=S.sw.cur.keep;k.has(v)?k.delete(v):k.add(v);render(false)},
  'carry-done'(){S.sw.cur.step=1;render(true)},
  'filter-go'(){const sw=S.sw,s=sw.data.sites[sw.i],c=sw.cur,problem=profileError(s,c.filter);if(problem){c.notice=problem;render(false);return}
    c.filtered=filterPool(s,s.pool,c.filter).map(m=>m.id);if(!c.filtered.length){c.notice='No microbes match. Widen a range or change a trait preference.';render(false);return}
    c.notice='';c.shown=c.filtered.slice(0,10);c.ci=0;c.cat={};
    if(c.shown.length){c.step=2}else{c.step=3;makeOffer()}render(true)},
  cat(v){const sw=S.sw,c=sw.cur,id=c.shown[c.ci];c.cat[id]=v;if(v==='next')sw.nextCarry.push(id);c.ci++;
    if(c.ci>=c.shown.length){c.step=3;c.rounds=0;makeOffer();if(!c.offer.length){c.step=4}}render(false)},
  prospect(v){const sw=S.sw,c=sw.cur;c.picks.push(v);c.rounds++;if(c.rounds>=4){c.step=4}else{makeOffer();if(!c.offer.length)c.step=4}render(true)},
  sel(v){const c=S.sw.cur,i=c.sel.indexOf(v);if(i>=0)c.sel.splice(i,1);else if(c.sel.length<3)c.sel.push(v);render(false)},
  confirm(){const sw=S.sw;if(sw.cur.sel.length!==3)return;scoreCurrent();sw.cur.step=5;render(true)},
  'site-next'(){const sw=S.sw;if(sw.i<2){enterSite(sw.i+1);render(true)}else finishSW()}
};
function hash(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))|0;return h}
function initRR(){S.rr={d:genRedrock(S.seed),ans:{},journal:[],notes:'',an:0,ci:0}}
function initSW(){const data=genSeaWolf(S.seed);if(S.difficulty==='hard')hardenSeaWolf(data);S.sw={data,i:0,cur:null,nextCarry:[],results:[],fin:false}}
function calcValue(){const e=S.calc.expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');if(!e||!/^[0-9+\-*/().\s]+$/.test(e))return null;try{const r=Function('"use strict";return ('+e+')')();return isFinite(r)?r:null}catch(x){return null}}
function calcKey(k){const c=S.calc;
  if(k==='C')c.expr='';else if(k==='⌫')c.expr=c.expr.slice(0,-1);
  else if(k==='='){const r=calcValue();if(r!==null){c.expr=String(Math.round(r*1e6)/1e6);c.fresh=true}}
  else{if(c.fresh&&/[0-9.(]/.test(k))c.expr='';c.fresh=false;c.expr+=k}
  const d=$('#cd');if(d)d.textContent=c.expr||'0'}

document.addEventListener('click',e=>{
  const j=e.target.closest('[data-j]');
  if(j&&S.rr){const[k,v]=j.dataset.j.split('|');track('journal',{label:k});if(!S.rr.journal.some(x=>x.k===k)){S.rr.journal.push({k,v,at:mmss((Date.now()-(S.session?.started||Date.now()))/1000)});S.tab='journal';const p=$('#side');if(p){p.innerHTML=panelHTML();p.classList.add('flash')}}return}
  const t=e.target.closest('[data-act]');if(!t||t.disabled)return;track(t.dataset.act==='tab'?'tab':'action',{name:t.dataset.act,value:t.dataset.v||'',site:S.sw?.i,day:S.sfl?.day});const a=ACT[t.dataset.act];if(a)a(t.dataset.v,t,e)});
function onInput(e){const t=e.target;
  if(t.dataset.jname!==undefined&&S.rr){const entry=S.rr.journal[Number(t.dataset.jname)];if(entry)entry.k=t.value;return}
  if(t.dataset.profileRange!==undefined||t.dataset.profileTrait!==undefined){const current=activeProfile();if(!current)return;
    if(t.dataset.profileRange!==undefined){const [index,end]=t.dataset.profileRange.split(':'),v=t.value.trim()===''?null:Number(t.value);current.filter.r[Number(index)][end==='min'?0:1]=Number.isFinite(v)?v:null}
    else current.filter.traitModes[t.dataset.profileTrait]=t.value;
    current.owner.notice='';track('filter',{field:t.dataset.profileRange||t.dataset.profileTrait});updateCount();return}
  if(t.dataset.pref){if(t.dataset.pref==='difficulty')S.difficulty=t.value;else S.learning=t.checked;try{localStorage.setItem('solve-lab-settings',JSON.stringify({difficulty:S.difficulty,learning:S.learning}))}catch{}}
  else if(t.dataset.teamAssign&&S.sfl){S.sfl.records[S.sfl.day].assign[t.dataset.teamAssign]=t.value}
  else if(t.dataset.teamReason&&S.sfl){S.sfl.records[S.sfl.day].reasons[t.dataset.teamReason]=t.value}
  else if(t.dataset.teamReflect&&S.sfl){S.sfl.records[S.sfl.day].reflect[t.dataset.teamReflect]=t.value}
  else if(t.dataset.bind&&S.rr){if(t.type==='radio'&&!t.checked)return;if(t.matches('input.num'))updateNumericValidity(t);setBind(t.dataset.bind,t.value);track('answer',{field:t.dataset.bind})}
  else if(t.dataset.notes!==undefined&&S.rr){S.rr.notes=t.value}}
document.addEventListener('input',onInput);document.addEventListener('change',onInput);
document.addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches('input.num')&&e.target.dataset.bind)S.lastInput=e.target;if(S.screen==='sw-site'&&S.sw&&S.sw.cur.step===1)updateCount()});
document.addEventListener('dragstart',e=>{if(e.target.id==='cd'&&e.dataTransfer){const v=calcValue();if(v!==null)e.dataTransfer.setData('text/plain',String(Math.round(v*100)/100))}});
document.addEventListener('dragover',e=>{if(e.target.matches?.('input.num[data-bind]'))e.preventDefault()});
document.addEventListener('drop',e=>{if(!e.target.matches?.('input.num[data-bind]'))return;e.preventDefault();const raw=e.dataTransfer?.getData('text/plain');if(raw&&Number.isFinite(Number(raw))){e.target.value=raw;e.target.dispatchEvent(new Event('input',{bubbles:true}));track('calculator-drop',{field:e.target.dataset.bind})}});
document.addEventListener('keydown',e=>{
  if($('#run-overlay')){
    if(e.key==='Escape'){e.preventDefault();S.quitConfirm?cancelQuit():resumeRun()}
    else if(e.altKey&&e.key.toLowerCase()==='p'&&!S.quitConfirm){e.preventDefault();resumeRun()}
    return;
  }
  if(e.altKey&&e.key.toLowerCase()==='p'&&S.clock){e.preventDefault();pauseRun();return}
  const j=e.target.closest&&e.target.closest('[data-j]');
  if(j&&(e.key==='Enter'||e.key===' ')){e.preventDefault();j.click();return}
  if(e.altKey&&isRR()&&S.rr&&['1','2','3'].includes(e.key)){const tab={1:'journal',2:'exh',3:'calc'}[e.key];if(tab==='exh'&&S.screen==='rr-inv')return;e.preventDefault();track('tab',{value:tab,keyboard:true});S.tab=tab;const side=$('#side');if(side)side.innerHTML=panelHTML();return}
  if(e.key==='Enter'&&S.screen.startsWith('drill-')&&S.drill&&['math','cases'].includes(S.drill.family)&&e.target.id==='drill-answer'){e.preventDefault();track('action',{name:'drill-answer',keyboard:true});drillAnswer();return}
  if(S.screen.startsWith('drill-')&&S.drill?.family==='filter'&&S.drill.phase==='classify'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){if(e.key==='1'||e.key==='2'){e.preventDefault();track('action',{name:'drill-cat',keyboard:true});drillCategorise(e.key==='1'?'keep':'reject');return}}
  if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){
    if(S.screen==='sw-site'&&S.sw?.cur.step===3&&['1','2','3'].includes(e.key)){const m=S.sw.cur.offer[Number(e.key)-1];if(m){e.preventDefault();track('action',{name:'prospect',site:S.sw.i,keyboard:true});ACT.prospect(m.id);return}}
    if(S.screen==='sfl-project'&&S.sfl?.phase==='decision'&&/^[abc]$/i.test(e.key)){const q=S.sfl.data.questions[S.sfl.step],o=q.options['abc'.indexOf(e.key.toLowerCase())];if(o){e.preventDefault();track('action',{name:'sfl-answer',day:S.sfl.day,keyboard:true});ACT['sfl-answer'](o.id);return}}
    if(S.screen==='sfl-team'&&S.sfl?.phase==='support'&&/^[abc]$/i.test(e.key)){e.preventDefault();track('action',{name:'team-support',day:S.sfl.day,keyboard:true});ACT['team-support']('abc'.indexOf(e.key.toLowerCase()));return}
    if(['drill-adaptive','drill-spaced'].includes(S.screen)&&S.drill?.family==='sfl'&&/^[abc]$/i.test(e.key)){const q=S.drill.items[S.drill.i]?.q,o=q?.options['abc'.indexOf(e.key.toLowerCase())];if(o){e.preventDefault();track('action',{name:'adaptive-choice',keyboard:true});adaptiveChoice(o.id);return}}
  }
  if(S.screen==='sw-site'&&S.sw&&S.sw.cur.step===2&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){const m={'1':'cur','2':'next','3':'rej'}[e.key];if(m&&!(m==='next'&&S.sw.i===2)){e.preventDefault();track('action',{name:'cat',site:S.sw.i,keyboard:true});ACT.cat(m)}}
});
/* seed input is read at start; step-1 count refresh after render */
const _render=render;render=function(s){_render(s);if(S.screen==='sw-site'&&S.sw&&S.sw.cur.step===1)updateCount()};
render(true);
