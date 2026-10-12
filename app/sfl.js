/* Original practice reconstructions. No McKinsey scoring or scenario content is used. */
const SFL_THEMES=[
  {title:"Burn-scar watershed",site:"the upper watershed",risk:"a forecast storm",resource:"field crews",goal:"protect downstream water quality",signal:"turbidity readings",access:"the upstream road"},
  {title:"Tidal wetland recovery",site:"the marsh edge",risk:"a high-tide surge",resource:"restoration crews",goal:"restore the nursery habitat",signal:"salinity readings",access:"the tidal causeway"},
  {title:"Urban heat corridor",site:"the south corridor",risk:"an early heat wave",resource:"survey teams",goal:"reduce exposure for vulnerable residents",signal:"surface-temperature readings",access:"the school-site permit"},
  {title:"Alpine slope restoration",site:"the eastern slope",risk:"an early thaw",resource:"erosion crews",goal:"reduce sediment entering the valley",signal:"slope-movement readings",access:"the ridge trail"},
  {title:"River migration corridor",site:"the lower river",risk:"a low-flow period",resource:"habitat crews",goal:"keep fish passage open",signal:"flow-gauge readings",access:"the downstream gate"},
  {title:"Coastal dune protection",site:"the exposed shore",risk:"a seasonal storm",resource:"monitoring crews",goal:"protect nesting habitat",signal:"shoreline-change readings",access:"the beach-entry permit"}
];
const SFL_RANK=[
  {id:"map",text:"Map sites by expected harm and mark the largest evidence gaps",rank:0,why:"A shared risk map defines which facts could change the first intervention."},
  {id:"verify",text:"Check current field readings and access at the leading site",rank:1,why:"Verify the highest-impact uncertainty before committing people."},
  {id:"brief",text:"Brief partners on the provisional priority and decision trigger",rank:2,why:"Explain the evidence and the condition that could change the plan."},
  {id:"commit",text:"Run a limited, reversible pilot at the leading accessible site",rank:3,why:"A pilot is useful after its location and constraints have been checked."}
];
const SFL_Q=[
  ["Scope","A partner can open {access} today, but the risk map for {site} is incomplete. The first crew leaves tomorrow. What is the strongest next step?",[
    ["Set a same-day deadline to compare expected harm and confirm access, then send the first crew",2,"evidence",["evidence",1,"trust",1],"The deadline protects the departure while resolving the facts most likely to change the location."],
    ["Use the available access for a small pilot and refine the risk map after the crew leaves",1,"targeted",["pressure",-1],"A reversible pilot keeps momentum, but may use the first crew at a lower-impact site."],
    ["Ask the partner to hold access until every site has a complete risk map",0,"delay",["pressure",1],"A complete map would help, but the open-ended wait risks losing access and the departure window."]
  ]],
  ["Signals","Fresh {signal} disagree with last week's field notes. A location decision is due this afternoon. What do you use?",[
    ["Check the method and run one targeted repeat at the disputed location before the decision",2,"evidence",["evidence",1],"A fast discriminating check addresses the conflict within the decision window."],
    ["Use the new readings provisionally, flag their uncertainty, and schedule validation tomorrow",1,"transparent",["trust",1],"This is transparent and timely, but the disputed reading may steer today's placement."],
    ["Blend the old and new readings into a midpoint estimate and add a wider safety margin",0,"smooth",["pressure",1],"A safety margin helps, but averaging may hide a real shift at the location."]
  ]],
  ["Trade-offs","Only half the requested {resource} are available. Two sites have different expected harm, but partners at both expect action. Which plan is strongest?",[
    ["Fully staff the higher-harm site, reserve a rapid check at the other, and explain the trigger to redeploy",2,"targeted",["pressure",-1,"trust",1],"This protects the largest exposure while keeping a defined watch on the other site."],
    ["Put one crew at each site so both partners see progress, then revise after a week",1,"spread",["pressure",1],"Visible coverage helps relationships, but each crew may lack capacity to change the higher-risk outcome."],
    ["Staff the site with confirmed access first and negotiate the second site's scope later",0,"assume",["trust",-1],"Access matters, but it is not enough to outweigh a known difference in expected harm."]
  ]],
  ["Stakeholders","A local group reports a nearby exposure the model may have missed. The current plan is due for approval tomorrow. What do you do?",[
    ["Ask for the location and evidence today, test whether it changes the risk order, and share the rule used",2,"transparent",["trust",2],"The claim receives a timely check against the same priority rule."],
    ["Add a small contingent allocation for the reported exposure and keep the main plan moving",1,"targeted",["pressure",1],"A contingency acknowledges the concern, but does not establish whether priorities should change."],
    ["Submit the current plan with the concern documented for the first scheduled review",0,"delay",["trust",-1],"Documentation is useful, but tomorrow's approval makes an immediate check possible and valuable."]
  ]],
  ["Timing","{risk} advances the field deadline by four days. Which schedule change best protects {goal}?",[
    ["Keep the exposure check and first intervention; defer the lower-impact survey and name an owner for follow-up",2,"targeted",["pressure",-1],"The critical outcome remains covered, with deferred work assigned rather than forgotten."],
    ["Run a shorter version of every task so all milestones remain on the calendar",1,"spread",["pressure",1],"Breadth preserves visibility, but can leave the critical check too thin."],
    ["Move the field crew immediately and complete analysis from last week's readings",0,"assume",["evidence",-1,"pressure",1],"Speed helps, but the omitted exposure check could send the crew to the wrong place."]
  ]],
  ["Team","Two specialists offer different explanations for the same {signal}. The next sampling window is short. How do you proceed?",[
    ["Agree on the one observation that separates the explanations and use the next sample to test it",2,"evidence",["evidence",1,"trust",1],"The scarce sample answers the decision-relevant disagreement."],
    ["Use the explanation with stronger historical evidence and record the competing view for review",1,"transparent",["trust",1],"History is a reasonable prior, but the next sample could resolve this case directly."],
    ["Collect a broad extra sample across all sites and decide after the full results return",0,"delay",["pressure",1],"Broader data may help later, but misses the short decision window."]
  ]],
  ["Measures","A sponsor wants one early indicator and one final test of whether the work achieved {goal}. Which pair is strongest?",[
    ["Track a baseline-adjusted outcome and a leading field signal tied to the intervention",2,"evidence",["evidence",1],"The leading signal supports timely course correction; the outcome tests the actual goal."],
    ["Track completed site visits and the final outcome against the original target",1,"targeted",["pressure",-1],"This is measurable, but site visits are activity and the target alone omits baseline change."],
    ["Track partner approval and the final outcome at the most visible site",0,"smooth",["evidence",-1],"Partner approval matters, but it does not reveal whether the broader exposure improved."]
  ]],
  ["Uncertainty","A quick intervention could reduce exposure at {site}, but its effect on adjacent habitat is unknown. There is time for one trial. What do you do?",[
    ["Trial it at a reversible site with a habitat measure and a pre-agreed stop threshold",2,"targeted",["evidence",1,"pressure",-1],"The trial creates useful evidence and limits a side effect before scaling."],
    ["Use it at the highest-risk site with intensive monitoring and authority to stop",1,"evidence",["evidence",1],"Monitoring helps, but an avoidable side effect would affect the most exposed site."],
    ["Wait for a laboratory study while using only the established slower intervention",0,"delay",["pressure",1],"The established method is defensible, but a bounded field trial could answer the urgent question sooner."]
  ]],
  ["Communication","A sponsor needs a board update before final results arrive. Which statement is most useful?",[
    ["State what has been delivered, what {signal} show so far, the uncertainty, and the next decision date",2,"transparent",["trust",2],"The board receives a usable status and a clear point for revision."],
    ["Give the early trend and a range of possible outcomes, with a note that validation is pending",1,"evidence",["evidence",1],"The range signals uncertainty, but leaves the next action and decision time unclear."],
    ["Report that delivery is on track and reserve outcome discussion for the final data release",0,"smooth",["trust",-1],"Delivery status is relevant, but it can imply the outcome is secure before evidence supports it."]
  ]],
  ["New evidence","One late field sample suggests risk has shifted away from the original site. The next crew can be redirected tomorrow. What do you do?",[
    ["Verify the shift with a fast independent check, then redirect that crew if the risk order changes",2,"evidence",["evidence",1,"pressure",-1],"A short verification prevents overreacting while keeping the crew movable."],
    ["Redirect the next crew now and test the shift during its first day in the field",1,"targeted",["pressure",-1],"This acts quickly, but uses crew capacity before the lone sample is confirmed."],
    ["Keep the crew at the original site and add the new location to the next survey cycle",0,"delay",["pressure",1],"The original plan has a rationale, but the available redirection window calls for a faster check."]
  ]],
  ["Capacity","The analyst validating {signal} is overloaded; a second analyst has capacity but less site context. What is the best hand-off?",[
    ["Transfer the repeatable quality check with a short briefing and retain final interpretation with the site analyst",2,"targeted",["pressure",-1,"trust",1],"The spare capacity removes a defined bottleneck without losing context for interpretation."],
    ["Move the entire analysis package to the available analyst and schedule one review at the end",1,"spread",["pressure",-1],"This frees the bottleneck, but puts interpretation at risk until the late review."],
    ["Keep all validation with the site analyst and ask the other to prepare the board slides",0,"assume",["pressure",1],"The other analyst contributes, but the validation bottleneck remains on the critical path."]
  ]],
  ["Synthesis","Leaders need a recommendation for {site} today, although one habitat measure remains uncertain. Which final note is strongest?",[
    ["Recommend the priority action, quantify the expected benefit, name the uncertainty, and specify a revision trigger",2,"transparent",["trust",1,"evidence",1],"The note supports an immediate decision and defines when new evidence should change it."],
    ["Recommend a limited first phase, show expected benefit and uncertainty, and request a second approval before scaling",1,"targeted",["pressure",1],"A staged decision limits downside, but may add an avoidable approval delay without a clear trigger."],
    ["Present the likely benefit and uncertainty, then let leaders choose among the three feasible actions",0,"delay",["pressure",1],"The evidence is useful, but the requested recommendation is still missing."]
  ]]
];
function sflFill(text,theme){return text.replaceAll("{site}",theme.site).replaceAll("{risk}",theme.risk).replaceAll("{resource}",theme.resource).replaceAll("{goal}",theme.goal).replaceAll("{signal}",theme.signal).replaceAll("{access}",theme.access)}
function genSFLProject(seed){
  const R=RNG(seed*23+11),theme=R.pick(SFL_THEMES);
  return{seed,theme,rank:R.shuffle(SFL_RANK),questions:SFL_Q.map(([phase,prompt,raw])=>({
    phase,prompt:sflFill(prompt,theme),options:R.shuffle(raw.map(([text,quality,stance,effects,why],i)=>({id:String(i),text:sflFill(text,theme),quality,stance,effects,why})))
  }))};
}
function sflProjectPrompt(data,index,state){
  const q=data.questions[index];
  const branches={
    3:state.trust<0?"Because earlier communication weakened trust, the local group arrives with a formal objection. ":"Because earlier communication built trust, the local group brings a new observation. ",
    6:state.evidence>1?"Your early checks created a useful baseline. ":"Early checks were skipped, so the baseline is uncertain. ",
    8:state.trust<0?"Partners now doubt previous updates. ":"Partners have been kept informed. ",
    9:state.pressure>2?"The schedule is already slipping. ":"There is still room for a targeted adjustment. "
  };
  const lead=branches[index]||[state.trust<0?"Partners are questioning the plan. ":"",state.pressure>2?"Time pressure is rising. ":"",state.evidence>2?"Your evidence base is improving. ":""].join("");
  return lead+q.prompt;
}
function scoreSFLProject(data,rank,answers,rankLocked=true){
  const ordered=rank.map(id=>data.rank.find(x=>x.id===id)?.rank).filter(x=>x!==undefined);
  let inversions=0;for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++)if(ordered[i]>ordered[j])inversions++;
  const rankPts=rankLocked&&ordered.length===4?Math.round((20-inversions*20/6)*10)/10:0;
  const items=[{label:"Priority ranking",pts:rankPts,max:20,your:rank.map(id=>data.rank.find(x=>x.id===id)?.text).join(" → "),correct:SFL_RANK.slice().sort((a,b)=>a.rank-b.rank).map(x=>x.text).join(" → "),why:SFL_RANK.slice().sort((a,b)=>a.rank-b.rank).map(x=>x.text+" — "+x.why).join(" ") }];
  const stances=[],state={evidence:0,trust:0,pressure:0};let decisionPts=0;
  for(let i=0;i<12;i++){const q=data.questions[i],choice=q.options.find(x=>x.id===answers[i]);const pts=choice?choice.quality*2.5:0;decisionPts+=pts;
    if(choice){stances.push(choice.stance);for(let k=0;k<choice.effects.length;k+=2)state[choice.effects[k]]+=choice.effects[k+1]}
    const best=q.options.find(x=>x.quality===2);
    items.push({label:"Decision "+(i+1)+" · "+q.phase,pts,max:5,your:choice?.text||"No decision",correct:best?.text||"",why:(choice?choice.why:"No decision submitted.")+" Strongest option: "+(best?.text||"")+" — "+(best?.why||"")})}
  const conflicts=[["transparent","opaque"],["evidence","assume"],["targeted","spread"],["targeted","delay"]];
  const conflictingPairs=conflicts.filter(([a,b])=>stances.includes(a)&&stances.includes(b));
  const inconsistent=conflictingPairs.length;
  const submitted=Array.from({length:12},(_,i)=>answers[i]).filter(x=>x!==undefined).length;
  const consistency=Math.round(Math.max(0,10-inconsistent*3)*submitted/12*10)/10;
  items.push({label:"Decision consistency",pts:consistency,max:10,why:(inconsistent?"Conflicting approaches: "+conflictingPairs.map(pair=>pair.join(" versus ")).join(", ")+".":"No conflicting approach was detected.")+" Answered "+submitted+" of 12 decisions; unanswered decisions reduce this score proportionally."});
  const outcome=Math.round(Math.max(0,10-2*Math.max(0,-state.evidence)-1.5*Math.max(0,-state.trust)-Math.max(0,state.pressure))*submitted/12*10)/10;
  items.push({label:"Project outcome",pts:outcome,max:10,why:`Evidence ${state.evidence}, trust ${state.trust}, pressure ${state.pressure}. Weak evidence, lost trust, and excess pressure reduce this score; skipped decisions reduce it proportionally.`});
  return{items,total:Math.round((rankPts+decisionPts+consistency+outcome)*10)/10,max:100};
}

const SFL_SKILLS=["Field ecology","Data analysis","Community outreach","Operations"];
const SFL_NAMES=["Ari","Bela","Cleo","Dara","Emi","Finn","Gio","Hana"];
const SFL_STATIONS=["Field station","Data desk","Community desk","Logistics bench"];
const SFL_SUPPORT=[
  {prompt:"Two measurements conflict just before the day's placement decision. One more sample can be run before the crew leaves.",options:[
    {text:"Check the method and use the extra sample where the readings disagree",quality:2,why:"The available sample directly tests the decision-relevant discrepancy."},
    {text:"Use the more recent reading provisionally and flag it for tomorrow's validation",quality:1,why:"This keeps the crew moving, but the placement still rests on disputed evidence."},
    {text:"Widen the planning range around the two readings and send the crew to the current priority",quality:0,why:"A wider range expresses uncertainty but does not resolve a check that fits today's window."}]},
  {prompt:"A partner needs a board update today; the outcome measure will arrive tomorrow.",options:[
    {text:"Share delivery progress, early signals, uncertainty and tomorrow's decision point",quality:2,why:"The partner gets a useful update without an unsupported outcome claim."},
    {text:"Share early signals as a provisional outcome range with a clear caveat",quality:1,why:"The caveat is honest, but the board still lacks a decision point."},
    {text:"Share the delivery milestones only and hold all interpretation until tomorrow",quality:0,why:"Milestones are factual, but they do not answer the board's request about likely impact."}]},
  {prompt:"The analyst on the critical-path check is overloaded. Another analyst has capacity but less site context.",options:[
    {text:"Hand over the repeatable validation step with a short briefing, retaining site interpretation",quality:2,why:"A bounded hand-off reduces pressure while preserving the context needed for interpretation."},
    {text:"Transfer the full analysis package and arrange a single review before release",quality:1,why:"This may reduce overload, but a late review can miss context-dependent errors."},
    {text:"Keep the analysis with its current owner and move presentation work to the spare analyst",quality:0,why:"Presentation support helps, but leaves the critical-path bottleneck untouched."}]},
  {prompt:"A workstation loses its main tool for the afternoon; the backup can complete only a subset of tasks.",options:[
    {text:"Move the critical compatible tasks to the backup and reschedule the rest with owners",quality:2,why:"The critical path continues within the backup's real capacity."},
    {text:"Send the full workload to the backup and triage unfinished tasks at day's end",quality:1,why:"This starts work quickly, but overcommits the known backup capacity."},
    {text:"Keep staff at the blocked station for preparatory work and resume the original plan tomorrow",quality:0,why:"Preparation has value, but available backup capacity could protect today's key task."}]}
];
function genSFLTeam(seed){
  const R=RNG(seed*29+5),names=R.shuffle(SFL_NAMES).slice(0,4);
  const people=names.map((name,i)=>({id:"p"+i,name,skill:SFL_SKILLS[i],preference:R.pick(["Clear hand-offs","Early feedback","Focused work","Partner contact"])}));
  const days=[0,1,2].map(day=>({
    stations:R.shuffle(SFL_SKILLS.map((skill,i)=>({id:"w"+i,name:SFL_STATIONS[i],skill,task:["Map the latest risk","Check the evidence","Coordinate partners","Stage the next response"][i]}))),
    requests:R.shuffle(SFL_SUPPORT).slice(0,2).map(q=>({...q,options:R.shuffle(q.options)}))
  }));
  return{seed,people,days};
}
function sflTeamState(person,station,support){
  if(!station)return"steady";
  if(station.skill!==person.skill)return"strained";
  return support>=3?"confident":"steady";
}
function sflTeamSupportScore(day,choices){
  return(choices||[]).reduce((sum,j,k)=>sum+(day.requests[k]?.options[j]?.quality||0),0);
}
function scoreSFLTeam(data,records){
  const items=[];let points=0,max=0;
  data.days.forEach((day,i)=>{
    const r=records[i]||{},asked=(r.asked||[]).length;
    const types=new Set((r.asked||[]).map(id=>id.startsWith("p")?"person":"station"));
    const explore=Math.min(3,asked,types.size===2?3:2);points+=explore;max+=3;items.push({label:"Day "+(i+1)+" · Explore",pts:explore,max:3,why:"Ask about both a researcher and a station to earn full inquiry credit."});
    let fit=0;for(const p of data.people){const station=day.stations.find(x=>x.id===r.assign?.[p.id]);if(station?.skill===p.skill){fit+=3;if(r.reasons?.[p.id]==="Skill fit")fit+=1}}
    points+=fit;max+=16;items.push({label:"Day "+(i+1)+" · Assign",pts:fit,max:16,
      your:data.people.map(p=>p.name+" → "+(day.stations.find(w=>w.id===r.assign?.[p.id])?.name||"unassigned")).join("; "),
      correct:data.people.map(p=>p.name+" → "+day.stations.find(w=>w.skill===p.skill)?.name).join("; "),
      why:"Match each person's strongest skill to the station's requirement; choose Skill fit as the reason."});
    const support=sflTeamSupportScore(day,r.support);
    points+=support;max+=4;items.push({label:"Day "+(i+1)+" · Support",pts:support,max:4,
      your:day.requests.map((q,j)=>q.options[r.support?.[j]]?.text||"No response").join("; "),
      correct:day.requests.map(q=>q.options.find(x=>x.quality===2)?.text).join("; "),
      why:"Resolve the specific constraint while preserving evidence and honest communication."});
    let reflect=0;for(const p of data.people){const station=day.stations.find(x=>x.id===r.assign?.[p.id]);if(r.reflect?.[p.id]===sflTeamState(p,station,support))reflect++}
    points+=reflect;max+=4;items.push({label:"Day "+(i+1)+" · Reflect",pts:reflect,max:4,
      your:data.people.map(p=>p.name+" → "+(r.reflect?.[p.id]||"unrated")).join("; "),
      correct:data.people.map(p=>p.name+" → "+sflTeamState(p,day.stations.find(x=>x.id===r.assign?.[p.id]),support)).join("; "),
      why:"Compare each person's skill fit and the support given today to estimate their state."});
  });
  return{items,total:Math.round(points/max*100),max:100,raw:points,rawMax:max};
}
