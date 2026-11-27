#!/usr/bin/env node
// Lints a TBA case (plan.md, fix-plan.md, sequence.md, api-blueprint.md) against the team conventions of
// OPENBOT-ADAPTATION.md, so that a rule is enforced by a check instead of by a sentence an agent can skip.
//
//   node check-plan.mjs <case-dir | file ...> [--repo-prefix hc-my-career-] [--json]
//
// A case dir is .tba/cases/<KEY>. Exit codes: 0 clean | 1 problems found | 2 bad usage.
// Every message names the file, the line, the rule id and the fix. No dependencies.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const pIdx = args.indexOf('--repo-prefix');
const prefix = pIdx >= 0 ? (args[pIdx + 1] || '') : '';
const targets = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--repo-prefix');
if (!targets.length) { console.error('usage: node check-plan.mjs <case-dir | file ...> [--repo-prefix <prefix>] [--json]'); process.exit(2); }

const problems = [];
const add = (file, line, rule, message, fix) => problems.push({ file, line, rule, message, fix });
const read = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');

// ---- fenced code blocks
function fences(text) {
  const out = []; let cur = null;
  text.split('\n').forEach((l, i) => {
    const m = /^\s*```(\S*)\s*$/.exec(l);
    if (m) {
      if (cur) { cur.end = i + 1; out.push(cur); cur = null; }
      else cur = { lang: m[1].toLowerCase(), start: i + 1, body: [] };
    } else if (cur) cur.body.push({ text: l, line: i + 1 });
  });
  if (cur) out.push({ ...cur, end: -1, unclosed: true });
  return out;
}

// ---- mermaid
function checkMermaid(file, text, { requireSequence }) {
  const mer = fences(text).filter((f) => f.lang === 'mermaid');
  if (requireSequence && !mer.some((f) => f.body.some((b) => /^\s*sequenceDiagram\b/.test(b.text)))) {
    add(file, 1, 'sequence-required', 'there is no mermaid block that starts a sequenceDiagram', 'add a ```mermaid block with sequenceDiagram: user, web, API, DB (the main card always needs one)');
  }
  for (const f of mer) {
    if (f.unclosed) add(file, f.start, 'mermaid-unclosed', 'a mermaid fence is never closed', 'close it with ```');
    for (const b of f.body) {
      if (b.text.trim() === '') add(file, b.line, 'mermaid-blank-line', 'blank line inside a mermaid fence', 'remove the blank line: the Jira converter cuts the diagram into paragraphs there');
      const m = /(?:-->>|->>|--x|-x|--\)|-\))\s*[^:\n]+:\s*(.*)$/.exec(b.text);
      if (m && /[;#:]/.test(m[1])) add(file, b.line, 'mermaid-message-chars', "the message text of an arrow contains ';', '#' or ':'", "rewrite the message without ; # or : (the mermaid parser breaks on them)");
    }
  }
}

// ---- API blueprint
const METHODS = /^(GET|POST|PUT|PATCH|DELETE)$/;
const junk = (l) => /^\s*(-{3,}|```.*)\s*$/.test(l) || /EXAMPLE\s*-{3,}\s*$/.test(l);

function loose(src) {   // request side: Go types such as *multipart.FileHeader are allowed as bare values
  return src.replace(/(:\s*)(\*?[A-Za-z_][\w.[\]*]*)(?=\s*(?:,|}|\n|$))/g, (m, a, tok) => (/^(true|false|null)$/.test(tok) ? m : `${a}"<go-type>"`));
}

function checkBlueprint(file, text) {
  const lines = text.split('\n');
  const starts = [];
  lines.forEach((l, i) => { if (/^\s*\/\/\s*ENDPOINT\s*:/.test(l)) starts.push(i); });
  if (!starts.length) { add(file, 1, 'blueprint-empty', 'no "// ENDPOINT:" block found', 'write every endpoint as // ENDPOINT, // METHOD, // SERVICE, then //RESP (see reference/example_api_blueprint.md)'); return; }
  starts.forEach((s, bi) => {
    const e = bi + 1 < starts.length ? starts[bi + 1] : lines.length;
    const block = lines.slice(s, e);
    const field = (name) => {
      const idx = block.findIndex((l) => new RegExp(`^\\s*//\\s*${name}\\s*:`).test(l));
      return idx < 0 ? null : { v: block[idx].replace(/^[^:]*:/, '').trim(), line: s + idx + 1, idx };
    };
    const ep = field('ENDPOINT'); const me = field('METHOD'); const sv = field('SERVICE');
    const where = `${me?.v || '?'} ${ep.v}`;
    if (!ep.v.startsWith('/')) add(file, ep.line, 'blueprint-endpoint', `ENDPOINT "${ep.v}" does not start with /`, 'write the path as /resource/:id');
    if (!me) add(file, s + 1, 'blueprint-method-missing', `${where}: no // METHOD line`, 'add // METHOD: GET|POST|PUT|PATCH|DELETE');
    else if (!METHODS.test(me.v)) add(file, me.line, 'blueprint-method', `${where}: METHOD "${me.v}" is not GET, POST, PUT, PATCH or DELETE`, 'use one of the five methods in upper case');
    if (!sv) add(file, s + 1, 'blueprint-service-missing', `${where}: no // SERVICE line`, 'add // SERVICE: <repo folder name> so the blueprint can go to the right backend subtask');
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(sv.v)) add(file, sv.line, 'blueprint-service-format', `${where}: SERVICE "${sv.v}" is not a repo folder name`, 'use the lower-case repo name, for example hc-my-career-api-planning');
    else if (prefix && !sv.v.startsWith(prefix)) add(file, sv.line, 'blueprint-service-prefix', `${where}: SERVICE "${sv.v}" does not start with the repo prefix "${prefix}"`, 'use a repo name of this team (see TEAM-PROFILE.md)');

    const iResp = block.findIndex((l) => /^\s*\/\/\s*RESP\s*:/.test(l));
    const iIn = block.findIndex((l) => /^\s*\/\/\s*(QUERYPARAMS|BODY|REQ)\b/.test(l));
    const tail = (from, to) => block.slice(from, to).filter((l) => !junk(l)).join('\n').trim();

    if (iIn >= 0) {
      const src = tail(iIn + 1, iResp >= 0 && iResp > iIn ? iResp : block.length);
      if (src) { try { JSON.parse(loose(src)); } catch (err) { add(file, s + iIn + 1, 'blueprint-input-json', `${where}: the request part is not valid JSON (${err.message})`, 'fix the commas and brackets; a Go type such as *multipart.FileHeader is allowed as a bare value'); } }
    }
    if (iResp < 0) { add(file, s + 1, 'blueprint-resp-missing', `${where}: no //RESP section`, 'add //RESP: with a realistic JSON example read from the real entity'); return; }
    const src = tail(iResp + 1, block.length);
    if (!src) { add(file, s + iResp + 1, 'blueprint-resp-empty', `${where}: //RESP is empty`, 'write the JSON the endpoint returns'); return; }
    if (/^\{\s*(\.\.\.|…)\s*\}$/.test(src) || /(^|[:,\[]\s*)(\.\.\.|…)(\s*[,\]}]|$)/.test(src)) { add(file, s + iResp + 1, 'blueprint-resp-placeholder', `${where}: //RESP is a placeholder`, 'write a realistic example with the field names of the real struct (read the entity in the repo)'); return; }
    try { JSON.parse(src); } catch (err) { add(file, s + iResp + 1, 'blueprint-resp-json', `${where}: //RESP is not valid JSON (${err.message})`, 'fix the commas and brackets so that JSON.parse accepts it'); }
  });
}

// ---- plan.md subtasks
function checkSubtasks(file, text) {
  const lines = text.split('\n');
  const h = lines.findIndex((l) => /^#{2,3}\s+.*subtask/i.test(l));
  if (h < 0) { add(file, 1, 'subtasks-missing', 'there is no "Subtasks" section', 'add the section with one item per proposed subtask: [REPO-NAME-UPPERCASE] Title'); return; }
  for (let i = h + 1; i < lines.length && !/^#{1,3}\s/.test(lines[i]); i++) {
    const m = /^\s*(?:[-*]|\d+[.)])\s+(.*)$/.exec(lines[i]);
    if (!m) continue;
    if (!/^`?\[[A-Z0-9][A-Z0-9-]*\]`?\s+\S/.test(m[1])) add(file, i + 1, 'subtask-format', `subtask "${m[1].slice(0, 60)}" does not start with an UPPER-CASE [REPO-NAME] tag`, 'write [HC-MY-CAREER-WEB] Title (upper case, one repo per subtask)');
  }
}

// ---- dispatch
function checkFile(file) {
  const name = path.basename(file).toLowerCase();
  const text = read(file);
  if (/blueprint/.test(name)) return checkBlueprint(file, text);
  if (name === 'plan.md') { checkMermaid(file, text, { requireSequence: true }); return checkSubtasks(file, text); }
  if (name === 'sequence.md') return checkMermaid(file, text, { requireSequence: true });
  return checkMermaid(file, text, { requireSequence: false });
}

for (const t of targets) {
  if (!fs.existsSync(t)) { console.error(`not found: ${t}`); process.exit(2); }
  if (fs.statSync(t).isDirectory()) {
    const names = ['plan.md', 'fix-plan.md', 'sequence.md', 'api-blueprint.md'].filter((n) => fs.existsSync(path.join(t, n)));
    if (!names.some((n) => n === 'plan.md' || n === 'fix-plan.md')) { add(t, 0, 'case-empty', 'the case folder has neither plan.md nor fix-plan.md', 'write the plan first'); continue; }
    for (const n of names) checkFile(path.join(t, n));
  } else checkFile(t);
}

if (asJson) console.log(JSON.stringify(problems, null, 2));
else if (!problems.length) console.log('OK: no problems found');
else {
  for (const p of problems) console.log(`${p.file}:${p.line}: [${p.rule}] ${p.message}. Fix: ${p.fix}`);
  console.log(`\n${problems.length} problem(s)`);
}
process.exit(problems.length ? 1 : 0);
