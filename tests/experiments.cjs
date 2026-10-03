const assert=require('node:assert/strict'),vm=require('node:vm');
const {Element,questions,script,setViewport}=require('./flow.cjs');
const key='associatieruimte.v01';
const clone=value=>JSON.parse(JSON.stringify(value));
async function setup(count,random=0,viewport='desktop',original='Een beginvraag',associations){
 setViewport(viewport==='mobile'?350:872,viewport==='mobile'?380:500);
 const app=new Element('main'),notice=new Element('p'),erase=new Element('button');
 const words=associations||Array.from({length:count},(_,i)=>({id:'word-'+i,text:'eigen '+i,x:35+i*20,y:40,size:1,color:i===0?'#aabbcc':undefined}));
 const saved={step:4,stepId:'experiment',entryType:'Ik zit ergens mee',originalQuestion:original,answers:{landscape:'Eigen antwoord'},associations:clone(words),activeId:words[0]?.id||null,selectedElement:words[0]?.text||null,firstSpaceStep:'space',routeId:'landscape',imageIds:['image-01','image-02','image-03']};
 const storage={[key]:JSON.stringify(saved)},math=Object.create(Math);math.random=()=>random;
 let ctx={Math:math,document:{querySelector:q=>({'#app':app,'#erase':erase,'#storage-notice':notice})[q],createElement:t=>new Element(t)},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},crypto:require('node:crypto').webcrypto,window:{scrollTo(){}},fetch:async()=>({ok:true,json:async()=>questions})};
 const boot=async()=>{ctx={...ctx};vm.createContext(ctx);vm.runInContext(script,ctx);await new Promise(r=>setImmediate(r));};await boot();
 const state=()=>JSON.parse(storage[key]);
 const click=text=>{const b=app.querySelectorAll('button').find(n=>n.textContent===text);assert(b,'Button: '+text);b.listeners.click();};
 return {app,state,click,get ctx(){return ctx;},storage,boot};
}
function select(h,label,id){const s=h.app.querySelectorAll('select').find(n=>n.attrs['aria-label']===label);assert(s);s.value=id;s.listeners.change();}
(async()=>{
 assert.deepEqual(questions.interventions.map(i=>[i.id,i.minTextElements]),[['possible-direction',1],['change-space',1],['temporarily-remove',2],['change-distance',2]]);
 for(const associations of [[],[{id:'shape',shape:'circle',text:'',x:50,y:50,size:1}]]){const h=await setup(0,0,'desktop','',associations);assert.equal(h.app.querySelector('h1').textContent,'Terug naar je beginvraag');assert.equal(h.state().experiment,null);}
 const single=await setup(1);assert.deepEqual(single.state().experiment.offeredIds,['possible-direction','change-space']);assert.equal(single.state().experiment.selectedId,null);assert.equal(single.state().experiment.snapshot,null);
 const seen=new Set();for(const seed of [0,.3,.6,.9]){const h=await setup(2,seed);assert.equal(h.state().experiment.offeredIds.length,2);h.state().experiment.offeredIds.forEach(id=>seen.add(id));}assert.equal(seen.size,4);
 // Content cannot affect suitability or selection.
 const neutral=await setup(2,.6,'desktop','Een egel'),different=await setup(2,.6,'desktop','<script> andere vraag');assert.deepEqual(neutral.state().experiment.offeredIds,different.state().experiment.offeredIds);
 let tested=0;
 for(const viewport of ['desktop','mobile'])for(const [index,item] of questions.interventions.entries())for(const decision of ['restore','keep','continue']){
  const h=await setup(item.minTextElements,[0,.3,.6,.9][index],viewport);
  const offered=h.state().experiment.offeredIds;assert(offered.includes(item.id));vm.runInContext('render();render()',h.ctx);assert.deepEqual(h.state().experiment.offeredIds,offered);await h.boot();assert.deepEqual(h.state().experiment.offeredIds,offered);assert.equal(h.state().experiment.selectedId,null);
  h.click(item.question);assert.equal(h.state().experiment.selectedId,item.id);assert.equal(h.state().experiment.phase,'edit');assert(!h.app.textContent.includes('Wil je hier nog iets aan toevoegen?'));assert(!h.app.textContent.includes('Wil je iets hiervan meenemen naar je Associatieruimte?'));
  const snapshot=clone(h.state().experiment.snapshot);assert.deepEqual(snapshot.associations,h.state().associations);
  if(item.interactionType==='two-elements'){select(h,'Eerste element','word-0');select(h,'Tweede element','word-1');assert(!h.app.querySelectorAll('select')[1].querySelectorAll('option').some(n=>n.attrs.value==='word-0'));}
  else if(item.interactionType!=='canvas')select(h,'Element om mee te experimenteren','word-0');
  const word=h.app.querySelector('.word');word.listeners.click();h.click('Groter');h.click('→');assert(h.state().associations[0].size>snapshot.associations[0].size);assert(h.state().associations[0].x>snapshot.associations[0].x);
  const left=parseFloat(word.style.left);word.listeners.pointerdown({button:0,clientX:100,clientY:100,pointerId:1});word.listeners.pointermove({clientX:130,clientY:110});assert(parseFloat(word.style.left)>left);word.listeners.pointerup();
  const color=h.app.querySelectorAll('input').find(n=>n.attrs['aria-label']==='Kleur van geselecteerd element');color.value='#112233';color.listeners.input();assert.equal(h.state().associations[0].color,'#112233');
  if(item.interactionType==='hide-element'){
   h.click('Element tijdelijk verbergen');assert.equal(h.state().associations.length,2);assert(h.app.querySelector('.word').hidden);assert(h.state().associations[0].hidden);h.click('Element terugzetten');assert(!h.state().associations[0].hidden);h.click('Element tijdelijk verbergen');select(h,'Element om mee te experimenteren','word-1');assert(!h.state().associations[0].hidden,'Only one experiment element may stay hidden');select(h,'Element om mee te experimenteren','word-0');h.click('Element tijdelijk verbergen');
  }
  assert.deepEqual(h.state().experiment.snapshot,snapshot,'Snapshot must not mutate with the working space');
  const changed=clone(h.state().associations);h.click('Opnieuw kijken');assert.equal(h.state().experiment.phase,'reflect');assert(h.app.textContent.includes('Wat merk je nu op dat je hiervoor nog niet zag?'));assert(!h.app.querySelector('.tools'));
  h.click('Verder');assert.equal(h.state().experiment.phase,'reflect','Must not silently keep without a decision');
  const reflection=h.app.querySelector('textarea');reflection.value='Mijn eigen waarneming';reflection.listeners.input();assert.equal(h.state().answers.experimentReflection,'Mijn eigen waarneming');
  await h.boot();assert.deepEqual(h.state().experiment.snapshot,snapshot);assert.deepEqual(h.state().associations,changed);
  if(decision==='restore'){
   h.click('Terug naar hoe het was');assert.deepEqual(h.state().associations,snapshot.associations);assert.equal(h.state().activeId,snapshot.activeId);assert.equal(h.state().selectedElement,snapshot.selectedElement);h.click('Verder');
  }else if(decision==='keep'){h.click('Zo laten');assert.deepEqual(h.state().associations,changed);}
  else{h.click('Nog even verder veranderen');assert.equal(h.state().experiment.phase,'edit');assert(h.app.querySelector('.tools'));assert.deepEqual(h.state().experiment.snapshot,snapshot);h.app.querySelector('.word').listeners.click();h.click('Kleiner');h.click('Opnieuw kijken');h.click('Zo laten');}
  assert.equal(h.app.querySelector('h1').textContent,'Sta bij één element stil');
  if(item.interactionType==='hide-element'&&decision==='keep'){
   h.click('Terug');h.click('Nog even verder veranderen');h.click('Element terugzetten');assert(!h.state().associations[0].hidden);h.click('Opnieuw kijken');h.click('Zo laten');
  }
  h.click('Verder');assert.equal(h.app.querySelector('h1').textContent,'Kijk opnieuw naar je ruimte');h.click('Verder');h.click('Verder');h.click('Verder');assert.equal(h.app.querySelector('h1').textContent,'Dit ontstond er onderweg');tested++;
 }
 // Deletion/addition can also be undone, and zero words must not skip an unfinished experiment.
 const h=await setup(1);h.click(questions.interventions[0].question);const original=clone(h.state().experiment.snapshot);h.app.querySelector('.word').listeners.click();h.click('Verwijderen');assert.equal(h.state().associations.length,0);const input=h.app.querySelectorAll('input').find(n=>n.attrs['aria-label']==='Nieuw woord of korte zin');input.value='tijdelijk toegevoegd';h.app.querySelector('form').listeners.submit({preventDefault(){}});assert.equal(h.state().associations[0].text,'tijdelijk toegevoegd');h.click('Opnieuw kijken');h.click('Terug naar hoe het was');assert.deepEqual(h.state().associations,original.associations);
 for(const [step,title] of [[4,'Sta bij één element stil'],[5,'Kijk opnieuw naar je ruimte'],[6,'Terug naar je beginvraag'],[7,'Een nieuwe vraag?'],[8,'Dit ontstond er onderweg']]){const old=await setup(2);const saved=old.state();delete saved.stepId;saved.step=step;saved.experiment=null;old.storage[key]=JSON.stringify(saved);await old.boot();assert.equal(old.app.querySelector('h1').textContent,title,'Legacy numeric step migration');}
 console.log(`PASS ${tested} experiment scenarios: all types, desktop/mobile, restore/keep/continue; plus suitability, stability, migration, zero words, preservation and no content analysis`);
})().catch(e=>{console.error(e);process.exitCode=1;});
