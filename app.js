'use strict';
const STORAGE_KEY = 'associatieruimte.v01';
const app = document.querySelector('#app');
const blank = () => ({step:0,entryType:'',originalQuestion:'',answers:{},associations:[],selectedImage:null,selectedElement:null,activeId:null,firstSpaceStep:null,routeId:null,imageIds:null,stepId:null,experiment:null});
let state = blank(), steps = [], content = {};
try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved && Array.isArray(saved.associations) && saved.answers && typeof saved.originalQuestion === 'string') state = {...state,...saved}; } catch { /* A fresh session also works without storage. */ }
// Only choices are retained between sessions, never answers or associations.
const CHOICES_KEY = STORAGE_KEY+'.choices';
function choose(items){return items[Math.floor(Math.random()*items.length)];}
function initialiseChoices(previous){
 if(!previous){try{previous=JSON.parse(localStorage.getItem(CHOICES_KEY));}catch{}}
 if(!content.routes.some(route=>route.id===state.routeId)){
  // Existing sessions used the landscape route. Preserve that route and its answers.
  state.routeId=Object.keys(state.answers).length||state.step>0?'landscape':choose(content.routes.filter(route=>route.id!==previous?.routeId)).id;
 }
 const pool=content.imagePool;
 if(!Array.isArray(state.imageIds)||state.imageIds.length!==3||new Set(state.imageIds).size!==3||!state.imageIds.every(id=>pool.some(image=>image.id===id))){
  const signature=ids=>[...ids].sort().join('|');
  const candidates=[];
  for(let a=0;a<pool.length-2;a++)for(let b=a+1;b<pool.length-1;b++)for(let c=b+1;c<pool.length;c++){
   const trio=[pool[a],pool[b],pool[c]],ids=trio.map(image=>image.id);
   if(signature(ids)===signature(previous?.imageIds||[]))continue;
   const score=trio[0].variation.reduce((sum,_,i)=>sum+new Set(trio.map(image=>image.variation[i])).size,0);
   candidates.push({ids,score});
  }
  const best=Math.max(...candidates.map(candidate=>candidate.score));
  state.imageIds=choose(candidates.filter(candidate=>candidate.score===best)).ids;
  if(!state.imageIds.includes(state.selectedImage))state.selectedImage=null;
 }
 try{localStorage.setItem(CHOICES_KEY,JSON.stringify({routeId:state.routeId,imageIds:state.imageIds}));}catch{}
 save();
}
function save(){state.stepId=steps[state.step]?.id??state.stepId;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{document.querySelector('#storage-notice').textContent='Bewaren lukt niet in deze browser. Je kunt doorgaan; houd dit tabblad open.';}}
function el(tag,text,attrs={}){const node=document.createElement(tag);if(text!==null)node.textContent=text;for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);return node;}
function button(text,action,attrs={}){const b=el('button',text,{type:'button',...attrs});b.addEventListener('click',action);return b;}
function reset(){try{localStorage.removeItem(STORAGE_KEY);}catch{}const previous={routeId:state.routeId,imageIds:state.imageIds};state=blank();initialiseChoices(previous);document.querySelector('#storage-notice').textContent='Je sessie is gewist.';render();}
document.querySelector('#erase').addEventListener('click',reset);
function field(f){const label=el('label',null,{class:'field'});label.append(el('span',f.text.replaceAll('{selectedElement}',()=>state.selectedElement ?? '')));const input=el('textarea',null,{'aria-label':f.text.replaceAll('{selectedElement}',()=>state.selectedElement ?? '')});input.value=f.key==='originalQuestion'?state.originalQuestion:(state.answers[f.key]??'');input.addEventListener('input',()=>{if(f.key==='originalQuestion')state.originalQuestion=input.value;else state.answers[f.key]=input.value;save();});label.append(input);return label;}
function collector(host,inSpace=false,showInvitation=true){
 const box=el('section',null,{class:'collector'});
 if(showInvitation)box.append(el('p',inSpace?'Wil je hier nog iets aan toevoegen?':'Wil je iets hiervan meenemen naar je Associatieruimte?'));
 const form=el('form',null),input=el('input',null,{'aria-label':'Nieuw woord of korte zin',placeholder:'Een woord of korte zin'});
 const row=el('div',null,{class:'collect-word'});row.append(input,el('button','Toevoegen',{type:'submit'}));
 const colors=el('div',null,{class:'collect-color'});colors.append(el('p','Heeft dit woord of deze zin voor jou een kleur?'));
 const label=el('label',null,{class:'color-control'});label.append(el('span','Kleur (optioneel)'));
 const color=el('input',null,{type:'color','aria-label':'Kleur voor nieuw woord of korte zin'});color.value='#fffdf1';label.append(color);
 let chosenColor=null;
 const status=el('span','Geen specifieke kleur',{class:'message','aria-live':'polite'});
 color.addEventListener('input',()=>{chosenColor=color.value;status.textContent='Eigen kleur gekozen';});
 colors.append(label,button('Geen specifieke kleur',()=>{chosenColor=null;color.value='#fffdf1';status.textContent='Geen specifieke kleur';}),status);
 form.append(row,colors);
 form.addEventListener('submit',e=>{e.preventDefault();if(!input.value.trim())return;const n=state.associations.length;const association={id:crypto.randomUUID(),text:input.value,x:20+(n%4)*20,y:20+(Math.floor(n/4)%4)*20,size:1};if(chosenColor)association.color=chosenColor;state.associations.push(association);save();render();});
 box.append(form);
 const cloud=el('div',null,{class:'word-cloud','aria-label':'Wat onderweg is ontstaan'});
 for(const a of state.associations.filter(a=>!a.shape)){const word=el('span',a.text,{class:'cloud-word'});word.style.backgroundColor=a.color||'#fffdf1';cloud.append(word);}
 box.append(cloud);host.append(box);
}
function bound(n,min,max){return Math.min(max,Math.max(min,n));}
const shapeNames = {circle:'Cirkel',rectangle:'Rechthoek',blob:'Kleurvlek'};
function canvas(host,readonly=false){const space=el('div',null,{class:'canvas'+(readonly?' readonly':''),'aria-label':'Jouw Associatieruimte'});let controls;host.append(space);if(!state.associations.length)space.append(el('p','Je ruimte is nog leeg. Ook dat mag.',{class:'empty'}));
for(const a of state.associations){const node=readonly?el('span',a.shape?'':a.text,{class:'word'+(a.shape?' shape shape-'+a.shape:'')}):button(a.shape?'':a.text,()=>{state.activeId=a.id;save();refreshControls(space,controls);},{class:'word'+(a.shape?' shape shape-'+a.shape:''),'aria-label':shapeNames[a.shape]||a.text,'aria-pressed':String(a.id===state.activeId)});node.dataset.id=a.id;space.append(node);position(space,node,a);node.hidden=Boolean(a.hidden);
if(!readonly){node.addEventListener('keydown',e=>{const delta={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]}[e.key];if(delta){e.preventDefault();move(space,a,delta[0],delta[1]);}});let drag=null;node.addEventListener('pointerdown',e=>{if(e.button!==0)return;state.activeId=a.id;refreshControls(space,controls);drag={x:e.clientX,y:e.clientY,ax:a.x,ay:a.y};node.setPointerCapture(e.pointerId);});node.addEventListener('pointermove',e=>{if(!drag)return;const rect=space.getBoundingClientRect();a.x=bound(drag.ax+(e.clientX-drag.x)/rect.width*100,12,88);a.y=bound(drag.ay+(e.clientY-drag.y)/rect.height*100,10,90);position(space,node,a);});node.addEventListener('pointerup',()=>{drag=null;save();});node.addEventListener('pointercancel',()=>{drag=null;save();});}}
function position(space,node,a){
node.style.fontSize=(16*a.size)+'px';
if(a.shape){node.style.width=(90*a.size)+'px';node.style.height=((a.shape==='rectangle'?65:90)*a.size)+'px';}
node.style.backgroundColor=a.color||(a.shape?'#b3c5bb':'#fffdf1');
// Bound the stored position as well as the visible position.
node.style.left=a.x+'%';node.style.top=a.y+'%';
const rect=space.getBoundingClientRect();
const halfX=Math.min(49,(node.offsetWidth/2+4)/rect.width*100);
const halfY=Math.min(49,(node.offsetHeight/2+4)/rect.height*100);
a.x=bound(a.x,Math.max(12,halfX),Math.min(88,100-halfX));
a.y=bound(a.y,Math.max(10,halfY),Math.min(90,100-halfY));
node.style.left=a.x+'%';node.style.top=a.y+'%';
}
function move(space,a,x,y){a.x=bound(a.x+x,12,88);a.y=bound(a.y+y,10,90);const node=[...space.children].find(n=>n.dataset.id===a.id);if(node)position(space,node,a);save();}
function refreshControls(space,controls){for(const [i,node] of [...space.querySelectorAll('.word')].entries())node.setAttribute('aria-pressed',String(state.associations[i].id===state.activeId));if(!controls)return;controls.replaceChildren();const active=state.associations.find(a=>a.id===state.activeId);controls.append(el('p',active?'Geselecteerd: '+(shapeNames[active.shape]||active.text):'Kies een woord. Gebruik daarna de knoppen om het te verplaatsen of te veranderen.'));if(!active)return;for(const [text,x,y] of [['←',-4,0],['→',4,0],['↑',0,-4],['↓',0,4]])controls.append(button(text,()=>move(space,active,x,y),{'aria-label':{ '←':'Naar links','→':'Naar rechts','↑':'Omhoog','↓':'Omlaag'}[text]}));for(const [text,d] of [['Kleiner',-.15],['Groter',.15]])controls.append(button(text,()=>{active.size=bound(active.size+d,.7,2.4);position(space,space.querySelector('[aria-pressed="true"]'),active);save();}));const label=el('label',null,{class:'color-control'});label.append(el('span','Kleur'));
const color=el('input',null,{type:'color','aria-label':'Kleur van geselecteerd element'});color.value=active.color||(active.shape?'#b3c5bb':'#fffdf1');
color.addEventListener('input',()=>{active.color=color.value;position(space,space.querySelector('[aria-pressed="true"]'),active);save();});label.append(color);controls.append(label);
controls.append(button('Verwijderen',()=>{state.associations=state.associations.filter(a=>a.id!==active.id);if(!active.shape&&state.selectedElement===active.text)state.selectedElement=null;state.activeId=null;save();render();}));}
if(!readonly){controls=el('div',null,{class:'tools'});host.append(controls);refreshControls(space,controls);
for(const a of state.associations.filter(a=>a.hidden))host.append(button('Terugzetten: '+(shapeNames[a.shape]||a.text),()=>{delete a.hidden;save();render();}));
}}
function availableStep(index,direction){while(index>0&&index<steps.length-1&&steps[index].minElements>state.associations.filter(a=>!a.shape).length&&!(steps[index].id==='experiment'&&state.experiment?.selectedId))index+=direction;return bound(index,0,steps.length-1);}
function copy(value){return JSON.parse(JSON.stringify(value));}
function experimentOptions(){
 const count=state.associations.filter(a=>!a.shape).length;
 const eligible=content.interventions.filter(item=>count>=item.minTextElements);
 if(!state.experiment)state.experiment={offeredIds:[],selectedId:null,phase:'choose',snapshot:null,elementIds:[],decision:null};
 const experiment=state.experiment;
 if(experiment.selectedId)return;
 experiment.offeredIds=experiment.offeredIds.filter(id=>eligible.some(item=>item.id===id));
 while(experiment.offeredIds.length<Math.min(2,eligible.length))experiment.offeredIds.push(choose(eligible.filter(item=>!experiment.offeredIds.includes(item.id))).id);
 save();
}
function startExperiment(id){
 const experiment=state.experiment;
 if(!experiment.offeredIds.includes(id))return;
 experiment.snapshot=copy({associations:state.associations,activeId:state.activeId,selectedElement:state.selectedElement});
 experiment.selectedId=id;experiment.phase='edit';experiment.elementIds=[];experiment.hiddenId=null;save();render();
}
function restoreExperiment(){
 const experiment=state.experiment;
 if(!experiment.snapshot)return;
 const snapshot=copy(experiment.snapshot);
 state.associations=snapshot.associations;state.activeId=snapshot.activeId;state.selectedElement=snapshot.selectedElement;
 experiment.elementIds=[];experiment.decision='restore';experiment.phase='done';save();render();
}
function experimentView(host){
 experimentOptions();
 const experiment=state.experiment;
 if(!experiment.selectedId){
  const choices=el('div',null,{class:'choices','aria-label':'Kies een experiment'});
  for(const id of experiment.offeredIds){const item=content.interventions.find(item=>item.id===id);choices.append(button(item.question,()=>startExperiment(id)));}
  host.append(choices);return;
 }
 const item=content.interventions.find(item=>item.id===experiment.selectedId);
 host.append(el('h2',item.question));
 if(experiment.phase==='edit'){
  host.append(el('p',content.experiment.invitation));
  const count=item.interactionType==='two-elements'?2:item.interactionType==='canvas'?0:1;
  const words=state.associations.filter(a=>!a.shape);
  for(let i=0;i<count;i++){
   const text=count===2?(i===0?'Eerste element':'Tweede element'):'Element om mee te experimenteren';
   const label=el('label',null,{class:'field'});label.append(el('span',text));
   const select=el('select',null,{'aria-label':text});select.append(el('option','Kies zelf een element',{value:''}));
   for(const a of words){if(experiment.elementIds.some((id,index)=>index!==i&&id===a.id))continue;const option=el('option',a.text,{value:a.id});option.selected=experiment.elementIds[i]===a.id;select.append(option);}
   select.value=experiment.elementIds[i]||'';
   select.addEventListener('change',()=>{if(item.interactionType==='hide-element'&&experiment.hiddenId&&experiment.hiddenId!==select.value){const previous=state.associations.find(a=>a.id===experiment.hiddenId);if(previous)delete previous.hidden;experiment.hiddenId=null;}experiment.elementIds[i]=select.value;state.activeId=select.value||null;save();render();});label.append(select);host.append(label);
  }
  const chosen=experiment.elementIds.filter(id=>words.some(a=>a.id===id));
  if(item.interactionType==='hide-element'){
   const a=words.find(a=>a.id===chosen[0]);
   if(a)host.append(button(a.hidden?'Element terugzetten':'Element tijdelijk verbergen',()=>{if(a.hidden){delete a.hidden;experiment.hiddenId=null;}else{a.hidden=true;experiment.hiddenId=a.id;state.activeId=null;}save();render();}));
  }
  canvas(host);
  // Keep adding available without repeating the collecting invitation as an intervention.
  collector(host,true,false);
  host.append(button('Opnieuw kijken',()=>{experiment.phase='reflect';save();render();},{class:'primary'}));
 }else{
  canvas(host,true);
  host.append(field({key:'experimentReflection',text:content.experiment.reflection}));
  host.append(el('p',content.experiment.decision));
  const choices=el('div',null,{class:'choices'});
  choices.append(button('Zo laten',()=>{experiment.decision='keep';experiment.phase='done';save();go(1);}),button('Terug naar hoe het was',restoreExperiment),button('Nog even verder veranderen',()=>{experiment.decision=null;experiment.phase='edit';save();render();}));
  host.append(choices);
 }
}
function render(){app.replaceChildren();const base=steps[state.step];if(!base)return;const s=base.route?{...base,...content.routes.find(route=>route.id===state.routeId)}:base;if(s.canvas&&!s.readonly&&!state.firstSpaceStep){state.firstSpaceStep=s.id;save();}const progress=el('progress',null,{max:String(steps.length),value:String(state.step+1),'aria-label':'Voortgang'});app.append(progress,el('p',`Associatieruimte · ${state.step+1} van ${steps.length}`,{class:'eyebrow'}));const heading=el('h1',s.title,{tabindex:'-1'});app.append(heading);if(s.intro){const intro=s.canvas&&!s.readonly&&state.firstSpaceStep===s.id?steps.find(step=>step.id==='space').intro:s.intro;app.append(el('p',intro,{class:'intro'}));}
if(s.id==='experiment')experimentView(app);
if(s.id==='entry'){const choices=el('div',null,{class:'choices','aria-label':'Kies een ingang'});s.entries.forEach(t=>choices.append(button(t,()=>{state.entryType=t;save();render();},{'aria-pressed':String(state.entryType===t)})));app.append(choices);}
if(s.id==='images'){const gallery=el('div',null,{class:'gallery'});for(const [index,id] of state.imageIds.entries()){const image=content.imagePool.find(image=>image.id===id),number=index+1;const b=button('',()=>{state.selectedImage=id;save();render();},{'aria-pressed':String(state.selectedImage===id),'aria-label':'Kies beeld '+number});b.append(el('img',null,{src:image.src,alt:'Beeld '+number,width:'1024',height:'1024'}),el('span','Beeld '+number));gallery.append(b);}app.append(gallery);}
if(s.id==='arrange'&&state.selectedElement!==null){app.append(el('p',s.changeInvitation),el('p',s.changeHint,{class:'intro'}));}
if(s.canvas){if(s.readonly){app.append(el('p',content.readonlyCanvas.title,{class:'eyebrow'}),el('p',content.readonlyCanvas.text));}if(!s.readonly&&!state.firstSpaceStep){state.firstSpaceStep=s.id;save();}canvas(app,s.readonly);}
if(s.id==='return'){app.append(el('p','Je kwam binnen met:'),el('blockquote',state.originalQuestion));}
if(s.id==='explore'){const label=el('label',null,{class:'field'});label.append(el('span','Welk element wil je onderzoeken?'));const select=el('select',null,{'aria-label':'Element om te onderzoeken'});select.append(el('option','Geen element geselecteerd',{value:''}));state.associations.filter(a=>!a.shape).forEach(a=>{const o=el('option',a.text,{value:a.id});if(a.text===state.selectedElement)o.selected=true;select.append(o);});select.addEventListener('change',()=>{state.selectedElement=state.associations.find(a=>a.id===select.value)?.text??null;state.answers.memory='';state.answers.memoryDetail='';save();render();});label.append(select);app.append(label);}
if(s.fields && (s.id!=='explore'||state.selectedElement!==null) && (s.id!=='images'||state.selectedImage!==null))s.fields.forEach(f=>app.append(field(f)));
if(s.collect || (s.canvas&&!s.readonly))collector(app,Boolean(s.canvas));
if(s.id==='finish'){app.append(el('h2','Je eigen slottekst'),el('div',state.answers.reflection||'',{class:'literal'}));if(state.answers.newQuestion)app.append(el('h2','Je nieuwe vraag'),el('div',state.answers.newQuestion,{class:'literal'}));for(const item of s.contact??[]){const section=el('section',null,{class:'contact'});section.append(el('h2',item.title),el('p',item.text,{class:'intro'}));const destination=content.contactLinks?.[item.urlKey]??'';if(/^(https?:\/\/|mailto:)/i.test(destination)){section.append(el('a',item.label,{href:destination,class:'contact-link'}));}else{section.append(el('button',item.label,{type:'button',disabled:'','aria-disabled':'true',title:'Deze link is nog niet ingesteld.'}));}app.append(section);}app.append(button('Opnieuw beginnen',reset,{class:'primary'}));}else{const nav=el('nav',null,{class:'navigation','aria-label':'Stappen'});if(state.step>0)nav.append(button('Terug',()=>go(-1)));else nav.append(el('span',''));nav.append(button('Verder',()=>{if(s.id==='entry'&&(!state.entryType||!state.originalQuestion.trim())){let msg=app.querySelector('.validation');if(!msg){msg=el('p','Kies een ingang en vul in waar het over gaat. Een kort antwoord is genoeg.',{role:'status',class:'validation'});nav.before(msg);}return;}if(s.id==='experiment'&&state.experiment?.phase==='edit'){state.experiment.phase='reflect';save();render();return;}if(s.id==='experiment'&&state.experiment?.phase==='reflect'){let message=app.querySelector('.validation');if(!message){message=el('p',content.experiment.decision,{role:'status',class:'validation'});nav.before(message);}return;}go(1);},{class:'primary'}));app.append(nav);}
}
function go(delta){state.step=availableStep(bound(state.step+delta,0,steps.length-1),delta);save();render();app.querySelector('h1').focus();window.scrollTo({top:0,behavior:'smooth'});}
fetch('questions.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{content=data;steps=data.steps;if(state.stepId){const resumed=steps.findIndex(step=>step.id===state.stepId);if(resumed>=0)state.step=resumed;}else if(state.step>=4){state.step+=1;}initialiseChoices();state.step=availableStep(bound(state.step,0,steps.length-1),1);render();}).catch(()=>{app.replaceChildren(el('h1','De vragen konden niet worden geladen'),el('p','Open de app via een lokale webserver: python3 -m http.server 8000. Open daarna http://localhost:8000.'));});
