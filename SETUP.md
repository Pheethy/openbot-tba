# SETUP — instructions for an OpenBot agent

You are an OpenBot agent. The user asked you to install the TBA team from this repo. Follow the steps in order. Report each step's result. Stop and ask the user when a step says so. Reply to the user in Thai (technical terms stay in English).

This setup creates local files, 4 agents, 1 skill and 2 workflows on the user's own OpenBot. It does not touch Jira, git remotes or any repo. Do not run any `tba\scripts\*.mjs` during setup.

## 0. Check what the user has (read only, ask before assuming)

1. Run `node --version` and `git --version`. If missing, tell the user and stop.
2. Call `openbot.list_mcp_servers`. Is an `atlassian` server there and signed in? If not, tell the user to connect Jira (Atlassian) in OpenBot Marketplace > Apps, with their own account, and to enable it for the TBA agents later. Setup can continue without it, but the workflows cannot read Jira until it is connected.
3. Call `openbot.list_agents`. If an agent already has one of these names, ask the user before creating a duplicate: `TBA TaskScout`, `TBA PlanMan`, `TBA Brusher`, `TBQA`.
4. Call `openbot.list_workflows`. Same check for the titles in `workflows\`.

## 1. Pick the install folder

Default: `<OpenBot Shared folder>\tba` (the Shared folder is the one named in your instructions). Tell the user the path and use it as `TBA_ROOT`. Do not overwrite an existing folder without asking.

## 2. Copy the files

Copy this repo's `tba\` folder to `TBA_ROOT` (scripts, reference, OPENBOT-ADAPTATION.md).
Then replace the text `<TBA_ROOT>` with the real `TBA_ROOT` path in these files, and only there:
- `TBA_ROOT\OPENBOT-ADAPTATION.md`
- `agents\agents.json` (work on a copy, keep the repo file as it is)

## 3. Install the caveman skill

1. Copy `skills\caveman\` into your own workspace folder.
2. Call `openbot.list_local_skills`. If a skill named `caveman` exists, use it; do not create a duplicate.
3. Otherwise call `openbot.create_skill` with the workspace-relative path of the copied folder. Keep the returned skill id and revision.

## 4. Create the 4 agents

For each entry in the (replaced) `agents\agents.json`: call `openbot.create_agent` with `name`, `title`, `description`, `avatarHue` and `initialMessage`. Do not pass provider or model: the new agents use yours.
Keep a map `key -> agentId`.
Then for each new agent call `openbot.install_local_skill` with the caveman skill id, its revision and the agent's id.

Check: call `openbot.list_agents` and confirm the 4 names exist. Do not wait for their setup replies; they answer in their own chats.

## 5. Build the 2 workflows

For each file in `workflows\`:
1. Replace every `agentKey` with the real agent id from the map (field `agentId`).
2. Call `openbot.edit_workflow` with the file's `title` and one `add` op per node, in file order: `ref`, `kind`, `fields` (plus `agentId` for agent nodes), `from` for the node's incoming edge. A condition's outgoing edges use `branch` (`yes` or `no`); the node with `branch` in the file gets it on its `add` op.
3. Do not run the workflow.

Check: call `openbot.read_workflow` once per workflow and confirm the node count matches the file and every agent node has an agentId.

## 6. Tell the user what is left (do not do these yourself)

- Connect and sign in to Atlassian (Jira) if step 0 said it is missing, and enable it for the 4 agents.
- Check that `hc-my-career-*` repos (or the user's own repos) exist locally and update the workspace paths if needed: the scripts read `~\.tba\config.json`, which the user creates (never ask for or print the Jira token; the Atlassian MCP replaces the token for Jira calls, but `config.mjs` still holds the workspace root and e2e settings).
- To start: run workflow `TBA 1` with a Jira card key as the input. Every Jira write needs the user's approval.
- Everything is untested on the user's machine until the first real run.

## Rules for you during setup

- Never print or read `~\.tba\config.json`.
- Do not post, create or change anything in Jira, GitHub or GitLab.
- If a step fails, find the cause and retry once; if it still fails, report it and stop.
