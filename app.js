'use strict';
const STORAGE_KEY = 'associatieruimte.v01';
const app = document.querySelector('#app');
const blank = () => ({step:0,entryType:'',originalQuestion:'',answers:{},associations:[],selectedImage:null,flowVersion:3,objectId:null,objectPhase:0,objectFlowVersion:2,activeId:null,firstSpaceStep:null,routeId:null,imageIds:null,stepId:null,research:null});
let state = blank(), steps = [], content = {}, lastStored = null;
try { lastStored = localStorage.getItem(STORAGE_KEY); const saved = JSON.parse(lastStored); if(saved && Array.isArray(saved.associations) && saved.answers && typeof saved.originalQuestion === 'string') state = {...state,...saved,flowVersion:saved.flowVersion??0,objectFlowVersion:saved.objectFlowVersion??1}; } catch { /* A fresh session also works without storage. */ }
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
  const previousIds=new Set(previous?.imageIds??[]);
  const remaining=pool.filter(image=>!previousIds.has(image.id));
  // Prefer unseen images; reuse previous images only if the pool is too small.
  const candidates=[...remaining];
  if(candidates.length<3)candidates.push(...pool.filter(image=>previousIds.has(image.id)));
  state.imageIds=[];
  while(state.imageIds.length<3){
   const available=remaining.length>=3?candidates:candidates.filter(image=>!previousIds.has(image.id));
   const image=choose(available.length?available:candidates);
   state.imageIds.push(image.id);candidates.splice(candidates.indexOf(image),1);
  }
  if(!state.imageIds.includes(state.selectedImage))state.selectedImage=null;
 }
 if(!content.objectPool.includes(state.objectId)){const candidates=content.objectPool.filter(id=>id!==previous?.objectId);state.objectId=choose(candidates.length?candidates:content.objectPool);}
 try{localStorage.setItem(CHOICES_KEY,JSON.stringify({routeId:state.routeId,imageIds:state.imageIds,objectId:state.objectId}));}catch{}
 save();
}
function storageIsCurrent(){
 try{if(localStorage.getItem(STORAGE_KEY)!==lastStored){document.querySelector('#storage-notice').textContent='Deze sessie is gewijzigd in een ander tabblad. Herlaad dit tabblad om verder te gaan. Wijzigingen hier worden niet opgeslagen.';return false;}}catch{}
 return true;
}
function save(){state.stepId=steps[state.step]?.id??state.stepId;if(!storageIsCurrent())return false;try{const serialized=JSON.stringify(state);localStorage.setItem(STORAGE_KEY,serialized);lastStored=serialized;return true;}catch{document.querySelector('#storage-notice').textContent='Bewaren lukt niet in deze browser. Je kunt doorgaan; houd dit tabblad open.';return false;}}
function el(tag,text,attrs={}){const node=document.createElement(tag);if(text!==null)node.textContent=text;for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);return node;}
function button(text,action,attrs={}){const b=el('button',text,{type:'button',...attrs});b.addEventListener('click',e=>{if(storageIsCurrent())action(e);});return b;}
function reset(){if(!storageIsCurrent())return;try{localStorage.removeItem(STORAGE_KEY);lastStored=null;}catch{}const previous={routeId:state.routeId,imageIds:state.imageIds,objectId:state.objectId};state=blank();initialiseChoices(previous);document.querySelector('#storage-notice').textContent='Je sessie is gewist.';render();}
document.querySelector('#erase').addEventListener('click',reset);
function updateAnswerReference(node){
 const key=node.dataset.answerKey,answer=key==='originalQuestion'?state.originalQuestion:state.answers[key];
 node.hidden=typeof answer!=='string'||!answer.trim();
 node.textContent=node.hidden?'':`(Eerder schreef je: ‘${answer}’)`;
}
function answerReference(key){const node=el('p',null,{class:'message answer-reference'});node.style.whiteSpace='pre-wrap';node.style.overflowWrap='anywhere';node.dataset.answerKey=key;updateAnswerReference(node);return node;}
function refreshAnswerReferences(){for(const node of app.querySelectorAll('.answer-reference'))updateAnswerReference(node);}
function field(f){const text=f.text;const label=el('label',null,{class:'field'});label.append(el('span',text));const referenceKey=f.referenceKey??content.routes.find(route=>route.id===state.routeId)?.fields[f.referenceRouteField]?.key;if(referenceKey)label.append(answerReference(referenceKey));const input=el('textarea',null,{'aria-label':text});input.value=f.key==='originalQuestion'?state.originalQuestion:(state.answers[f.key]??'');input.addEventListener('input',()=>{if(f.key==='originalQuestion')state.originalQuestion=input.value;else state.answers[f.key]=input.value;save();refreshAnswerReferences();refreshAnswerSuggestions();});label.append(input);return label;}
function newElementPosition(text){
 const existing=app.querySelector('.canvas'),space=existing??el('div',null,{class:'canvas'});
 if(!existing){space.style.visibility='hidden';app.append(space);}
 const rect=space.getBoundingClientRect(),nodes=[...space.querySelectorAll('.word')];
 const measure=a=>{const probe=el('span',a.text??'',{class:'word'+(a.shape?' shape shape-'+a.shape:'')});probe.style.visibility='hidden';probe.style.fontSize=16*a.size+'px';if(a.shape){probe.style.width=90*a.size+'px';probe.style.height=(a.shape==='rectangle'?65:90)*a.size+'px';}space.append(probe);const dimensions={width:probe.offsetWidth,height:probe.offsetHeight};probe.remove();return dimensions;};
 const {width,height}=measure({text,size:1});
 const occupied=state.associations.filter(a=>!a.hidden).map(a=>{const node=nodes.find(n=>n.dataset.id===a.id);return {a,...(node?{width:node.offsetWidth,height:node.offsetHeight}:measure(a))};});
 if(!existing)space.remove();
 const halfX=Math.min(49,(width/2+4)/rect.width*100),halfY=Math.min(49,(height/2+4)/rect.height*100);
 let best={x:50,y:50},score=-Infinity;
 // Keep existing positions; only find room for the new element. In a full space use the least crowded candidate.
 for(const cy of [20,40,60,80,10,30,50,70,90])for(const cx of [20,40,60,80,12,30,50,70,88]){
  const x=bound(cx,Math.max(12,halfX),Math.min(88,100-halfX)),y=bound(cy,Math.max(10,halfY),Math.min(90,100-halfY));
  const gap=occupied.length?Math.min(...occupied.map(o=>Math.max(Math.abs(x-o.a.x)*rect.width/100-(width+o.width)/2,Math.abs(y-o.a.y)*rect.height/100-(height+o.height)/2))):Infinity;
  if(gap>score){best={x,y};score=gap;}if(gap>=12)return {x,y};
 }
 return best;
}
function addElement(text,color){
 if(!storageIsCurrent())return false;
 if(!text.trim())return false;
 const association={id:crypto.randomUUID(),text,...newElementPosition(text),size:1};
 if(color)association.color=color;
 state.associations.push(association);save();return true;
}
function elementForm(){
 const form=el('form',null,{'aria-label':'Zelf iets toevoegen'});
 const input=el('input',null,{'aria-label':'Nieuw woord of korte zin',placeholder:'Een woord of korte zin'});

 const row=el('div',null,{class:'collect-word'});row.append(input,el('button','Toevoegen',{type:'submit'}));
 const colors=el('div',null,{class:'collect-color'});colors.append(el('p','Heeft dit woord of deze zin voor jou een kleur?'));
 const label=el('label',null,{class:'color-control'});label.append(el('span','Kleur (optioneel)'));
 const color=el('input',null,{type:'color','aria-label':'Kleur voor nieuw woord of korte zin'});color.value='#fffdf1';label.append(color);
 let chosenColor=null;
 const status=el('span','Geen specifieke kleur',{class:'message','aria-live':'polite'});
 color.addEventListener('input',()=>{chosenColor=color.value;status.textContent='Eigen kleur gekozen';});
 colors.append(label,button('Geen specifieke kleur',()=>{chosenColor=null;color.value='#fffdf1';status.textContent='Geen specifieke kleur';}),status);
 form.append(row,colors);
 form.addEventListener('submit',e=>{e.preventDefault();if(addElement(input.value,chosenColor))render();});
 form.getChosenColor=()=>chosenColor;
 return form;
}
function collectibleAnswers(){
 // Known free-text fields and stored research scopes contain user material, not UI choices.
 const fields=[...content.routes.flatMap(route=>route.fields??[]),...steps.flatMap(step=>step.fields??[])];
 const answers=fields.filter(field=>field.key!=='originalQuestion').map(field=>state.answers[field.key]);
 answers.push(...(content.legacyAnswerKeys??[]).map(key=>state.answers[key]));
 for(const [key,text] of Object.entries(state.answers)){
  const [prefix,routeId,xId,yId,variant,fieldKey,...extra]=key.split('.');
  if(prefix!=='research'||extra.length||!xId)continue;
  const route=content.researchRoutes.find(route=>route.id===routeId);
  if(!route)continue;
  const definitions=route.variants
   ?route.variants[variant]?.phases.flatMap(phase=>[...(phase.beforeFields??[]),...(phase.fields??[])])??[]
   :[...(route.fields??[]),route.hereField,route.lookField,route.reverseField,route.field,route.replyField,route.changeField].filter(Boolean);
  if(definitions.some(field=>field.key===fieldKey))answers.push(text);
 }
 answers.push(...state.associations.filter(a=>!a.shape).map(a=>a.text));
 return [...new Set(answers.filter(text=>typeof text==='string'&&text.trim()))];
}
function fillAnswerSuggestions(panel){
 const config=panel.suggestionConfig;
 const answers=config?.keys?[...new Set(config.keys.map(key=>state.answers[key]).filter(text=>typeof text==='string'&&text.trim()))]:collectibleAnswers();panel.hidden=!answers.length;panel.replaceChildren();
 panel.append(el('p',config?.title??'Dit zijn dingen die je eerder invulde:'));
 const options=el('div',null,{class:'answer-options','aria-label':'Eerdere eigen antwoorden'});
 for(const text of answers){
  const added=state.associations.some(a=>!a.shape&&a.text===text);
  const option=button('',()=>{if(state.associations.some(a=>!a.shape&&a.text===text))return;if(addElement(text,panel.getChosenColor?.()))render();},{class:'answer-chip','aria-label':(added?'Al toegevoegd: ':'Toevoegen: ')+text});
  option.append(el('span',text,{class:'answer-chip-text'}));
  if(added){option.setAttribute('disabled','');option.append(el('span','Toegevoegd',{class:'answer-chip-status'}));}
  options.append(option);
 }
 panel.append(options);if(config?.invitation!==false)panel.append(el('p',config?.invitation??'Wil je iets hiervan een plek geven in je Associatieruimte?'));
}
function refreshAnswerSuggestions(){for(const panel of app.querySelectorAll('.answer-suggestions'))fillAnswerSuggestions(panel);}
function answerSuggestions(config){const panel=el('section',null,{class:'answer-suggestions'});panel.suggestionConfig=config;fillAnswerSuggestions(panel);return panel;}
function collector(host,inSpace=false,invitation=null,offerAnswers=false,suggestionConfig){
 const box=el('section',null,{class:'collector'});
 if(!state.associations.some(a=>!a.shape))box.append(el('p','Je kunt hier woorden of korte zinnen verzamelen die voor jou tijdens het onderzoeken betekenis krijgen. Neem iets mee uit wat ontstaat, of voeg zelf iets toe dat voor jou erbij hoort.',{class:'message'}));
 const form=elementForm();
 if(offerAnswers){if(invitation)box.append(el('p',invitation));const suggestions=answerSuggestions(suggestionConfig);if(suggestionConfig)suggestions.getChosenColor=form.getChosenColor;box.append(suggestions,el('p','Komt er nog iets anders bij je op?'));}
 else box.append(el('p',invitation??(inSpace?'Wil je hier nog iets aan toevoegen?':'Wil je iets hiervan meenemen naar je Associatieruimte?')));
 box.append(form);
 const cloud=el('div',null,{class:'word-cloud','aria-label':'Wat onderweg is ontstaan'});
 for(const a of state.associations.filter(a=>!a.shape)){const word=el('span',a.text,{class:'cloud-word'});word.style.backgroundColor=a.color||'#fffdf1';cloud.append(word);}
 box.append(cloud);host.append(box);
}
function bound(n,min,max){return Math.min(max,Math.max(min,n));}
const shapeNames = {circle:'Cirkel',rectangle:'Rechthoek',blob:'Kleurvlek'};
function canvas(host,readonly=false){const space=el('div',null,{class:'canvas'+(readonly?' readonly':''),'aria-label':'Jouw Associatieruimte'});let controls;host.append(space);if(!state.associations.length)space.append(el('p','Je ruimte is nog leeg. Ook dat mag.',{class:'empty'}));
for(const a of state.associations){const node=readonly?el('span',a.shape?'':a.text,{class:'word'+(a.shape?' shape shape-'+a.shape:'')}):button(a.shape?'':a.text,()=>{state.activeId=a.id;if(selectResearchFromCanvas(a))return;save();refreshControls(space,controls);},{class:'word'+(a.shape?' shape shape-'+a.shape:''),'aria-label':shapeNames[a.shape]||a.text,'aria-pressed':String(a.id===state.activeId)});node.dataset.id=a.id;space.append(node);position(space,node,a);node.hidden=Boolean(a.hidden);
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
function refreshControls(space,controls){markResearchWords(space);for(const [i,node] of [...space.querySelectorAll('.word')].entries())node.setAttribute('aria-pressed',String(state.associations[i].id===state.activeId));if(!controls)return;controls.replaceChildren();const active=state.associations.find(a=>a.id===state.activeId);controls.append(el('p',active?(steps[state.step]?.id==='research'?'Voor bewerken geselecteerd: ':'Geselecteerd: ')+(shapeNames[active.shape]||active.text):'Kies een woord. Gebruik daarna de knoppen om het te verplaatsen of te veranderen.'));if(!active)return;for(const [text,x,y] of [['←',-4,0],['→',4,0],['↑',0,-4],['↓',0,4]])controls.append(button(text,()=>move(space,active,x,y),{'aria-label':{ '←':'Naar links','→':'Naar rechts','↑':'Omhoog','↓':'Omlaag'}[text]}));for(const [text,d] of [['Kleiner',-.15],['Groter',.15]])controls.append(button(text,()=>{active.size=bound(active.size+d,.7,2.4);position(space,space.querySelector('[aria-pressed="true"]'),active);save();}));const label=el('label',null,{class:'color-control'});label.append(el('span','Kleur'));
const color=el('input',null,{type:'color','aria-label':'Kleur van geselecteerd element'});color.value=active.color||(active.shape?'#b3c5bb':'#fffdf1');
color.addEventListener('input',()=>{active.color=color.value;position(space,space.querySelector('[aria-pressed="true"]'),active);save();});label.append(color);controls.append(label);
controls.append(button('Verwijderen',()=>{state.associations=state.associations.filter(a=>a.id!==active.id);state.activeId=null;save();render();}));}
if(!readonly){controls=el('div',null,{class:'tools'});host.append(controls);refreshControls(space,controls);
for(const a of state.associations.filter(a=>a.hidden))host.append(button('Terugzetten: '+(shapeNames[a.shape]||a.text),()=>{delete a.hidden;save();render();}));
}}
function researchWords(){return state.associations.filter(a=>!a.shape&&!a.hidden);}
function availableStep(index,direction){while(index>0&&index<steps.length-1&&(steps[index].id==='research'?researchWords().length<1:steps[index].minElements>state.associations.filter(a=>!a.shape).length))index+=direction;return bound(index,0,steps.length-1);}
function researchText(text){
 const research=state.research;
 const word=id=>state.associations.find(a=>a.id===id)?.text??'';
 return text.replace(/\{([XY])\}/g,(_,name)=>word(name==='X'?research.xId:research.yId));
}
function researchAnswerKey(definition){
 const research=state.research;
 // Scope answers to the chosen IDs; switching words never overwrites earlier answers.
 const scope=[research.routeId,research.xId,definition.text.includes('{Y}')||definition.key==='reply'?research.yId:'',research.variant??'',definition.key].join('.');
 return 'research.'+scope;
}
function researchField(host,definition){host.append(field({...definition,key:researchAnswerKey(definition),text:researchText(definition.text),literal:true}));}
function researchSelectionKey(){
 if(steps[state.step]?.id!=='research')return null;
 const r=state.research,route=content.researchRoutes.find(route=>route.id===r?.routeId);
 if(!route||researchWords().length<route.minTextElements)return null;
 const needsY=route.id==='dialogue'||(route.id==='standing'&&r.phase===1);
 if(!r.xId)return 'xId';
 if(r.selectionTarget==='xId'||(r.selectionTarget==='yId'&&needsY))return r.selectionTarget;
 if(needsY&&!r.yId)return 'yId';return null;
}
function selectResearchWord(key,id){
 const r=state.research;
 if(id&&(!researchWords().some(a=>a.id===id)||(key==='yId'&&id===r.xId)))return false;
 if(r[key]!==id){r[key]=id;if(key==='xId'){r.yId=null;r.phase=0;}r.reply=false;r.reverse=false;if(r.routeId==='dialogue')r.dialoguePhase=0;}
 r.selectionTarget=null;state.activeId=id;save();render();return true;
}
function selectResearchFromCanvas(a){
 const key=researchSelectionKey();if(!key)return false;
 if(a.shape||a.hidden||(key==='yId'&&a.id===state.research.xId)){selectionNotice(key==='yId'?'Kies een ander woord dan het eerste woord.':'Kies een woord voor deze oefening.');return false;}
 return selectResearchWord(key,a.id);
}
function selectionNotice(text){let node=app.querySelector('.selection-validation');if(!node){node=el('p',null,{class:'message selection-validation',role:'status'});app.querySelector('.navigation').before(node);}node.textContent=text;}
function researchSelectionStatus(host){
 const r=state.research,key=researchSelectionKey(),status=el('p',null,{class:'message research-selection-status',id:'research-selection-status'});
 const x=state.associations.find(a=>a.id===r.xId)?.text,y=state.associations.find(a=>a.id===r.yId)?.text;
 status.textContent=(x?`Voor de oefening: X = ‘${x}’${y?`; Y = ‘${y}’`:''}. `:'')+(key?(key==='yId'?'Kies nu het tweede woord':'Kies een woord')+' door erop te klikken in de ruimte of via de keuzelijst.':'Klik op een woord om het te bewerken. De oefenkeuze blijft staan.');host.append(status);
}
function markResearchWords(space){
 const r=steps[state.step]?.id==='research'?state.research:null;
 for(const node of space.querySelectorAll('.word')){const role=r?.routeId?(node.dataset.id===r.xId?'X':node.dataset.id===r.yId?'Y':''):'';if(role){node.setAttribute('data-research-role',role);node.setAttribute('aria-describedby','research-selection-status');}else{node.removeAttribute('data-research-role');node.removeAttribute('aria-describedby');}}
}
function researchCanContinue(){
 const r=state.research,route=content.researchRoutes.find(route=>route.id===r?.routeId);
 if(!route){selectionNotice('Kies een oefening, of kies ‘Oefening overslaan’.');return false;}
 if(researchWords().length<route.minTextElements){selectionNotice('Voor deze oefening zijn meer woorden nodig. Je kunt de oefening afronden.');return false;}
 if(r.selectionTarget){selectionNotice('Kies een woord, of kies ‘Huidige keuze behouden’.');return false;}
 if(!r.xId){selectionNotice('Kies eerst een woord in de ruimte of via de keuzelijst.');return false;}
 if((route.id==='dialogue'||(route.id==='standing'&&r.phase===1))&&!r.yId){selectionNotice('Kies eerst het tweede woord in de ruimte of via de keuzelijst.');return false;}
 return true;
}
function researchSelect(host,text,key){
 const research=state.research,words=researchWords();
 const label=el('label',null,{class:'field'});label.append(el('span',researchText(text)));
 const select=el('select',null,{'aria-label':researchText(text)});select.append(el('option','Kies zelf een woord',{value:''}));
 for(const a of words){if(key==='yId'&&a.id===research.xId)continue;const option=el('option',a.text,{value:a.id});option.selected=research[key]===a.id;select.append(option);}
 select.value=research[key]??'';
 select.addEventListener('change',()=>selectResearchWord(key,select.value||null));
 label.append(select);host.append(label);
 if(research[key]){if(research.selectionTarget===key)host.append(button('Huidige keuze behouden',()=>{research.selectionTarget=null;save();render();}));else host.append(button(key==='yId'?'Tweede woord wijzigen':'Woord voor de oefening wijzigen',()=>{research.selectionTarget=key;save();render();}));}

}
function dialogueView(host,route){
 const research=state.research;
 if(research.yId===research.xId)research.yId=null;
 research.dialoguePhase??=research.reply?3:bound(research.phase,0,2);
 if(!research.xId){research.dialoguePhase=0;researchSelect(host,route.xSelection,'xId');}
 else{
  host.append(el('p',researchText('Je staat bij ‘{X}’.')));
  if(!research.yId){research.dialoguePhase=0;researchSelect(host,route.ySelection,'yId');}
  else{
   host.append(el('p',researchText('Je gesprek is tussen ‘{X}’ en ‘{Y}’.')));
   host.append(button('Andere woorden kiezen',()=>{research.xId=null;research.yId=null;research.dialoguePhase=0;research.reply=false;research.selectionTarget=null;save();render();}));
   if(research.dialoguePhase===0)researchField(host,route.hereField);
   else if(research.dialoguePhase===1)researchField(host,route.lookField);
   else if(research.dialoguePhase===2){host.append(el('p',researchText('‘{X}’ spreekt tegen ‘{Y}’.')));researchField(host,route.field);}
   else{host.append(el('p',researchText('‘{Y}’ antwoordt ‘{X}’.')));researchField(host,{...route.replyField,referenceKey:researchAnswerKey(route.field)});}
  }
 }
 researchSelectionStatus(host);canvas(host);
 if(research.xId&&research.yId&&research.dialoguePhase>=2)collector(host,true,route.collectionInvitation,true);
}
function researchView(host){
 if(!state.research)state.research={routeId:null,xId:null,yId:null,phase:0,variant:null,reply:false,reverse:false};
 const research=state.research,words=researchWords();
 if(!words.some(a=>a.id===research.xId)){research.xId=null;research.yId=null;research.phase=0;research.reply=false;research.reverse=false;research.selectionTarget=null;}
 if(!words.some(a=>a.id===research.yId))research.yId=null;
 const route=content.researchRoutes.find(route=>route.id===research.routeId);
 if(!route){
  research.routeId=null;
  const choices=el('div',null,{class:'choices','aria-label':'Kies iets om te onderzoeken'});
  for(const item of content.researchRoutes.filter(item=>words.length>=item.minTextElements))choices.append(button(item.label,()=>{research.routeId=item.id;research.variant=item.variants?choose(Object.keys(item.variants)):null;save();render();}));
  host.append(choices);save();return;
 }
 if(words.length<route.minTextElements){
  host.append(el('p','Je kunt hier iets toevoegen of gewoon verdergaan.'));researchSelectionStatus(host);canvas(host);collector(host,true,route.collectionInvitation,true);save();return;
 }
 if(research.selectionTarget==='yId'&&route.id!=='dialogue'&&!(route.id==='standing'&&research.phase===1))research.selectionTarget=null;
 if(route.variants&&!route.variants[research.variant])research.variant=choose(Object.keys(route.variants));
 if(route.interactionType==='dialogue'){dialogueView(host,route);save();return;}
 const variant=route.variants?.[research.variant];
 if(route.interactionType==='standing'&&words.length<2&&research.phase===1){research.phase=0;research.reverse=false;}
 if(variant)research.phase=bound(research.phase,0,variant.phases.length-1);
 researchSelect(host,variant?.xSelection??route.xSelection,'xId');
 if(research.xId){
  if(route.interactionType==='standing'){
   if(research.phase===0){route.fields.forEach(definition=>researchField(host,definition));}
   else if(research.phase===2){researchField(host,route.changeField);}
   else{
    researchSelect(host,route.ySelection,'yId');
    if(research.yId){researchField(host,research.reverse?route.reverseField:route.lookField);if(!research.reverse)host.append(button(route.reverseChoice,()=>{research.reverse=true;save();render();}));}
   }
   if(research.phase!==2)host.append(button(route.changeChoice,()=>{research.phase=2;save();render();}));
   if(research.phase===0&&words.length>=2)host.append(button(route.lookChoice,()=>{research.phase=1;save();render();}));
  }else if(route.interactionType==='size'){
   const phase=variant.phases[research.phase];
   (phase.beforeFields??[]).forEach(definition=>researchField(host,definition));
   if(phase.id==='own')(phase.fields??[]).forEach(definition=>researchField(host,definition));
   host.append(el('p',researchText(phase.instruction),{class:'intro'}));
   if(phase.id!=='own')(phase.fields??[]).forEach(definition=>researchField(host,definition));
  }
 }
 researchSelectionStatus(host);
 // Every experience screen reuses the existing interactive canvas, never a readonly copy.
 canvas(host);
 if(research.xId)collector(host,true,route.collectionInvitation,true);
 if(research.xId&&variant?.phases[research.phase].nextLabel)host.append(button(variant.phases[research.phase].nextLabel,()=>{research.phase+=1;state.activeId=research.xId;save();render();}));
 save();
}
function render(){app.replaceChildren();const base=steps[state.step];if(!base)return;const s=base.route?{...base,...content.routes.find(route=>route.id===state.routeId)}:base;if(s.canvas&&!s.readonly&&!state.firstSpaceStep){state.firstSpaceStep=s.id;save();}const progress=el('progress',null,{max:String(steps.length),value:String(state.step+1),'aria-label':'Voortgang'});app.append(progress,el('p',`Associatieruimte · ${state.step+1} van ${steps.length}`,{class:'eyebrow'}));const heading=el('h1',s.title,{tabindex:'-1'});app.append(heading);if(s.intro&&s.id!=='finish'){const intro=s.canvas&&!s.readonly&&state.firstSpaceStep===s.id?steps.find(step=>step.id==='space').intro:s.intro;app.append(el('p',intro,{class:'intro'}));}
if(s.id==='research')researchView(app);
if(s.id==='object'){app.append(el('p','Er verschijnt ineens een '+state.objectId+' in je Associatieruimte.',{class:'intro'}));if(state.objectPhase===0)s.fields.forEach(f=>app.append(field(f)));else app.append(el('p','Wil je iets van wat er net ontstond een plek geven in je Associatieruimte?'));canvas(app);if(state.objectPhase===1)collector(app,true,null,true,{keys:s.fields.map(f=>f.key),title:'Dit vulde jij zojuist in:',invitation:false});}
if(s.id==='entry'){const choices=el('div',null,{class:'choices','aria-label':'Kies een ingang'});s.entries.forEach(t=>choices.append(button(t,()=>{state.entryType=t;save();render();},{'aria-pressed':String(state.entryType===t)})));app.append(choices);}
if(s.id==='images'){const gallery=el('div',null,{class:'gallery'});for(const [index,id] of state.imageIds.entries()){const image=content.imagePool.find(image=>image.id===id),number=index+1;const b=button('',()=>{state.selectedImage=id;save();render();},{'aria-pressed':String(state.selectedImage===id),'aria-label':'Kies beeld '+number});b.append(el('img',null,{src:image.src,alt:'Beeld '+number,width:'1024',height:'1024'}),el('span','Beeld '+number));gallery.append(b);}app.append(gallery);}
if(s.id==='arrange'){const changeKey=state.research?.routeId==='standing'&&researchWords().some(a=>a.id===state.research.xId)&&state.research.phase===2?researchAnswerKey(content.researchRoutes.find(route=>route.id==='standing').changeField):state.research?.changeReferenceKey;if(changeKey)app.append(el('p',s.changeInvitation),answerReference(changeKey),el('p',s.changeHint,{class:'intro'}));}
if(s.canvas&&s.id!=='finish'){if(s.readonly){app.append(el('p',content.readonlyCanvas.title,{class:'eyebrow'}),el('p',content.readonlyCanvas.text));}if(!s.readonly&&!state.firstSpaceStep){state.firstSpaceStep=s.id;save();}canvas(app,s.readonly);}
if(s.viewCanvas)canvas(app,true);
if(s.id==='return'){app.append(el('p','Je kwam binnen met:'),el('blockquote',state.originalQuestion));}
if(s.fields && s.id!=='object' && (s.id!=='images'||state.selectedImage!==null))s.fields.forEach(f=>app.append(field(f)));
if(s.collect || (s.canvas&&!s.readonly))collector(app,Boolean(s.canvas),null,true);
if(s.id==='finish'){app.append(el('h2','Hier begon je mee'),el('div',state.originalQuestion,{class:'literal'}),el('h2','Je Associatieruimte'),el('p','Terugblik · niet bewerkbaar',{class:'message'}));canvas(app,true);app.append(el('h2','Wat je zelf meenam'),el('div',state.answers.reflection||'',{class:'literal'}));if(state.answers.newQuestion?.trim())app.append(el('h2','Een vraag die ontstond'),el('div',state.answers.newQuestion,{class:'literal'}));if(s.intro)app.append(el('p',s.intro,{class:'intro'}));for(const item of s.contact??[]){const section=el('section',null,{class:'contact'});section.append(el('h2',item.title),el('p',item.text,{class:'intro'}));const destination=content.contactLinks?.[item.urlKey]??'';if(/^(https?:\/\/|mailto:)/i.test(destination)){section.append(el('a',item.label,{href:destination,class:'contact-link'}));}else{section.append(el('button',item.label,{type:'button',disabled:'','aria-disabled':'true',title:'Deze link is nog niet ingesteld.'}));}app.append(section);}app.append(button('Opnieuw beginnen',reset,{class:'primary'}));}else{const nav=el('nav',null,{class:'navigation','aria-label':'Stappen'});if(state.step>0)nav.append(button('Terug',()=>{if(s.id==='object'&&state.objectPhase>0){state.objectPhase--;save();render();}else if(s.id==='research'&&state.research?.routeId==='dialogue'&&state.research.dialoguePhase>0){state.research.dialoguePhase--;save();render();}else go(-1);}));else nav.append(el('span',''));if(s.id==='research')nav.append(button(state.research?.xId?'Oefening afronden':'Oefening overslaan',()=>go(1)));nav.append(button('Verder',()=>{if(s.id==='research'&&!researchCanContinue())return;if(s.id==='research'&&state.research?.routeId==='dialogue'&&state.research.xId&&state.research.yId&&researchWords().length>=2&&state.research.dialoguePhase<3){state.research.dialoguePhase++;save();render();return;}if(s.id==='object'&&state.objectPhase===0){state.objectPhase++;save();render();return;}if(s.id==='entry'&&(!state.entryType||!state.originalQuestion.trim())){let msg=app.querySelector('.validation');if(!msg){msg=el('p','Kies een ingang en vul in waar het over gaat. Een kort antwoord is genoeg.',{role:'status',class:'validation'});nav.before(msg);}return;}go(1);},{class:'primary'}));app.append(nav);}
}
function go(delta){state.step=availableStep(bound(state.step+delta,0,steps.length-1),delta);save();render();app.querySelector('h1').focus();window.scrollTo({top:0,behavior:'smooth'});}
function migrateFlow(){
 // Merge the old question screens; keep completed collection screens and all answers.
 const objectPhase=Number(state.objectPhase);
 state.objectPhase=state.objectFlowVersion<2?(objectPhase===2?1:0):(objectPhase===1?1:0);
 state.objectFlowVersion=2;
 // Preserve legacy answers, also when their element has since been removed.
 const oldElement=state.associations.find(a=>!a.shape&&a.text===state.selectedElement);
 if(oldElement&&state.flowVersion<2){
  for(const [oldKey,newKey] of [['memory','here'],['memoryDetail','change']]){
   const key='research.standing.'+oldElement.id+'...'+newKey;
   if(typeof state.answers[oldKey]==='string'&&state.answers[key]===undefined)state.answers[key]=state.answers[oldKey];
  }
 }
 if(oldElement&&state.flowVersion<2&&typeof state.answers.memoryDetail==='string'&&state.stepId!=='explore'){
  state.research??={routeId:null,xId:null,yId:null,phase:0,variant:null,reply:false,reverse:false};
  state.research.changeReferenceKey='research.standing.'+oldElement.id+'...change';
 }
 if(state.stepId==='experiment')state.stepId='research';
 if(!state.stepId&&state.flowVersion<2){
  // Sessions predating research used indices without its inserted step.
  const oldIndex=state.step>=4?state.step+1:state.step;
  state.stepId=['entry','imagine','images','space','research','explore','arrange','return','new','finish'][oldIndex];
 }
 if(state.stepId==='explore'){
  state.stepId='research';
  state.research={routeId:'standing',xId:oldElement?.id??null,yId:null,phase:oldElement?2:0,variant:null,reply:false,reverse:false};
 }
 if(!state.stepId&&state.flowVersion===2)state.stepId=['entry','imagine','images','space','research','arrange','return','new','finish'][state.step];
 state.flowVersion=3;
}
fetch('questions.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{content=data;steps=data.steps;migrateFlow();if(state.stepId){const resumed=steps.findIndex(step=>step.id===state.stepId);if(resumed>=0)state.step=resumed;}initialiseChoices();state.step=availableStep(bound(state.step,0,steps.length-1),1);render();}).catch(()=>{app.replaceChildren(el('h1','De vragen konden niet worden geladen'),el('p','Open de app via een lokale webserver: python3 -m http.server 8000. Open daarna http://localhost:8000.'));});
