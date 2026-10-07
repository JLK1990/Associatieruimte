const assert=require('node:assert/strict'),vm=require('node:vm');
const {Element,questions,script,setViewport}=require('./flow.cjs');
(async()=>{
 for(const width of [350,872])for(const newQuestion of ['', '   ', '  Een eigen vraag $& <b>\n  ']){
  setViewport(width,380);const app=new Element('main'),notice=new Element('p'),erase=new Element('button'),key='associatieruimte.v01';
  const original='  Mijn beginvraag $& <i>\n  ',reflection='  Eigen opbrengst\n letterlijk  ';
  const saved={stepId:'finish',flowVersion:2,originalQuestion:original,answers:{reflection,newQuestion},associations:[{id:'word',text:'Mijn woord',x:40,y:45,size:1.4,color:'#123456'}],routeId:'landscape',imageIds:['image-01','image-02','image-03']};const storage={[key]:JSON.stringify(saved)};
  const ctx={document:{querySelector:q=>({'#app':app,'#erase':erase,'#storage-notice':notice})[q],createElement:t=>new Element(t)},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},crypto:require('node:crypto').webcrypto,window:{scrollTo(){}},fetch:async()=>({ok:true,json:async()=>questions})};
  vm.runInNewContext(script,ctx);await new Promise(r=>setImmediate(r));
  assert.deepEqual(app.querySelectorAll('h2').slice(0,newQuestion.trim()?4:3).map(n=>n.textContent),['Hier begon je mee','Je Associatieruimte','Wat je zelf meenam',...(newQuestion.trim()?['Een vraag die ontstond']:[])]);
  const literal=app.querySelectorAll('.literal');assert.equal(literal[0].textContent,original);assert.equal(literal[1].textContent,reflection);assert.equal(literal.length,newQuestion.trim()?3:2);if(newQuestion.trim())assert.equal(literal[2].textContent,newQuestion);
  assert(!app.querySelector('textarea'));assert(!app.querySelector('form'));assert(!app.querySelector('.tools'));assert(!app.textContent.includes('Dit is je Associatieruimte zoals die nu is ontstaan.'));
  const word=app.querySelector('.word');assert.equal(word.tag,'span');assert.equal(word.style.left,'40%');assert.equal(word.style.top,'45%');assert.equal(word.style.fontSize,(16*1.4)+'px');assert.equal(word.style.backgroundColor,'#123456');
  const outro=app.children.find(n=>n.textContent===questions.steps.find(s=>s.id==='finish').intro);assert(app.children.indexOf(outro)>app.children.indexOf(literal.at(-1)));assert.equal(JSON.parse(storage[key]).originalQuestion,original);assert.deepEqual(JSON.parse(storage[key]).answers,saved.answers);
 }
 console.log('PASS finish: literal summary, order, readonly current space, empty/whitespace new question, no exercise, preserved state on desktop/mobile');
})().catch(e=>{console.error(e);process.exitCode=1;});
