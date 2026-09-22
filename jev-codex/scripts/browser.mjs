import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {choice,ensure,text,boundedNumber,untrusted,config,Stop} from './core.mjs';
const exec=promisify(execFile);
const pageExpression=`JSON.stringify({url:location.href,title:document.title,text:document.body?.innerText||'',scrollY:scrollY,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight,fields:Array.from(document.querySelectorAll('input,textarea,select')).map(e=>({label:e.getAttribute('aria-label')||e.name||e.id,type:e.type,value:e.type==='password'?'[REDACTED]':e.value})),links:Array.from(document.querySelectorAll('a[href]')).filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')||e.innerText.trim(),href:e.href,target:e.target,download:e.hasAttribute('download')}))})`;
const risky=/(?:\b(?:delete|remove|purchase|pay|buy|book|reserve|send|submit|publish|deploy|transfer|upload|download|install|logout|sign out|unsubscribe|approve|confirm|accept all)\b|删除|移除|支付|购买|下单|预订|发送|提交|发布|转账|上传|下载|安装|退出|注销|授权|批准|确认|同意全部)/i;
const fingerprint=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function contract(input){
 text(input.goal,5000);ensure(typeof input.session==='string'&&/^jev-[a-zA-Z0-9_-]{1,60}$/.test(input.session),'dedicated_session_required');
 ensure(Array.isArray(input.allowedOrigins)&&input.allowedOrigins.length>0&&input.allowedOrigins.length<=12,'allowed_origins_required');
 for(const o of input.allowedOrigins){const u=new URL(o);ensure(['http:','https:'].includes(u.protocol)&&u.origin===o,'invalid_origin');}
 if(input.url)ensure(input.allowedOrigins.includes(new URL(input.url).origin),'initial_origin_not_allowed');
 ensure(Array.isArray(input.allowedClicks)&&input.allowedClicks.length<=100,'allowed_clicks_required');
 for(const x of input.allowedClicks){ensure(['button','link','tab','menuitem'].includes(x.role),'unsupported_click_role');text(x.name,1000);ensure(!risky.test(x.name),'consequential_click_requires_codex');}
 if(input.allowedTabUrls)for(const u of input.allowedTabUrls)ensure(input.allowedOrigins.includes(new URL(u).origin),'tab_origin_not_allowed');
 ensure(Array.isArray(input.successChecks)&&input.successChecks.length>0,'success_checks_required');
 for(const c of input.successChecks){ensure(['textIncludes','urlEquals','urlStartsWith'].includes(c.type),'unsupported_success_check');text(c.value,2000);}
 return input;
}
export function verified(page,checks){return checks.every(c=>c.type==='textIncludes'?page.text.includes(c.value):c.type==='urlEquals'?page.url===c.value:page.url.startsWith(c.value));}
export function allowedTargets(refs,page,c){
 const targets={};
 for(const [id,ref]of Object.entries(refs||{})){
  if(!/^e\d+$/.test(id)||risky.test(ref.name||'')||!c.allowedClicks.some(a=>a.role===ref.role&&a.name===ref.name))continue;
  if(ref.role==='link'){
   const matches=page.links.filter(l=>l.name===ref.name);
   if(matches.length!==1)continue;
   const link=matches[0];let url;try{url=new URL(link.href)}catch{continue}
   if(!c.allowedOrigins.includes(url.origin)||link.download||link.target==='_blank'||risky.test(url.pathname))continue;
  }
  targets[id]=`${ref.role}: ${ref.name}`;
 }
 return targets;
}
export class BrowserAdapter {
 constructor(input){this.input=input;this.c=config();this.calls=0;this.lastPage=null;}
 async call(...args){
  this.calls++;const env={...process.env};delete env.TYPESAFE_API_KEY;
  env.AGENT_BROWSER_ALLOWED_DOMAINS=[...new Set(this.input.allowedOrigins.map(o=>new URL(o).hostname))].join(',');
  if(this.c.browserExecutable)env.AGENT_BROWSER_EXECUTABLE_PATH=this.c.browserExecutable;
  let raw;try{raw=(await exec(this.c.browserBin,['--session',this.input.session,...args,'--json'],{timeout:15000,maxBuffer:3e6,env})).stdout;}catch{throw new Stop('browser_command_failed');}
  let r;try{r=JSON.parse(raw)}catch{throw new Stop('browser_invalid_json')}
  ensure(r.success,'browser_command_failed');return r.data;
 }
 async start(){if(this.input.url)await this.call('open',this.input.url);}
 async page(){const r=await this.call('eval',pageExpression);return JSON.parse(r.result);}
 async observe(){
  const before=await this.page();const snap=await this.call('snapshot','-i');const after=await this.page();
  ensure(fingerprint(before)===fingerprint(after),'page_changed_during_snapshot');
  let tabs=[];if(this.input.allowedTabUrls?.length){const r=await this.call('tab','list');ensure(Array.isArray(r.tabs),'unsupported_tab_schema');tabs=r.tabs;}
  return{page:after,refs:snap.refs??{},tabs};
 }
 async execute(op,target){
  if(op==='CLICK')await this.call('click','@'+target);
  else if(op==='SCROLL_DOWN')await this.call('scroll','down','550');
  else if(op==='SCROLL_UP')await this.call('scroll','up','550');
  else if(op==='SWITCH_TAB')await this.call('tab',String(target));
  else if(op==='WAIT')await new Promise(r=>setTimeout(r,200));
  else throw new Stop('unsupported_operation');
 }
 async screenshot(file){await this.call('screenshot',file);return file;}
}
export async function browserMode(input,jev,{adapter,output}={}){
 const c=contract(input);const b=adapter??new BrowserAdapter(c);const maxActions=boundedNumber(c.maxActions,10,1,30),maxMs=boundedNumber(c.maxMs,25000,1000,60000),confidence=boundedNumber(c.minConfidence,.85,.5,1);
 const started=Date.now();const actions=[];let stale=0,latest=null;const counts=new Map();
 async function finish(reason,extra={}){
  const result={status:'handoff',reason,session:c.session,actions,staleDecisions:stale,elapsedMs:Date.now()-started,browserCalls:b.calls??null,url:latest?.page.url,...extra};
  if(output&&c.screenshot!==false){try{result.screenshot=await b.screenshot(path.resolve(output)+'.png');}catch{result.screenshotUnavailable=true;}}
  return result;
 }
 try{
  await b.start();
  for(let step=0;step<maxActions;step++){
   ensure(Date.now()-started<maxMs,'browser_time_budget');
   try{latest=await b.observe()}catch(e){if(e.code==='page_changed_during_snapshot'&&++stale<=2)continue;throw e;}
   const {page,refs,tabs}=latest;
   ensure(c.allowedOrigins.includes(new URL(page.url).origin),'navigated_outside_scope');
   ensure(page.text.length<=30000&&Object.keys(refs).length<=500,'page_requires_codex_reduction');
   if(verified(page,c.successChecks))return finish('checkpoint_reached_requires_codex_acceptance',{checksPassed:true});
   const targets=allowedTargets(refs,page,c);
   const tabTargets={};
   for(const tab of tabs||[])if(c.allowedTabUrls?.includes(tab.url)&&tab.active!==true&&/^t\d+$/.test(tab.tabId))tabTargets[tab.tabId]=`${tab.title??''} ${tab.url}`;
   const ops={HANDOFF_INPUT:'Text input, selection, login or file upload is needed; return to Codex',HANDOFF_REASONING:'Needs complex reasoning, an unsupported action, or a decision outside the authorized contract',HANDOFF_VISUAL:'Needs screenshot interpretation or visual acceptance',CHECKPOINT:'The requested checkpoint appears reached; Codex must verify',WAIT:'Page is loading; wait briefly'};
   if(Object.keys(targets).length)ops.CLICK='Click one allowlisted observed navigation element';
   if(c.allowScroll!==false&&page.scrollY+page.viewport<page.scrollHeight-5)ops.SCROLL_DOWN='Scroll down one bounded increment';
   if(c.allowScroll!==false&&page.scrollY>0)ops.SCROLL_UP='Scroll up one bounded increment';
   if(Object.keys(tabTargets).length)ops.SWITCH_TAB='Switch to one explicitly allowed observed browser tab';
   const instructions=`${untrusted} Goal: ${c.goal}. Only execute navigation within supplied options. Never invent input, selectors, URLs, permissions or commands. If input is needed hand off. If the desired click is absent from allowed options hand off, do not pick a substitute. Current page and recent actions are in state. Choose one narrow next operation.`;
   const questions={operation:choice(instructions,ops)};
   // NONE preserves a valid two-option question when only one real target exists.
   if(Object.keys(targets).length)questions.click=choice(instructions+' Assuming CLICK, choose its target.',{...targets,NONE:'No permitted target is suitable; hand off'});
   if(Object.keys(tabTargets).length)questions.tab=choice(instructions+' Assuming SWITCH_TAB, choose its target.',{...tabTargets,NONE:'No appropriate allowed tab'});
   const answers=await jev.ask({goal:c.goal,page,allowedTargets:targets,tabs:tabTargets,recentActions:actions.slice(-6)},questions);
   const op=answers.operation.choice;
   if(op.startsWith('HANDOFF_')||op==='CHECKPOINT')return finish(op.toLowerCase(),{checksPassed:false,decision:answers.operation});
   if(answers.operation.confidence<confidence)return finish('uncertain_operation',{decision:answers.operation});
   const answer=op==='CLICK'?answers.click:op==='SWITCH_TAB'?answers.tab:null;
   if(answer&&(answer.choice==='NONE'||answer.confidence<confidence))return finish('uncertain_target',{decision:answer});
   const target=answer?.choice??null;
   if(op==='CLICK')ensure(Object.hasOwn(targets,target),'unobserved_target');
   if(op==='SWITCH_TAB')ensure(Object.hasOwn(tabTargets,target),'unobserved_tab');
   // Re-observe both DOM and refs after inference; changed mappings invalidate the whole decision.
   const fresh=await b.observe();
   if(fingerprint(fresh)!==fingerprint(latest)){if(++stale>2)return finish('repeated_stale_page');continue;}
   const key=fingerprint({page,op,target});counts.set(key,(counts.get(key)||0)+1);
   if(counts.get(key)>1)return finish('no_progress');
   ensure(Date.now()-started<maxMs,'browser_time_budget');
   await b.execute(op,target);actions.push({operation:op,target,confidence:answers.operation.confidence});
  }
  return finish('action_budget');
 }catch(e){return finish(e instanceof Stop?e.code:'browser_runtime_error');}
}
