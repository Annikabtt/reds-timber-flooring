# REDS Project Rules

## Business Rules

- Purchase order number format: `POYYMM-00001`
- Purchase order running numbers reset monthly

## Visual-First Development Rule

- ทุกโมดูลต้องยืนยัน business workflow และ UI/UX design ก่อนเริ่ม implementation ที่เปลี่ยนพฤติกรรมระบบ
- Design ที่ยืนยันแล้วเป็น implementation baseline
- หาก implementation ต้องเปลี่ยน Business Rule ให้หยุดและกลับไป review กับผู้ใช้
- ตรวจ schema และ function จริงก่อนแก้ backend ห้ามอาศัยความจำหรือการคาดเดา
- สิทธิ์ใน UI ต้องอ้างอิง database permissions และ backend ต้องตรวจสิทธิ์ซ้ำเสมอ

## Rules Index

- วิธีทำงานและ validation: [development_workflow.md](development_workflow.md)
- UI, forms และ semantic colours: [REDS-UI-STANDARD-v1.md](REDS-UI-STANDARD-v1.md)
- Business process: [business_workflow_v1.md](business_workflow_v1.md)
- Database constraints: [database_rules.md](database_rules.md)
- TypeScript conventions: [typescript_rules.md](typescript_rules.md)
- File/component organization: [project_structure.md](project_structure.md)
