import {choice,ensure,text,list,untrusted} from './core.mjs';
import {isPinned} from './modes.mjs';
const protectedKinds=new Set(['goal','pending','uncertainty','artifact','verification','user_request']);
const protectedItem=i=>isPinned(i)||protectedKinds.has(i.kind);
export async function compactMode(input,jev){
 text(input.goal,6000);list(input.items,40);
 for(const i of input.items){text(i.text,12000);text(i.source,3000);}
 const items=Object.fromEntries(input.items.map(i=>[i.id,i]));
 const questions={};
 if(input.action==='plan'){
  const groups=input.mergeGroups??[];if(groups.length)list(groups,16);
  for(const g of groups){ensure(Array.isArray(g.itemIds)&&g.itemIds.length>=2&&g.itemIds.length<=10&&new Set(g.itemIds).size===g.itemIds.length&&g.itemIds.every(id=>Object.hasOwn(items,id)),'invalid_merge_group');}
  for(const i of input.items)if(!protectedItem(i))questions['retain_'+i.id]=choice(`${untrusted} For continuing goal, classify item ${i.id}. Keep unresolved facts, exceptions, contrary evidence and provenance. Archive only if clearly irrelevant or superseded with no remaining diagnostic value.`,{keep:'Needed verbatim or uncertain',summarize:'Needed meaning can be expressed concisely without losing qualifications',archive:'Not needed in next working summary; original remains available'});
  for(const g of groups)questions['merge_'+g.id]=choice(`${untrusted} Can items in merge group ${g.id} be summarized together without hiding differences in time, status, scope, decisions or conflicting evidence?`,{merge:'Compatible; combined summary must preserve distinct qualifications and source IDs',separate:'Keep distinct to avoid loss or distortion',uncertain:'Insufficient context to merge safely'});
  const answers=Object.keys(questions).length?await jev.ask({goal:input.goal,items,mergeGroups:groups},questions):{};
  return{status:'draft_required',items:input.items.map(i=>({id:i.id,source:i.source,protected:protectedItem(i),disposition:protectedItem(i)?'keep':answers['retain_'+i.id].confidence<.85?'keep':answers['retain_'+i.id].choice,assessment:answers['retain_'+i.id]??null})),mergeGroups:groups.map(g=>({...g,merge:answers['merge_'+g.id].choice==='merge'&&answers['merge_'+g.id].confidence>=.85,assessment:answers['merge_'+g.id]})),next:'Codex writes an attributed draft, then runs context action audit against ALL original items. No original text has been removed.'};
 }
 ensure(input.action==='audit','invalid_context_action');list(input.summary,40);
 for(const s of input.summary){text(s.text,12000);ensure(Array.isArray(s.sourceIds)&&s.sourceIds.length>0&&s.sourceIds.every(id=>Object.hasOwn(items,id)),'unknown_summary_source');}
 const state={goal:input.goal,items,summary:input.summary};
 for(const i of input.items)questions['coverage_'+i.id]=choice(`${untrusted} Compare original item ${i.id} to the COMPLETE summary. Preserve negation, numbers, uncertainty, pending work, authorization limits, failed attempts, contradictions and artifact locations. ${protectedItem(i)?'This item is mandatory: never choose not_needed.':''}`,{covered:'All task-relevant meaning and qualifications retained',missing:'Relevant meaning, qualifier, status or provenance is omitted or changed',not_needed:'Entire item irrelevant or superseded for continuation',uncertain:'Cannot verify sufficient coverage'});
 for(const s of input.summary)questions['fidelity_'+s.id]=choice(`${untrusted} Is summary item ${s.id} fully supported by ONLY its sourceIds? Reject invented facts, broadened permission, resolved uncertainty, planned work described as done, incorrect numbers or missing contradictory evidence.`,{faithful:'Fully supported including scope and uncertainty',distorted:'Contradicts, overstates or invents information',uncertain:'Support is insufficient or ambiguous'});
 const a=await jev.ask(state,questions);
 const coverage=input.items.map(i=>({id:i.id,source:i.source,protected:protectedItem(i),assessment:a['coverage_'+i.id]}));
 const fidelity=input.summary.map(s=>({id:s.id,sourceIds:s.sourceIds,assessment:a['fidelity_'+s.id]}));
 const issues=[...coverage.filter(i=>i.assessment.confidence<.85||!(i.assessment.choice==='covered'||i.assessment.choice==='not_needed'&&!i.protected)).map(i=>({type:'coverage',id:i.id,reason:(i.assessment.choice==='covered'||i.assessment.choice==='not_needed'&&!i.protected)?'low_confidence':'missing_or_uncertain'})),...fidelity.filter(s=>s.assessment.confidence<.85||s.assessment.choice!=='faithful').map(s=>({type:'fidelity',id:s.id,reason:s.assessment.choice==='faithful'?'low_confidence':'distorted_or_uncertain'}))];
 return{status:issues.some(i=>i.reason!=='low_confidence')?'revision_required':issues.length?'needs_codex_review':'ready_for_codex_check',coverage,fidelity,issues,summary:input.summary,originalChars:input.items.reduce((n,i)=>n+i.text.length,0),summaryChars:input.summary.reduce((n,s)=>n+s.text.length,0),note:'Advisory review against supplied materials only. Codex verifies and saves the continuation summary with original source/archive paths. This does not trigger native compact, replace history or measure token savings.'};
}
