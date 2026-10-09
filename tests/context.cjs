const assert=require('node:assert/strict'),vm=require('node:vm');
const {Element,questions,script,setViewport}=require('./flow.cjs');
const key='associatieruimte.v01';
const clone=x=>JSON.parse(JSON.stringify(x));
const xText='eenvoud $& {Y} {selectedElement} <b>',yText='gezelligheid $& {X}';
async function setup(count,viewport='desktop',random=0){
 setViewport(viewport==='mobile'?350:872,viewport==='mobile'?380:500);
 const app=new Element('main'),notice=new Element('p'),erase=new Element('button');
 const associations=Array.from({length:count},(_,i)=>({id:'word-'+i,text:i===0?xText:i===1?yText:'eigen '+i,x:35+i*15,y:40,size:1,color:i===0?'#aabbcc':undefined}));
 const stored={step:4,stepId:'research',originalQuestion:'Mijn vraag',entryType:'Ik zit ergens mee',answers:{landscape:'Mijn eigen antwoord'},associations,activeId:null,selectedElement:null,firstSpaceStep:'space',routeId:'landscape',imageIds:['image-01','image-02','image-03']};
 const storage={[key]:JSON.stringify(stored)},math=Object.create(Math);math.random=()=>random;
 let ctx={Math:math,document:{querySelector:q=>({'#app':app,'#erase':erase,'#storage-notice':notice})[q],createElement:t=>new Element(t)},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},crypto:require('node:crypto').webcrypto,window:{scrollTo(){}},fetch:async()=>({ok:true,json:async()=>questions})};
 const boot=async()=>{ctx={...ctx};vm.createContext(ctx);vm.runInContext(script,ctx);await new Promise(r=>setImmediate(r));};await boot();
 const state=()=>JSON.parse(storage[key]);
 const click=text=>{const n=app.querySelectorAll('button').find(n=>n.textContent===text);assert(n,'Button: '+text);n.listeners.click();};
 const select=(index,id)=>{const n=app.querySelectorAll('select')[index];assert(n);n.value=id;n.listeners.change();};
 const answer=(index,text)=>{const n=app.querySelectorAll('textarea')[index];assert(n);n.value=text;n.listeners.input();};
 const add=(text,color)=>{const input=app.querySelectorAll('input').find(n=>n.attrs['aria-label']==='Nieuw woord of korte zin');assert(input);input.value=text;if(color){const c=app.querySelectorAll('input').find(n=>n.attrs['aria-label']==='Kleur voor nieuw woord of korte zin');c.value=color;c.listeners.input();}app.querySelector('form').listeners.submit({preventDefault(){}});};
 return {app,state,click,select,answer,add,boot,storage,get ctx(){return ctx;}};
}

const visible=h=>h.app.querySelectorAll('.answer-context').filter(n=>!n.hidden);
const values=h=>visible(h).map(n=>n.children[1].textContent);
(async()=>{
 for(const viewport of ['desktop','mobile']){
  const h=await setup(3,viewport);h.click('Twee woorden laten spreken');h.select(0,'word-0');h.select(0,'word-1');assert.deepEqual(values(h),[]);
  const here='  klein maken $& <b>\n  ',look='Vanaf hier: scherp',say='  Mijn uitspraak\n  ';h.answer(0,here);h.click('Verder');assert.deepEqual(values(h),[here]);assert(visible(h)[0].children[0].textContent.includes(xText));assert(h.app.children.indexOf(visible(h)[0])<h.app.children.indexOf(h.app.querySelector('.field')));
  await h.boot();assert.deepEqual(values(h),[here]);h.answer(0,look);h.click('Verder');assert.deepEqual(values(h),[look]);h.answer(0,say);h.click('Verder');assert.deepEqual(values(h),[say]);assert(visible(h)[0].children[0].textContent.includes(yText));h.click('Terug');assert.deepEqual(values(h),[look]);h.click('Terug');assert.deepEqual(values(h),[here]);
  const before=clone(h.state().associations),answers=clone(h.state().answers);h.click('Andere woorden kiezen');h.select(0,'word-2');h.select(0,'word-1');h.click('Verder');assert.deepEqual(values(h),[],'Never show experience belonging to old X');assert.deepEqual(h.state().answers,answers);assert.deepEqual(h.state().associations,before);
  const a=await setup(2,viewport);a.click('Bij een woord gaan staan');a.select(0,'word-0');a.answer(0,here);a.answer(1,'Om me heen');a.click('Vanaf dit woord naar een ander woord kijken');assert.deepEqual(values(a),[here,'Om me heen']);a.select(1,'word-1');a.answer(0,look);a.click('Vanaf het andere woord terugkijken');assert.deepEqual(values(a),[look]);a.click('Een mogelijke verandering verbeelden');assert.deepEqual(values(a),[here,'Om me heen']);a.answer(0,'Mijn mogelijke verandering');a.click('Verder');assert.equal(a.app.querySelector('.answer-reference').textContent,'(Eerder schreef je: ‘Mijn mogelijke verandering’)');
  for(const random of [0,.9]){
   const z=await setup(1,viewport,random);z.click('Groot en klein ervaren');z.select(0,'word-0');const v=questions.researchRoutes.find(r=>r.id==='size').variants[z.state().research.variant];const inputs=z.app.querySelectorAll('textarea');inputs.forEach((n,i)=>z.answer(i,'Eerste '+i));const expected1=inputs.slice(inputs.length-v.phases[0].fields.length).map(n=>n.value);z.click(v.phases[0].nextLabel);assert.deepEqual(values(z),expected1);assert(visible(z).every(n=>/groot|klein/.test(n.children[0].textContent)));z.app.querySelectorAll('textarea').forEach((n,i)=>z.answer(i,'Tweede '+i));const expected2=z.app.querySelectorAll('textarea').map(n=>n.value);z.click(v.phases[1].nextLabel);assert.deepEqual(values(z),[...expected1,...expected2]);await z.boot();assert.deepEqual(values(z),[...expected1,...expected2]);
  }
  // Last reflection remains context for the optional new question; return keeps question + space.
  const r=await setup(1,viewport);vm.runInContext("state.step=steps.findIndex(s=>s.id==='return');save();render()",r.ctx);assert.equal(r.app.querySelector('blockquote').textContent,'Mijn vraag');assert(r.app.querySelector('.canvas'));r.answer(0,here);r.click('Verder');assert.deepEqual(values(r),[here]);assert.equal(r.app.querySelectorAll('textarea').length,1);await r.boot();assert.deepEqual(values(r),[here]);r.click('Terug');assert.equal(r.app.querySelector('textarea').value,here);
 }
 // Audit: original three routes already keep all fields together, literal live references remain.
 for(const route of questions.routes){assert.equal(route.fields.length,3);assert(route.fields[1].referenceKey);}
 console.log('PASS context: scoped literal dialogue/standing references, size contrasts in both variants, optional new question, no stale word scopes, empty hiding, refresh/back, unchanged answers/canvas on desktop/mobile');
})().catch(e=>{console.error(e);process.exitCode=1;});
