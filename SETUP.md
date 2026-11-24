# SETUP — instructions for an OpenBot agent

You are an OpenBot agent. The user asked you to install the TBA team from this repo. Follow the steps in order. Report each step's result. Stop and ask the user when a step says so. Reply to the user in Thai (technical terms stay in English).

This setup creates local files, 5 agents, 5 skills (each agent gets the skills listed for it) and 3 workflows on the user's own OpenBot. It does not touch Jira, git remotes or any repo. Do not run any `tba\scripts\*.mjs` during setup.

## 0. Check what the user has (read only, ask before assuming)

1. Run `node --version` and `git --version`. If missing, tell the user and stop.
2. Call `openbot.list_mcp_servers`. Is an `atlassian` server there and signed in? If not, tell the user to connect Jira (Atlassian) in OpenBot Marketplace > Apps, with their own account, and to enable it for the TBA agents later. Setup can continue without it, but the workflows cannot read Jira until it is connected.
3. Call `openbot.list_agents`. If an agent already has one of these names, ask the user before creating a duplicate: `TBA TaskScout`, `TBA PlanMan`, `TBA Flusher`, `TBA BugsJaeger`, `TBQA`.
4. Call `openbot.list_workflows`. Same check for the titles in `workflows\`.

## 1. Pick the install folder

Default: `<OpenBot Shared folder>\tba` (the Shared folder is the one named in your instructions). Tell the user the path and use it as `TBA_ROOT`. Do not overwrite an existing folder without asking.

## 2. Copy the files

Copy this repo's `tba\` folder to `TBA_ROOT` (scripts, reference, OPENBOT-ADAPTATION.md).
Then replace the text `<TBA_ROOT>` with the real `TBA_ROOT` path in these files, and only there:
- `TBA_ROOT\OPENBOT-ADAPTATION.md`
- `agents\agents.json` (work on a copy, keep the repo file as it is)

## 2b. Team profile (ask the user, do not guess)

This repo comes from one team (ThaiBev, project `RTRCDS`, repos `hc-my-career-*`). The user's team is probably different (for example project `RTRED`, repos `hc-ed-*`). Every such name in `tba\reference\` is only an example.

1. Read `tba\TEAM-PROFILE.template.md`. Ask the user for the missing values, in Thai, in one `AskUserQuestion` (up to 4 questions at a time, with a typed answer allowed): Jira site, project key, the **products** under that project (a project can hold several, for example three products with their own repos: for each one ask the repo prefix, the folder that holds its clones, the front-end e2e repo or none, and whether it is cloned on this computer yet), the status a finished subtask moves to and the status for the main card.
2. Get `CLOUD_ID` by calling `getAccessibleAtlassianResources` (if Atlassian is connected) and match the user's site. If it is not connected yet, write `<fill after Atlassian is connected>` and tell the user.
3. Write the filled table to `TBA_ROOT\TEAM-PROFILE.md` (copy of the template with the "Your value" column filled in; remove the instruction lines if you like). If the file exists, ask before overwriting.
4. Read the team conventions section of `TBA_ROOT\OPENBOT-ADAPTATION.md` to the user in two lines (sequence diagram required, API blueprint per backend change, subtask goes to Done, Thai + caveman voice) and ask whether their team follows them. Change or delete the rules that do not apply.
5. Create `~\.tba\config.json` only if it does not exist, with non-secret fields from the profile and no token: `{ "jira": { "site": "...", "email": "", "token": "", "project": "...", "transitions": { "readyToTest": "...", "inProgress": "In Progress" } }, "docs": { "localPath": "" }, "workspace": { "roots": ["<folder of product 1>", "<folder of product 2>"], "repoPrefix": ["<prefix 1>", "<prefix 2>"] }, "e2e": { "repo": "...", "pathPattern": "e2e/playwright/sprint{N}/{KEY}" } }`. If it exists, do not open or change it. The local scripts (`case-state`, `branch`, `repo-map`, `scan`, `sprint`) read the workspace and e2e fields from it. `repo-map` tries every folder in `roots`; a product that is not cloned yet may be listed anyway, it is reported as missing until the user clones it.

## 3. Install the skills

Which agent gets which skill is decided only by the `skills` field of each agent in `agents\agents.json` (required, no defaults). `skills\skills.json` describes each skill: purpose, source, license.

1. Tell the user, in Thai, before you install: the skills that will be installed, which agent gets which, where each skill comes from and its license. Say plainly where the catalog says "not stated" or "original author not recorded".
2. Optional and read-only: run `node scripts\check-bundle.mjs` in the repo folder. If it prints problems, report them and stop.
3. For each folder in `skills\`: copy it into your own workspace folder.
4. Call `openbot.list_local_skills`. If a skill with the same name exists, use it; do not create a duplicate. If its description differs from the one in the repo, tell the user and ask which one to keep.
5. Otherwise call `openbot.create_skill` with the workspace-relative path of the copied folder. Keep the returned skill id and revision of each.

## 4. Create the 5 agents

For each entry in the (replaced) `agents\agents.json`: call `openbot.create_agent` with `name`, `title`, `description`, `avatarHue` and `initialMessage`. Do not pass provider or model: the new agents use yours.
Keep a map `key -> agentId`.
Then for each new agent call `openbot.install_local_skill` for every skill in the entry's `skills` field, no more and no fewer, with the skill id, its revision and the agent's id.

Check: call `openbot.list_agents` and confirm the 5 names exist. Then call `openbot.read_agent` for each new agent and compare its installed skills with the `skills` field of its entry. Report every mismatch and fix it (install the missing skill); do not go on with a skill missing. Do not wait for the agents' setup replies; they answer in their own chats.

## 5. Build the 3 workflows

For each file in `workflows\`:
1. Replace every `agentKey` with the real agent id from the map (field `agentId`).
2. Call `openbot.edit_workflow` with the file's `title` and one `add` op per node, in file order: `ref`, `kind`, `fields` (plus `agentId` for agent nodes), `from` for the node's incoming edge. A condition's outgoing edges use `branch` (`yes` or `no`); the node with `branch` in the file gets it on its `add` op.
3. Do not run the workflow.

Check: call `openbot.read_workflow` once per workflow and confirm the node count matches the file and every agent node has an agentId.

## 6. Tell the user what is left (do not do these yourself)

- Connect and sign in to Atlassian (Jira) if step 0 said it is missing, and enable it for the 5 agents.
- Check that `hc-my-career-*` repos (or the user's own repos) exist locally and update the workspace paths if needed: the scripts read `~\.tba\config.json`, which the user creates (never ask for or print the Jira token; the Atlassian MCP replaces the token for Jira calls, but `config.mjs` still holds the workspace root and e2e settings).
- To start: run workflow `TBA 1` with a Jira card key as the input. Every Jira write needs the user's approval.
- Everything is untested on the user's machine until the first real run.

## Rules for you during setup

- Never print or read `~\.tba\config.json`.
- Do not post, create or change anything in Jira, GitHub or GitLab.
- If a step fails, find the cause and retry once; if it still fails, report it and stop.
