/* Local learning data and deterministic practice variants. */
const HISTORY_KEY="solve-lab-history-v1",SETTINGS_KEY="solve-lab-settings",FEEDBACK_KEY="solve-lab-feedback-v1";
function safeRead(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return x??fallback}catch{return fallback}}
function safeWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function readSettings(){const s=safeRead(SETTINGS_KEY,{});return{difficulty:s.difficulty==="hard"?"hard":"standard",learning:!!s.learning}}
function readHistory(){const h=safeRead(HISTORY_KEY,[]);return Array.isArray(h)?h.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[]}
function saveHistory(entry){const h=[entry,...readHistory()];for(const n of [80,60,40,20,10,1])if(safeWrite(HISTORY_KEY,h.slice(0,n)))return true;return false}
function readFeedback(){const x=safeRead(FEEDBACK_KEY,[]);return Array.isArray(x)?x:[]}
function addFeedback(entry){const a=readFeedback();a.unshift(entry);safeWrite(FEEDBACK_KEY,a.slice(0,100))}
function challengeParams(){try{const p=new URLSearchParams(location.search),s=p.get("seed"),m=p.get("mode");return{seed:s&&/^\d{1,10}$/.test(s)?Number(s)>>>0:null,mode:["full","full20","full30","rr","sw","sfl20","sfl30"].includes(m)?m:null}}catch{return{seed:null,mode:null}}}
function challengeURL(seed,mode){const u=new URL(location.href);u.searchParams.set("seed",seed);u.searchParams.set("mode",mode);return u.href}
function challengeShareText(seed,mode){return location.protocol==="file:"?`Solve Lab challenge — seed ${seed}, mode ${mode}`:challengeURL(seed,mode)}
function downloadText(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csvCell(v){let s=String(v??"");if(typeof v==="string"&&/^[=+@-]/.test(s.trimStart())&&!/^[+-]?\d+(?:\.\d+)?$/.test(s.trim()))s="'"+s;return'"'+s.replaceAll('"','""')+'"'}
function historyCSV(rows){const keys=["date","seed","mode","difficulty","rr","sw","sfl","math","drill","drillMax","durationSeconds","source","phaseSeconds","mistakes","skillStats","adaptiveFocus","spacedFocus"];return[keys.join(","),...rows.map(r=>keys.map(k=>csvCell(r[k]!==null&&typeof r[k]==="object"?JSON.stringify(r[k]):r[k])).join(","))].join("\r\n")}
function resultsCSV(){
  const rows=[["game","phase","item","your answer","correct answer","points","maximum"]];
  if(S.res.rr)for(const x of S.res.rr.items)rows.push(["Redrock",x.sec,x.label,x.your,x.correct,x.pts,x.max]);
  if(S.res.sw)for(const x of S.res.sw){rows.push(["Sea Wolf",x.site.name,"Treatment",x.trio.map(m=>m.name).join(" + "),x.bestFull.trio?.map(m=>m.name).join(" + ")||"",x.sc.score,100]);for(const d of x.sc.ded)rows.push(["Sea Wolf",x.site.name,"Deduction",d,"",x.trio.length===3?-20:"",0])}
  if(S.res.sfl)for(const x of S.res.sfl.score.items)rows.push(["SFL",S.res.sfl.format,x.label,x.your||"",x.correct||x.why,x.pts,x.max]);
  if(S.drill?.results)for(const x of S.drill.results.items)rows.push(["Drill",S.drill.kind,x.label,x.your,x.correct,x.ok?1:0,1]);
  return [["seed","mode","difficulty",...rows[0]].join(","),...rows.slice(1).map(row=>[S.seed,S.mode,S.difficulty,...row].map(csvCell).join(","))].join("\r\n");
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
function countPerfectTeams(site){
  let n=0,p=site.pool;for(let a=0;a<p.length-2;a++)for(let b=a+1;b<p.length-1;b++)for(let c=b+1;c<p.length;c++)if(scoreSite(site,[p[a],p[b],p[c]]).score===100)n++;
  return n;
}
function genMath(seed){
  const R=RNG(seed*37+19),out=[];
  for(let i=0;i<4;i++){const base=R.pick([80,100,120,160,200,240]),rate=R.pick([10,12.5,15,20,25]);out.push({kind:"Percent change",prompt:`A measure rises from ${base} to ${f1(base*(1+rate/100))}. What is the percent increase?`,ans:rate,unit:"%",why:`(new − old) ÷ old × 100 = ${rate}%.`})}
  for(let i=0;i<4;i++){const n1=R.pick([20,30,40]),n2=R.pick([10,15,25]),v1=R.pick([4,5,6,7]),v2=R.pick([8,9,10]);const ans=f1((n1*v1+n2*v2)/(n1+n2));out.push({kind:"Weighted average",prompt:`${n1} observations average ${v1}; ${n2} average ${v2}. What is the combined average?`,ans,unit:"",why:`(${n1} × ${v1} + ${n2} × ${v2}) ÷ ${n1+n2} = ${ans}.`})}
  for(let i=0;i<4;i++){const a=R.int(2,9),b=R.int(2,9),c=R.int(2,9),lo=R.int(3,6),hi=lo+2,sum=a+b+c,ans=sum>=3*lo&&sum<=3*hi?1:0;out.push({kind:"Range check",prompt:`A treatment has values ${a}, ${b} and ${c}. Is their average inside ${lo}–${hi}? Enter 1 for yes or 0 for no.`,ans,unit:"",why:`Sum = ${sum}. The accepted sum range is ${3*lo}–${3*hi} (three times each endpoint), so the answer is ${ans?'yes':'no'}.`})}
  return R.shuffle(out);
}
