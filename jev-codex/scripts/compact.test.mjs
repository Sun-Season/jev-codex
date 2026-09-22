import test from 'node:test';
import assert from 'node:assert/strict';
import {compactMode} from './compact.mjs';
const items=[{id:'pending',kind:'pending',text:'Export still pending',source:'task:1'},{id:'old',text:'Old progress',source:'log:2'}];
const fake=overrides=>({ask:async(s,q)=>Object.fromEntries(Object.keys(q).map(k=>[k,{choice:overrides[k]??(k.startsWith('coverage')?'covered':k.startsWith('fidelity')?'faithful':'archive'),confidence:.99}]))});
const audit=()=>({action:'audit',goal:'Finish export',items,summary:[{id:'s',text:'Export pending',sourceIds:['pending']}]});
test('plan always retains pending work despite archive votes',async()=>{const r=await compactMode({action:'plan',goal:'Finish export',items},fake({}));assert.equal(r.items[0].disposition,'keep');assert.equal(r.items[1].disposition,'archive');});
test('audit cannot omit mandatory item even if model says not needed',async()=>{const r=await compactMode(audit(),fake({coverage_pending:'not_needed'}));assert.equal(r.status,'revision_required');assert.equal(r.issues[0].id,'pending');});
test('invented completion prevents acceptance',async()=>{const r=await compactMode(audit(),fake({fidelity_s:'distorted'}));assert.equal(r.status,'revision_required');});
test('audit checks every original including omitted items',async()=>{const r=await compactMode(audit(),fake({coverage_old:'missing'}));assert.ok(r.issues.some(x=>x.id==='old'));});
test('unknown source and unsafe merge references fail before remote call',async()=>{const j=audit();j.summary[0].sourceIds=['absent'];await assert.rejects(()=>compactMode(j,{ask:()=>assert.fail()}));await assert.rejects(()=>compactMode({action:'plan',goal:'test',items,mergeGroups:[{id:'g',itemIds:['old','absent']}]},{ask:()=>assert.fail()}));});
test('clean audit still requires Codex check',async()=>{assert.equal((await compactMode(audit(),fake({}))).status,'ready_for_codex_check');});

test('low confidence alone asks for inspection, not a fabricated correction',async()=>{const model=fake({});const r=await compactMode(audit(),{ask:async(s,q)=>{const a=await model.ask(s,q);a.coverage_pending.confidence=.7;return a;}});assert.equal(r.status,'needs_codex_review');assert.equal(r.issues[0].reason,'low_confidence');});
