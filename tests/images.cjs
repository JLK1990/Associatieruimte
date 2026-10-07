const assert=require('node:assert/strict'),vm=require('node:vm');
const {Element,questions,script}=require('./flow.cjs');
const key='associatieruimte.v01',storage={},app=new Element('main'),erase=new Element('button'),notice=new Element('p');
let seed=82731;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let ctx;
async function boot(){ctx={Math:math,document:{querySelector:q=>({'#app':app,'#erase':erase,'#storage-notice':notice})[q],createElement:t=>new Element(t)},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},crypto:require('node:crypto').webcrypto,window:{scrollTo(){}},fetch:async()=>({ok:true,json:async()=>questions})};vm.createContext(ctx);vm.runInContext(script,ctx);await new Promise(r=>setImmediate(r));}
const state=()=>JSON.parse(storage[key]);
(async()=>{
 await boot();const counts=Object.fromEntries(questions.imagePool.map(im=>[im.id,0]));let previous=null;const sessions=10000;
 for(let i=0;i<sessions;i++){
  if(i)vm.runInContext('reset()',ctx);
  const ids=state().imageIds;assert.equal(ids.length,3);assert.equal(new Set(ids).size,3);assert(ids.every(id=>Object.hasOwn(counts,id)));if(previous)assert(ids.every(id=>!previous.includes(id)));
  for(const id of ids)counts[id]++;
  vm.runInContext('render();initialiseChoices();render()',ctx);assert.deepEqual(state().imageIds,ids);
  if(i%1000===0){await boot();assert.deepEqual(state().imageIds,ids);}
  previous=ids;
 }
 for(const count of Object.values(counts)){assert(count>0);assert(Math.abs(count/sessions-.3)<.025,'Distribution should be approximately equal');}
 // A valid saved set, including formerly excluded images, must remain unchanged.
 const saved=state();saved.imageIds=['image-02','image-03','image-09'];storage[key]=JSON.stringify(saved);await boot();assert.deepEqual(state().imageIds,saved.imageIds);
 // Remember the last set even when only the session record is cleared.
 delete storage[key];await boot();assert(state().imageIds.every(id=>!saved.imageIds.includes(id)));
 // Metadata cannot affect selection; a smaller pool falls back without duplicates.
 const subset=questions.imagePool.slice(0,5);vm.runInContext(`content.imagePool=${JSON.stringify(subset)};state.imageIds=null;initialiseChoices({imageIds:${JSON.stringify(subset.slice(0,3).map(i=>i.id))}})`,ctx);const fallback=state().imageIds;assert.equal(new Set(fallback).size,3);assert(subset.slice(3).every(im=>fallback.includes(im.id)));
 console.log('PASS images: 10,000 sessions; unique sets, zero previous-set overlap, stable render/refresh, saved sessions, previous-set storage and smaller-pool fallback');
 console.log(JSON.stringify({sessions,counts,percent:Object.fromEntries(Object.entries(counts).map(([id,n])=>[id,(n/sessions*100).toFixed(2)+'%']))}));
})().catch(e=>{console.error(e);process.exitCode=1;});
