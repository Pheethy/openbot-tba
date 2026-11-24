# TEAM-PROFILE (template)

SETUP.md step 2 asks the user for these values and writes the result to `<TBA_ROOT>\TEAM-PROFILE.md`.
Agents read `TEAM-PROFILE.md` at the start of every task, after `OPENBOT-ADAPTATION.md`.

**Rule:** the reference files (`reference\*`) and script comments come from the original team (ThaiBev, project `RTRCDS`, repos `hc-my-career-*`, site `digital-and-technology.atlassian.net`). Every such name there is only an EXAMPLE. Always use the values below.

| Key | Meaning | Original team's example | Your value |
|---|---|---|---|
| `JIRA_SITE` | Jira Cloud host | `digital-and-technology.atlassian.net` | `<fill>` |
| `CLOUD_ID` | Atlassian cloudId (SETUP gets it from `getAccessibleAtlassianResources`) | `6bcb0d47-...` | `<auto>` |
| `PROJECT_KEY` | Jira project key | `RTRCDS` | `<fill>` (e.g. `RTRED`) |
| `PRODUCTS` | one Jira project can hold several products, each with its own repos: fill the "Products" table below (one row is fine) | my-career, 360, bevy | see table |
| `SUBTASK_TAG_FORMAT` | `[<REPO-NAME-UPPERCASE>] Title`; DB suffix `-DB` maps to the API repo | `[HC-MY-CAREER-API-EMPLOYEE] ...` | same rule with your prefix, e.g. `[HC-ED-API-X] ...` |
| `WORKSPACE_ROOTS` | folders that hold the repo clones (one per product, or one shared folder); goes to `workspace.roots` in `~/.tba/config.json` | `~/go/src/gitlab.thaibevapp.com/my-career` | from the Products table |
| `BRANCH_PATTERN` | built by `branch.mjs` from the key, lower case | `feature/rtrcds-<id>` | `feature/<key-lowercase>` (e.g. `feature/rtred-123`) |
| `E2E_REPO` | front-end repo that holds Playwright specs (per product in the table; `config.json` has one `e2e.repo`, so the agent uses the table value for the card's product) | `hc-my-career-web` | from the Products table |
| `E2E_PATH_PATTERN` | where specs go | `e2e/playwright/sprint{N}/{KEY}` | `<fill>` |
| `SUBTASK_DONE_STATUS` | status a finished subtask moves to | `Done` | `<fill>` |
| `STORY_SHIP_STATUS` | status the main card moves to when shipped | `READY TO TEST` | `<fill>` |
| `DOCS_REPO` | optional shared docs repo | `hc-my-career-docs` | `<fill or none>` |
| `API_BLUEPRINT` | blueprint pattern | `reference\example_api_blueprint.md` | keep, or replace that file with your team's example |

Team conventions in `OPENBOT-ADAPTATION.md` (sequence diagram required, API blueprint per backend change, subtask goes to Done, Thai + caveman style) are the original team's habits. If your team differs, change them in that file during setup; do not leave a rule you do not follow.

## Products (one row per product under the same Jira project)

| Product | Repo prefix(es) | Folder that holds its clones | Front-end e2e repo | Cloned on this computer? |
|---|---|---|---|---|
| `<name>` | `<e.g. hc-ed->` | `<path>` | `<repo or none>` | `<yes / not yet>` |

The original team's example: project `RTRCDS` = products `my-career` (`hc-my-career-`), `360` and `bevy` (repo names of the last two not recorded).

Rules for agents:
- Decide a card's product from its title, labels or components. If unsure, ask the user once and write `Project: <name>` on the first line of `plan.md`.
- A subtask tag is the full repo name in upper case, so one tag format covers every product.
- A repo that is "not yet" cloned: report it as missing with its product. Do not clone and do not pick another folder; ask the user.
- Setup writes the folders to `workspace.roots` (a list) and the prefixes to `workspace.repoPrefix` (a string or a list) in `~/.tba/config.json`. `scripts\repo-map.mjs` tries every folder in order.
