/* Local learning data and deterministic practice variants. */
const HISTORY_KEY="solve-lab-history-v1",SETTINGS_KEY="solve-lab-settings",FEEDBACK_KEY="solve-lab-feedback-v1",SCORING_VERSION=6;
function safeRead(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return x??fallback}catch{return fallback}}
function safeWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
const DIFFICULTIES=['guided','standard','hard','expert'];
function readSettings(){const s=safeRead(SETTINGS_KEY,{});return{difficulty:DIFFICULTIES.includes(s.difficulty)?s.difficulty:'standard',learning:!!s.learning}}
function numericTolerance(difficulty){return{guided:1,standard:.5,hard:.25,expert:.1}[difficulty]??.5}
function readHistory(){const h=safeRead(HISTORY_KEY,[]);return Array.isArray(h)?h.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[]}
function saveHistory(entry){const h=[entry,...readHistory()];for(const n of [80,60,40,20,10,1])if(safeWrite(HISTORY_KEY,h.slice(0,n)))return true;return false}
function readFeedback(){const x=safeRead(FEEDBACK_KEY,[]);return Array.isArray(x)?x:[]}
function addFeedback(entry){const a=readFeedback();a.unshift(entry);safeWrite(FEEDBACK_KEY,a.slice(0,100))}
function challengeParams(search=location.search){try{const p=new URLSearchParams(search),s=p.get("seed"),m=p.get("mode"),d=p.get("difficulty");return{seed:s&&/^\d{1,10}$/.test(s)?Number(s)>>>0:null,mode:["full","full20","full30","rr","sw","sfl20","sfl30"].includes(m)?m:null,difficulty:DIFFICULTIES.includes(d)?d:null}}catch{return{seed:null,mode:null,difficulty:null}}}
function challengeURL(seed,mode,difficulty){const u=new URL(location.href);u.searchParams.set("seed",seed);u.searchParams.set("mode",mode);u.searchParams.set("difficulty",difficulty);return u.href}
function challengeShareText(seed,mode,difficulty){return location.protocol==="file:"?`Solve Lab challenge — seed ${seed}, mode ${mode}, difficulty ${difficulty}`:challengeURL(seed,mode,difficulty)}
function downloadText(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csvCell(v){let s=String(v??"");if(typeof v==="string"&&/^[=+@-]/.test(s.trimStart())&&!/^[+-]?\d+(?:\.\d+)?$/.test(s.trim()))s="'"+s;return'"'+s.replaceAll('"','""')+'"'}
function historyCSV(rows){const keys=["date","seed","mode","difficulty","scoringVersion","rr","sw","sfl","math","drill","drillMax","durationSeconds","source","phaseSeconds","mistakes","skillStats","adaptiveFocus","spacedFocus"];return[keys.join(","),...rows.map(r=>keys.map(k=>csvCell(r[k]!==null&&typeof r[k]==="object"?JSON.stringify(r[k]):r[k])).join(","))].join("\r\n")}
function resultsCSV(){
  const columns=['seed','mode','difficulty','game','phase','item','question','your answer','correct answer','points','maximum','explanation','alternatives'];
  const rows=[];
  for(const section of aiReviewData().sections){
    if(section.items)for(const x of section.items)rows.push([section.game,x.phase||section.format||'',x.label,x.question,x.selected,x.correct,x.points??(x.correctness?1:0),x.maximum??1,x.explanation,x.alternatives?JSON.stringify(x.alternatives):'']);
    if(section.sites)for(const site of section.sites)rows.push([section.game,site.name,'Site score',`Ranges: ${JSON.stringify(site.attributeRanges)}. Desired trait: ${site.desiredTrait}; forbidden trait: ${site.undesiredTrait}`,
      site.selectedTreatment.map(x=>x.name).join(' + '),site.strongestAvailableExample.map(x=>x.name).join(' + '),site.finalScore,100,
      `Treatment ${site.treatmentScore}/100; decisions ${site.decisionScore}/100. Deductions: ${site.deductions.join('; ')||'none'}. Decision penalties: ${JSON.stringify(site.decisionPenalties||[])}`,'']);
  }
  return[columns.join(','),...rows.map(row=>[S.seed,S.mode,S.difficulty,...row].map(csvCell).join(','))].join('\r\n');
}
function hardenSeaWolf(data){
  data.sites.forEach((site,i)=>{
    const team=site.planted.map(id=>data.byId[id]);
    site.ranges=site.ranges.map((_,a)=>{const avg=team.reduce((sum,m)=>sum+m.a[a],0)/3;return[Math.floor(avg),Math.ceil(avg)]});
    const seen=new Set(site.pool.map(m=>m.id));
    const traps=data.sites.filter((_,j)=>j!==i).flatMap(x=>x.pool).filter(m=>m.trait===site.undesired&&!seen.has(m.id)).slice(0,4);
    site.pool=site.pool.concat(traps);
    site.difficulty="hard";
  });
  return data;
}
function tuneSeaWolf(data,difficulty){
  if(difficulty==='guided'){
    data.sites.forEach(site=>{site.ranges=site.ranges.map(([lo,hi])=>[Math.max(1,lo-1),Math.min(10,hi+1)]);site.difficulty='guided'});
  }else if(difficulty==='hard'||difficulty==='expert'){
    hardenSeaWolf(data);
    if(difficulty==='expert')data.sites.forEach((site,i)=>{
      const seen=new Set(site.pool.map(m=>m.id));
      site.pool.push(...[...new Map(data.sites.filter((_,j)=>j!==i).flatMap(x=>x.pool).filter(m=>m.trait===site.undesired&&!seen.has(m.id)).map(m=>[m.id,m])).values()].slice(0,4));
      site.difficulty='expert';
    });
  }
  return data;
}
function countPerfectTeams(site){
  let n=0,p=site.pool;for(let a=0;a<p.length-2;a++)for(let b=a+1;b<p.length-1;b++)for(let c=b+1;c<p.length;c++)if(scoreSite(site,[p[a],p[b],p[c]]).ded.length===0)n++;
  return n;
}
function genMath(seed,difficulty='standard'){
  const R=RNG(seed*37+19),out=[],advanced=difficulty==='hard'||difficulty==='expert';
  for(let i=0;i<3;i++){
    const base=R.pick(advanced?[80,120,160,240,320]:[80,100,120,160,200]),rate=R.pick(advanced?[7.5,12.5,17.5,22.5,35]:[10,12.5,15,20,25]);
    out.push({kind:'Percent change',prompt:`A measure rises from ${base} to ${f1(base*(1+rate/100))}. What is the percent increase?`,ans:rate,unit:'%',why:`Subtract the original value, divide by ${base}, then multiply by 100: (${f1(base*rate/100)} ÷ ${base}) × 100 = ${rate}%. Dividing by the new value would understate the increase.`});
    const n1=R.pick([20,30,40]),n2=R.pick([10,15,25]),v1=R.pick([4,5,6,7]),v2=R.pick([8,9,10]),weighted=f1((n1*v1+n2*v2)/(n1+n2));
    out.push({kind:'Weighted average',prompt:`${n1} observations average ${v1}; ${n2} average ${v2}. What is the combined average?`,ans:weighted,unit:'',why:`Multiply each mean by its group size and divide by all ${n1+n2} observations: (${n1} × ${v1} + ${n2} × ${v2}) ÷ ${n1+n2} = ${weighted}. A plain average of the two means ignores unequal group sizes.`});
    const a=R.int(2,9),b=R.int(2,9),c=R.int(2,9),lo=R.int(3,6),hi=lo+2,sum=a+b+c,inside=sum>=3*lo&&sum<=3*hi?1:0;
    out.push({kind:'Range check',prompt:`A treatment has values ${a}, ${b} and ${c}. Is their average inside ${lo}–${hi}? Enter 1 for yes or 0 for no.`,ans:inside,unit:'',why:`Sum the three values (${sum}) and compare with three times each endpoint (${3*lo}–${3*hi}). The answer is ${inside?'yes':'no'}. Checking each value separately would use the wrong rule.`});
    const before=R.pick([18,25,32,40,48]),after=before+R.pick([4,6,8,10]);
    out.push({kind:'Percentage points',prompt:`A success rate moves from ${before}% to ${after}%. How many percentage points did it change?`,ans:after-before,unit:'points',why:`Subtract the two rates: ${after}% − ${before}% = ${after-before} percentage points. A relative percent increase would divide by ${before}%, which answers a different question.`});
  }
  if(difficulty!=='guided')for(let i=0;i<2;i++){
    const base=R.pick([100,200,400]),rise=R.pick([10,20,25]),fall=R.pick([10,15,20]),final=f1(base*(1+rise/100)*(1-fall/100)),net=f1((final/base-1)*100);
    out.push({kind:'Sequential change',prompt:`A total of ${base} rises ${rise}% and then falls ${fall}%. What is the overall percentage change? Enter a negative number for a decrease.`,ans:net,unit:'%',why:`Apply each change to the updated total: ${base} × ${1+rise/100} × ${1-fall/100} = ${final}. Relative to the original ${base}, this is ${net}%. Subtracting the two rates misses the changed denominator.`});
    const good=R.pick([2,3,4,5]),bad=10-good,payoff=R.pick([20,30,40]),cost=R.pick([5,10,15]),ev=f1((good*payoff-bad*cost)/10);
    out.push({kind:'Expected value',prompt:`Of 10 equally likely outcomes, ${good} gain ${payoff} points and ${bad} lose ${cost} points. What is the expected net points per outcome?`,ans:ev,unit:'points',why:`Weight both outcomes: (${good} × ${payoff} − ${bad} × ${cost}) ÷ 10 = ${ev}. The loss must be subtracted, not ignored.`});
  }
  if(advanced)for(let i=0;i<2;i++){
    const total=R.pick([120,160,200]),part=R.pick([30,40,50]),factor=R.pick([2,3]),newShare=f1(part*factor/(total-part+part*factor)*100);
    out.push({kind:'Changing denominator',prompt:`A group has ${part} of ${total} cases. Its count becomes ${factor} times as large while all other groups stay fixed. What percent of the new total belongs to it?`,ans:newShare,unit:'%',why:`New group count is ${part*factor}; new total is ${total-part+part*factor}. Divide to get ${newShare}%. Using ${total} as the denominator would ignore the added cases.`});
    const red=R.pick([2,3,4]),blue=R.pick([3,4,5]),chance=f1(red/(red+blue)*(red-1)/(red+blue-1)*100);
    out.push({kind:'Without replacement',prompt:`A bag has ${red} red and ${blue} blue markers. Draw two without replacement. What is the chance both are red, as a percent?`,ans:chance,unit:'%',why:`First red: ${red}/${red+blue}; second red after that: ${red-1}/${red+blue-1}. Multiply and convert to percent: ${chance}%. The second draw cannot use the original counts.`});
  }
  const kinds=difficulty==='guided'?4:difficulty==='standard'?6:8;
  const ordered=[...new Set(out.map(x=>x.kind))].slice(0,kinds),chosen=ordered.map(kind=>R.pick(out.filter(x=>x.kind===kind)));
  return R.shuffle(chosen.concat(R.shuffle(out.filter(x=>!chosen.includes(x))).slice(0,12-chosen.length)));
}
