/* Self-contained post-run data for user-controlled AI analysis. */
const AI_REVIEW_PROMPT=`Please analyze the attached Solve Practice Lab practice run. This is an independent simulator, not an official McKinsey score. Use the question prompts, exhibits, selected answers, correct answers, and option reasons in the file. First identify my three most important error patterns with concrete examples. For each missed item, explain why my choice was weak or wrong and why the strongest answer works; show calculation steps and units for numeric questions. Distinguish mistakes from partial-credit decisions. Then give me a short, prioritized practice plan and three new questions at an appropriate difficulty. Do not invent missing run data or claim to predict a real assessment result.`;
const AI_SERVICES={chatgpt:'https://chatgpt.com/',claude:'https://claude.ai/',gemini:'https://gemini.google.com/'};
function textOnly(value){const node=document.createElement('div');node.innerHTML=String(value??'');return(node.textContent||'').replace(/\s+/g,' ').trim()}
function caseChoiceReason(c,answer){
  if(!c||c.type!=='mc')return c?.explain||'';
  const chosen=c.options.find(o=>o.text===answer||o.id===answer),right=c.options.find(o=>o.id===c.ans);
  if(!chosen)return 'No option was selected. '+c.explain;
  if(chosen.id===c.ans)return 'Correct. '+c.explain;
  const reasons={
    Growth:'The increase must be divided by the original Year 1 value. This option uses a different base or applies an extra change.',
    Ratio:'Compare cost per bird, not the total budget or total number of birds. This programme has a higher cost per bird than the best option.',
    'Chart choice':{'Pie':'A pie chart shows parts of one whole.','Line':'A line chart shows a trend across time.','Waterfall':'A waterfall chart shows how additions and subtractions bridge two totals.','Clustered bar':'A clustered bar chart compares groups side by side.'}[chosen.text]+' That message does not match this question.',
    'Data judgement':'The 25% rise in sightings is supported, but survey hours rose 50%; sightings per hour fell by about 16.7%, not 25%.',
    'Sequential change':'The autumn decrease applies to the larger spring value. Subtracting the two rates or applying both to the original base gives the wrong net change.',
    'Conditional probability':'Among positive tests, the denominator includes true positives and false positives. Prevalence or test sensitivity alone does not answer this conditional question.'};
  return`Why ${chosen.text} is wrong: ${reasons[c.kind]||'It does not follow the calculation shown below.'} Strongest answer: ${right?.text}. ${c.explain}`;
}
function aiReviewData(){
  const report={schema:'solve-practice-lab.review.v1',createdAt:new Date().toISOString(),source:'independent practice simulator',
    caveat:'Practice scores and answer keys are internal learning aids, not official McKinsey results or pass predictions.',
    prompt:AI_REVIEW_PROMPT,session:{seed:S.seed,mode:S.mode,difficulty:S.difficulty,scoringVersion:SCORING_VERSION,
      durationSeconds:S.session?.entry?.durationSeconds??null,metrics:S.session?sessionMetrics():null,
      scores:{redrock:S.res.rr?.total??null,seaWolf:S.res.sw?.reduce((n,x)=>n+x.sc.score,0)??null,sfl:S.res.sfl?.score.total??null,drill:S.drill?.results?.total??null}},
    sections:[]};
  if(S.res.rr&&S.rr){const d=S.rr.d,items=S.res.rr.items;
    report.sections.push({game:'Redrock',scenario:d.theme.name,unit:d.theme.unit,
      exhibits:{groups:d.names,yearValues:d.terr,year4Baseline:d.y4,proposalARules:d.aRules,proposalBRules:d.bRules,managementZone:d.resource,targetPercent:d.targetPct},
      items:items.map((x,i)=>{const caseNumber=x.sec==='Cases'?Number(x.label.match(/Case (\d+)/)?.[1])-1:-1,c=d.cases[caseNumber];
        const question=c?`${textOnly(c.body)} ${c.q}`:x.sec==='Analysis'?d.an.flatMap(q=>q.parts.map(p=>p.text)).at(i):x.sec==='Report'&&x.label.startsWith('Written')?d.blanks[i-8]?.prompt:x.label;
        return{phase:x.sec,label:x.label,question,sourceHtml:c?.body,options:c?.type==='mc'?c.options.map(o=>({answer:o.text,correct:o.id===c.ans,reason:caseChoiceReason(c,o.text)})):undefined,
          selected:x.your,correct:x.correct,points:x.pts,maximum:x.max,explanation:c?.type==='mc'?caseChoiceReason(c,x.your):rrStepForItem(x,i),
          answerAssessment:x.pts===x.max?'Correct':x.pts>0?'Partial credit':'Incorrect or missing'};})});
  }
  if(S.res.sw)report.sections.push({game:'Sea Wolf',traitKey:Object.fromEntries(TRAITS.map((t,i)=>[TRAIT_SYMBOLS[i],t])),
    sites:S.res.sw.map(x=>({name:x.site.name,contamination:x.site.contam,attributeRanges:Object.fromEntries(ATTRS.map((a,i)=>[a,x.site.ranges[i]])),
      desiredTrait:x.site.desired,undesiredTrait:x.site.undesired,selectedTreatment:x.trio.map(m=>({name:m.name,attributes:m.a,trait:m.trait})),
      treatmentAverages:x.sc.avg,treatmentScore:x.sc.treatmentScore,decisionScore:x.sc.processScore,finalScore:x.sc.score,
      deductions:x.sc.ded,decisionPenalties:x.sc.penalties,
      strongestAvailableExample:x.bestFull.trio?.map(m=>({name:m.name,attributes:m.a,trait:m.trait}))||[],
      interpretation:'A treatment needs exactly three microbes. Their average must be inside every range, at least one must have the desired trait, and none may have the undesired trait.'}))});
  if(S.res.sfl&&S.sfl){const sc=S.res.sfl.score,project=S.res.sfl.format!=='team';
    report.sections.push({game:'Sustainable Futures Lab',format:S.res.sfl.format,scenario:S.sfl.data.theme?.title,
      items:sc.items.map((x,i)=>({label:x.label,question:project&&i>=1&&i<=12?S.sfl.data.questions[i-1]?.prompt:x.label,
        selected:x.your??null,correct:x.correct??null,points:x.pts,maximum:x.max,explanation:x.why,
        alternatives:project&&i>=1&&i<=12?S.sfl.data.questions[i-1].options.map(o=>({answer:o.text,strength:o.quality,reason:o.why})):undefined}))});
  }
  if(S.drill?.results)report.sections.push({game:'Focused drill',family:S.drill.family,items:S.drill.results.items.map((x,i)=>({
    label:x.label,question:S.drill.items?.[i]?.prompt||S.drill.items?.[i]?.q?.prompt||S.drill.items?.[i]?.q||x.label,
    selected:x.your,correct:x.correct,correctness:x.ok,explanation:x.why,
    alternatives:S.drill.items?.[i]?.q?.options?.map(o=>({answer:o.text,strength:o.quality,reason:o.why}))}))});
  return report;
}
function aiReviewText(){const report=aiReviewData();return 'SOLVE PRACTICE LAB — AI REVIEW\n\n'+AI_REVIEW_PROMPT+'\n\nSTRUCTURED RUN DATA (JSON)\n'+JSON.stringify(report,null,2)+'\n'}
function aiReviewHTML(){return`<section class="card stack"><span class="eyebrow">Deeper review</span><h2>Study this run with an AI</h2><p class="mute">Download a self-contained review with prompts, answers, scoring, and explanations. Open your AI, then attach the downloaded file and paste the copied request. You choose what to share.</p><div class="row"><button class="btn ghost" data-act="ai-review-download">Download AI review</button>${Object.keys(AI_SERVICES).map(id=>`<button class="btn ghost" data-act="ai-review-open" data-v="${id}">Open ${id==='chatgpt'?'ChatGPT':id==='claude'?'Claude':'Gemini'}</button>`).join('')}</div><p class="mute" id="ai-review-status" role="status"></p></section>`}
function aiReviewDownload(){downloadText(`solve-lab-review-${S.seed}.txt`,aiReviewText(),'text/plain;charset=utf-8')}
function aiReviewOpen(service){const url=AI_SERVICES[service];if(!url)return;
  aiReviewDownload();const status=document.querySelector('#ai-review-status');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(AI_REVIEW_PROMPT).then(()=>{if(status)status.textContent='Review downloaded and request copied. Attach the text file in the AI chat.'}).catch(()=>{if(status)status.textContent='Review downloaded. Attach the text file and use the request at its top.'});
  else if(status)status.textContent='Review downloaded. Attach the text file and use the request at its top.';
  if(window.pywebview?.api?.open_review_service)window.pywebview.api.open_review_service(service);
  else window.open(url,'_blank','noopener,noreferrer');
}
