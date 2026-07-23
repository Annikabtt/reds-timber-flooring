# REDS Timber Flooring — Codex-Assisted Development Workflow

## 1. เป้าหมาย

เอกสารนี้ใช้เป็นแผนงานหลักสำหรับนำ Codex เข้ามาช่วยตรวจ วิเคราะห์ แก้ไข และทดสอบโค้ดใน repository จริงของ REDS Timber Flooring โดยมีเป้าหมายดังนี้

- ลดการส่งไฟล์หลายไฟล์เข้า ChatGPT เพื่อให้ตรวจทีละรอบ
- ลดการเดา schema, RPC, route, permission และชื่อ field
- ลดการแก้ไฟล์ซ้ำ วนกลับไปมา
- ให้ Codex อ่าน source code จริงทั้ง repository
- ให้ Codex รัน TypeScript, Build และ Tests ก่อนส่งผล
- ให้ทุกการแก้ไขเกิดใน Git branch ที่ตรวจสอบย้อนหลังได้
- แยกหน้าที่ระหว่าง ChatGPT, Codex และผู้พัฒนาอย่างชัดเจน

> ไม่มี AI ตัวใดรับประกันว่าโค้ดจะไม่มีบั๊ก 100% แต่ workflow นี้ช่วยลดความผิดพลาดจากการเดาและลดรอบแก้ไขได้มากที่สุด

---

## 2. บทบาทของแต่ละเครื่องมือ

### ChatGPT

ใช้สำหรับ:

- ออกแบบ data model
- วิเคราะห์ workflow ธุรกิจ
- ตัดสินใจ architecture
- อธิบายโค้ดและข้อผิดพลาด
- อ่าน screenshot และ console error
- วาง test plan
- ตรวจความสอดคล้องระหว่าง module
- ช่วยเขียน prompt ที่แม่นยำให้ Codex

### Codex

ใช้สำหรับ:

- อ่าน repository จริง
- ตรวจไฟล์ที่เกี่ยวข้องทั้งหมด
- แก้ source code โดยตรง
- ค้น schema usage และ RPC usage
- รัน TypeScript check
- รัน production build
- รัน tests
- ตรวจ diff
- แก้ compiler errors
- สรุปไฟล์ที่เปลี่ยน
- เตรียมงานก่อน commit

### ผู้พัฒนา

รับผิดชอบ:

- ยืนยัน requirement
- อนุมัติการเปลี่ยน schema
- ทดสอบ UI จริง
- ทดสอบ business workflow
- ตรวจ SQL หลัง action สำคัญ
- ตรวจ diff ก่อน commit
- commit และ push
- อนุมัติ deployment

---

## 3. ลำดับแหล่งข้อมูลที่ต้องเชื่อถือ

เมื่อข้อมูลขัดกัน ให้ใช้ลำดับนี้:

1. Database schema จริง
2. `pg_get_functiondef()` ของ RPC/function
3. Generated Supabase types
4. Backend regression tests ที่ผ่านแล้ว
5. Current source files ใน repository
6. Documentation ใน repository
7. Chat history

ห้ามใช้ความจำหรือ chat history แทน generated types หรือ database schema

---

## 4. ไฟล์ที่ควรมีใน repository

ที่ root ของ repository:

```text
D:\RedsTimber-Git
```

ควรมี:

```text
AGENTS.md
docs/REDS_ARCHITECTURE.md
docs/REDS_DATABASE_RULES.md
docs/REDS_UI_STANDARD.md
docs/REDS_WORKFLOWS.md
docs/REDS_TEST_PLAN.md
```

### หน้าที่ของแต่ละไฟล์

#### `AGENTS.md`

กฎบังคับสำหรับ Codex ก่อนแก้โค้ดทุกครั้ง

#### `docs/REDS_ARCHITECTURE.md`

โครงสร้างระบบ เช่น React, Supabase, React Query, routing และ module dependencies

#### `docs/REDS_DATABASE_RULES.md`

กฎ schema, atomic RPC, RLS, audit, soft delete และ permission

#### `docs/REDS_UI_STANDARD.md`

มาตรฐาน REDS UI, desktop/mobile, dialog, form, loading/error/empty states

#### `docs/REDS_WORKFLOWS.md`

Quotation, Revision, Material Requirement, Work Order, Daily Report และ Payroll workflows

#### `docs/REDS_TEST_PLAN.md`

ชุดทดสอบที่ต้องรันก่อน commit

---

## 5. การติดตั้ง Codex

เปิด PowerShell:

```powershell
npm install -g @openai/codex
```

ตรวจเวอร์ชัน:

```powershell
codex --version
```

เปิด repository:

```powershell
cd D:\RedsTimber-Git
codex
```

แนะนำให้ใช้ Codex ผ่าน VS Code เพื่อดู diff และเปิดไฟล์จริงได้ง่าย

---

## 6. Baseline ก่อนเริ่มทุกงาน

ก่อนให้ Codex แก้ไฟล์:

```powershell
cd D:\RedsTimber-Git

git status --short

npm run build
```

สถานะที่ต้องการ:

```text
working tree clean
build passed
```

จากนั้นสร้าง branch ใหม่:

```powershell
git switch -c feat/<ชื่อฟีเจอร์>
```

ตัวอย่าง:

```powershell
git switch -c feat/quotation-ui-v2
```

ห้ามเริ่มงานใหญ่บน branch ที่มีไฟล์แก้ค้างโดยไม่ทราบที่มา

---

## 7. Workflow หลักสำหรับ Codex

### ขั้นที่ 1 — Audit ก่อนแก้

Codex ต้อง:

1. อ่าน `AGENTS.md`
2. อ่านไฟล์เป้าหมายเต็มไฟล์
3. อ่าน generated Supabase types
4. ยืนยัน table columns
5. ยืนยัน relationships
6. ยืนยัน RPC signatures
7. ยืนยัน permission codes
8. ยืนยัน route และ navigation
9. ตรวจ UI pattern จากหน้าที่ทำงานได้ดีอยู่แล้ว
10. รายงานสิ่งที่พบก่อนแก้

### ขั้นที่ 2 — แก้โค้ด

Codex ต้อง:

- แก้เฉพาะไฟล์ที่เกี่ยวข้อง
- ไม่ refactor ส่วนอื่นโดยไม่จำเป็น
- ไม่แก้ generated types ด้วยมือ
- ไม่เดา schema หรือ RPC
- ใช้ atomic RPC สำหรับ write operations
- ไม่เขียนตรงลง workflow tables เมื่อมี RPC
- รองรับ loading/error/empty states
- รองรับ desktop/mobile
- ป้องกัน duplicate submit
- ใช้ permission จาก backend
- ไม่ hard-code role หากมี `has_permission`

### ขั้นที่ 3 — ตรวจสอบ

Codex ต้องรัน:

```powershell
npx tsc --noEmit
npm run build
```

ถ้ามี:

```powershell
npm run lint
npm test
```

จากนั้น:

```powershell
git diff --stat
git diff
```

### ขั้นที่ 4 — Self-review

ให้ Codex ตรวจ diff ของตัวเองอีกครั้ง โดยหา:

- schema field ที่ถูกเดา
- RPC argument ผิด
- stale closure
- infinite render
- empty string ถูกส่งเข้า UUID/date
- missing query invalidation
- permission assumptions
- dialog เลื่อนไม่ได้
- mobile overflow
- direct table write
- error ถูกแสดงเป็น empty state
- double submit
- null handling ผิด
- UOM conversion ผิด
- source snapshot ถูกแก้ย้อนหลัง

### ขั้นที่ 5 — ทดสอบโดยผู้พัฒนา

ผู้พัฒนาทดสอบ browser ตาม acceptance criteria

### ขั้นที่ 6 — ตรวจ SQL

หลัง workflow สำคัญ เช่น Accept Quotation ให้ตรวจ SQL ว่าผลเกิดจริง

### ขั้นที่ 7 — Commit

เมื่อ build, browser test และ SQL test ผ่านแล้ว:

```powershell
git add .
git commit -m "feat: <คำอธิบาย>"
git push
```

---

## 8. Prompt แม่แบบสำหรับ Codex

ใช้ prompt นี้เป็นฐาน:

```text
Task: <ชื่องาน>

Before editing:
- Read AGENTS.md.
- Inspect the complete current target files.
- Inspect generated Supabase types.
- Confirm table columns, relationships, RPC signatures, status names and permission codes.
- Inspect existing UI patterns from working pages.
- Do not guess schema, routes, permissions or RPC arguments.
- Do not modify the database unless explicitly requested.

Requirements:
- <รายการ requirement>
- Support loading, error, empty and disabled states.
- Support desktop and mobile.
- Use atomic RPCs for write operations.
- Prevent duplicate submissions.
- Preserve immutable commercial snapshots.
- Do not add mock data.

Validation:
- Run npx tsc --noEmit.
- Run npm run build.
- Run relevant tests.
- Review git diff.
- Report changed files.
- Report command results.
- Report remaining risks honestly.
- Do not commit or push.
```

---

## 9. Prompt ตัวอย่าง — Quotations

```text
Task: Complete the REDS Quotations page.

Before editing:
- Read AGENTS.md.
- Inspect src/pages/Quotations.tsx.
- Inspect src/App.tsx and src/components/AppSidebar.tsx only if routing or navigation changes are needed.
- Inspect generated Supabase types for quotation tables and all quotation/revision RPC signatures.
- Inspect current Products and Stock Requests UI patterns.
- Do not guess status names, permission codes or RPC arguments.

Requirements:
- Multiple quotation lines.
- Create and edit Draft quotations through atomic RPCs.
- View quotation details.
- Send, accept, reject, cancel and soft-delete according to backend workflow.
- Support revisions according to available revision RPCs.
- Search and status filtering.
- Desktop table and mobile cards.
- Scrollable dialogs with sticky action footer.
- Cost and margin visible only with permission.
- Loading, error and empty states.
- Print and CSV export.
- CSV import only into an unsaved or Draft quotation.
- Do not introduce mock data.
- Resolve Sales UOM, Base UOM and conversion from product and product_uom_conversions.
- Never send an empty string to UUID or date parameters.

Validation:
- Run npx tsc --noEmit.
- Run npm run build.
- Review the diff for UOM, nullable values and RPC payloads.
- Do not commit or push.
```

---

## 10. Prompt ตัวอย่าง — แก้บั๊กจาก Screenshot

```text
Reproduce and fix this bug.

Route:
<route>

Steps:
1. <step>
2. <step>
3. <step>

Expected:
<expected behavior>

Actual:
<actual behavior>

Console error:
<full error>

Known database facts:
- <fact>
- <fact>

Instructions:
- Inspect the actual state construction, validation and RPC payload.
- Do not assume the displayed UI value equals the submitted payload.
- Identify the root cause before editing.
- Add a focused regression test if the project supports it.
- Run typecheck and build.
- Report the exact changed files and test results.
```

---

## 11. การแบ่งงานเพื่อลดความเสี่ยง

อย่าสั่ง module ใหญ่ทั้งหมดในครั้งเดียว

ตัวอย่าง Quotations:

```text
Task A — Audit schema/RPC and report
Task B — List and View Detail
Task C — Create/Edit Draft with multiple lines
Task D — Send/Accept/Reject/Cancel
Task E — Revisions
Task F — Print/CSV
Task G — Regression and mobile test
```

แต่ละ task ต้องจบด้วย:

```powershell
npx tsc --noEmit
npm run build
git diff --stat
```

---

## 12. Checklist ก่อน Codex แก้ไฟล์

```text
[ ] Git working tree clean
[ ] Branch ใหม่ถูกสร้าง
[ ] Build baseline ผ่าน
[ ] AGENTS.md มีอยู่
[ ] Generated types ล่าสุด
[ ] Supabase project ref ถูกต้อง
[ ] .env ชี้ project เดียวกัน
[ ] Acceptance criteria ชัดเจน
[ ] ระบุไฟล์เป้าหมาย
[ ] ระบุสิ่งที่ห้ามแก้
```

---

## 13. Checklist หลัง Codex แก้ไฟล์

```text
[ ] TypeScript ผ่าน
[ ] Build ผ่าน
[ ] Lint ผ่าน (ถ้ามี)
[ ] Tests ผ่าน
[ ] ไม่มี mock data
[ ] ไม่มี direct write เมื่อมี RPC
[ ] RPC argument ตรง generated types
[ ] Empty UUID/date ถูกแปลงเป็น null/undefined ตาม backend
[ ] Query invalidation ครบ
[ ] Permission ถูกตรวจ
[ ] Dialog เลื่อนได้
[ ] Mobile ไม่ล้น
[ ] Loading/Error/Empty แยกกัน
[ ] ไม่มี infinite render
[ ] ไม่มี console debug ที่ไม่จำเป็น
[ ] Diff ไม่มีไฟล์นอกขอบเขต
```

---

## 14. Browser Test Template

```text
Module:
Route:
Browser:
Screen size:
User role:

Steps:
1.
2.
3.

Expected:
Actual:

Console:
Network:
Screenshot:

Result:
PASS / FAIL
```

---

## 15. Database Verification Template

ตัวอย่างหลัง Accept Quotation:

```sql
select
    material_requirement_id,
    material_requirement_no,
    requirement_status,
    quotation_id,
    accepted_revision_id,
    created_at
from public.material_requirements
where is_deleted = false
order by created_at desc
limit 5;
```

ห้าม insert test data ด้วย SQL หาก workflow มี RPC ที่ยืนยันแล้ว

---

## 16. Git Workflow ที่แนะนำ

เริ่มงาน:

```powershell
git status --short
git switch -c feat/<name>
```

ดูการเปลี่ยนแปลง:

```powershell
git diff --stat
git diff
```

ยกเลิกเฉพาะไฟล์:

```powershell
git restore <file>
```

Commit เมื่อผ่านทั้งหมด:

```powershell
git add .
git commit -m "feat: <description>"
git push -u origin HEAD
```

---

## 17. สิ่งที่ห้ามทำ

- ห้ามแก้ generated `types.ts` ด้วยมือ
- ห้ามเดาชื่อ RPC
- ห้ามเดา schema field
- ห้ามสร้าง status ใหม่เอง
- ห้าม hard-code permission จาก role
- ห้ามเขียนตรง workflow tables เมื่อมี atomic RPC
- ห้ามบอกว่าใช้งานได้เพียงเพราะ syntax ผ่าน
- ห้าม commit ก่อน build ผ่าน
- ห้ามใช้ mock data ใน production page
- ห้ามให้หลาย agent แก้ไฟล์เดียวพร้อมกัน
- ห้ามรวม database migration กับ UI rewrite โดยไม่จำเป็น
- ห้ามส่ง empty string ไป UUID/date
- ห้ามเชื่อ dropdown display โดยไม่ตรวจ state/payload
- ห้ามลบ audit หรือ source snapshot

---

## 18. วิธีใช้ ChatGPT ร่วมกับ Codexในช่วงเริ่มต้น

ช่วงแรกให้ใช้ขั้นตอนนี้:

```text
1. อธิบายปัญหาให้ ChatGPT
2. ให้ ChatGPT ช่วยเขียน prompt สำหรับ Codex
3. เปิด Codex ใน repository
4. ให้ Codex audit ก่อน
5. ให้ Codex แก้และรัน build
6. ส่งเฉพาะรายงาน diff/error กลับมาให้ ChatGPT หากต้องการวิเคราะห์เพิ่ม
7. ผู้พัฒนาทดสอบ browser และ SQL
8. Commit
```

วิธีนี้ลดการอัปโหลดไฟล์เข้า ChatGPT และทำให้ source ที่ Codexเห็นตรงกับเครื่องจริง

---

## 19. Workflow สั้นที่สุดที่ยังปลอดภัย

```text
Git clean
→ New branch
→ Codex reads AGENTS.md
→ Audit repo and generated types
→ Implement
→ Typecheck
→ Build
→ Self-review diff
→ Browser test
→ SQL verification
→ Commit
```

---

## 20. จุดเริ่มต้นที่แนะนำสำหรับ REDS

เริ่มด้วย module เดียว:

```text
src/pages/Quotations.tsx
```

เป้าหมายรอบแรก:

```text
- Resolve current UOM save issue
- Confirm multiple lines
- Confirm Draft save/edit
- Confirm Send
- Confirm Accept creates Material Requirement
- Run build
- Review diff
```

ยังไม่ควรเพิ่มหลาย agent หรือ automation จนกว่าจะใช้ workflow นี้ได้คล่อง
