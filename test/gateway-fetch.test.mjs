import assert from 'node:assert/strict';
import test from 'node:test';
import { createGatewayFetch } from '../scripts/gateway-fetch.mjs';

function harness(responses, options = {}) {
  let clock = Date.parse('2026-10-06T00:00:00Z');
  const calls = [];
  const waits = [];
  const warnings = [];
  const fetch = createGatewayFetch({
    now: () => clock,
    sleep: async (ms) => { waits.push(ms); clock += ms; },
    fetchImpl: async (input, init) => {
      calls.push({ time: clock, input, init });
      const response = responses.shift();
      if (!response) throw new Error('Unexpected extra request');
      return response;
    },
    warn: (message) => warnings.push(message),
    ...options,
  });
  return { fetch, calls, waits, warnings };
}
const ok = () => new Response('{}', { status: 200 });
const limited = (headers = {}) => new Response('limited', { status: 429, headers });

test('paces concurrent initialization and tool requests through one queue', async () => {
  const h = harness([ok(), ok(), ok()]);
  await Promise.all([h.fetch('init'), h.fetch('list'), h.fetch('tool')]);
  assert.deepEqual(h.calls.map((c) => c.input), ['init', 'list', 'tool']);
  assert.deepEqual(h.waits, [1500, 1500]);
});

test('retries HTTP 429 after Retry-After and preserves the request', async () => {
  const response = limited({ 'Retry-After': '12' });
  const h = harness([response, ok()]);
  const init = { method: 'POST', body: '{"name":"country_report_context"}' };
  assert.equal((await h.fetch('gateway', init)).status, 200);
  assert.deepEqual(h.waits, [12000]);
  assert.equal(h.calls[1].init, init);
  assert.equal(response.bodyUsed, true);
  assert.equal(h.warnings.length, 1);
});

test('honors HTTP-date Retry-After and backs off without a valid header', async () => {
  const h = harness([
    limited({ 'Retry-After': 'Tue, 06 Oct 2026 00:00:20 GMT' }),
    limited({ 'Retry-After': 'invalid' }), ok(),
  ]);
  assert.equal((await h.fetch('gateway')).status, 200);
  assert.deepEqual(h.waits, [20000, 120000]);
});

test('shares a bounded retry budget across all tools', async () => {
  const h = harness([limited(), ok(), limited(), limited()], { retryBudget: 1 });
  assert.equal((await h.fetch('first')).status, 200);
  assert.equal((await h.fetch('second')).status, 429);
  assert.equal((await h.fetch('third')).status, 429);
  assert.equal(h.warnings.length, 1);
});

test('does not retry early for hourly quotas', async () => {
  const h = harness([limited({ 'Retry-After': '3600' })]);
  assert.equal((await h.fetch('gateway')).status, 429);
  assert.deepEqual(h.waits, []);
});

test('preserves policy blocks and authentication failures without retrying', async () => {
  const block = { isError: true, content: [{type: 'text', text: '{"code":"PUBLIC_RESPONSE_BLOCKED"}'}] };
  const h = harness([new Response(JSON.stringify(block)), new Response('', {status: 403})]);
  assert.deepEqual(await (await h.fetch('policy')).json(), block);
  assert.equal((await h.fetch('auth')).status, 403);
  assert.equal(h.calls.length, 2);
  assert.equal(h.warnings.length, 0);
});

test('an aborted request does not reach the gateway or poison the queue', async () => {
  const h = harness([ok()]);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(h.fetch('aborted', {signal: controller.signal}), {name: 'AbortError'});
  assert.equal((await h.fetch('next')).status, 200);
  assert.equal(h.calls.length, 1);
});
