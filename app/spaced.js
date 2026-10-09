/* Calendar-day review schedule. It is practice guidance, not a Solve scoring rule. */
const SPACED_KEY='solve-lab-spaced-v1';
const SPACED_INTERVALS=[1,3,7,14,30];
function spacedDueAt(now,days){
  const d=new Date(now);d.setDate(d.getDate()+days);d.setHours(0,0,0,0);return d.getTime();
}
function spacedBlank(now=Date.now()){
  return Object.fromEntries(Object.keys(ADAPTIVE_FOCI).map(id=>[id,{dueAt:now,intervalDays:0,streak:0,reviews:0,lastAccuracy:null,lastReviewedAt:null}]));
}
function advanceSpacing(card,signal,now){
  const attempted=Number(signal?.attempted),missed=Number(signal?.missed);
  if(!Number.isFinite(attempted)||attempted<=0||!Number.isFinite(missed)||missed<0)return card;
  const accuracy=Math.max(0,Math.min(1,(attempted-missed)/attempted));
  const passed=accuracy>=.85,streak=passed?Math.min(5,(card.streak||0)+1):0;
  const intervalDays=passed?SPACED_INTERVALS[streak-1]:1;
  return{dueAt:spacedDueAt(now,intervalDays),intervalDays,streak,reviews:(card.reviews||0)+1,
    lastAccuracy:Math.round(accuracy*100),lastReviewedAt:now};
}
function readSpaced(now=Date.now()){
  const saved=safeRead(SPACED_KEY,null),cards=spacedBlank(now);
  if(saved?.version===1&&saved.cards&&typeof saved.cards==='object'){
    for(const id of Object.keys(cards)){
      const x=saved.cards[id];if(!x||!Number.isFinite(x.dueAt)||Math.abs(x.dueAt)>8.64e15)continue;
      cards[id]={dueAt:x.dueAt,intervalDays:Number.isFinite(x.intervalDays)?x.intervalDays:0,
        streak:Number.isFinite(x.streak)?x.streak:0,reviews:Number.isFinite(x.reviews)?x.reviews:0,
        lastAccuracy:Number.isFinite(x.lastAccuracy)?x.lastAccuracy:null,
        lastReviewedAt:Number.isFinite(x.lastReviewedAt)&&Math.abs(x.lastReviewedAt)<=8.64e15?x.lastReviewedAt:null};
    }
    return cards;
  }
  for(const row of readHistory().slice().reverse()){
    const at=Date.parse(row.date);
    if(!Number.isFinite(at)||at>now||!row.skillStats)continue;
    for(const [id,signal] of Object.entries(row.skillStats))if(cards[id])cards[id]=advanceSpacing(cards[id],signal,at);
  }
  safeWrite(SPACED_KEY,{version:1,cards});
  return cards;
}
function updateSpaced(stats,now=Date.now()){
  const cards=readSpaced(now);let changed=false;
  for(const [id,signal] of Object.entries(stats||{})){
    if(!cards[id])continue;
    const next=advanceSpacing(cards[id],signal,now);
    if(next!==cards[id]){cards[id]=next;changed=true}
  }
  return !changed||safeWrite(SPACED_KEY,{version:1,cards});
}
function spacedSummary(now=Date.now()){
  const cards=readSpaced(now),ordered=Object.keys(ADAPTIVE_FOCI).sort((a,b)=>cards[a].dueAt-cards[b].dueAt);
  return{cards,ordered,due:ordered.filter(id=>cards[id].dueAt<=now),next:ordered[0]};
}
function spacedRecommendation(now=Date.now()){
  const summary=spacedSummary(now),id=summary.next,card=summary.cards[id];
  const reason=card.dueAt<=now
    ?card.reviews?'Scheduled review is due. Last accuracy: '+card.lastAccuracy+'%.':'New skill ready for its first review.'
    :'Next review is '+new Date(card.dueAt).toLocaleDateString()+'. You can practise ahead.';
  return{id,...ADAPTIVE_FOCI[id],reason,source:'spaced'};
}
function spacedDueText(card,now=Date.now()){
  if(!card.reviews)return'Ready now';
  if(card.dueAt<=now)return'Due now';
  return'Due '+new Date(card.dueAt).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function spacedPanelHTML(){
  const now=Date.now(),summary=spacedSummary(now),next=spacedRecommendation(now);
  const heading=summary.due.length?summary.due.length+' skill'+(summary.due.length===1?'':'s')+' ready':'All reviews current';
  const rows=Object.keys(ADAPTIVE_FOCI).map(id=>{
    const card=summary.cards[id],due=card.dueAt<=now,focus=ADAPTIVE_FOCI[id];
    return'<div class="spaced-item '+focus.family+(due?' due':'')+'"><b>'+esc(focus.label)+'</b><span class="spaced-date">'+esc(spacedDueText(card,now))+'</span><span class="mute">'+(card.reviews?'Streak '+card.streak+' · last '+card.lastAccuracy+'%':'New skill')+'</span></div>';
  }).join('');
  return'<section class="card stack spaced-panel" aria-labelledby="spaced-title"><div class="row spaced-head"><div><span class="eyebrow">Scheduled practice</span><h2 id="spaced-title">'+heading+'</h2><p class="mute">Review '+esc(next.label)+'. Strong runs space a skill over 1, 3, 7, 14 and 30 days; missed work returns tomorrow.</p></div><button class="btn" data-act="drill-start" data-v="spaced">'+(summary.due.length?'Review next skill':'Practise ahead')+'</button></div><div class="spaced-grid">'+rows+'</div><button class="btn ghost sm spaced-export" data-act="spaced-csv">Export review plan CSV</button></section>';
}
function spacedCSV(now=Date.now()){
  const cards=readSpaced(now),rows=[['skill','status','due date','interval days','streak','reviews','last accuracy','last reviewed']];
  for(const [id,focus] of Object.entries(ADAPTIVE_FOCI)){
    const c=cards[id];rows.push([focus.label,c.dueAt<=now?'due':'scheduled',new Date(c.dueAt).toISOString(),c.intervalDays,c.streak,c.reviews,c.lastAccuracy??'',c.lastReviewedAt?new Date(c.lastReviewedAt).toISOString():'']);
  }
  return rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
