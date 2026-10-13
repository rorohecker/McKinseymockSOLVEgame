/* Original practice reconstructions. No McKinsey scoring or scenario content is used. */
const SFL_THEMES=[
  {title:"Burn-scar watershed",site:"the upper watershed",risk:"a forecast storm",resource:"field crews",goal:"protect downstream water quality",signal:"turbidity readings",access:"the upstream road"},
  {title:"Tidal wetland recovery",site:"the marsh edge",risk:"a high-tide surge",resource:"restoration crews",goal:"restore the nursery habitat",signal:"salinity readings",access:"the tidal causeway"},
  {title:"Urban heat corridor",site:"the south corridor",risk:"an early heat wave",resource:"survey teams",goal:"reduce exposure for vulnerable residents",signal:"surface-temperature readings",access:"the school-site permit"},
  {title:"Alpine slope restoration",site:"the eastern slope",risk:"an early thaw",resource:"erosion crews",goal:"reduce sediment entering the valley",signal:"slope-movement readings",access:"the ridge trail"},
  {title:"River migration corridor",site:"the lower river",risk:"a low-flow period",resource:"habitat crews",goal:"keep fish passage open",signal:"flow-gauge readings",access:"the downstream gate"},
  {title:"Coastal dune protection",site:"the exposed shore",risk:"a seasonal storm",resource:"monitoring crews",goal:"protect nesting habitat",signal:"shoreline-change readings",access:"the beach-entry permit"},
  {title:"Urban flood response",site:"the east canal district",risk:"the next heavy storm",resource:"inspection crews",goal:"reduce repeat flood harm",signal:"drainage-capacity readings",access:"the canal maintenance gate"}
];
const SFL_RANK=[
  {id:"map",text:"Compare the risk map with field and community reports to locate the most exposed groups",rank:0,why:"Locating the greatest harm gives the remaining review a clear priority."},
  {id:"verify",text:"Check crew capacity, access and budget for the leading response areas",rank:1,why:"Feasibility narrows the actions that can protect those groups before the deadline."},
  {id:"brief",text:"Review why previous interventions stalled in the highest-risk areas",rank:2,why:"Past failures can refine a feasible plan once the priority and constraints are known."},
  {id:"commit",text:"Audit the full raw field record for trends and anomalies across the entire area",rank:3,why:"A complete audit may help later, but it is too broad for the first meeting's decision window."}
];
const SFL_Q=[
  ["Scope","A partner can open {access} today, but the risk map for {site} is incomplete. The first crew leaves tomorrow. What is the strongest next step?",[
    ["Set a same-day deadline to compare expected harm and confirm access, then send the first crew",2,"evidence",["evidence",1,"trust",1],"The deadline protects the departure while resolving the facts most likely to change the location."],
    ["Use the available access for a small pilot and refine the risk map after the crew leaves",1,"targeted",["pressure",-1],"A reversible pilot keeps momentum, but may use the first crew at a lower-impact site."],
    ["Use today's access to verify conditions at {site}, then choose the crew's destination from the completed risk map tonight",0,"delay",["pressure",1],"This protects access and leaves a decision window, but spends the only field check at one site before comparing expected harm."]
  ]],
  ["Signals","Fresh {signal} disagree with last week's field notes. A location decision is due this afternoon. What do you use?",[
    ["Check the method and run one targeted repeat at the disputed location before the decision",2,"evidence",["evidence",1],"A fast discriminating check addresses the conflict within the decision window."],
    ["Use the new readings provisionally, flag their uncertainty, and schedule validation tomorrow",1,"transparent",["trust",1],"This is transparent and timely, but the disputed reading may steer today's placement."],
    ["Check the instrument log, use the more reliable series for today's placement, and widen the safety margin",0,"smooth",["pressure",1],"Instrument checks and a margin are useful, but neither tests whether conditions changed at the disputed location."]
  ]],
  ["Trade-offs","Only half the requested {resource} are available. Two sites have different expected harm, but partners at both expect action. Which plan is strongest?",[
    ["Fully staff the higher-harm site, reserve a rapid check at the other, and explain the trigger to redeploy",2,"targeted",["pressure",-1,"trust",1],"This protects the largest exposure while keeping a defined watch on the other site."],
    ["Put one crew at each site so both partners see progress, then revise after a week",1,"spread",["pressure",1],"Visible coverage helps relationships, but each crew may lack capacity to change the higher-risk outcome."],
    ["Start a bounded intervention at the accessible site and hold the remaining crew until the higher-harm site's access is confirmed",0,"assume",["trust",-1],"The plan avoids an idle crew, but reserves scarce capacity without a time limit or a trigger tied to the higher harm."]
  ]],
  ["Stakeholders","A local group reports a nearby exposure the model may have missed. The current plan is due for approval tomorrow. What do you do?",[
    ["Ask for the location and evidence today, test whether it changes the risk order, and share the rule used",2,"transparent",["trust",2],"The claim receives a timely check against the same priority rule."],
    ["Add a small contingent allocation for the reported exposure and keep the main plan moving",1,"targeted",["pressure",1],"A contingency acknowledges the concern, but does not establish whether priorities should change."],
    ["Ask the group for its evidence today, add a provisional buffer near the reported exposure, and revisit the risk order after approval",0,"delay",["trust",-1],"The buffer and outreach are reasonable, but the decision can still incorporate a quick risk comparison before approval."]
  ]],
  ["Timing","{risk} advances the field deadline by four days. Which schedule change best protects {goal}?",[
    ["Keep the exposure check and first intervention; defer the lower-impact survey and name an owner for follow-up",2,"targeted",["pressure",-1],"The critical outcome remains covered, with deferred work assigned rather than forgotten."],
    ["Run a shorter version of every task so all milestones remain on the calendar",1,"spread",["pressure",1],"Breadth preserves visibility, but can leave the critical check too thin."],
    ["Run the exposure check in parallel with deployment using last week's priority site, then redirect if the result differs",0,"assume",["evidence",-1,"pressure",1],"Parallel work saves time, but commits the scarce first crew before the check that could change its destination."]
  ]],
  ["Team","Two specialists offer different explanations for the same {signal}. The next sampling window is short. How do you proceed?",[
    ["Agree on the one observation that separates the explanations and use the next sample to test it",2,"evidence",["evidence",1,"trust",1],"The scarce sample answers the decision-relevant disagreement."],
    ["Use the explanation with stronger historical evidence and record the competing view for review",1,"transparent",["trust",1],"History is a reasonable prior, but the next sample could resolve this case directly."],
    ["Use the next sample at the site with the widest uncertainty and ask both specialists to interpret it independently",0,"delay",["pressure",1],"Independent readings are useful, but the widest uncertainty may not distinguish the two explanations driving this decision."]
  ]],
  ["Measures","A sponsor wants one early indicator and one final test of whether the work achieved {goal}. Which pair is strongest?",[
    ["Track a baseline-adjusted outcome and a leading field signal tied to the intervention",2,"evidence",["evidence",1],"The leading signal supports timely course correction; the outcome tests the actual goal."],
    ["Track completed site visits and the final outcome against the original target",1,"targeted",["pressure",-1],"This is measurable, but site visits are activity and the target alone omits baseline change."],
    ["Track intervention coverage as the early indicator and compare the final outcome with last year's site average",0,"smooth",["evidence",-1],"Coverage and a historical comparison are concrete, but coverage may not predict effect and last year's mix may differ from the current baseline."]
  ]],
  ["Uncertainty","A quick intervention could reduce exposure at {site}, but its effect on adjacent habitat is unknown. There is time for one trial. What do you do?",[
    ["Trial it at a reversible site with a habitat measure and a pre-agreed stop threshold",2,"targeted",["evidence",1,"pressure",-1],"The trial creates useful evidence and limits a side effect before scaling."],
    ["Use it at the highest-risk site with intensive monitoring and authority to stop",1,"evidence",["evidence",1],"Monitoring helps, but an avoidable side effect would affect the most exposed site."],
    ["Trial the quick intervention beside the highest-risk site, with habitat checks and a stop rule before wider use",0,"delay",["pressure",1],"This limits scale and monitors habitat, but still exposes a sensitive adjacent area when a reversible test site is available."]
  ]],
  ["Communication","A sponsor needs a board update before final results arrive. Which statement is most useful?",[
    ["State what has been delivered, what {signal} show so far, the uncertainty, and the next decision date",2,"transparent",["trust",2],"The board receives a usable status and a clear point for revision."],
    ["Give the early trend and a range of possible outcomes, with a note that validation is pending",1,"evidence",["evidence",1],"The range signals uncertainty, but leaves the next action and decision time unclear."],
    ["Report delivery progress and the early signal as provisional, then commit to a written revision after validation",0,"smooth",["trust",-1],"The caveat is honest, but the board still lacks the uncertainty range and the specific decision it must make next."]
  ]],
  ["New evidence","One late field sample suggests risk has shifted away from the original site. The next crew can be redirected tomorrow. What do you do?",[
    ["Verify the shift with a fast independent check, then redirect that crew if the risk order changes",2,"evidence",["evidence",1,"pressure",-1],"A short verification prevents overreacting while keeping the crew movable."],
    ["Redirect the next crew now and test the shift during its first day in the field",1,"targeted",["pressure",-1],"This acts quickly, but uses crew capacity before the lone sample is confirmed."],
    ["Keep tomorrow's crew at the original site, but request a same-day repeat sample and prepare a second crew to move if it confirms the shift",0,"delay",["pressure",1],"This protects the original commitment, but the prepared second crew is slower and costlier than using tomorrow's movable crew after verification."]
  ]],
  ["Capacity","The analyst validating {signal} is overloaded; a second analyst has capacity but less site context. What is the best hand-off?",[
    ["Transfer the repeatable quality check with a short briefing and retain final interpretation with the site analyst",2,"targeted",["pressure",-1,"trust",1],"The spare capacity removes a defined bottleneck without losing context for interpretation."],
    ["Move the entire analysis package to the available analyst and schedule one review at the end",1,"spread",["pressure",-1],"This frees the bottleneck, but puts interpretation at risk until the late review."],
    ["Have the second analyst independently check the highest-risk figures while the site analyst completes validation and interpretation",0,"assume",["pressure",1],"An independent check is valuable, but duplicates work while the overloaded analyst retains the entire critical path."]
  ]],
  ["Synthesis","Leaders need a recommendation for {site} today, although one habitat measure remains uncertain. Which final note is strongest?",[
    ["Recommend the priority action, quantify the expected benefit, name the uncertainty, and specify a revision trigger",2,"transparent",["trust",1,"evidence",1],"The note supports an immediate decision and defines when new evidence should change it."],
    ["Recommend a limited first phase, show expected benefit and uncertainty, and request a second approval before scaling",1,"targeted",["pressure",1],"A staged decision limits downside, but may add an avoidable approval delay without a clear trigger."],
    ["Recommend the priority action with a benefit range and a short follow-up review, leaving the scaling decision open",0,"delay",["pressure",1],"This is a defensible staged recommendation, but it leaves the unresolved measure without a specific threshold for changing course."]
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
    {text:"Check both instruments' calibration, widen the planning range, and use the current priority for today's crew",quality:0,why:"Calibration and a wider range are sensible, but the spare sample can test the actual disagreement before placement."}]},
  {prompt:"A partner needs a board update today; the outcome measure will arrive tomorrow.",options:[
    {text:"Share delivery progress, early signals, uncertainty and tomorrow's decision point",quality:2,why:"The partner gets a useful update without an unsupported outcome claim."},
    {text:"Share early signals as a provisional outcome range with a clear caveat",quality:1,why:"The caveat is honest, but the board still lacks a decision point."},
    {text:"Share delivery and the early signal as provisional, then promise a corrected outcome note tomorrow",quality:0,why:"This is candid, but does not tell the board which decision depends on tomorrow's measure."}]},
  {prompt:"The analyst on the critical-path check is overloaded. Another analyst has capacity but less site context.",options:[
    {text:"Hand over the repeatable validation step with a short briefing, retaining site interpretation",quality:2,why:"A bounded hand-off reduces pressure while preserving the context needed for interpretation."},
    {text:"Transfer the full analysis package and arrange a single review before release",quality:1,why:"This may reduce overload, but a late review can miss context-dependent errors."},
    {text:"Have the spare analyst independently check the key figures while the current owner finishes validation",quality:0,why:"An independent check has value, but duplicates effort while the overloaded analyst still owns the bottleneck."}]},
  {prompt:"A workstation loses its main tool for the afternoon; the backup can complete only a subset of tasks.",options:[
    {text:"Move the critical compatible tasks to the backup and reschedule the rest with owners",quality:2,why:"The critical path continues within the backup's real capacity."},
    {text:"Send the full workload to the backup and triage unfinished tasks at day's end",quality:1,why:"This starts work quickly, but overcommits the known backup capacity."},
    {text:"Use the backup for the easiest compatible tasks and keep staff at the main station to prepare tomorrow's restart",quality:0,why:"This uses the backup and prepares a restart, but gives its scarce capacity to easy tasks rather than the critical path."}]},
  {prompt:"A community partner asks to share a provisional risk map tonight. One location still has unverified data.",options:[
    {text:"Share the verified areas and label the uncertain location with a clear update time",quality:2,why:"The partner can act on reliable information without treating the uncertain location as settled."},
    {text:"Share the whole map with a prominent general caveat and invite corrections",quality:1,why:"The caveat helps, but does not tell readers which location requires caution."},
    {text:"Share a simplified priority list and explain the map will follow after the next check",quality:0,why:"The list is useful, but hides the location-specific uncertainty that matters for tonight's planning."}]},
  {prompt:"The access permit for the preferred sampling point is delayed. A nearby point can be reached now but has a different habitat profile.",options:[
    {text:"Use the nearby point for a limited comparison, record the habitat difference, and keep the permit request active",quality:2,why:"The team learns something today without treating the substitute as an identical site."},
    {text:"Sample the nearby point as planned and adjust the result statistically for habitat later",quality:1,why:"Adjustment may be possible, but the change needs to be documented before sampling and interpreted cautiously."},
    {text:"Shift all sampling to a second accessible area with the same habitat type and preserve today's schedule",quality:0,why:"The habitat match helps, but moving the full programme may change the question the preferred point was meant to answer."}]},
  {prompt:"A field reading sits just above the intervention threshold, within the instrument's stated error range.",options:[
    {text:"Run a quick independent reading and prepare the response while the result is checked",quality:2,why:"A second reading resolves a borderline trigger without wasting the preparation window."},
    {text:"Begin a reversible first response now and confirm the reading before expanding",quality:1,why:"A reversible step limits delay, but still spends capacity before the threshold is confirmed."},
    {text:"Treat the reading as a trigger, deploy the response, and include uncertainty in the hand-off",quality:0,why:"The hand-off is candid, but the independent check fits the decision window and could avoid a false trigger."}]},
  {prompt:"A volunteer team offers extra survey capacity, but its method differs from the current protocol.",options:[
    {text:"Assign a short calibration task and use volunteer data only where agreement is demonstrated",quality:2,why:"The extra capacity becomes useful without silently mixing incompatible measures."},
    {text:"Use the volunteers for low-priority sites and keep the core team on the decision sites",quality:1,why:"This protects critical sites, but the volunteer data still needs a comparability check."},
    {text:"Combine the datasets with a separate volunteer label and review method differences after collection",quality:0,why:"The label preserves provenance, but delayed calibration can leave collected data unusable for the decision."}]}
];
function genSFLTeam(seed){
  const R=RNG(seed*29+5),names=R.shuffle(SFL_NAMES).slice(0,4);
  const people=names.map((name,i)=>({id:"p"+i,name,skill:SFL_SKILLS[i],preference:R.pick(["Clear hand-offs","Early feedback","Focused work","Partner contact"])}));
  const supportPlan=R.shuffle(SFL_SUPPORT);
  const days=[0,1,2].map(day=>({
    stations:R.shuffle(SFL_SKILLS.map((skill,i)=>({id:"w"+i,name:SFL_STATIONS[i],skill,task:["Map the latest risk","Check the evidence","Coordinate partners","Stage the next response"][i]}))),
    requests:supportPlan.slice(day*2,day*2+2).map(q=>({...q,options:R.shuffle(q.options)}))
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
