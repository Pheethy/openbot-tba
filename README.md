# openbot-tba

ทีมเอเจนต์ **TBA** (SDLC: Jira card → design → coding → e2e test) สำหรับ OpenBot ดัดแปลงจาก Claude Code plugin [`tba-plugin`](https://github.com/Pheethy/tba-plugin) v0.3.0

## ได้อะไร

| ส่วน | รายละเอียด |
|---|---|
| **เอเจนต์ 4 ตัว** | `TBA TaskScout` (รับการ์ดจาก Jira), `TBA PlanMan` (ออกแบบ + API blueprint + sequence diagram), `TBA Brusher` (เขียนโค้ด + unit test), `TBQA` (ตรวจ + e2e) |
| **Workflow 2 ตัว** | `TBA 1` card → plan → subtasks, `TBA 2` subtask → implement → audit → ship |
| **สกิล** | `caveman` ให้ทุกตัวพูดสั้นตรงประเด็น (ภาษาไทย ศัพท์เทคนิคอังกฤษ) |
| **กฎทีม** | `tba/OPENBOT-ADAPTATION.md` (ใช้ Atlassian MCP แทน token, convention ของทีม, จุดขออนุมัติ) |

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

- ชื่อ `RTRCDS` / `hc-my-career-*` ในโฟลเดอร์ `tba/reference/` เป็นแค่ตัวอย่างจากทีมเดิม เอเจนต์ถูกสั่งให้ใช้ค่าจาก `TEAM-PROFILE.md` แทน
- สคริปต์ `tba/scripts` อ่านค่าจาก `~/.tba/config.json` (ค่าเริ่มต้นในชุดนี้ว่างเปล่า ไม่มีชื่อทีมเดิม)
- **กฎทีมเดิมที่ติดมา:** ต้องมี sequence diagram, API blueprint ต่อ backend change, subtask ไป Done (READY TO TEST ใช้กับ Story), พูดไทยแบบ caveman ถ้าทีมคุณไม่ทำแบบนี้ เอเจนต์จะถามตอนติดตั้งและแก้กฎให้ตรง
- รูปแบบ API blueprint อยู่ที่ `tba/reference/example_api_blueprint.md` เปลี่ยนเป็นตัวอย่างของทีมคุณได้

## สถานะ

ผ่านการตั้งค่าบนเครื่องผู้สร้างเท่านั้น **ยังไม่เคยรันครบ flow กับการ์ดจริง** รู้ปัญหาที่ยังไม่ได้ตรวจ: mermaid อาจไม่ render ใน Jira, workflow วนหลาย subtask ไม่ได้ (รัน `TBA 2` ทีละใบ), ไม่มี Playwright MCP ในชุดนี้

## โครงสร้าง

```
SETUP.md                  คำสั่งให้เอเจนต์ติดตั้ง
agents/agents.json        สเปกเอเจนต์ 4 ตัว
workflows/*.json          สเปก workflow 2 ตัว
skills/caveman/SKILL.md   สกิล caveman
tba/                      สคริปต์ Node, กฎ, prompt และคำสั่งอ้างอิงจาก plugin เดิม
```

ที่มา: `tba/scripts` และ `tba/reference` คัดลอกจาก `tba-plugin` (MIT) ของ Pheethy
