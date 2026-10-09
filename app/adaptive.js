/* Local-only skill signals and short practice recommendations. */
const ADAPTIVE_FOCI={
  percent:{label:"Percent change and percentage points",family:"math",mathKind:"Percent change"},
  weighted:{label:"Weighted averages and expected value",family:"math",mathKind:"Weighted average"},
  range:{label:"Three-value range checks",family:"math",mathKind:"Range check"},
  data:{label:"Redrock data and chart cases",family:"cases"},
  filter:{label:"Sea Wolf filtering",family:"filter"},
  sfl:{label:"Sustainable Futures decisions",family:"sfl"}
};
function caseSkill(kind){
  if(["Growth","Percentage points"].includes(kind))return"percent";
  if(["Weighted average","Expected value"].includes(kind))return"weighted";
  return"data";
}
function mathSkill(kind){
  return kind==="Percent change"?"percent":kind==="Weighted average"?"weighted":"range";
}
function sessionSkillStats(){
  const stats={};
  const add=(id,missed)=>{const x=stats[id]||(stats[id]={attempted:0,missed:0});x.attempted++;if(missed)x.missed++};
  if(S.res.rr)for(const item of S.res.rr.items){
    let id="data";
    if(item.sec==="Analysis")id=["Q1b","Q2a"].includes(item.label)?"percent":item.label==="Q3a"?"weighted":"data";
    if(item.sec==="Cases"){const kind=item.label.split(" · ")[1];id=caseSkill(kind)}
    add(id,item.pts<item.max);
  }
  if(S.res.sw)for(const r of S.res.sw){
    const deductions=r.sc.ded||[];
    for(let i=0;i<3;i++)add("range",r.trio.length!==3||deductions.some(x=>x.startsWith(ATTRS[i]+" average")));
    const review=r.review;
    if(review){
      for(const id of r.site.planted)add("filter",!review.shown?.includes(id)||review.cat?.[id]!=="cur");
    }else add("filter",true);
  }
  if(S.res.sfl)for(const item of S.res.sfl.score.items)add("sfl",item.pts<item.max);
  if(S.drill?.results){
    const d=S.drill;
    d.results.items.forEach((item,i)=>{
      let id=["adaptive","spaced"].includes(d.kind)?d.focus.id:d.kind==="math"?mathSkill(d.items[i]?.kind):d.kind==="cases"?caseSkill(d.items[i]?.kind):"filter";
      add(id,!item.ok);
    });
  }
  return stats;
}
function adaptiveRecommendation(rows=readHistory()){
  const totals={};
  rows.slice(0,24).forEach((row,index)=>{
    const weight=1/(1+index*.15);
    let signals=row.skillStats;
    if(!signals){
      const mistakes=row.mistakes||{};
      signals={percent:{attempted:Math.max(1,mistakes.redrock?.Analysis||0),missed:mistakes.redrock?.Analysis||0},
        data:{attempted:Math.max(1,(mistakes.redrock?.Report||0)+(mistakes.redrock?.Cases||0)),missed:(mistakes.redrock?.Report||0)+(mistakes.redrock?.Cases||0)},
        filter:{attempted:Math.max(1,mistakes.seaWolf||0),missed:mistakes.seaWolf||0},
        sfl:{attempted:Math.max(1,mistakes.sfl||0),missed:mistakes.sfl||0}};
    }
    for(const [id,x] of Object.entries(signals)){
      if(!ADAPTIVE_FOCI[id]||!x?.attempted)continue;
      const t=totals[id]||(totals[id]={attempted:0,missed:0});
      t.attempted+=x.attempted*weight;t.missed+=(x.missed||0)*weight;
    }
  });
  const mastered=id=>{
    let clean=0;
    for(const row of rows){
      const signal=row.skillStats?.[id];
      if(signal?.missed>0)break;
      if(row.adaptiveFocus===id&&signal?.attempted&&signal.missed===0)clean++;
      if(clean>=2)return true;
    }
    return false;
  };
  const candidates=Object.entries(totals).filter(([id,x])=>x.missed>0&&!mastered(id));
  if(!candidates.length){
    const id=Object.keys(ADAPTIVE_FOCI).sort((a,b)=>(totals[a]?.attempted||0)-(totals[b]?.attempted||0))[0];
    return{id,...ADAPTIVE_FOCI[id],reason:rows.length?"No recent skill needs urgent review. Try a less-practised topic next.":"Start with a baseline percent-math session. Future runs will guide the next drill.",source:rows.length?"rotation":"baseline"};
  }
  candidates.sort((a,b)=>{
    const score=x=>x.missed/x.attempted*2+Math.min(4,x.missed)*.25;
    return score(b[1])-score(a[1])||b[1].missed-a[1].missed||a[0].localeCompare(b[0]);
  });
  const [id,x]=candidates[0];
  return{id,...ADAPTIVE_FOCI[id],reason:"Your recent runs show "+Math.round(x.missed)+" misses in about "+Math.round(x.attempted)+" opportunities for this skill.",source:"history"};
}
function adaptiveMathItems(seed,focus){
  const wanted=focus.mathKind,items=[],seen=new Set();
  for(let offset=0;items.length<8&&offset<30;offset++){
    for(const q of genMath(seed+offset*101)){
      if(q.kind!==wanted||seen.has(q.prompt))continue;
      seen.add(q.prompt);items.push(q);if(items.length===8)break;
    }
  }
  return items;
}
function adaptiveCaseItems(seed){
  const items=[],seen=new Set();
  for(let offset=0;items.length<5&&offset<40;offset++){
    for(const c of genRedrock(seed+offset*73).cases){
      if(!["Chart choice","Data judgement","Waterfall entry","Ratio","Probability"].includes(c.kind)||seen.has(c.body))continue;
      seen.add(c.body);items.push(c);if(items.length===5)break;
    }
  }
  return items;
}
