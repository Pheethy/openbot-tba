// Tests of check-plan.mjs. Run: node --test scripts/test/   (Node 20+, no dependencies)
// Each rule is proven on a mistake that really happened: the retro of RTRCDS-4081 (blank line in a mermaid fence,
// missing sequence diagram, blueprint pattern) and the typos of the team's own example_api_blueprint.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, '..', 'check-plan.mjs');
const exampleFile = path.join(here, '..', '..', 'reference', 'example_api_blueprint.md');

const GOOD_PLAN = [
  '# KEY-1 — Pre-Build Trial', '', '## Sequence', '```mermaid', 'sequenceDiagram', '  participant W as Web', '  participant A as API',
  '  W->>A: GET /career-form/latest', '  A-->>W: 200 พร้อมข้อมูล', '```', '', '## Subtasks ที่เสนอ',
  '- `[HC-MY-CAREER-API-PLANNING]` เพิ่ม endpoint latest', '- `[HC-MY-CAREER-WEB]` ปรับเมนู', '',
].join('\n');
const GOOD_BP = [
  '```', '// ENDPOINT: /career-form/latest/:user_id', '// METHOD: GET', '// SERVICE: hc-my-career-api-planning', '',
  '//RESP:', '{', '  "id": 12, "fiscal_year": 2026, "status": "Launched"', '}', '```', '',
].join('\n');

function run(files, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-plan-'));
  for (const [n, c] of Object.entries(files)) fs.writeFileSync(path.join(dir, n), c);
  const r = spawnSync(process.execPath, [script, dir, '--json', ...extra], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { code: r.status, problems: r.stdout.trim().startsWith('[') ? JSON.parse(r.stdout) : [], raw: r.stdout + r.stderr };
}
const rules = (r) => r.problems.map((p) => p.rule);

test('a correct case passes', () => {
  const r = run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP });
  assert.equal(r.code, 0, r.raw);
  assert.deepEqual(rules(r), []);
});

test('retro 2.4: a plan without a sequence diagram is rejected', () => {
  const r = run({ 'plan.md': GOOD_PLAN.replace('sequenceDiagram', 'flowchart TD') });
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('sequence-required'));
});

test('retro bug 2: a blank line inside a mermaid fence is rejected and the line is named', () => {
  const r = run({ 'plan.md': GOOD_PLAN.replace('  participant A as API', '  participant A as API\n') });
  assert.ok(rules(r).includes('mermaid-blank-line'));
  assert.ok(r.problems.find((p) => p.rule === 'mermaid-blank-line').line > 0);
});

test('retro 2.5: ; # : inside an arrow message are rejected', () => {
  for (const bad of ['GET /x; ok', 'GET /x # ok', 'POST /x: body']) {
    const r = run({ 'plan.md': GOOD_PLAN.replace('GET /career-form/latest', bad) });
    assert.ok(rules(r).includes('mermaid-message-chars'), `not rejected: ${bad}`);
  }
});

test('a blank line inside a non-mermaid fence is allowed (the team blueprint pattern has them)', () => {
  const r = run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP });
  assert.equal(r.code, 0);
});

test('subtask tags must be UPPER CASE', () => {
  const r = run({ 'plan.md': GOOD_PLAN.replace('[HC-MY-CAREER-WEB]', '[hc-my-career-web]') });
  assert.ok(rules(r).includes('subtask-format'));
});

test('blueprint: //RESP must be valid JSON (a missing comma is caught)', () => {
  const r = run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace('"fiscal_year": 2026,', '"fiscal_year": 2026') });
  assert.ok(rules(r).includes('blueprint-resp-json'));
});

test('blueprint: a placeholder //RESP is rejected', () => {
  const r = run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace(/\{[\s\S]*?\n\}/, '{...}') });
  assert.ok(rules(r).includes('blueprint-resp-placeholder'));
});

test('blueprint: METHOD, SERVICE and RESP are required, SERVICE must be a repo name', () => {
  assert.ok(rules(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace('// METHOD: GET\n', '') })).includes('blueprint-method-missing'));
  assert.ok(rules(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace('// METHOD: GET', '// METHOD: FETCH') })).includes('blueprint-method'));
  assert.ok(rules(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace(/\/\/ SERVICE:.*\n/, '') })).includes('blueprint-service-missing'));
  assert.ok(rules(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace('hc-my-career-api-planning', 'Planning API') })).includes('blueprint-service-format'));
  assert.ok(rules(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP.replace(/\/\/RESP:[\s\S]*?\n\}\n/, '') })).includes('blueprint-resp-missing'));
});

test('blueprint: --repo-prefix enforces the repo prefix of the team', () => {
  assert.equal(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP }, ['--repo-prefix', 'hc-my-career-']).code, 0);
  assert.ok(rules(run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': GOOD_BP }, ['--repo-prefix', 'hc-ed-'])).includes('blueprint-service-prefix'));
});

test('a case folder with no plan is rejected', () => {
  assert.ok(rules(run({ 'api-blueprint.md': GOOD_BP })).includes('case-empty'));
});

test('REAL PAST MISTAKE: the typos of the team example blueprint are caught, and the fixed copy passes', () => {
  const raw = fs.readFileSync(exampleFile, 'utf8').replace(/\r\n/g, '\n');
  const bad = run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': raw });
  assert.equal(bad.code, 1, bad.raw);
  assert.ok(rules(bad).includes('blueprint-resp-json'), 'the unclosed [ in the GET response must be caught');
  assert.ok(rules(bad).includes('blueprint-input-json'), 'the missing comma after "user_id" in the POST/PUT body must be caught');
  const fixed = raw
    .replace('"created_at": "2026-01-10 16:09:00"\n}\n}', '"created_at": "2026-01-10 16:09:00"\n}\n]\n}')
    .replaceAll('"user_id": "U00001"\n"file"', '"user_id": "U00001",\n"file"');
  const ok = run({ 'plan.md': GOOD_PLAN, 'api-blueprint.md': fixed });
  assert.equal(ok.code, 0, ok.raw);
});
