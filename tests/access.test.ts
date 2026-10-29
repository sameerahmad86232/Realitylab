import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { ACCESS_COOKIE, accessStatus, assertPaidAccess, newSession, validAccessCode, validSession } from "../lib/server/access.ts";
import { durableQuotaConfiguration, reserveDurableInferenceBudget } from "../lib/server/limits.ts";
import { ScanError } from "../lib/server/provider.ts";

const saved = {
  accessCode: process.env.REALITYLAB_ACCESS_CODE,
  sessionSecret: process.env.REALITYLAB_SESSION_SECRET,
  required: process.env.DURABLE_QUOTA_REQUIRED,
  nodeEnv: process.env.NODE_ENV,
};
afterEach(() => {
  const keys = {accessCode:"REALITYLAB_ACCESS_CODE",sessionSecret:"REALITYLAB_SESSION_SECRET",required:"DURABLE_QUOTA_REQUIRED",nodeEnv:"NODE_ENV"};
  for (const [name,key] of Object.entries(keys)) {
    const value = saved[name as keyof typeof saved];
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
test("private session uses constant-time passcode matching and expires", () => {
  process.env.REALITYLAB_ACCESS_CODE = "change-me-very-long-test-only-123";
  process.env.REALITYLAB_SESSION_SECRET = "separate-key-for-tests-not-a-real-secret-123456";
  const t = 1_800_000_000_000;
  assert.equal(validAccessCode(process.env.REALITYLAB_ACCESS_CODE),true);
  assert.equal(validAccessCode("incorrect"),false);
  const session=newSession(t);
  assert.equal(validSession(session.value,t),true);
  assert.equal(validSession(session.value,t+8*3600*1000+1000),false);
  assert.equal(validSession(session.value.slice(0,-1)+"0",t),false);
  const req = new Request("http://localhost/api/scan",{headers:{cookie:ACCESS_COOKIE+"="+session.value}});
  assert.throws(()=>assertPaidAccess(req),(e)=>e instanceof ScanError&&e.status===401);
});
test("production denies paid inference without private session and shared store",async()=>{
  process.env.NODE_ENV="production";
  delete process.env.REALITYLAB_ACCESS_CODE;
  delete process.env.REALITYLAB_SESSION_SECRET;
  delete process.env.DURABLE_QUOTA_REQUIRED;
  assert.deepEqual(accessStatus(),{configured:false,restricted:true});
  assert.throws(()=>assertPaidAccess(new Request("http://localhost/api/scan")),(e)=>e instanceof ScanError&&e.status===503);
  assert.equal(durableQuotaConfiguration().required,true);
  await assert.rejects(reserveDurableInferenceBudget(),(e)=>e instanceof ScanError&&e.status===503);
});
test("authenticated paid requests require a valid signed HTTP-only session",()=>{
  process.env.REALITYLAB_ACCESS_CODE="demo-code-is-long-enough-123";
  process.env.REALITYLAB_SESSION_SECRET="separate-demo-signing-key-long-enough-123";
  const req=new Request("http://localhost/api/scan",{headers:{cookie:ACCESS_COOKIE+"="+newSession().value}});
  assert.doesNotThrow(()=>assertPaidAccess(req));
  assert.throws(()=>assertPaidAccess(new Request("http://localhost/api/scan")),(e)=>e instanceof ScanError&&e.status===401);
  process.env.REALITYLAB_SESSION_SECRET="rotated-different-key-long-enough-1234567";
  assert.throws(()=>assertPaidAccess(req),(e)=>e instanceof ScanError&&e.status===401);
});
