const assert=require('node:assert/strict'),vm=require('node:vm');
const {Element,questions,script,setViewport}=require('./flow.cjs');
const key='associatieruimte.v01',clone=x=>JSON.parse(JSON.stringify(x));
async function boot(storage,width=872){
 setViewport(width,width===350?380:500);const app=new Element('main'),notice=new Element('p'),erase=new Element('button');
 const ctx={document:{querySelector:q=>({'#app':app,'#storage-notice':notice,'#erase':erase})[q],createElement:t=>new Element(t)},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},crypto:require('node:crypto').webcrypto,window:{scrollTo(){}},fetch:async()=>({ok:true,json:async()=>questions})};
 vm.createContext(ctx);vm.runInContext(script,ctx);await new Promise(r=>setImmediate(r));
 const state=()=>JSON.parse(vm.runInContext('JSON.stringify(state)',ctx));
 const click=text=>{const n=app.querySelectorAll('button').find(n=>n.textContent===text||n.attrs['aria-label']===text);assert(n,text);n.listeners.click();};
 const select=(index,id)=>{const n=app.querySelectorAll('select')[index];n.value=id;n.listeners.change();};
 const answer=(index,text)=>{const n=app.querySelectorAll('textarea')[index];n.value=text;n.listeners.input();};
 const add=text=>{const input=app.querySelectorAll('input').find(n=>n.attrs['aria-label']==='Nieuw woord of korte zin');assert(input);input.value=text;app.querySelector('form').listeners.submit({preventDefault(){}});};
 return {app,notice,ctx,state,click,select,answer,add};
}
const initial=()=>({stepId:'space',flowVersion:3,originalQuestion:'Vraag',answers:{},associations:[],routeId:'animal',imageIds:['image-01','image-02','image-03']});
const report=[];
(async()=>{
 for(const width of [872,350]){
  const storage={[key]:JSON.stringify(initial())};let h=await boot(storage,width); // empty space skips forward: use object collector in second phase to add initial words
  vm.runInContext("state.step=steps.findIndex(s=>s.id==='space');render()",h.ctx);
  const originals=['energie','vrijheid','op en neer hoppen','Stroming/beweging'];for(const t of originals)h.add(t);
  const ids=h.state().associations.map(a=>a.id);let checks=0;
  function check(label){const st=h.state(),saved=JSON.parse(storage[key]);for(const id of ids){assert(st.associations.some(a=>a.id===id));assert(saved.associations.some(a=>a.id===id));}const canvas=h.app.querySelector('.canvas');if(canvas){const rendered=canvas.querySelectorAll('.word');for(const id of ids)assert(rendered.some(n=>n.dataset.id===id&&!n.hidden));}checks++;}
  check('added');h.click('Verder');check('research options');h.click('Twee woorden laten spreken');check('dialogue before X');
  h.select(0,ids[0]);check('X');assert.equal(h.app.querySelectorAll('textarea').length,0);h.select(0,ids[1]);check('Y');assert.equal(h.state().activeId,ids[1]);assert.equal(h.app.querySelectorAll('select').length,0);
  const selected=()=>{assert.equal(h.state().research.xId,ids[0]);assert.equal(h.state().research.yId,ids[1]);assert.equal(h.app.querySelectorAll('select').length,0);};
  selected();h.answer(0,'Ervaring X');check('here');h.click('Verder');check('look');selected();h.answer(0,'Ervaring X naar Y');h.click('Verder');check('say');h.answer(0,'Uitspraak X');
  assert(!h.app.querySelectorAll('button').some(n=>n.textContent.startsWith('Wil je')));h.click('Verder');check('fixed reply');selected();assert.equal(h.app.querySelectorAll('textarea').length,1);assert(h.app.querySelector('textarea').attrs['aria-label'].includes('vrijheid'));assert(h.app.querySelector('.answer-reference').textContent.includes('Uitspraak X'));h.answer(0,'Antwoord Y');h.add('nieuw tijdens dialoog');check('new word');h=await boot(storage,width);check('refresh');selected();assert.equal(h.state().research.dialoguePhase,3);assert.equal(h.app.querySelector('textarea').value,'Antwoord Y');
  h.click('Terug');check('back to say');assert.equal(h.app.querySelector('textarea').value,'Uitspraak X');h.click('Verder');check('reply again');assert.equal(h.app.querySelector('textarea').value,'Antwoord Y');
  h.click('Verder');check('arrange');h.click('Terug');check('return to research');assert.equal(h.state().research.dialoguePhase,3);h.click('Verder');h.click('Verder');check('object phase 0');h.answer(0,'Mijn eigen actie');h.answer(1,'Mijn eigen verbeelding');check('object simultaneous questions');h.click('Verder');check('object collection');h.add('nieuw bij voorwerp');check('object addition');h=await boot(storage,width);check('object refresh');h.click('Verder');check('return');h.click('Verder');check('new (no canvas)');h.click('Verder');check('finish');h=await boot(storage,width);check('finish refresh');
  report.push({width,checks,preserved:originals.length,finalCount:h.state().associations.length});
 }
 // Stale tab may neither overwrite newer additions nor erase the newer session.
 const saved=initial();saved.stepId='arrange';saved.associations=[{id:'x',text:'oud',x:40,y:40,size:1}];const shared={[key]:JSON.stringify(saved)};const a=await boot(shared),b=await boot(shared);a.add('alleen tab A');const latest=shared[key];b.click('Verder');assert.equal(shared[key],latest);assert(b.notice.textContent.includes('ander tabblad'));vm.runInContext('save();reset()',b.ctx);assert.equal(shared[key],latest);const resumed=await boot(shared);assert(resumed.state().associations.some(x=>x.text==='alleen tab A'));report.push({protected:'stale second-tab save and reset preserve newer additions'});
 // The placement no longer cycles through sixteen start positions.
 const h=await boot({[key]:JSON.stringify({...initial(),stepId:'arrange',associations:[{id:'seed',text:'seed',x:70,y:70,size:1}]})});for(let n=1;n<=17;n++)h.add('word '+n);const all=h.state().associations;const p=all[1],q=all[17];assert(p.x!==q.x||p.y!==q.y);assert.equal(all.length,18);report.push({protected:'18 elements stored, no automatic sixteen-position cycle'});
 // Resume each old phase, including a previously optional Y reply, without losing any answers/material.
 for(const phase of [0,1,2])for(const reply of [false,true]){
  const old=initial();old.stepId='research';old.associations=[{id:'x',text:'X',x:30,y:30,size:1},{id:'y',text:'Y',x:70,y:70,size:1}];old.research={routeId:'dialogue',xId:'x',yId:'y',phase,reply};old.answers={'research.dialogue.x.y..say':'Bewaren X','research.dialogue.x.y..reply':'Bewaren Y'};
  const legacy=await boot({[key]:JSON.stringify(old)});assert.equal(legacy.state().research.dialoguePhase,reply?3:phase);assert.deepEqual(legacy.state().answers,old.answers);assert.equal(legacy.state().associations.length,2);
 }
 // Selecting another pair is explicit; old scoped answers remain intact.
 const pair=await boot({[key]:JSON.stringify({...initial(),stepId:'research',associations:[{id:'x',text:'X',x:30,y:30,size:1},{id:'y',text:'Y',x:70,y:70,size:1}],research:{routeId:'dialogue',xId:'x',yId:'y',phase:2,reply:true},answers:{'research.dialogue.x.y..say':'Bewaren'}})});pair.click('Andere woorden kiezen');assert.equal(pair.state().research.xId,null);assert.equal(pair.state().associations.length,2);assert.equal(pair.state().answers['research.dialogue.x.y..say'],'Bewaren');
 // Legacy hidden nodes stay in data and DOM, but are hidden and excluded from selectors.
 const old=initial();old.stepId='research';old.associations=[{id:'h',text:'verborgen',x:40,y:40,size:1,hidden:true},{id:'v',text:'zichtbaar',x:60,y:60,size:1}];old.research={routeId:'standing',xId:'v',yId:null,phase:0};const legacy=await boot({[key]:JSON.stringify(old)});assert(legacy.app.querySelector('.canvas').querySelectorAll('.word').find(n=>n.dataset.id==='h').hidden);assert.equal(legacy.state().associations.length,2);assert(legacy.app.querySelectorAll('button').some(n=>n.textContent==='Terugzetten: verborgen'));report.push({confirmed:'legacy hidden element retained but not visible'});
 console.log('PASS dialogue regression:',JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
