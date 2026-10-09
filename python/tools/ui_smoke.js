/* Loaded after app/ui.js by ui_smoke.py. Browser regression, not game content. */
(() => {
  const lines=[];
  const fail=(message)=>{throw Error(message)};
  const check=(value,message)=>{if(!value)fail(message)};
  const log=message=>lines.push('PASS '+message);
  const fill=(selector,value)=>{
    const field=document.querySelector(selector);check(field,'missing field '+selector);
    field.value=String(value);
    if(field.type==='radio')field.checked=true;
    field.dispatchEvent(new Event(field.type==='radio'||field.tagName==='SELECT'?'change':'input',{bubbles:true}));
    return field;
  };
  window.onerror=(message,source,line)=>lines.push('BROWSER ERROR '+message+' at '+line);
  const noOverflow=label=>check(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,label+' horizontal overflow');
  const luminance=color=>{
    const rgb=color.match(/[\d.]+/g)?.slice(0,3).map(Number);
    check(rgb?.length===3,'unreadable color '+color);
    const linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
    return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
  };
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  function checkPalette(){
    const root=document.documentElement,theme=root.dataset.theme,game=root.dataset.game;
    const probe=document.createElement('div');probe.className='card';probe.innerHTML='<p class="mute">Readable detail</p><button class="btn">Continue</button>';document.body.append(probe);
    for(const mode of ['dark','light'])for(const mission of ['home','rr','sw','sfl']){
      root.dataset.theme=mode;root.dataset.game=mission;
      const body=getComputedStyle(document.body),card=getComputedStyle(probe),muted=getComputedStyle(probe.querySelector('.mute')),button=getComputedStyle(probe.querySelector('.btn'));
      check(contrast(body.color,body.backgroundColor)>=4.5,mode+' '+mission+' body contrast');
      check(contrast(muted.color,card.backgroundColor)>=4.5,mode+' '+mission+' muted contrast');
      check(contrast(button.color,button.backgroundColor)>=4.5,mode+' '+mission+' button contrast '+button.color+' on '+button.backgroundColor+' = '+contrast(button.color,button.backgroundColor).toFixed(2)+' root sea '+getComputedStyle(root).getPropertyValue('--sea')+' accent '+getComputedStyle(root).getPropertyValue('--accent')+' probe accent '+button.getPropertyValue('--accent'));
    }
    probe.remove();root.dataset.theme=theme;root.dataset.game=game;
    log('all mission palettes meet 4.5:1 text contrast');
  }
  const home=(seed=12345)=>{stopClock();S.seed=seed;S.screen='home';render(false);document.querySelector('#seed').value=seed;noOverflow('home')};
  function chooseFullProfile(){
    check(document.querySelector('[data-act="profile-toggle"]'),'profile choices visible');
    document.querySelector('[data-act="profile-toggle"][data-v="a0"]').click();
    document.querySelector('[data-act="profile-toggle"][data-v="a1"]').click();
    for(const i of [0,1]){fill('[data-profile-range="'+i+':min"]',1);fill('[data-profile-range="'+i+':max"]',10)}
    const count=activeProfile().site.pool.length;
    check(document.querySelector('#fcount')?.textContent.includes(count+' of '+count),'all microbes matched');
    noOverflow('Sea Wolf profile');
  }
  function redrock(){
    check(S.screen==='rr-intro','Redrock intro');ACT.rrbegin();noOverflow('Redrock investigation');
    const clickTarget=document.querySelector('[data-j]');
    clickTarget.click();check(S.rr.journal.length===1,'journal click save');
    const name=document.querySelector('[data-jname]');
    name.value='Field note';name.dispatchEvent(new Event('input',{bubbles:true}));
    check(S.rr.journal[0].k==='Field note','journal rename');
    ACT.tab('calc');S.calc.expr='6+4';ACT.key('=');check(calcValue()===10,'calculator result');
    ACT.tab('journal');ACT['to-an']();
    if(S.learning)check(document.querySelector('.pace')?.textContent.includes('Quick check'),'Redrock learning hint');
    for(const q of S.rr.d.an){
      for(const p of q.parts)fill('[data-bind="'+p.key+'"]',p.ans);
      ACT['an-next']();
    }
    for(const b of S.rr.d.blanks)fill('[data-bind="'+b.key+'"]',Array.isArray(b.ans)?b.ans[0]:b.ans);
    ACT['to-rep2']();fill('[data-bind="vtype"][value="'+S.rr.d.vis.right+'"]',S.rr.d.vis.right);
    S.rr.d.vis.values.forEach((v,i)=>fill('[data-bind="v'+i+'"]',v));
    ACT['to-cases']();noOverflow('Redrock case');
    for(const c of S.rr.d.cases){const key='c'+S.rr.ci;fill('[data-bind="'+key+'"]'+(c.type==='mc'?'[value="'+c.ans+'"]':''),c.ans);ACT['case-next']()}
    check(S.res.rr.total===175,'Redrock 175/175');
  }
  function seawolf(){
    check(S.screen==='sw-intro','Sea Wolf intro');ACT.swbegin();noOverflow('Sea Wolf site');
    for(let siteIndex=0;siteIndex<3;siteIndex++){
      if(S.sw.cur.step===0)ACT['carry-done']();
      chooseFullProfile();
      ACT['filter-go']();
      const nextSite=S.sw.data.sites[siteIndex+1],nextBrief=document.querySelector('.next-site-brief');
      if(nextSite){
        check(nextBrief?.textContent.includes(nextSite.name)&&nextBrief.textContent.includes(nextSite.contam),'upcoming Sea Wolf site description shown while categorising');
        check(nextSite.ranges.every(range=>nextBrief.textContent.includes(range.join('–'))),'upcoming Sea Wolf numeric targets shown');
        check((!nextSite.desired||nextBrief.textContent.includes(nextSite.desired))&&(!nextSite.undesired||nextBrief.textContent.includes(nextSite.undesired)),'upcoming Sea Wolf trait rules shown');
      }else check(!nextBrief,'no next-site brief on final site');
      noOverflow('Sea Wolf categorisation with next-site brief');
      while(S.sw.cur.step===2){
        const id=S.sw.cur.shown[S.sw.cur.ci];
        ACT.cat(S.sw.data.sites[siteIndex].planted.includes(id)?'cur':'rej');
      }
      while(S.sw.cur.step===3)ACT.prospect(S.sw.cur.offer[0].id);
      for(const id of S.sw.data.sites[siteIndex].planted)ACT.sel(id);
      ACT.confirm();ACT['site-next']();
    }
    check(S.res.sw.reduce((sum,x)=>sum+x.sc.score,0)===300,'Sea Wolf 300/300');
  }
  function project(){
    check(S.screen==='sfl-intro','Project intro');ACT['sfl-begin']();
    const correct=SFL_RANK.slice().sort((a,b)=>a.rank-b.rank).map(x=>x.id);
    for(let i=0;i<correct.length;i++){
      let pos=S.sfl.rank.indexOf(correct[i]);
      while(pos>i){document.querySelector('[data-act="rank-up"][data-v="'+pos+'"]').click();pos--}
    }
    ACT['rank-done']();
    for(let i=0;i<12;i++){
      const q=S.sfl.data.questions[S.sfl.step];
      ACT['sfl-answer'](q.options.find(x=>x.quality===2).id);ACT['sfl-next']();
    }
    check(S.res.sfl.score.total===100,'SFL project 100/100');
  }
  function team(){
    check(S.screen==='sfl-intro','Team intro');ACT['sfl-begin']();noOverflow('SFL team');
    for(let day=0;day<3;day++){
      const f=S.sfl,record=f.records[day],data=f.data,stations=data.days[day].stations;
      data.people.slice(0,3).forEach(p=>ACT['team-ask'](p.id));ACT['team-next']();
      for(const p of data.people){fill('[data-team-assign="'+p.id+'"]',stations.find(x=>x.skill===p.skill).id);fill('[data-team-reason="'+p.id+'"]','Skill fit')}
      ACT['team-next']();
      for(let i=0;i<2;i++)ACT['team-support'](data.days[day].requests[i].options.findIndex(x=>x.quality===2));
      for(const p of data.people)fill('[data-team-reflect="'+p.id+'"]',sflTeamState(p,stations.find(x=>x.id===record.assign[p.id]),4));
      ACT['team-next']();
    }
    check(S.res.sfl.score.total===100,'SFL team 100/100');
  }
  function fullRun(mode){
    home(mode==='full20'?12345:mode==='full30'?34567:56789);
    S.difficulty=mode==='full30'?'hard':'standard';S.learning=true;
    ACT.start(mode);redrock();check(S.screen==='break','break after Redrock');
    ACT['break-next']();seawolf();
    if(mode!=='full'){check(S.screen==='break','break after Sea Wolf');ACT['break-next']();(mode==='full20'?project:team)()}
    check(S.screen==='results','combined results');
    check(document.querySelectorAll('.sw-review-site').length===3&&document.querySelectorAll('.sw-review-site .phase-review').length===12,'Sea Wolf four-phase review for each site');
    for(const result of S.res.sw){
      check(result.review.offerHistory.length===4,'prospect offers retained for review');
      const v=result.review,ids=v.shown.filter(id=>v.cat[id]==='cur').concat(v.kept,v.picks);
      check(bestReviewTreatment(result.site,ids).score===result.bestPool.score,'review comparison matches treatment scorer');
    }
    check(readHistory()[0].mode===mode,'history mode');
    check(readSpaced().percent.reviews>=1,'combined run updates review plan');
    check(resultsCSV().includes('Redrock'),'results CSV');
    log(mode+' full route');
  }
  function standaloneRuns(){
    for(const [mode,play] of [['rr',redrock],['sw',seawolf],['sfl20',project],['sfl30',team]]){
      home(76123);ACT.start(mode);play();
      check(S.screen==='results'&&readHistory()[0].mode===mode,mode+' standalone result and history');
      log(mode+' standalone route');
    }
  }
  function perfectDrill(d){
    if(d.family==='math'||d.family==='cases'){
      const count=d.items.length;
      for(let i=0;i<count;i++){
        const q=d.items[i];
        if(q.type==='mc')document.querySelector('input[name="case-drill"][value="'+q.ans+'"]').checked=true;
        else document.querySelector('#drill-answer').value=q.ans;
        drillAnswer();
      }
    }else if(d.family==='sfl'){
      while(!d.done)adaptiveChoice(d.items[d.i].q.options.find(x=>x.quality===2).id);
    }else{
      chooseFullProfile();
      applyDrillFilter();
      const useful=new Set(),p=d.site.pool,s=d.site;
      for(let a=0;a<p.length-2;a++)for(let b=a+1;b<p.length-1;b++)for(let c=b+1;c<p.length;c++)
        if(scoreSite(s,[p[a],p[b],p[c]]).score===100)[p[a],p[b],p[c]].forEach(m=>useful.add(m.id));
      while(!d.done)drillCategorise(useful.has(d.shown[d.i])?'keep':'reject');
    }
    check(d.done&&d.results.max>0&&d.results.total===d.results.max,d.kind+' '+d.focus?.id+' perfect drill');
  }
  function spaced(){
    const now=Date.now();let card=spacedBlank(now).percent;
    for(const days of SPACED_INTERVALS){
      card=advanceSpacing(card,{attempted:8,missed:0},now);
      check(card.intervalDays===days,'interval '+days);
    }
    card=advanceSpacing(card,{attempted:8,missed:2},now);
    check(card.streak===0&&card.intervalDays===1,'miss resets schedule');
    log('spacing intervals and reset');
    localStorage.removeItem(SPACED_KEY);
    localStorage.setItem(HISTORY_KEY,JSON.stringify([{date:new Date(now-2*86400000).toISOString(),skillStats:{weighted:{attempted:8,missed:0}}}]));
    check(readSpaced(now).weighted.reviews===1,'history backfill once');
    check(readSpaced(now).weighted.reviews===1,'history backfill idempotent');
    log('review plan history migration');
    const broken=readSpaced(now);broken.percent.dueAt=1e20;broken.percent.lastReviewedAt=1e20;
    safeWrite(SPACED_KEY,{version:1,cards:broken});
    check(spacedCSV(now).includes('Percent change'),'invalid saved date repaired');
    log('review plan storage recovery');
    for(const focus of Object.keys(ADAPTIVE_FOCI)){
      const cards=spacedBlank(now);
      for(const id of Object.keys(cards))cards[id].dueAt=now+86400000;
      cards[focus].dueAt=now-1000;
      safeWrite(SPACED_KEY,{version:1,cards});
      home(12345);check(spacedRecommendation().id===focus,focus+' due priority');
      startDrill('spaced');check(S.drill.focus.id===focus&&S.screen==='drill-spaced',focus+' review launch');
      perfectDrill(S.drill);
      check(readHistory()[0].spacedFocus===focus,focus+' saved focus');
      check(readSpaced()[focus].reviews===1&&readSpaced()[focus].intervalDays===1,focus+' scheduled tomorrow');
      check(document.querySelector('.spaced-panel')===null,'drill results layout');
      log('spaced '+focus);
    }
    check(spacedCSV().split('\r\n').length===7,'review plan CSV rows');
    check(historyCSV(readHistory()).includes('spacedFocus'),'history CSV focus');
  }
  function edgeCases(){
    check(num('5xyz')===null&&num('1,2')===null&&num('1,250')===1250&&num('12.5%')===12.5,'numeric answers require one complete number');
    home();startDrill('math');
    const answer=document.querySelector('#drill-answer');answer.value='37';
    const savedCount=readHistory().length;
    document.querySelector('[data-act="pause"]').click();
    check(S.clock.paused&&document.querySelector('#app').inert&&document.querySelector('[role="dialog"]')?.textContent.includes('Practice paused'),'pause dialog blocks game');
    const remaining=S.clock.remaining;S.clock.end=Date.now()-1000;S.clock.pausedAt-=12000;tick();
    check(S.screen==='drill-math'&&S.drill.i===0&&document.querySelector('#drill-answer').value==='37','pause freezes timer and preserves typed answer');
    ACT.resume();
    check(!S.clock.paused&&!document.querySelector('#run-overlay')&&Math.abs(S.clock.end-Date.now()-remaining)<1000,'resume restores remaining time');
    check(S.session.pausedMs>=12000&&document.querySelector('#drill-answer').value==='37','pause excluded from metrics and form retained');
    answer.focus();answer.dispatchEvent(new KeyboardEvent('keydown',{key:'p',altKey:true,bubbles:true}));
    check(S.clock.paused,'Alt+P pauses while an answer is focused');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    check(!S.clock.paused&&document.activeElement===answer,'Escape resumes and restores answer focus');
    noOverflow('timed header with pause and quit');
    document.querySelector('[data-act="quit"]').click();
    check(S.clock.paused&&S.quitConfirm&&document.querySelector('[role="dialog"]')?.textContent.includes('Quit this run'),'quit confirmation pauses timer');
    ACT['quit-cancel']();check(!S.clock.paused&&document.querySelector('#drill-answer').value==='37','cancel quit resumes run');
    ACT.pause();ACT.quit();ACT['quit-cancel']();
    check(S.clock.paused&&document.querySelector('[role="dialog"]')?.textContent.includes('Practice paused'),'cancel quit returns to paused state');
    ACT.resume();ACT.quit();ACT['quit-confirm']();
    check(S.screen==='home'&&!S.clock&&!S.session&&readHistory().length===savedCount,'quit discards unfinished run without saving');
    home();ACT.start('rr');ACT.quit();check(S.quitConfirm&&!S.clock,'quit works from untimed briefing');ACT['quit-confirm']();
    log('pause, resume, quit, form retention and timing');
    home();ACT.start('sw');ACT.swbegin();
    check(document.querySelector('[data-act="filter-go"]').disabled,'profile needs two choices');
    const site=S.sw.data.sites[0],traits=profileTraits(site);
    check(traits.length===4&&document.querySelectorAll('[data-act="profile-toggle"][data-v^="t:"]').length===4,'four selectable traits shown');
    const traitKey='t:'+traits[0];
    document.querySelector('[data-act="profile-toggle"][data-v="a0"]').click();
    document.querySelectorAll('[data-act="profile-toggle"]').forEach(el=>{if(el.dataset.v===traitKey)el.click()});
    check(S.sw.cur.filter.selected.length===2&&!document.querySelector('[data-act="filter-go"]').disabled,'numeric plus trait selected');
    document.querySelector('[data-act="profile-toggle"][data-v="a1"]').click();
    check(S.sw.cur.filter.selected.length===2&&document.querySelector('[role="alert"]')?.textContent.includes('Remove one'),'third choice blocked');
    document.querySelector('[data-profile-trait]').value='no';
    fill('[data-profile-trait="'+traits[0]+'"]','no');
    const expected=filterPool(site,site.pool,S.sw.cur.filter).length;
    ACT['filter-go']();check(S.sw.cur.step===2&&S.sw.cur.filtered.length===expected,'mixed profile applied');
    home();ACT.start('sw');ACT.swbegin();
    for(const t of profileTraits(S.sw.data.sites[0]).slice(0,2)){
      const button=[...document.querySelectorAll('[data-act="profile-toggle"]')].find(x=>x.dataset.v==='t:'+t);button.click();
    }
    check(S.sw.cur.filter.selected.length===2&&S.sw.cur.filter.selected.every(x=>x.startsWith('t:')),'two-trait profile');
    log('two-choice Sea Wolf profile variants and limit');
    home();startDrill('math');drillAnswer();
    check(S.drill.i===0&&document.querySelector('#drill-notice').textContent,'blank drill answer blocked');
    drillAnswer(true);check(S.drill.i===1,'drill skip');
    document.querySelector('#drill-answer').value=S.drill.items[1].ans;
    document.querySelector('#drill-answer').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    check(S.drill.i===2&&sessionMetrics().actions>0,'Enter shortcut and telemetry');
    finishDrill();
    home();ACT.start('rr');ACT.rrbegin();ACT['to-an']();
    const numeric=document.querySelector('input.num[data-bind]');
    fill('input.num[data-bind]','5xyz');check(numeric.getAttribute('aria-invalid')==='true'&&numeric.getAttribute('aria-describedby')&&numeric.parentElement.querySelector('.field-error')?.textContent.includes('complete number'),'invalid Redrock answer flagged while typing');
    ACT['an-next']();check(S.rr.an===0&&document.activeElement===numeric,'invalid Redrock answer blocks locking the question');
    fill('input.num[data-bind]','5');check(numeric.getAttribute('aria-invalid')==='false'&&!numeric.parentElement.querySelector('.field-error'),'corrected Redrock answer clears warning');
    ACT['an-next']();check(S.rr.an===1,'corrected Redrock answer can advance');
    ACT.quit();ACT['quit-confirm']();log('input validation and shortcuts');
    home();ACT.start('rr');ACT.rrbegin();S.clock.end=Date.now()-1;tick();
    check(S.screen==='results'&&S.res.rr.total===0,'Redrock timeout');
    home();ACT.start('sw');ACT.swbegin();S.clock.end=Date.now()-1;tick();
    check(S.screen==='results'&&S.res.sw.length===3,'Sea Wolf timeout');
    check(S.res.sw[0].review.filtered===null&&document.querySelector('.sw-review-site .phase-review')?.textContent.includes('No profile was submitted'),'Sea Wolf timeout review reports no submitted profile');
    check(!swResults().includes('−20 · Site not reached')&&!resultsCSV().includes('"-20"'),'unplayed site is not shown as a 20-point deduction');
    check(sessionSkillStats().range.missed===9,'unplayed range work enters practice history');
    home();ACT.start('sfl30');ACT['sfl-begin']();S.clock.end=Date.now()-1;tick();
    check(S.screen==='results'&&S.res.sfl.score.total>=0,'SFL timeout');
    log('all game timeouts');
    home();ACT.theme();check(document.documentElement.dataset.theme==='light','day theme');
    ACT.theme();check(document.documentElement.dataset.theme==='dark','night theme');
    check(homeHTML().includes('Scheduled practice'),'review plan visible');
    log('day/night and review UI');
    checkPalette();
  }
  try{
    localStorage.removeItem(HISTORY_KEY);localStorage.removeItem(SPACED_KEY);
    fullRun('full');fullRun('full20');fullRun('full30');standaloneRuns();spaced();edgeCases();
  }catch(error){lines.push('FAIL '+(error.stack||error))}
  const pre=document.createElement('pre');pre.id='qa-output';pre.textContent=lines.join('\n');document.body.append(pre);
})();
