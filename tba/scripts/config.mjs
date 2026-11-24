#!/usr/bin/env node
// TBA config loader / saver. Lives at ~/.tba/config.json

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export const CONFIG_DIR = path.join(homedir(), '.tba');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

// Neutral defaults for the openbot-tba bundle: fill them in for YOUR team
// (see TEAM-PROFILE.md). jira.email/token stay empty: Jira goes through the
// Atlassian MCP, so no token is needed for the OpenBot agents.
export const DEFAULTS = {
  jira: {
    site: '',            // e.g. your-company.atlassian.net
    email: '',
    token: '',
    project: '',         // e.g. PROJ
    transitions: {
      readyToTest: 'READY TO TEST',
      inProgress: 'In Progress',
    },
  },
  docs: {
    localPath: '',       // optional shared docs repo
  },
  workspace: {
    root: path.join(homedir(), 'work'),   // folder that holds all your repos
    repoPrefix: '',                         // e.g. 'hc-xx-' ; empty = every folder
  },
  e2e: {
    repo: '',                               // front-end repo that holds e2e specs
    pathPattern: 'e2e/playwright/sprint{N}/{KEY}',
  },
};
export function configExists() {
  return existsSync(CONFIG_PATH);
}

export async function loadConfig() {
  if (!configExists()) return null;
  const raw = await readFile(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function saveConfig(config) {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
  return CONFIG_PATH;
}

// CLI: node config.mjs show | init | path
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2] || 'show';
  if (cmd === 'show') {
    const c = await loadConfig();
    if (!c) {
      console.log('No config yet. Run `/tba-brief` for setup wizard.');
      process.exit(1);
    }
    const redacted = JSON.parse(JSON.stringify(c));
    if (redacted.jira?.token) redacted.jira.token = '***';
    console.log(JSON.stringify(redacted, null, 2));
  } else if (cmd === 'init') {
    if (configExists()) {
      console.log(`Config already exists at ${CONFIG_PATH}`);
      process.exit(0);
    }
    const p = await saveConfig(DEFAULTS);
    console.log(`Wrote default config to ${p}`);
    console.log('Edit it to add your Jira email + token.');
  } else if (cmd === 'path') {
    console.log(CONFIG_PATH);
  } else if (cmd === 'defaults') {
    console.log(JSON.stringify(DEFAULTS, null, 2));
  } else {
    console.log('Usage: node config.mjs [show|init|path|defaults]');
  }
}
