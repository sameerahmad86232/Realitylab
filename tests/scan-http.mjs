// Exercise the built Next.js route over HTTP. Mocked route handlers miss NextRequest proxies.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {readScanResponse} from '../lib/scan-stream.ts';
const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,BASETEN_API_KEY:'test-only-never-sent',APP_ORIGIN:origin,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let diagnostics='';child.stderr.on('data',data=>{diagnostics+=String(data)});
try {
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Next server did not start: '+diagnostics)),15000);
  child.stdout.on('data',data=>{if(String(data).includes('Ready in')){clearTimeout(timer);resolve()}});
  child.once('exit',code=>{clearTimeout(timer);reject(Error(`Next server exited ${code}: ${diagnostics}`))});
 });
 for(const accept of ['application/json','application/x-ndjson']) {
  const form=new FormData();form.set('consent','false');
  const response=await fetch(origin+'/api/scan',{method:'POST',headers:{Origin:origin,Accept:accept},body:form,signal:AbortSignal.timeout(10000)});
  assert.match(response.headers.get('content-type')||'',accept==='application/json'?/application\/json/:/application\/x-ndjson/);
  const events=[];
  await assert.rejects(readScanResponse(response,event=>events.push(event)),/Consent to send/);
  if(accept==='application/x-ndjson') {
   assert.equal(response.status,200);
   assert.ok(events.some(event=>event.stage==='validation'&&event.status==='failed'));
   assert.equal(events.some(event=>event.stage==='analysis'&&event.status==='running'),false);
  } else assert.equal(response.status,400);
 }
 assert.doesNotMatch(diagnostics,/Cannot read private member/);
 console.log('PASS: built Next.js HTTP JSON and NDJSON routes preserve upload validation and readable errors; no provider call.');
} finally {
 const exited=once(child,'exit');child.kill();await exited;
}
