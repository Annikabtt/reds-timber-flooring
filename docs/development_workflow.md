# REDS Visual-First Development Workflow

เอกสารนี้กำหนดลำดับการออกแบบ พัฒนา และตรวจสอบทุกโมดูลของ REDS

## ลำดับงานมาตรฐาน

1. ยืนยัน Business Requirements และ Business Rules
2. จัดทำ Visual UI หรือ Workflow Mockup
3. ให้ผู้ใช้ตรวจและยืนยัน Design Lock
4. ตรวจ schema, functions, RLS และข้อมูลอ้างอิงจาก Supabase จริง
5. วิเคราะห์ผลกระทบต่อฐานข้อมูล สิทธิ์ ระบบเดิม และข้อมูล snapshot
6. จัดทำ Implementation Plan
7. พัฒนา migration/RPC ก่อน frontend เมื่อ backend ต้องเปลี่ยน
8. พัฒนา frontend ตาม design และ backend contract ที่ยืนยันแล้ว
9. รัน regression tests, TypeScript และ production build
10. ทดสอบ browser ตาม permission และ workflow ที่เกี่ยวข้อง
11. Review diff และ commit เป็นก้อนงานที่แยกขอบเขตชัดเจน
12. Deploy เฉพาะเมื่อได้รับอนุญาต และตรวจผลหลัง deploy

## Design Gate

- ห้ามเริ่ม SQL, RPC หรือ frontend ที่เปลี่ยน business workflow ก่อนผู้ใช้ยืนยัน visual/workflow ที่เกี่ยวข้อง
- ห้ามใช้การเขียนโค้ดเป็นวิธีทดลอง Business Rule
- หากพบว่าต้องเปลี่ยน Business Rule ระหว่าง implementation ให้หยุดและกลับไป Design Review
- Design ที่ยืนยันแล้วเป็น implementation baseline

## Database Gate

- ใช้ลำดับ source of truth ตาม `AGENTS.md`
- ตรวจ hosted Supabase แบบ read-only ก่อนแก้ backend ที่อาศัยสถานะ production
- ห้ามเดาชื่อ table, column, RPC, parameter, status หรือ permission code
- ใช้ atomic RPC สำหรับ protected workflow เมื่อมี RPC อยู่แล้ว
- migration ต้องรันบน local database และควรทนต่อ schema ที่อยู่ในสถานะเป้าหมายแล้ว
- ห้าม deploy migration โดยไม่ได้รับอนุญาตอย่างชัดเจน

## UI Gate

- ปฏิบัติตาม [REDS-UI-STANDARD-v1.md](REDS-UI-STANDARD-v1.md)
- Permission ของ UI ต้องมาจาก database-driven permission checks
- Backend เป็นผู้ตัดสินสิทธิ์สุดท้ายเสมอ
- ต้องมี loading, error, empty และ disabled states ที่ถูกต้อง
- การเปลี่ยนสถานะด้วยสีต้องสัมพันธ์กับการอนุญาต action จริง

Semantic status colours:

| สี | ความหมาย |
| --- | --- |
| Green | Ready, completed หรือพร้อมดำเนินการ |
| Amber/Orange | Partial, pending หรือควรตรวจสอบ |
| Red | Blocked, error หรือไม่สามารถดำเนินการ |
| Grey | Historical, fully processed, disabled หรือ locked |
| Blue | Informational, approved หรือ neutral workflow state |

สถานะที่ไม่สามารถดำเนินการต้องแสดงทั้ง background, border, status text และ disabled action ไม่ใช้เพียงตัวอักษรเปลี่ยนสี

## Required Validation

หลังแก้ไขให้รันอย่างน้อย:

```powershell
npx tsc --noEmit
npm run build
```

และเมื่อมีคำสั่งรองรับ:

```powershell
npm run lint
npm test
npx supabase test db
```

จากนั้นตรวจ:

```powershell
git diff --stat
git diff
git diff --check
```

## Commit and Deployment

- แยก commit ตามโมดูลหรือความรับผิดชอบ
- อย่ารวมไฟล์ที่ไม่เกี่ยวข้องหรือการเปลี่ยนแปลงของผู้ใช้เข้าด้วยกัน
- ห้าม push หรือ deploy จนกว่าผู้ใช้จะอนุญาต
- หลัง deploy ให้ rerun tests/advisors ที่เกี่ยวข้องและบันทึกความเสี่ยงที่ยังเหลือ

## Related Documents

- [REDS UI Standard](REDS-UI-STANDARD-v1.md)
- [Business Workflow](business_workflow_v1.md)
- [Database Rules](database_rules.md)
- [TypeScript Rules](typescript_rules.md)
- [Project Structure](project_structure.md)
- [Codex Workflow Plan](REDS_CODEX_WORKFLOW_PLAN.md)
