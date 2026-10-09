/* Original practice reconstructions. No McKinsey scoring or scenario content is used. */
const SFL_THEMES=[
  {title:"Burn-scar watershed",site:"the upper watershed",risk:"a forecast storm",resource:"field crews",goal:"protect downstream water quality"},
  {title:"Tidal wetland recovery",site:"the marsh edge",risk:"a high-tide surge",resource:"restoration crews",goal:"restore the nursery habitat"},
  {title:"Urban heat corridor",site:"the south corridor",risk:"an early heat wave",resource:"survey teams",goal:"reduce exposure for vulnerable residents"}
];
const SFL_RANK=[
  {id:"map",text:"Map the highest-consequence sites and evidence gaps",rank:0,why:"Locate the greatest risk before spending scarce capacity."},
  {id:"verify",text:"Verify the latest field conditions and constraints",rank:1,why:"Check whether the initial picture is still accurate."},
  {id:"brief",text:"Brief partners on the plan and uncertainty",rank:2,why:"Give partners a usable plan once priorities are clear."},
  {id:"commit",text:"Commit the full budget to the most visible location",rank:3,why:"Visibility alone does not establish the strongest intervention."}
];
const SFL_Q=[
  ["Scope","A partner asks you to begin at {site} before the risk map is complete. What do you do?",[
    ["Set a short evidence deadline and prioritise the highest-consequence locations",2,"evidence",["evidence",1,"trust",1],"A focused evidence check keeps the project moving without guessing."],
    ["Accept the visible location immediately",0,"assume",["pressure",2,"evidence",-1],"Visibility is not evidence of impact."],
    ["Delay every action until a perfect map exists",1,"delay",["pressure",1],"A short deadline is more useful than an open-ended study."]
  ]],
  ["Signals","New monitoring data conflicts with last week's field notes. How do you respond?",[
    ["Check the measurement method and ask for a targeted resample",2,"evidence",["evidence",1],"Resolve the discrepancy before treating either source as certain."],
    ["Discard the new data because it disagrees",0,"assume",["evidence",-1],"Dismissing inconvenient data hides a material risk."],
    ["Average the two readings and continue",1,"smooth",["pressure",1],"Averaging can conceal a real change in conditions."]
  ]],
  ["Trade-offs","Only half of the requested {resource} are available. Which plan is strongest?",[
    ["Concentrate effort where expected harm is highest and stage the rest",2,"targeted",["pressure",-1,"trust",1],"Concentrating scarce capacity protects the most exposed areas."],
    ["Split every crew equally across sites",1,"spread",["pressure",1],"Equal allocation can ignore unequal risks."],
    ["Promise full coverage anyway",0,"opaque",["trust",-2],"A promise that capacity cannot support damages trust."]
  ]],
  ["Stakeholders","A local group says the current plan overlooks their concerns. What is your next step?",[
    ["Ask for specific evidence and explain how it will affect the priority rule",2,"transparent",["trust",2],"A clear decision rule and open evidence channel preserve trust."],
    ["Explain that the model is final",0,"opaque",["trust",-2],"The model may be missing local information."],
    ["Change the plan without checking the new claim",1,"assume",["pressure",1],"Being responsive still requires a consistent decision rule."]
  ]],
  ["Timing","The forecast moves the deadline forward. What changes first?",[
    ["Protect critical milestones and defer lower-value work",2,"targeted",["pressure",-1],"Re-scope around the outcome that matters most."],
    ["Keep every deliverable and ask everyone to work faster",0,"spread",["pressure",2],"This increases failure risk without changing capacity."],
    ["Stop the project until the forecast stabilises",1,"delay",["pressure",1],"Some reversible preparation can continue."]
  ]],
  ["Team","Two specialists disagree about the likely cause of the risk. How do you proceed?",[
    ["Name the competing hypotheses and run one discriminating check",2,"evidence",["evidence",1,"trust",1],"A small test can resolve a high-stakes disagreement."],
    ["Let the senior specialist decide without a check",1,"assume",["trust",-1],"Seniority alone does not settle the evidence."],
    ["Suppress the disagreement in the project note",0,"opaque",["trust",-2],"Hidden uncertainty creates brittle decisions."]
  ]],
  ["Measures","You must define success for {goal}. Which metric is most useful?",[
    ["Pair an outcome measure with a leading measure and a clear baseline",2,"evidence",["evidence",1],"The baseline and leading signal show whether action is working."],
    ["Count only how many meetings the team held",0,"smooth",["evidence",-1],"Activity is not an outcome."],
    ["Use one outcome number without a baseline",1,"assume",["evidence",-1],"Without a baseline, change is hard to interpret."]
  ]],
  ["Uncertainty","A quick intervention might help but its side effects are unclear. What do you do?",[
    ["Pilot it at a reversible site with a stop rule",2,"targeted",["evidence",1,"pressure",-1],"A bounded pilot creates evidence while limiting downside."],
    ["Deploy everywhere immediately",0,"assume",["pressure",2],"Wide deployment amplifies unknown side effects."],
    ["Reject it without testing",1,"delay",["pressure",1],"A small pilot may be worth the information gained."]
  ]],
  ["Communication","A sponsor asks for a confident success claim before results arrive. What do you say?",[
    ["Report progress, uncertainty and the next decision point",2,"transparent",["trust",2],"An honest update preserves a useful decision path."],
    ["Say success is guaranteed",0,"opaque",["trust",-2],"A guarantee is unsupported before results arrive."],
    ["Provide no update until the project ends",1,"delay",["trust",-1],"Silence prevents timely decisions."]
  ]],
  ["New evidence","A late field sample shows risk shifted away from the original site. How do you respond?",[
    ["Re-check the shift and redirect the next available crew if confirmed",2,"evidence",["evidence",1,"pressure",-1],"Update the plan when material evidence changes."],
    ["Continue unchanged to avoid explaining a revision",0,"opaque",["trust",-2],"Consistency of process matters more than defending an old location."],
    ["Move every crew before verifying the sample",1,"assume",["pressure",1],"A single late sample deserves a quick check."]
  ]],
  ["Capacity","A team member is overloaded while another has spare time. What do you do?",[
    ["Reassign a defined task and agree on the hand-off",2,"targeted",["pressure",-1,"trust",1],"A specific hand-off protects delivery and ownership."],
    ["Tell the overloaded person to push through",0,"spread",["pressure",2],"The bottleneck remains."],
    ["Move every task at once",1,"assume",["pressure",1],"A broad reshuffle adds coordination cost."]
  ]],
  ["Synthesis","You are asked for a final recommendation. What should it include?",[
    ["The priority, supporting evidence, uncertainty and a trigger to revise",2,"transparent",["trust",1,"evidence",1],"A decision-ready recommendation states what to do and when to adapt."],
    ["Only the most positive metric",0,"opaque",["trust",-2],"Selective reporting prevents an informed decision."],
    ["A long data dump without a recommendation",1,"delay",["pressure",1],"The audience still needs a clear decision."]
  ]]
];
function sflFill(text,theme){return text.replaceAll("{site}",theme.site).replaceAll("{risk}",theme.risk).replaceAll("{resource}",theme.resource).replaceAll("{goal}",theme.goal)}
function genSFLProject(seed){
  const R=RNG(seed*23+11),theme=R.pick(SFL_THEMES);
  return{seed,theme,rank:R.shuffle(SFL_RANK),questions:SFL_Q.map(([phase,prompt,raw])=>({
    phase,prompt:sflFill(prompt,theme),options:R.shuffle(raw.map(([text,quality,stance,effects,why],i)=>({id:String(i),text,quality,stance,effects,why})))
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
  const stances=[];let decisionPts=0;
  for(let i=0;i<12;i++){const q=data.questions[i],choice=q.options.find(x=>x.id===answers[i]);const pts=choice?choice.quality*2.5:0;decisionPts+=pts;
    if(choice)stances.push(choice.stance);
    const best=q.options.find(x=>x.quality===2);
    items.push({label:"Decision "+(i+1)+" · "+q.phase,pts,max:5,your:choice?.text||"No decision",correct:best?.text||"",why:(choice?choice.why:"No decision submitted.")+" Strongest option: "+(best?.text||"")+" — "+(best?.why||"")})}
  const conflicts=[["transparent","opaque"],["evidence","assume"],["targeted","spread"]];
  const conflictingPairs=conflicts.filter(([a,b])=>stances.includes(a)&&stances.includes(b));
  const inconsistent=conflictingPairs.length;
  const submitted=Array.from({length:12},(_,i)=>answers[i]).filter(x=>x!==undefined).length;
  const consistency=Math.round(Math.max(0,20-inconsistent*5)*submitted/12*10)/10;
  items.push({label:"Decision consistency",pts:consistency,max:20,why:(inconsistent?"Conflicting approaches: "+conflictingPairs.map(pair=>pair.join(" versus ")).join(", ")+".":"No conflicting approach was detected.")+" Answered "+submitted+" of 12 decisions; unanswered decisions reduce this score proportionally."});
  return{items,total:Math.round((rankPts+decisionPts+consistency)*10)/10,max:100};
}

const SFL_SKILLS=["Field ecology","Data analysis","Community outreach","Operations"];
const SFL_NAMES=["Ari","Bela","Cleo","Dara","Emi","Finn","Gio","Hana"];
const SFL_STATIONS=["Field station","Data desk","Community desk","Logistics bench"];
const SFL_SUPPORT=[
  {prompt:"A researcher finds a conflicting measurement and asks what to do.",options:[
    {text:"Check the method and repeat one targeted sample",quality:2,why:"A targeted check resolves the discrepancy."},
    {text:"Use whichever reading supports the current plan",quality:0,why:"Selecting convenient evidence creates bias."},
    {text:"Average the readings without investigating",quality:1,why:"Averaging can hide a real change."}]},
  {prompt:"A partner requests a result before the team is ready.",options:[
    {text:"Share progress, uncertainty and the next update time",quality:2,why:"A bounded update is honest and useful."},
    {text:"Promise the result will be positive",quality:0,why:"The result is not known yet."},
    {text:"Ignore the request until the project ends",quality:1,why:"Silence weakens coordination."}]},
  {prompt:"A team member says their workload is becoming unmanageable.",options:[
    {text:"Clarify the bottleneck and reassign one defined task",quality:2,why:"A specific hand-off reduces overload."},
    {text:"Ask them to work longer",quality:0,why:"Longer hours do not remove the bottleneck."},
    {text:"Cancel all work at the station",quality:1,why:"A narrower change could preserve progress."}]},
  {prompt:"A workstation loses access to a key tool for the afternoon.",options:[
    {text:"Move reversible tasks and reset the day's priorities",quality:2,why:"Replanning protects the critical path."},
    {text:"Keep the original schedule and hope access returns",quality:0,why:"The blocked task cannot progress."},
    {text:"Move everyone to the same station",quality:1,why:"A full move may overcrowd the station."}]}
];
function genSFLTeam(seed){
  const R=RNG(seed*29+5),names=R.shuffle(SFL_NAMES).slice(0,4);
  const people=names.map((name,i)=>({id:"p"+i,name,skill:SFL_SKILLS[i],preference:R.pick(["Clear hand-offs","Early feedback","Focused work","Partner contact"])}));
  const days=[0,1,2].map(day=>({
    stations:R.shuffle(SFL_SKILLS.map((skill,i)=>({id:"w"+i,name:SFL_STATIONS[i],skill,task:["Map the latest risk","Check the evidence","Coordinate partners","Stage the next response"][i]}))),
    requests:R.shuffle(SFL_SUPPORT).slice(0,2)
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
    const explore=Math.min(3,asked);points+=explore;max+=3;items.push({label:"Day "+(i+1)+" · Explore",pts:explore,max:3,why:"Use up to three questions to reduce uncertainty."});
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
