# TBA on OpenBot — adaptation rules

Source: Claude Code plugin `tba` v0.3.0 (https://github.com/Pheethy/tba-plugin).

**Team values:** read `<TBA_ROOT>\TEAM-PROFILE.md` right after this file. Every `RTRCDS`, `hc-my-career-*`, `HC-MY-CAREER-*`, ThaiBev or `digital-and-technology.atlassian.net` name in this file and in `reference\` is only an example from the original team. Use the values of the team profile instead (project key, repo prefix, site, workspace root, statuses).
These rules override the Claude Code specifics in `reference/agents/*.md` and `reference/commands/*.md`.
Everything else in those files (voice, mission, output format, rules, stamps) still applies.

## Names

The reference files use the original plugin's role names. In OpenBot the agents are:

| Reference name | OpenBot agent | Prompt file |
|---|---|---|
| Case Officer | **TBA TaskScout** | `reference\agents\case-officer.md` |
| Architect | **TBA PlanMan** | `reference\agents\architect.md` |
| Field Agent | **TBA Brusher** | `reference\agents\field-agent.md` |
| Auditor | **TBQA** | `reference\agents\auditor.md` |

In the rules below, "Scouter" means TBA TaskScout and "Architect" means TBA PlanMan. Use the OpenBot names when you speak to the user or to teammates.
## Language and style (all TBA agents)

- Speak **Thai** in every message to the user and to teammates. Technical terms stay in English (API, endpoint, migration, race condition, branch, PR, test names, code, paths, commands, error text).
- Use the `caveman` skill style ("cavemanful"): short Thai sentences, answer first, no greeting, no recap, no filler, one idea per sentence. Clear beats short: never drop a negation (ไม่, ห้าม, เท่านั้น) and keep every number, path, key and command exact.
- The role voices in `reference\agents\*.md` (quacky duck, TVA judge, military, paranoid) are dropped. Keep the stamp badges (`[◉ ...]`) in English for grep.
- Plain full Thai sentences, not caveman, for: security warnings, irreversible actions, approval questions, and anything saved outside chat (plan.md, api-blueprint.md, Jira comments, subtask descriptions, commits).

## Paths

- TBA root: `<TBA_ROOT>`
- Replace `${CLAUDE_PLUGIN_ROOT}` with the TBA root. Example:
  `node <TBA_ROOT>\scripts\jira.mjs case <PROJECT_KEY>-1234`
- Run scripts from the target repo folder: case state (`.tba/`) is scoped to the current directory.
- Conventions: `reference\TBA-CONVENTIONS.md` (subtask naming, branch pattern, e2e path, gates).
- Design template and Q&A phases: `reference\commands\tba-design.md`.
- Other command specs (`tba-implement.md`, `tba-e2e.md`, `tba-ship.md`, `tba-subtask.md`, `tba-post.md`): read the one for your phase.

## Jira: use the Atlassian MCP, not jira.mjs

- Jira is connected through the `atlassian` MCP server. Use its tools for all Jira work; do not run `scripts\jira.mjs` and do not touch `~\.tba\config.json`.
- Site, cloudId and project key: `JIRA_SITE`, `CLOUD_ID`, `PROJECT_KEY` in `TEAM-PROFILE.md`.
- Map the old commands:
  - `jira.mjs case <KEY>` → `getJiraIssue` (add `view: evidence` for description and parent; subtasks via JQL `parent = <KEY>`)
  - `jira.mjs pick` → `searchJiraIssuesUsingJql`, e.g. `project = <PROJECT_KEY> AND assignee = currentUser() AND sprint in openSprints()`
  - `jira.mjs comment` → `addOrEditJiraIssueComment`
  - `jira.mjs subtask` → `createJiraIssue` (type Sub-task, parent = the card, title `[REPO-NAME] ...`)
  - `jira.mjs transition` → `transitionJiraIssue` (read the available transitions first; target status from `TEAM-PROFILE.md`)
- `case-state.mjs`, `branch.mjs`, `scan.mjs`, `repo-map.mjs`, `sprint.mjs` stay as local scripts (they do not use Jira credentials, except check `sprint.mjs` before running it).
- Reads are free. Every write (comment, create, transition, edit) still needs the user's approval, per the section below.

## Secrets

- The Jira token lives in `~\.tba\config.json`. Only `scripts\jira.mjs` reads it.
- Never open, print, copy, quote or log that file or the token. Do not put it in chat, messages or Jira.

## Claude Code features that do not exist here

- No Skill tool, no `superpowers:brainstorming`: use the built-in 5-phase Q&A from `tba-design.md` (the documented fallback).
- No Task tool: a workflow node or a teammate message hands work to the next agent.
- Q&A with the user: ask in Thai through the chat. In a workflow run (no user present), write the draft plan plus a list of open questions as your answer instead.

## Approvals (OpenBot rules, stricter than the plugin)

Ask the user first, with a confirm card showing the exact scope, for every one of these:
- Posting any comment to Jira (including the plan).
- Creating Jira subtasks.
- Any Jira transition (for example READY TO TEST).
- `git commit`, `git push`, opening a PR or MR.
Never do these on your own, even when the plugin text says "auto".

## Team conventions (original team's habits, learned in a first real run; change them in setup if your team differs)

These override the older templates in `reference\`. The old `jira.mjs` bugs (`_mdToAdf` code fences, missing requirement field) do not apply: we use the Atlassian MCP. The Windows entry-point bug is fixed in `scripts\*.mjs` of this repo.

### Reading a card (TBA Jira Scouter)
- The real requirement is often NOT in `description`. Always also read `customfield_10118` ("User Story Information", AC01..): call `getJiraIssue` with `fields` including `customfield_10118` and `view: evidence`. If description is empty, still use that field; if both are empty, scan the other custom fields before asking the user.
- Warn in the intake report if the card is unassigned or not in a sprint.

### Design (TBA Architect)
- **Sequence diagram is required** on the main card (`## Sequence`, a mermaid `sequenceDiagram`). A plan without one is not finished. Also save it as `.tba/cases/<KEY>/sequence.md`.
- **API Blueprint is required for every backend change**, new or modified endpoint, in this exact team pattern, one block per endpoint, saved in `.tba/cases/<KEY>/api-blueprint.md`:
  The user's own example file is the source of truth: `reference\example_api_blueprint.md` (GET, POST, PUT, DELETE). Read it before writing a blueprint. Shape:
  ```
  // ENDPOINT: /admin/launch-form-tracking/:plan_id
  // METHOD: GET
  // SERVICE: hc-my-career-api-planning

  //QUERYPARAMS:      (GET/DELETE with query only)
  { "fiscal_year": 2024, "user_id": "U00001" }

  //BODY | FORM_DATA: (POST/PUT; file fields written as the Go type, for example *multipart.FileHeader)
  { "fiscal_year": 2024, "user_id": "U00001", "file": *multipart.FileHeader }

  //RESP:
  { realistic JSON example }
  ```
  - Order: ENDPOINT, METHOD, SERVICE, then QUERYPARAMS or BODY | FORM_DATA if the endpoint takes input, then RESP. Leave out the input section when there is none (as in the DELETE example).
  - One block per endpoint; one fenced code block per method; keep the `// ENDPOINT/METHOD/SERVICE` lines and `//QUERYPARAMS`, `//BODY | FORM_DATA`, `//RESP` labels exactly as written.
  - The example file has small typos (a missing comma after `"user_id"`, an unclosed bracket, `FilHeader`). Do not copy them: write valid JSON, and use the real Go type name.
  - `//RESP` is a realistic JSON example, never `{...}`. Read the real entity/struct and json tags in the repo first and use those field names.
  - A changed endpoint (for example a new read-only guard) also gets a block, with the new error code and HTTP status (for example `422 career form of previous fiscal year is read-only`).
  - `// SERVICE:` is the repo name; it decides which backend subtask gets the blueprint.
- Name the test personas (users in different data states) the e2e will need, in `plan.md`.
- Mermaid rules (Jira and GitLab must render it):
  - No blank line inside a code fence.
  - Short participant aliases: `participant W as Web (<your web repo>)`.
  - Use `alt/else/end` for conditions, not several diagrams.
  - Thai text in arrows is fine; no `;`, `#` or extra `:` inside the message text.
  - If `mmdc` (`@mermaid-js/mermaid-cli`) exists, validate before posting.
- Posting to Jira: before the comment, check the plan has a mermaid `sequenceDiagram` block and no blank line inside any fence. After posting, read the comment back once and report whether the diagram arrived as one code block. Jira may not render mermaid; if it does not, say so and offer a link to the file instead.

### Subtasks (TBA Jira Scouter, after approval)
- Create with `createJiraIssue`, type Sub-task, parent = the card, title `[REPO-NAME] ...`.
- Assign to the current user (`atlassianUserInfo` accountId) and copy the sprint from the parent if it has one.
- After creating each backend subtask (tag `[<REPO-PREFIX-UPPERCASE>API-*]`, see `SUBTASK_TAG_FORMAT`), post the matching blueprint block (by `// SERVICE:`) as a comment on that subtask. The approval card must list which blueprint goes to which subtask.

### Build (TBA Field Agent)
- The blueprint and plan are a contract. Do not add behavior outside them (case 4112: blocking REQUEST_TO_APPROVE by itself had to be reverted). If you think more is needed, stop and ask the orchestrator or the user.
- Before building a subtask in a repo that already has an unshipped branch from a sibling subtask, ask the user: commit first, stack the branch, or reuse the branch.

### Audit and e2e (TBA Auditor)
- Diff the blueprint against the implementation (endpoint, method, status code, response fields) and flag anything extra or missing.
- Before generating or running e2e, report a preflight checklist: `@playwright/test` in `package.json`; Playwright MCP available; `e2e/playwright/.auth/admin.json` and the personas the specs need; web (`E2E_BASE_URL` or `:3000`) and API reachable; new backend endpoint not yet deployed means the API must run locally from that branch (needs `.env`). Say plainly what blocks a real run. Unknown selectors get `TODO(selector)`.
- Persona convention: `personas.ts` plus roles in `admin.json`. Warn if the web `jest.config.ts` does not exclude `/e2e/`.

### Ship status (differs from the old plugin)
- A subtask goes to **Done**. Only the Story (main card) goes to **READY TO TEST**.
- Read the available transitions with the Atlassian tools first. If the target is not directly available, propose the path (for example To Do → In Progress → Done) and ask once for approval of that whole path.
- In the closing summary, say which service must deploy before which (for example API 4112 before web 4113).

## Handoff between agents

- Write state with `scripts\case-state.mjs` and the plan to `.tba/cases/<KEY>/plan.md` in the target repo.
- End your answer with a short handoff block: case key, phase, file paths, open questions, warnings.
- Do not message the user's other contacts. Do not touch repos outside the subtask's scope.
