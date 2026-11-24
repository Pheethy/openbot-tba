# openbot-tba

ทีมเอเจนต์ **TBA** (SDLC: Jira card → design → coding → e2e test) สำหรับ OpenBot ดัดแปลงจาก Claude Code plugin [`tba-plugin`](https://github.com/Pheethy/tba-plugin) v0.3.0

## ได้อะไร

| ส่วน | รายละเอียด |
|---|---|
| **เอเจนต์ 5 ตัว** | `TBA TaskScout` (รับการ์ดจาก Jira แล้วแยกประเภท: Bug → BugsJaeger, Feature → PlanMan), `TBA PlanMan` (ออกแบบ + API blueprint + sequence diagram), `TBA Flusher` (เขียนโค้ด + unit test), `TBA BugsJaeger` (debug หา root cause แล้วส่งให้ PlanMan ออกแบบวิธีแก้), `TBQA` (ตรวจ + e2e) |
| **Workflow 3 ตัว** | `TBA 1` card → (Bug: debug → fix | Feature: design → subtasks), `TBA 2` subtask → implement → audit → ship, `TBA 3` bug → debug → design fix → approve → fix → verify (BugsJaeger → PlanMan → คุณอนุมัติ → Flusher → TBQA) |
| **สกิล** | `caveman` ให้ทุกตัวพูดสั้นตรงประเด็น (ภาษาไทย ศัพท์เทคนิคอังกฤษ), `debug-mantra` วินัย debug 4 ข้อให้ BugsJaeger, `scrutinize` รีวิวโค้ดมุมคนนอกให้ TBQA (ห้ามเผย secret, ถามคุณก่อนแก้), `ponytail` โหมดเขียนโค้ดเปลี่ยนน้อยที่สุดที่แก้ครบให้ Flusher, `tba-brainstorming` วิธีคุยออกแบบให้ PlanMan (ดัดแปลงจาก [obra/superpowers](https://github.com/obra/superpowers) MIT) |
| **กฎทีม** | `tba/OPENBOT-ADAPTATION.md` (ใช้ Atlassian MCP แทน token, convention ของทีม, จุดขออนุมัติ) |

## เอเจนต์ × สกิล

เอเจนต์แต่ละตัว **ต้องมี** สกิลตามตารางนี้ (แหล่งความจริงคือฟิลด์ `skills` ใน `agents/agents.json`) ตอนติดตั้ง เอเจนต์จะติดตั้งให้ครบแล้วตรวจกลับว่าไม่ขาดไม่เกิน

| เอเจนต์ | บทบาท | `caveman` | `tba-brainstorming` | `ponytail` | `debug-mantra` | `scrutinize` |
|---|---|---|---|---|---|---|
| `TBA TaskScout` | รับการ์ด แยก Bug / Feature | ✓ | — | — | — | — |
| `TBA PlanMan` | ออกแบบ / ออกแบบวิธีแก้ | ✓ | ✓ | — | — | — |
| `TBA Flusher` | เขียนโค้ด + test | ✓ | — | ✓ | — | — |
| `TBA BugsJaeger` | หาสาเหตุบั๊ก | ✓ | — | — | ✓ | — |
| `TBQA` | ตรวจ + review + e2e | ✓ | — | — | — | ✓ |

- สกิลอยู่ใน `skills/` พร้อมที่มา ผู้เขียน และ license ใน `skills/skills.json` สถานะ license ที่ตรวจแล้ว (2026-11-24):
  - `caveman`: **Apache-2.0** (Julius Brussee) แนบ LICENSE และ NOTICE ไว้ใน `skills/caveman/references/` ชื่อ "Caveman" เป็นเครื่องหมายการค้าของผู้เขียน repo นี้ไม่ได้เกี่ยวข้องหรือได้รับการรับรองจากเขา
  - `tba-brainstorming`: ดัดแปลงจาก obra/superpowers **MIT** (Jesse Vincent) แนบ license ไว้
  - `ponytail`: ระบุ MIT ในไฟล์เอง ไม่มีชื่อผู้เขียน (ตรวจที่มาไม่ได้)
  - `debug-mantra`, `scrutinize`: คัดลอกจาก [thananon/9arm-skills](https://github.com/thananon/9arm-skills) ซึ่ง **ไม่มี license** ผู้เขียนสงวนสิทธิ์ตามค่าเริ่มต้น **ห้ามเผยแพร่ใน repo สาธารณะโดยไม่ได้รับอนุญาต**
- ก่อนเปิด repo เป็น Public รัน `node scripts/check-bundle.mjs --public` สคริปต์จะล้มถ้ายังมีสกิลที่ไม่มี license
- เพิ่มหรือเปลี่ยนสกิลของเอเจนต์: แก้ `agents/agents.json`, ใส่โฟลเดอร์สกิลใน `skills/`, เพิ่มแถวใน `skills/skills.json` แล้วรัน `node scripts/check-bundle.mjs` (อ่านอย่างเดียว ตรวจว่าสกิล เอเจนต์ และ workflow สอดคล้องกัน, description ไม่เกิน 500 ตัวอักษร, ไม่มี token หรือพาธเครื่อง)
## ติดตั้ง

1. เชื่อม **Atlassian (Jira)** ใน OpenBot ด้วยบัญชีของตัวเอง
2. clone repo นี้ แล้วบอกเอเจนต์ของคุณในแชท:

   > อ่าน `SETUP.md` ใน repo openbot-tba (ที่ path `<โฟลเดอร์ที่ clone>`) แล้วติดตั้งทีม TBA ให้ผม

3. เอเจนต์จะคัดลอกไฟล์ สร้างเอเจนต์ ติดตั้งสกิล และสร้าง workflow ให้ ไม่แตะ Jira หรือ git
4. รัน workflow `TBA 1` ด้วย key ของการ์ด (เช่น `RTRCDS-1234`)

ต้องมี: Node.js, git, OpenBot, และสิทธิ์ Jira/repo ของตัวเอง

## ความปลอดภัย

- **ไม่มี token หรือ secret ใน repo นี้** Jira ใช้ผ่าน Atlassian MCP ของแต่ละคน
- ทุกการเขียนลง Jira (คอมเมนต์, สร้าง subtask, เปลี่ยนสถานะ) และ commit/push ต้องให้ผู้ใช้อนุมัติก่อน
- สคริปต์ใน `tba/scripts/` ที่ยังอ่าน `~/.tba/config.json` (workspace root, e2e) ไม่ควรเอา token ไปใส่ถ้าไม่จำเป็น

## ตั้งค่าให้ตรงกับทีมของคุณ

ต้นฉบับมาจากทีมหนึ่ง (โปรเจกต์ `RTRCDS`, repo `hc-my-career-*`) ทีมอื่นเช่น `RTRED` / `hc-ed-*` ใช้ได้ โดยตอนติดตั้งเอเจนต์จะ **ถามค่าของทีมคุณ** แล้วเขียนลง `TEAM-PROFILE.md` ได้แก่ Jira site, project key, repo prefix, workspace root, repo e2e, สถานะที่ใช้ตอน ship (ดูตาราง `tba/TEAM-PROFILE.template.md`)

- **หลาย product ใต้ Jira project เดียว** (เช่น my-career, 360, bevy) รองรับ: ตอนติดตั้งเอเจนต์ถามทีละ product (repo prefix, โฟลเดอร์ที่ clone, repo e2e) สคริปต์หา repo ข้ามหลายโฟลเดอร์ได้ (`workspace.roots`) และ product ที่ยังไม่ได้ clone จะถูกรายงานว่าขาด ไม่ clone เอง
- ชื่อ `RTRCDS` / `hc-my-career-*` ในโฟลเดอร์ `tba/reference/` เป็นแค่ตัวอย่างจากทีมเดิม เอเจนต์ถูกสั่งให้ใช้ค่าจาก `TEAM-PROFILE.md` แทน
- สคริปต์ `tba/scripts` อ่านค่าจาก `~/.tba/config.json` (ค่าเริ่มต้นในชุดนี้ว่างเปล่า ไม่มีชื่อทีมเดิม)
- **กฎทีมเดิมที่ติดมา:** ต้องมี sequence diagram, API blueprint ต่อ backend change, subtask ไป Done (READY TO TEST ใช้กับ Story), พูดไทยแบบ caveman ถ้าทีมคุณไม่ทำแบบนี้ เอเจนต์จะถามตอนติดตั้งและแก้กฎให้ตรง
- รูปแบบ API blueprint อยู่ที่ `tba/reference/example_api_blueprint.md` เปลี่ยนเป็นตัวอย่างของทีมคุณได้

## สถานะ

ผ่านการตั้งค่าบนเครื่องผู้สร้างเท่านั้น **ยังไม่เคยรันครบ flow กับการ์ดจริง** รู้ปัญหาที่ยังไม่ได้ตรวจ: mermaid อาจไม่ render ใน Jira, workflow วนหลาย subtask ไม่ได้ (รัน `TBA 2` ทีละใบ), ไม่มี Playwright MCP ในชุดนี้

## โครงสร้าง

```
SETUP.md                  คำสั่งให้เอเจนต์ติดตั้ง
agents/agents.json        สเปกเอเจนต์ 5 ตัว
workflows/*.json          สเปก workflow 3 ตัว
skills/*/SKILL.md         สกิล 5 ตัว (caveman, debug-mantra, tba-brainstorming, ponytail, scrutinize)
skills/skills.json        ที่มาและ license ของแต่ละสกิล
scripts/check-bundle.mjs  ตรวจความสอดคล้องของชุดแพ็ก (อ่านอย่างเดียว)
tba/                      สคริปต์ Node, กฎ, prompt และคำสั่งอ้างอิงจาก plugin เดิม
```

ที่มา: `tba/scripts` และ `tba/reference` คัดลอกจาก `tba-plugin` (MIT) ของ Pheethy
