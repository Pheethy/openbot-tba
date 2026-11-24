# TEAM-PROFILE (template)

SETUP.md step 2 asks the user for these values and writes the result to `<TBA_ROOT>\TEAM-PROFILE.md`.
Agents read `TEAM-PROFILE.md` at the start of every task, after `OPENBOT-ADAPTATION.md`.

**Rule:** the reference files (`reference\*`) and script comments come from the original team (ThaiBev, project `RTRCDS`, repos `hc-my-career-*`, site `digital-and-technology.atlassian.net`). Every such name there is only an EXAMPLE. Always use the values below.

| Key | Meaning | Original team's example | Your value |
|---|---|---|---|
| `JIRA_SITE` | Jira Cloud host | `digital-and-technology.atlassian.net` | `<fill>` |
| `CLOUD_ID` | Atlassian cloudId (SETUP gets it from `getAccessibleAtlassianResources`) | `6bcb0d47-...` | `<auto>` |
| `PROJECT_KEY` | Jira project key | `RTRCDS` | `<fill>` (e.g. `RTRED`) |
| `REPO_PREFIX` | prefix of every service repo folder | `hc-my-career-` | `<fill>` (e.g. `hc-ed-`) |
| `SUBTASK_TAG_FORMAT` | `[<REPO-NAME-UPPERCASE>] Title`; DB suffix `-DB` maps to the API repo | `[HC-MY-CAREER-API-EMPLOYEE] ...` | same rule with your prefix, e.g. `[HC-ED-API-X] ...` |
| `WORKSPACE_ROOT` | folder that holds all repo clones | `~/go/src/gitlab.thaibevapp.com/my-career` | `<fill>` |
| `BRANCH_PATTERN` | built by `branch.mjs` from the key, lower case | `feature/rtrcds-<id>` | `feature/<key-lowercase>` (e.g. `feature/rtred-123`) |
| `E2E_REPO` | front-end repo that holds Playwright specs | `hc-my-career-web` | `<fill or none>` |
| `E2E_PATH_PATTERN` | where specs go | `e2e/playwright/sprint{N}/{KEY}` | `<fill>` |
| `SUBTASK_DONE_STATUS` | status a finished subtask moves to | `Done` | `<fill>` |
| `STORY_SHIP_STATUS` | status the main card moves to when shipped | `READY TO TEST` | `<fill>` |
| `DOCS_REPO` | optional shared docs repo | `hc-my-career-docs` | `<fill or none>` |
| `API_BLUEPRINT` | blueprint pattern | `reference\example_api_blueprint.md` | keep, or replace that file with your team's example |

Team conventions in `OPENBOT-ADAPTATION.md` (sequence diagram required, API blueprint per backend change, subtask goes to Done, Thai + caveman style) are the original team's habits. If your team differs, change them in that file during setup; do not leave a rule you do not follow.
