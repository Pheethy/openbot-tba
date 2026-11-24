#!/usr/bin/env node
// TBA — map [REPO-NAME] tag from subtask title to absolute repo path.
//
// Rules:
//   1. Extract "[FOO-BAR-BAZ] rest of title" → "foo-bar-baz"
//   2. Lowercase, trim.
//   3. Strip trailing "-db" → use counterpart repo (DB tag lives with its API repo)
//   4. Resolve <workspace.root>/<name>
//   5. Verify directory exists. If not, suggest nearest matches.
//
// CLI:
//   node repo-map.mjs "[HC-MY-CAREER-API-EMPLOYEE] Create user API"
//   node repo-map.mjs "[HC-MY-CAREER-API-EMPLOYEE-DB] Add table"
//   node repo-map.mjs list

import { loadConfig } from './config.mjs';
import { readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

const TAG_RE = /^\s*\[([A-Z0-9][A-Z0-9-]*)\]\s*(.*)$/;

export function parseTag(title) {
  const m = title.match(TAG_RE);
  if (!m) return null;
  const rawTag = m[1];
  const rest = m[2];
  let repoName = rawTag.toLowerCase();
  let isDb = false;
  if (repoName.endsWith('-db')) {
    repoName = repoName.slice(0, -3);
    isDb = true;
  }
  return { rawTag, repoName, isDb, title: rest };
}

// workspace.roots (array of folders) is optional; workspace.root still works.
// Use roots when the repos of several projects live in different folders.
export function workspaceRoots(cfg) {
  const w = cfg.workspace || {};
  const list = Array.isArray(w.roots) && w.roots.length ? w.roots : [w.root];
  return list.filter(Boolean).map(_expand);
}

export function listRepos(workspaceRoot, prefix) {
  if (!existsSync(workspaceRoot)) return [];
  const prefixes = (Array.isArray(prefix) ? prefix : [prefix]).filter(Boolean);
  return readdirSync(workspaceRoot)
    .filter((name) => !prefixes.length || prefixes.some((p) => name.startsWith(p)))
    .filter((name) => {
      const p = path.join(workspaceRoot, name);
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
}

export function resolveRepo(title, cfg) {
  const parsed = parseTag(title);
  if (!parsed) {
    return { ok: false, reason: 'no_tag', title, hint: 'Subtask title must start with [REPO-NAME]' };
  }
  const roots = workspaceRoots(cfg);
  for (const workspace of roots) {
    const repoPath = path.join(workspace, parsed.repoName);
    if (existsSync(repoPath) && statSync(repoPath).isDirectory()) {
      return { ok: true, ...parsed, repoPath, workspace };
    }
  }
  // suggest near matches across all roots
  const all = roots.flatMap((r) => listRepos(r, cfg.workspace.repoPrefix));
  const near = all
    .map((n) => ({ name: n, score: _similarity(parsed.repoName, n) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return {
    ok: false,
    reason: 'not_found',
    ...parsed,
    attempted: roots.map((r) => path.join(r, parsed.repoName)),
    workspaces: roots,
    suggestions: near,
  };
}

function _expand(p) {
  if (p === '~') return homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(homedir(), p.slice(2));
  return p;
}
// Simple Dice coefficient for suggestion
function _similarity(a, b) {
  if (a === b) return 1;
  const bigrams = (s) => {
    const out = new Set();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
  };
  const A = bigrams(a), B = bigrams(b);
  let shared = 0;
  for (const x of A) if (B.has(x)) shared++;
  return (2 * shared) / (A.size + B.size || 1);
}

// ─── CLI ──────────────────────────────────────────
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const cfg = await loadConfig();
  if (!cfg) {
    console.error('No config. Run /tba:brief first.');
    process.exit(1);
  }
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === 'help') {
    console.log('Usage: repo-map.mjs "<subtask-title>" | list');
    process.exit(0);
  }
  if (cmd === 'list') {
    for (const workspace of workspaceRoots(cfg)) {
      console.log(`Workspace: ${workspace}`);
      for (const r of listRepos(workspace, cfg.workspace.repoPrefix)) console.log(`  ${r}`);
    }
    process.exit(0);
  }
  const title = [cmd, ...rest].join(' ');
  const r = resolveRepo(title, cfg);
  if (r.ok) {
    console.log(JSON.stringify({ ok: true, repoName: r.repoName, isDb: r.isDb, repoPath: r.repoPath, title: r.title }, null, 2));
  } else {
    console.error(JSON.stringify(r, null, 2));
    process.exit(1);
  }
}
