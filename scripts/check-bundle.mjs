#!/usr/bin/env node
// Read-only consistency check of the openbot-tba bundle. No dependencies, no network.
//   node scripts/check-bundle.mjs
// Exit code 0 = consistent, 1 = at least one problem.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const bad = (msg) => problems.push(msg);
const readJson = (rel) => {
  try { return JSON.parse(readFileSync(path.join(root, rel), 'utf8')); }
  catch (e) { bad(`${rel}: not valid JSON (${e.message})`); return null; }
};

// --- skills on disk
const skillsDir = path.join(root, 'skills');
const onDisk = readdirSync(skillsDir).filter((n) => statSync(path.join(skillsDir, n)).isDirectory());
const frontmatter = {};
for (const name of onDisk) {
  const file = path.join(skillsDir, name, 'SKILL.md');
  if (!existsSync(file)) { bad(`skills/${name}: SKILL.md missing`); continue; }
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { bad(`skills/${name}/SKILL.md: no frontmatter`); continue; }
  const nm = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  let desc = '';
  const folded = fm[1].match(/^description:\s*>\s*\n((?:[ \t]+.*\n?)+)/m);
  if (folded) desc = folded[1].split('\n').map((s) => s.trim()).filter(Boolean).join(' ');
  else desc = (fm[1].match(/^description:\s*(.+)$/m)?.[1] || '').trim().replace(/^"(.*)"$/, '$1');
  if (nm !== name) bad(`skills/${name}/SKILL.md: name '${nm}' differs from the folder name`);
  if (!desc) bad(`skills/${name}/SKILL.md: description missing`);
  if (desc.length > 500) bad(`skills/${name}/SKILL.md: description is ${desc.length} characters (limit 500)`);
  frontmatter[name] = { descLen: desc.length };
}

// --- catalog
const catalog = readJson('skills/skills.json');
const cataloged = new Set((catalog?.skills || []).map((s) => s.name));
for (const s of catalog?.skills || []) {
  if (!onDisk.includes(s.name)) bad(`skills/skills.json lists '${s.name}' but skills/${s.name} does not exist`);
  for (const k of ['purpose', 'source', 'license']) if (!s[k]) bad(`skills/skills.json: '${s.name}' has no ${k}`);
}
for (const n of onDisk) if (!cataloged.has(n)) bad(`skills/${n} is not listed in skills/skills.json`);

// license status of every skill; --public makes unresolved ones a failure
const publicMode = process.argv.includes('--public');
const okStatus = ['verified', 'self-declared', 'no-license', 'unknown'];
const notForPublic = [];
for (const s of catalog?.skills || []) {
  if (!okStatus.includes(s.licenseStatus)) { bad(`skills/skills.json: '${s.name}' needs licenseStatus (${okStatus.join(' | ')})`); continue; }
  if (s.licenseStatus === 'verified' && /Apache|MIT, Copyright/.test(s.license || '')) {
    const refs = path.join(skillsDir, s.name, 'references');
    const hasLicense = existsSync(refs) && readdirSync(refs).some((f) => /licen[sc]e/i.test(f));
    if (!hasLicense) bad(`skills/${s.name}: license is "verified" but no LICENSE file is in skills/${s.name}/references/`);
  }
  if (s.licenseStatus === 'no-license' || s.licenseStatus === 'unknown') notForPublic.push(s);
}
if (publicMode) for (const s of notForPublic) bad(`--public: skill '${s.name}' has no license (${s.licenseStatus}); do not publish it without the author's permission`);

// --- agents
const agents = readJson('agents/agents.json')?.agents || [];
const keys = new Set();
const used = new Set();
for (const a of agents) {
  for (const f of ['key', 'name', 'title', 'description', 'initialMessage']) if (!a[f]) bad(`agents.json: an agent has no ${f} (${a.key || a.name || '?'})`);
  if (keys.has(a.key)) bad(`agents.json: duplicate key '${a.key}'`);
  keys.add(a.key);
  if (!Array.isArray(a.skills) || a.skills.length === 0) { bad(`agents.json: '${a.key}' must list its skills explicitly (field 'skills')`); continue; }
  for (const s of a.skills) {
    used.add(s);
    if (!onDisk.includes(s)) bad(`agents.json: '${a.key}' needs skill '${s}' but skills/${s} does not exist`);
  }
  if (!a.skills.includes('caveman')) bad(`agents.json: '${a.key}' has no 'caveman' (all TBA agents speak the short Thai style)`);
}
for (const n of onDisk) if (!used.has(n)) bad(`skills/${n} is not used by any agent`);

// --- workflows
const wfDir = path.join(root, 'workflows');
for (const file of readdirSync(wfDir).filter((f) => f.endsWith('.json'))) {
  const wf = readJson(`workflows/${file}`);
  if (!wf) continue;
  const refs = new Set(wf.nodes.map((n) => n.ref));
  for (const n of wf.nodes) {
    if (n.agentKey && !keys.has(n.agentKey)) bad(`workflows/${file}: node '${n.ref}' uses unknown agentKey '${n.agentKey}'`);
    if (n.kind === 'agent' && !n.agentKey) bad(`workflows/${file}: agent node '${n.ref}' has no agentKey`);
    if (n.from && !refs.has(n.from)) bad(`workflows/${file}: node '${n.ref}' comes from unknown node '${n.from}'`);
    const src = wf.nodes.find((x) => x.ref === n.from);
    if (n.branch && src?.kind !== 'condition') bad(`workflows/${file}: node '${n.ref}' has a branch but '${n.from}' is not a condition`);
    if (src?.kind === 'condition' && !n.branch) bad(`workflows/${file}: node '${n.ref}' follows condition '${n.from}' without a branch`);
  }
}

// --- nothing private in the bundle
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.name === '.git') return [];
  return e.isDirectory() ? walk(p) : [p];
});
const patterns = [
  [/ATATT[A-Za-z0-9_-]{10,}/, 'Atlassian API token'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/C:\\Users\\[A-Za-z0-9._-]+\\/, 'a local Windows user path'],
];
for (const file of walk(root)) {
  if (!/\.(md|json|mjs|txt|js)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const [re, label] of patterns) if (re.test(text)) bad(`${path.relative(root, file)}: looks like ${label}`);
}

// --- report
console.log('Agent x skills');
for (const a of agents) console.log(`  ${(a.name || a.key).padEnd(16)} ${(a.skills || []).join(', ')}`);
console.log(`Skills on disk: ${onDisk.join(', ')}`);
console.log('License status');
for (const s of catalog?.skills || []) console.log(`  ${s.name.padEnd(18)} ${s.licenseStatus || '?'}`);
if (!publicMode && notForPublic.length) console.log(`  (not ready for a public repo: ${notForPublic.map((s) => s.name).join(', ')}. Run with --public to enforce.)`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('\nOK: agents, skills, catalog and workflows are consistent; no secret patterns found.');
