// Optional Chromium regression test. No browser dependency is added to the app.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),key='associatieruimte.v01';
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({args:['--no-sandbox']});const url=`http://127.0.0.1:${server.address().port}/index.html`;
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile});
  await context.addInitScript(()=>{if(!localStorage.getItem('associatieruimte.v01'))localStorage.setItem('associatieruimte.v01',JSON.stringify({stepId:'imagine',flowVersion:3,originalQuestion:'Vraag',answers:{},associations:[],routeId:'animal',imageIds:['image-01','image-02','image-03']}));});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByRole('heading',{name:'Laat een beeld verschijnen'}).waitFor();
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('associatieruimte.v01')));
  const add=async text=>{await page.getByRole('textbox',{name:'Nieuw woord of korte zin',exact:true}).fill(text);await page.getByRole('button',{name:'Toevoegen',exact:true}).click();};
  const next=()=>page.getByRole('button',{name:'Verder',exact:true}).click();
  for(const text of ['energie','vrijheid','op en neer hoppen','Stroming/beweging'])await add(text);
  const initial=(await state()).associations.map(a=>a.id);let checks=0;
  const check=async()=>{const st=await state();for(const id of initial)assert(st.associations.some(a=>a.id===id));if(await page.locator('.canvas').count())for(const id of initial)await page.locator(`.canvas .word[data-id="${id}"]`).waitFor({state:'visible'});checks++;};
  await next();await next();await check();
  // Actual rendered boxes must not overlap after these four additions.
  const boxes=await page.locator('.canvas .word').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(Math.min(a.r,b.r)>Math.max(a.l,b.l)&&Math.min(a.b,b.b)>Math.max(a.t,b.t)),'Initial words overlap');}
  await next();await page.getByRole('button',{name:'Twee woorden laten spreken',exact:true}).click();await page.locator('select').selectOption(initial[0]);assert.equal(await page.locator('textarea').count(),0);await page.locator('select').selectOption(initial[1]);assert.equal(await page.locator('select').count(),0);assert.equal((await state()).activeId,null);await check();
  const word=page.locator(`.canvas .word[data-id="${initial[0]}"]`);await word.scrollIntoViewIfNeeded();const bounds=await word.boundingBox(),start={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  if(mobile){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+40,y:start.y+20}]});assert((await word.boundingBox()).x>bounds.x+10);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();assert.equal(await word.getAttribute('aria-pressed'),'true');await page.mouse.move(start.x+60,start.y+20,{steps:5});assert((await word.boundingBox()).x>bounds.x+20);await page.mouse.up();}
  await word.click();const font=await word.evaluate(n=>parseFloat(getComputedStyle(n).fontSize));await page.getByRole('button',{name:'Groter',exact:true}).click();assert(await word.evaluate(n=>parseFloat(getComputedStyle(n).fontSize))>font);await page.getByRole('button',{name:'Kleiner',exact:true}).click();await page.getByLabel('Kleur van geselecteerd element',{exact:true}).evaluate(n=>{n.value='#112233';n.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal((await state()).associations[0].color,'#112233');
  for(const answer of ['Ervaring X','Kijken naar Y','Uitspraak X','Antwoord Y']){await page.locator('textarea').fill(answer);await check();if(answer==='Antwoord Y'){await add('nieuw in gesprek');await page.reload();assert.equal(await page.locator('textarea').inputValue(),answer);await check();}await next();}
  await page.getByRole('heading',{name:'Kijk opnieuw naar je ruimte',exact:true}).waitFor();await check();await page.getByRole('button',{name:'Terug',exact:true}).click();assert.equal(await page.locator('textarea').inputValue(),'Antwoord Y');await next();await next();await check();await page.locator('textarea').fill('Mijn actie');await next();await page.locator('textarea').fill('Mijn verbeelding');await next();await add('nieuw bij voorwerp');await check();await next();await check();await next();await next();await check();await page.reload();await check();assert.equal((await state()).associations.length,6);
  // Real second tab: its older state cannot overwrite or reset the newer session.
  const other=await context.newPage();await other.goto(url);await other.getByRole('heading',{name:'Dit ontstond er onderweg'}).waitFor();await page.getByRole('button',{name:'Opnieuw beginnen',exact:true}).click();const newer=await state();await other.getByRole('button',{name:'Opnieuw beginnen',exact:true}).click();assert.deepEqual(await state(),newer);assert((await other.locator('#storage-notice').textContent()).includes('ander tabblad'));
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS Chromium ${mobile?'touch/mobile':'mouse/desktop'}: ${checks} preservation checks, fixed dialogue, boxes, controls, reload, object and stale tab`);
 }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
