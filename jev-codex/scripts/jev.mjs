#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Stop,ensure,loadKey,checkSecrets,Jev,saveExclusive,boundedNumber} from './core.mjs';
import {contextMode,searchMode,reviewMode} from './modes.mjs';
import {browserMode} from './browser.mjs';
export async function main(args=process.argv.slice(2)){
 const mode=args.shift();if(mode==='--help'||!mode){console.log('node scripts/jev.mjs context|search|review|browser --input job.json --output result.json\nOutput, source archive and trace use private new files. No shell commands or arbitrary code from Jev are executed.');return;}
 ensure(['context','search','review','browser'].includes(mode),'unknown_mode');
 const options={};for(let i=0;i<args.length;i+=2){ensure(['--input','--output'].includes(args[i])&&args[i+1],'invalid_argument');options[args[i]]=args[i+1];}
 ensure(options['--input']&&options['--output'],'input_and_output_required');
 const output=path.resolve(options['--output']),archive=output+'.source.json',trace=output+'.trace.jsonl';
 ensure(![output,archive,trace,output+'.png'].some(fs.existsSync),'output_already_exists');
 const input=JSON.parse(fs.readFileSync(options['--input'],'utf8'));
 let key;try{key=loadKey()}catch(e){if(!(e instanceof Stop))throw e;}
 checkSecrets(input,key);saveExclusive(archive,input);
 const jev=new Jev({key,trace,maxCalls:boundedNumber(input.maxCalls,mode==='browser'?12:1,1,30),maxMs:boundedNumber(input.maxMs,mode==='browser'?25000:15000,1000,60000)});
 let result;
 try{
  // Small context inputs can be retained without credentials or a remote call.
  if(!key&&!(mode==='context'&&Array.isArray(input.items)&&input.items.reduce((n,i)=>n+(i.text?.length||0),0)<(input.minChars??8000)))throw new Stop('missing_api_key');
  result=await({context:contextMode,search:searchMode,review:reviewMode,browser:browserMode}[mode])(input,jev,{output});
 }catch(e){result={status:'handoff',reason:e instanceof Stop?e.code:'invalid_input_or_runtime_error',originalsPreserved:true};}
 result={...result,archive,metrics:jev.metrics()};saveExclusive(output,result);
 const brief={status:result.status,reason:result.reason,result:output,archive,metrics:result.metrics};
 if(result.retainedChars!==undefined)Object.assign(brief,{originalChars:result.originalChars,retainedChars:result.retainedChars});
 if(result.actions)brief.actions=result.actions;
 if(result.needsCodexReview)brief.needsCodexReview=result.needsCodexReview;
 console.log(JSON.stringify(brief,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(JSON.stringify({status:'handoff',reason:e instanceof Stop?e.code:'invalid_input_or_runtime_error'}));process.exitCode=1;});
