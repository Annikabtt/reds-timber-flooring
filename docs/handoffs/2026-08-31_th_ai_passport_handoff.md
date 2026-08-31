# TH-AI Passport Handoff — REDS Timber

อัปเดต: 2026-08-31

Repository: `D:\RedsTimber-Git`

Branch: `codex/work-order-permission-rls`

Supabase project ref: `fbxuljocaslnjwnjvddk`

## Operating Constraints

- ยังไม่ได้ push หรือ deploy migration ไป hosted Supabase
- ห้าม push/deploy จนกว่าผู้ใช้จะอนุญาตอย่างชัดเจน
- ห้ามแก้ generated Supabase types ด้วยมือ
- รักษาการเปลี่ยนแปลงของผู้ใช้ที่อยู่นอกขอบเขต
- ใช้ schema และ function definitions เป็น source of truth ตาม `AGENTS.md`

## Completed Commits

เรียงจากใหม่ไปเก่า:

- `37f0b27 docs: formalize REDS development workflow`
- `01454c6 chore(ui): modernize Tailwind configuration`
- `e9315bf fix(quotations): enforce pricing units and cost permissions`
- `8773587 fix(materials): validate requirement product units`
- `b7e1763 fix(products): enforce canonical units and backend access`
- `b219e4c fix(invoices): reconcile commercial source snapshots`
- `68bea9d test(database): report regression suites through pgTAP`
- `3631575 fix(database): reconcile quotation billing and product thickness schema`
- `25fa2d2 fix(database): harden exposed views and function search paths`
- `f3b8321 fix(work-orders): enforce permission-aware workflow security`

## Important Fixes

- Work Order UI และ RLS ใช้ permission-aware workflow; ผู้ใช้ทำ manual browser tests เดิมครบ 3 กรณีแล้ว
- Security Advisor migrations เปลี่ยน exposed views เป็น `security_invoker`, จำกัด grants และ harden function search paths
- เติม quotation billing, product thickness และ Invoice accepted-source snapshot schema drift
- Products ใช้ backend permission และ canonical `product_units`
- Material Request และ Quotations validate UOM จาก `product_units`
- Quotations UI ไม่ส่ง `cost_price` เมื่อไม่มี `quotations.view_cost`
- Migration `20260831110000_quotation_draft_cost_permission_hardening.sql` รักษาต้นทุนเดิมตาม `line_uid` ฝั่งฐานข้อมูล และไม่ให้ client ที่ไม่มีสิทธิ์ทับค่าเดิม

## Latest Validation

- `npx eslint src/pages/Quotations.tsx`: PASS
- `npx tsc --noEmit`: PASS
- `npm run build`: PASS
- `npm test`: PASS — 1/1
- `npx supabase test db`: PASS — 2 files, 15 tests
- Quotation cost hardening migration applied locally twice: PASS
- Build warnings remain for old Browserslist data, jsPDF mixed imports and a large application chunk
- Database lint has one known false positive where `plpgsql_check` cannot see a runtime-created temporary table in `update_draft_quotation_atomic`

## Working Tree at Handoff Preparation

One tracked file remains modified:

- `supabase/migrations/20260801170000_product_create_atomic_identity_v2.sql`
  - Difference is removal of the UTF-8 BOM on the first line only
  - No SQL semantics changed
  - Do not commit or restore it without deciding whether encoding normalization is desired

Cleanup completed:

- Removed duplicate root-level handoff document
- Removed empty, extensionless `supabase/migrations/20260829_secure_document_sequences_rls`
- Kept one canonical handoff under `docs/handoffs/`

## Remaining Manual Tests

Test Quotations in the browser with at least these roles:

1. User with `quotations.update_draft` and `quotations.view_cost`
2. User with `quotations.update_draft` but without `quotations.view_cost`
3. User without `quotations.apply_discount`

For case 2, edit a Draft and verify the existing cost/margin remains unchanged after save. Also verify a new line does not receive a client-supplied cost.

## Recommended Next Steps

1. Confirm `git status --short` and read this handoff plus `AGENTS.md`
2. Run the three Quotations manual permission tests
3. Decide whether to keep or restore the BOM-only change
4. Review the complete branch diff against its base
5. Ask for explicit authorization before push or Supabase deployment
6. After deployment, rerun Security Advisor and compare errors/warnings

## Resume Prompt

```text
Open D:\RedsTimber-Git on branch codex/work-order-permission-rls. Read AGENTS.md and docs/handoffs/2026-08-31_th_ai_passport_handoff.md completely. Verify git status and the listed commits. Continue with the remaining Quotations permission browser tests and branch-level review. The correct Supabase project is fbxuljocaslnjwnjvddk. Do not push or deploy without my explicit authorization, and do not alter the remaining BOM-only working-tree change until reviewed.
```
