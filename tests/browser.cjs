// Optional real-browser check: install Playwright and Chromium in the test environment.
// No dependency or external request is added to the app.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const target=file===root+path.sep?path.join(root,'index.html'):file;fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp'})[path.extname(target)]||'application/octet-stream');res.end(data);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch();const url=`http://127.0.0.1:${server.address().port}/index.html`;
 for(const mobile of [false,true])for(const routeIndex of [0,1,2]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile});
  await context.addInitScript(i=>{Math.random=()=> (i+.1)/3;},routeIndex);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  const snapshot=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('associatieruimte.v01'));return {routeId:s.routeId,imageIds:s.imageIds};});
  await page.getByRole('button',{name:'Ik zit ergens mee',exact:true}).click();const choices=await snapshot();
  await page.getByRole('textbox',{name:'Waar gaat het over?',exact:true}).fill('Een eigen vraag');await page.getByRole('button',{name:'Verder',exact:true}).click();
  await page.locator('textarea').first().fill('Antwoord dat niet wordt verzameld');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('associatieruimte.v01')).associations.length),0);
  await page.getByRole('textbox',{name:'Nieuw woord of korte zin',exact:true}).fill('testwoord');
  await page.getByLabel('Kleur voor nieuw woord of korte zin',{exact:true}).evaluate(n=>{n.value='#8844aa';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.getByRole('button',{name:'Toevoegen',exact:true}).click();assert.equal(await page.locator('.cloud-word').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(136, 68, 170)');
  await page.getByRole('button',{name:'Verder',exact:true}).click();assert.equal(await page.locator('.gallery img').count(),3);const src=await page.locator('.gallery img').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));assert(src.every(s=>s.startsWith('images/candidates/')));for(const img of await page.locator('.gallery img').all())await img.evaluate(n=>n.decode());
  await page.reload();assert.deepEqual(await snapshot(),choices);await page.getByRole('button',{name:'Terug',exact:true}).click();await page.getByRole('button',{name:'Verder',exact:true}).click();assert.deepEqual(await page.locator('.gallery img').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src'))),src);
  await page.getByRole('button',{name:'Verder',exact:true}).click();const word=page.locator('.canvas .word');await word.scrollIntoViewIfNeeded();assert.equal(await word.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(136, 68, 170)');
  const bounds=await word.boundingBox(),start={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  if(mobile){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+40,y:start.y+30}]});assert((await word.boundingBox()).x>bounds.x+10);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();assert.equal(await word.getAttribute('aria-pressed'),'true');await page.mouse.move(start.x+80,start.y+40,{steps:5});assert((await word.boundingBox()).x>bounds.x+20,'Visible movement while pointer remains down');await page.mouse.up();}
  await word.click();const font=await word.evaluate(n=>parseFloat(getComputedStyle(n).fontSize));await page.getByRole('button',{name:'Groter',exact:true}).click();assert(await word.evaluate(n=>parseFloat(getComputedStyle(n).fontSize))>font);await page.getByRole('button',{name:'Kleiner',exact:true}).click();
  await page.getByLabel('Kleur van geselecteerd element',{exact:true}).evaluate(n=>{n.value='#112233';n.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await word.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(17, 34, 51)');assert.equal(await page.getByRole('button',{name:/Cirkel toevoegen|Rechthoek toevoegen|Kleurvlek toevoegen/}).count(),0);
  await page.getByRole('button',{name:'Verwijderen',exact:true}).click();assert.equal(await page.locator('.canvas .word').count(),0);
  await page.getByRole('button',{name:'Verder',exact:true}).click();await page.getByRole('heading',{name:'Terug naar je beginvraag',exact:true}).waitFor();await page.getByRole('button',{name:'Verder',exact:true}).click();await page.getByRole('button',{name:'Verder',exact:true}).click();assert.equal(await page.getByRole('link',{name:'Kennismaken',exact:true}).getAttribute('href'),'https://www.jekerntotbloei.nl/afspraak-maken');assert.equal(await page.getByRole('link',{name:'Deel je ervaring met mij',exact:true}).getAttribute('href'),'mailto:info@jekerntotbloei.nl?subject=Mijn%20ervaring%20met%20de%20Associatieruimte');
  await page.getByRole('button',{name:'Opnieuw beginnen',exact:true}).click();const next=await snapshot();assert.notEqual(next.routeId,choices.routeId);assert.notEqual([...next.imageIds].sort().join('|'),[...choices.imageIds].sort().join('|'));assert.deepEqual(errors,[]);await context.close();console.log(`PASS real browser: ${mobile?'touch':'mouse'}, route ${routeIndex}`);
 }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
