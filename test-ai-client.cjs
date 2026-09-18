const assert = require('node:assert/strict');
const { test } = require('node:test');
process.env.AI_SERVICE_URL = 'https://queue.example.test/api/ai-service';
process.env.AI_WEBSITE_KEY = 'website-test';
const { complete } = require('./ai-client.cjs');
test('server bridge forwards history and retrieves result with scoped key', async () => {
  const calls = [];
  const transport = async (url, opts) => {
    calls.push({ url, opts });
    return { ok:true, json:async () => calls.length === 1 ? {id:'job-1'} : {status:'done', result:{text:'Bonjour'}} };
  };
  const messages = [{role:'user',content:'Cours anglais ?'}];
  assert.equal(await complete(messages, 'Consigne', transport), 'Bonjour');
  assert.deepEqual(JSON.parse(calls[0].opts.body), {messages,system:'Consigne'});
  assert.equal(calls[0].opts.headers['X-AI-Website-Key'],'website-test');
  assert.equal(calls[1].url,'https://queue.example.test/api/ai-service/jobs/job-1');
});
test('worker failure returns error without provider fallback', async () => {
  let n=0;
  const transport=async () => ({ok:true,json:async () => ++n === 1 ? {id:'job-1'} : {status:'failed'}});
  await assert.rejects(complete([{role:'user',content:'x'}], '', transport), /indisponible/);
  assert.equal(n,2);
});
