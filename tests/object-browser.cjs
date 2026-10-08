// Optional real Chromium checks; install Playwright + Chromium in the test environment.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),key='associatieruimte.v01';
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({args:['--no-sandbox']});const url=`http://127.0.0.1:${server.address().port}/index.html`;
 for(const mobile of [false,true])for(const filled of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile});
  await context.addInitScript(()=>{if(!localStorage.getItem('associatieruimte.v01'))localStorage.setItem('associatieruimte.v01',JSON.stringify({stepId:'object',flowVersion:3,objectId:'touw',objectPhase:0,originalQuestion:'Vraag',answers:{},associations:[{id:'keep',text:'energie',x:30,y:40,size:1.3,color:'#123456'}],routeId:'animal',imageIds:['image-01','image-02','image-03']}));});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByRole('heading',{name:'Nog één ding…',exact:true}).waitFor();
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('associatieruimte.v01')));
  const check=async phase=>{const s=await state();assert.equal(s.objectPhase,phase);assert.equal(s.stepId,'object');assert.equal(s.objectId,'touw');assert.equal(s.associations.length,1);await page.locator('.canvas .word[data-id="keep"]').waitFor({state:'visible'});};
  for(const phase of [0,1,2]){
   await check(phase);
   if(phase===1){assert.equal(await page.locator('.object-action-reference p').textContent(),'Wat zou je ermee doen?');assert.equal(await page.locator('.object-action-reference div').textContent(),(await state()).answers.objectAction??'');assert.equal(await page.locator('.object-action-reference textarea').count(),0);}
   if(phase<2){assert.equal(await page.locator('textarea').count(),1);if(filled)await page.locator('textarea').fill(phase===0?'  Mijn actie $& <b>\n  ':'  Mijn beeld\n  ');await check(phase);}
   else{assert.equal(await page.locator('textarea').count(),0);await page.getByText('Wil je iets van wat er net ontstond een plek geven in je Associatieruimte?',{exact:true}).waitFor();assert.equal(await page.locator('.answer-chip-text').count(),filled?2:0);}
   const before=await state();await page.reload();await page.getByRole('heading',{name:'Nog één ding…',exact:true}).waitFor();await check(phase);assert.deepEqual((await state()).answers,before.answers);if(phase<2)assert.equal(await page.locator('textarea').inputValue(),before.answers[phase===0?'objectAction':'objectView']??'');if(phase===1)assert.equal(await page.locator('.object-action-reference div').textContent(),before.answers.objectAction??'');
   await page.getByRole('button',{name:'Verder',exact:true}).click();
  }
  await page.getByRole('heading',{name:'Terug naar je beginvraag',exact:true}).waitFor();await page.getByRole('button',{name:'Terug',exact:true}).click();await check(2);await page.getByRole('button',{name:'Terug',exact:true}).click();await check(1);await page.getByRole('button',{name:'Terug',exact:true}).click();await check(0);assert.deepEqual(errors,[]);await context.close();console.log(`PASS Chromium object: ${mobile?'mobile':'desktop'}, ${filled?'filled':'empty'} phases 0/1/2, typing, refresh, back, words`);
 }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
