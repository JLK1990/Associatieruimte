const assert=require('node:assert/strict'),vm=require('node:vm');
const {Element,questions,script,setViewport}=require('./flow.cjs'),key='associatieruimte.v01';
async function setup(viewport='desktop',random=0){
 setViewport(viewport==='mobile'?350:872,viewport==='mobile'?380:500);
 const app=new Element('main'),notice=new Element('p'),erase=new Element('button');
 const storage={[key]:JSON.stringify({stepId:'research',flowVersion:3,originalQuestion:'Vraag',answers:{},associations:['energie','vrijheid','beweging'].map((text,i)=>({id:'word-'+i,text,x:30+i*20,y:30+i*20,size:1,color:'#112233'})),routeId:'animal',imageIds:['image-01','image-02','image-03']})};
 let ctx;const math=Object.create(Math);math.random=()=>random;
 const boot=async()=>{ctx={Math:math,document:{querySelector:q=>({'#app':app,'#storage-notice':notice,'#erase':erase})[q],createElement:t=>new Element(t)},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},crypto:require('node:crypto').webcrypto,window:{scrollTo(){}},fetch:async()=>({ok:true,json:async()=>questions})};vm.createContext(ctx);vm.runInContext(script,ctx);await new Promise(r=>setImmediate(r));};await boot();
 const state=()=>JSON.parse(storage[key]),click=text=>{const n=app.querySelectorAll('button').find(n=>n.textContent===text);assert(n,text);n.listeners.click();};
 const word=id=>app.querySelector('.canvas').querySelectorAll('.word').find(n=>n.dataset.id===id),pick=id=>word(id).listeners.click();
 const select=(index,id)=>{const n=app.querySelectorAll('select')[index];n.value=id;n.listeners.change();};
 const answer=text=>{const n=app.querySelector('textarea');n.value=text;n.listeners.input();};
 return {app,state,click,word,pick,select,answer,boot,storage};
}
function editingWorks(h){
 const before=h.state().associations;h.pick('word-1');assert.equal(h.state().research.xId,'word-0');assert.equal(h.state().activeId,'word-1');assert.equal(h.word('word-0').attrs['data-research-role'],'X');assert.equal(h.word('word-1').attrs['data-research-role'],undefined);
 h.click('Groter');assert.equal(h.state().associations[0].size,before[0].size);assert(h.state().associations[1].size>before[1].size);h.click('Kleiner');
 const color=h.app.querySelectorAll('input').find(n=>n.attrs['aria-label']==='Kleur van geselecteerd element');color.value='#abcdef';color.listeners.input();assert.equal(h.state().associations[1].color,'#abcdef');assert.equal(h.state().associations[0].color,'#112233');
 const w=h.word('word-1'),start=parseFloat(w.style.left);w.listeners.pointerdown({button:0,clientX:100,clientY:100,pointerId:1});w.listeners.pointermove({clientX:120,clientY:115});assert(parseFloat(w.style.left)>start);w.listeners.pointerup();assert.equal(h.state().research.xId,'word-0');
 w.listeners.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(h.state().research.xId,'word-0');
}
(async()=>{
 for(const viewport of ['desktop','mobile']){
  const menu=await setup(viewport);menu.click('Verder');assert.equal(menu.state().stepId,'research');assert(menu.app.querySelector('.selection-validation'));menu.click('Oefening overslaan');assert.equal(menu.state().stepId,'arrange');
  for(const [label,random] of [['Bij een woord gaan staan',0],['Groot en klein ervaren',0],['Groot en klein ervaren',.9]]){
   const h=await setup(viewport,random);h.click(label);h.click('Verder');assert.equal(h.state().stepId,'research');assert(h.app.querySelector('.selection-validation'));h.pick('word-0');assert.equal(h.state().research.xId,'word-0');assert.equal(h.app.querySelector('select').value,'word-0');assert.equal(h.state().activeId,'word-0');h.answer('Letterlijk eigen materiaal');editingWorks(h);
   h.select(0,'word-2');assert.equal(h.state().research.xId,'word-2');assert.equal(h.state().activeId,'word-2');assert(Object.values(h.state().answers).includes('Letterlijk eigen materiaal'));h.click('Woord voor de oefening wijzigen');h.click('Verder');assert.equal(h.state().stepId,'research');h.click('Huidige keuze behouden');assert.equal(h.state().research.xId,'word-2');h.click('Woord voor de oefening wijzigen');h.pick('word-0');assert.equal(h.state().research.xId,'word-0');assert.equal(h.app.querySelector('select').value,'word-0');assert.equal(h.app.querySelector('textarea').value,'Letterlijk eigen materiaal');await h.boot();assert.equal(h.state().research.xId,'word-0');assert.equal(h.word('word-0').attrs['data-research-role'],'X');
   if(label==='Bij een woord gaan staan'){
    h.click('Vanaf dit woord naar een ander woord kijken');h.click('Verder');assert.equal(h.state().stepId,'research');h.pick('word-0');assert.equal(h.state().research.yId,null);h.pick('word-1');assert.equal(h.state().research.yId,'word-1');assert.equal(h.app.querySelectorAll('select')[1].value,'word-1');h.answer('Kijken vanuit X');h.click('Tweede woord wijzigen');h.pick('word-2');assert.equal(h.state().research.xId,'word-0');assert.equal(h.state().research.yId,'word-2');assert(Object.values(h.state().answers).includes('Kijken vanuit X'));h.click('Tweede woord wijzigen');h.click('Een mogelijke verandering verbeelden');assert.equal(h.state().research.selectionTarget,null);
   }
   const keep=h.state().associations.map(a=>a.id);h.click('Oefening afronden');assert.equal(h.state().stepId,'arrange');assert.deepEqual(h.state().associations.map(a=>a.id),keep);
  }
  const h=await setup(viewport);h.click('Twee woorden laten spreken');h.pick('word-0');assert.equal(h.state().research.xId,'word-0');assert.equal(h.state().research.yId,null);assert(h.app.querySelector('.research-selection-status').textContent.includes('tweede woord'));h.click('Verder');assert.equal(h.state().stepId,'research');h.pick('word-0');assert.equal(h.state().research.yId,null);h.pick('word-1');assert.equal(h.state().research.xId,'word-0');assert.equal(h.state().research.yId,'word-1');assert.equal(h.app.querySelectorAll('select').length,0);assert.equal(h.word('word-1').attrs['data-research-role'],'Y');h.pick('word-2');assert.equal(h.state().activeId,'word-2');assert.equal(h.state().research.xId,'word-0');assert.equal(h.state().research.yId,'word-1');
  for(const phase of [0,1,2,3]){assert.equal(h.state().research.dialoguePhase,phase);h.answer('Antwoord '+phase);await h.boot();assert.equal(h.state().research.dialoguePhase,phase);assert.equal(h.app.querySelector('textarea').value,'Antwoord '+phase);h.click('Verder');}assert.equal(h.state().stepId,'arrange');
  const change=await setup(viewport);change.click('Twee woorden laten spreken');change.select(0,'word-0');change.select(0,'word-1');change.answer('Bewaren');change.click('Andere woorden kiezen');change.pick('word-2');change.pick('word-0');assert.equal(change.state().research.xId,'word-2');assert.equal(change.state().research.yId,'word-0');assert(Object.values(change.state().answers).includes('Bewaren'));change.click('Oefening afronden');assert.equal(change.state().stepId,'arrange');
  // Deleting a chosen element asks for a replacement, and deletes only the explicit canvas target.
  const deleted=await setup(viewport);deleted.click('Bij een woord gaan staan');deleted.pick('word-0');deleted.click('Verwijderen');assert.equal(deleted.state().research.xId,null);deleted.click('Verder');assert.equal(deleted.state().stepId,'research');deleted.pick('word-2');assert.equal(deleted.state().research.xId,'word-2');assert.equal(deleted.state().associations.length,2);
 }
 console.log('PASS selection: all routes and both size variants, desktop/mobile; canvas/dropdown parity, distinct editing, drag/keyboard/size/color/delete, fixed X/Y, validation, explicit skip/finish, reselection, scoped answers and refresh');
})().catch(e=>{console.error(e);process.exitCode=1;});
