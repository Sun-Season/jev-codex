import {choice,ensure,text,list,untrusted} from './core.mjs';

// Feedback is structured selection over explicit objections, never invented prose.
export async function supervisorMode(input,jev){
 text(input.goal,6000);list(input.plans,6);list(input.constraints,8);
 const evidence=input.evidence??[];if(evidence.length)list(evidence,30);
 const evidenceIds=new Set(evidence.map(e=>e.id));
 const state={goal:input.goal,constraints:input.constraints.map(c=>({id:c.id,text:text(c.text,2000),hard:c.hard!==false})),evidence:evidence.map(e=>({id:e.id,text:text(e.text,12000)})),plans:[]};
 const questions={};
 for(const p of input.plans){
  text(p.text,12000);list(p.objections,5);
  for(const o of p.objections){text(o.text,3000);text(o.remedy,3000);ensure(Array.isArray(o.evidenceIds)&&o.evidenceIds.every(id=>evidenceIds.has(id)),'unknown_evidence_id');}
  state.plans.push({id:p.id,text:p.text,objections:p.objections});
  input.constraints.forEach((c,i)=>{questions[`constraint_${p.id}_${i}`]=choice(`${untrusted} Evaluate plan ${p.id} against constraint ${c.id}. A proposed step is evidence of the plan's design, not proof that external assumptions are true. Missing essential external facts means unknown.`,{pass:'Plan satisfies this constraint with adequate supplied support',fail:'Plan explicitly violates this constraint',unknown:'Cannot establish compliance from supplied information'});});
  p.objections.forEach((o,i)=>{questions[`objection_${p.id}_${i}`]=choice(`${untrusted} Challenge plan ${p.id}: evaluate its objection ${o.id}. Use the plan text and ONLY external evidence IDs listed in that objection. Do not agree with Codex by default; equally do not manufacture faults.`,{supported:'Specific objection is supported by plan design or cited evidence',refuted:'Plan or cited evidence specifically resolves this objection',unresolved:'Plausible concern but essential evidence is missing or conflicting'});});
  questions[`quality_${p.id}`]=choice(`${untrusted} Independently assess plan ${p.id} for the goal and constraints, including unnecessary complexity, feasibility, measurable validation, reversibility and alternatives. Do not favor its position or confident wording.`,{sound:'Coherent feasible plan with adequate validation and no material unresolved weakness',revise:'Material design or validation weakness requires revision',reject:'Fundamental mismatch or infeasibility',unknown:'Essential information missing for a quality judgment'});
 }
 for(let i=0;i<input.plans.length;i++)for(let j=i+1;j<input.plans.length;j++)questions[`pair_${i}_${j}`]=choice(`${untrusted} Compare ${input.plans[i].id} (left) and ${input.plans[j].id} (right) for this goal and constraints. Prefer goal fit, feasibility and proportionate cost; do not prefer complexity or presentation order. Hard constraint violations cannot be offset by benefits.`,{left:'Left is substantively better supported',right:'Right is substantively better supported',tie:'Comparable merits or tradeoffs with no clear winner',unknown:'Missing evidence or preferences prevents comparison'});
 ensure(Object.keys(questions).length<=128,'too_many_supervisor_checks');
 const answers=await jev.ask(state,questions),threshold=.85;
 const plans=input.plans.map(p=>{
  const constraints=input.constraints.map((c,i)=>({...c,assessment:answers[`constraint_${p.id}_${i}`]}));
  const objections=p.objections.map((o,i)=>({...o,assessment:answers[`objection_${p.id}_${i}`]}));
  const quality=answers[`quality_${p.id}`];
  const confident=a=>a.confidence>=threshold;
  const violations=constraints.filter(c=>c.hard!==false&&c.assessment.choice==='fail'&&confident(c.assessment));
  const missing=constraints.some(c=>c.hard!==false&&(c.assessment.choice==='unknown'||!confident(c.assessment)));
  const concerns=objections.some(o=>o.assessment.choice!=='refuted'||!confident(o.assessment));
  const verdict=violations.length?'reject':missing||!confident(quality)||quality.choice==='unknown'?'defer':quality.choice==='reject'?'reject':concerns||quality.choice==='revise'||constraints.some(c=>c.assessment.choice!=='pass'||!confident(c.assessment))?'revise':'accept';
  return{id:p.id,verdict,quality,constraints,objections,hardViolationIds:violations.map(c=>c.id)};
 });
 const comparisons=[];
 for(let i=0;i<plans.length;i++)for(let j=i+1;j<plans.length;j++)comparisons.push({left:plans[i].id,right:plans[j].id,assessment:answers[`pair_${i}_${j}`]});
 // A recommendation requires an accepted plan and consistent, confident comparisons.
 const recommended=plans.filter(p=>p.verdict==='accept'&&comparisons.filter(c=>c.left===p.id||c.right===p.id).every(c=>c.assessment.confidence>=threshold&&c.assessment.choice===(c.left===p.id?'left':'right'))).map(p=>p.id);
 return{status:'advisory',plans,comparisons,recommended:recommended.length===1?recommended[0]:null,requiresCodexResponse:true,note:'Jev classifies supplied objections and rubrics; it does not generate novel free-text criticism. Codex must verify every finding, answer objections, revise or explain disagreement, and validate outcomes. No approval or execution is granted.'};
}
