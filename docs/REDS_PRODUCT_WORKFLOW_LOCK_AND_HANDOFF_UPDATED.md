REDS Timber Flooring — Product Workflow Lock, Real Data Integration, and Handoff

Date: 2026-08-01Status: Approved source of truth for Product Add/Edit implementationSupersedes: Earlier Product workflow documents wherever they require Mock Data, a Mock Provider, a prototype-only save, or a separate Product Code Builder workflow.

1. Purpose

This document locks the approved Product workflow and the working method for continuing Product UI development without losing agreed requirements.

The Product UI must now be implemented directly against the existing Supabase schema, master data, validation RPCs, permissions, and atomic create/update functions. A parallel Mock UI, Mock Provider, Mock Product records, Mock permissions, or Mock save path must not be created.

The implementation must preserve existing backend business rules. UI problems must be solved in the frontend unless the verified backend contract is genuinely incorrect.

2. Source-of-Truth Priority

Use the following priority when instructions conflict:

This document.

REDS_PRODUCT_UI_IMPLEMENTATION_CONTROL.md revised for Real Data Integration.

Verified current database schema, constraints, RLS policies, permissions, triggers, and RPC signatures.

Latest full source files.

Earlier Product documents only where they do not conflict with items 1–4.

Any older instruction requiring Mock Data, Mock Provider, prototype-only save, delayed Supabase integration, or Product Code Builder confirmation is cancelled.

3. Current Backend Status

The backend already supports independent Product identity and real Product persistence.

3.1 Independent Product identity columns

products.product_code_family_id
products.product_thickness_code_id
products.product_code_type_id

3.2 Product Code RPCs

get_product_code_context_v2
preview_product_code_variant_v2
generate_product_code_variant_v2

3.3 Atomic Product persistence

create_product_with_units_atomic
update_product_with_units_atomic

Before implementation, confirm the exact generated TypeScript signatures and the current local Supabase definitions. Do not guess parameter names or payload shape.

4. Product Code Identity — Locked

4.1 Logical format

CC-C-TTT-WWWXLLLL-CLR-VV

4.2 Completed Product Code

CCC-TTT-WWWXLLLL-CLR-VV

Example:

012-ENG-190X1200-BLK-01

4.3 Independent identity components

The six components are independent and must remain separate in both UI and database mapping:

Product Family

Thickness Code

Product Code Type

Size Rule

Product Colour

Variant Code

Do not combine Product Family with Thickness. Do not place family names or Product Type names inside Thickness options.

4.4 Reserved values

Z  = Unknown Thickness
X  = Not Applicable
01 = Standard Product
02–99 = Special Product Variant

Thickness must not be encoded in Variant Code.

4.5 Identity immutability

After Product creation, the following identity values cannot be changed directly:

Product Family

Thickness Code

Product Code Type

Size identity

Product Colour

Variant Code

Full Product Code

If an identity was created incorrectly, do not modify it in place. A future controlled replacement workflow may create a new Product and retain the old Product for historical documents. That replacement workflow is outside the present scope.

5. Product Form — Locked Four-Step Workflow

The Product form has exactly four steps:

Product Identity & Information

Units & Packaging

Specifications & Coverage

Review & Status

Do not add, remove, rename, or reorder these steps without explicit approval.

Add Product and Edit Product must use the same layout. Mode-specific behavior controls whether identity is editable or read-only.

6. Step 1 — Product Identity & Information

6.1 Product Code Preview

The Product Code preview appears above the identity controls.

[CC] [C] [TTT] [WWWXLLLL] [CLR] [VV]

CCC-TTT-WWWXLLLL-CLR-VV

The frontend updates the visible preview immediately as selections change.

The backend validates the selection by calling:

preview_product_code_variant_v2

Use a debounce so the RPC is not called on every keystroke or transient state.

The backend result is authoritative for:

final Product Code

Variant availability

duplicate detection

validation errors

warnings

There is no:

Preview Product Code button

Use This Product Code button

Product Code confirmation step

separate Product Code Builder modal in the Add/Edit workflow

6.2 Required field order

The controls must appear in this exact order:

Product Family

Thickness Code

Product Code Type

Size Rule

Product Colour

Variant Code

Desktop may arrange the controls across columns. Mobile stacks them vertically while preserving the same order.

6.3 Search behavior

Master pickers must:

show available options when opened

support typing to search

search by Code and Name

rank exact code matches first

rank code prefix matches next

rank name prefix matches next

show name-containing matches after that

expose loading, empty, and error states

6.4 Manage links

Each master field has its own relevant Manage link:

Manage Product Families

Manage Thickness Codes

Manage Product Code Types

Manage Size Rules

Manage Product Colours

Variant Code has no separate master-data page in Phase 1.

Opening and closing a Manage dialog must preserve the Product form state.

6.5 Variant behavior

01    Standard Product
02–99 Special Product Variant

When Variant Code is 02–99, require:

Variant Name

Variant Description

6.6 Product information fields

After Product Code controls, show:

Product Name *

Product Category *

Business Product Type *

Description

Search Keywords

Product Code Type and Business Product Type are different concepts and must not use confusing labels or database mapping.

Business Product Type uses the locked values:

Material
Consumable
Tool
Equipment
Service

7. Step 2 — Units & Packaging

7.1 Base Unit first

The user must select Base Unit before adding packaging or supported Units.

After Base Unit selection, create the Base Unit row automatically:

1 kg = 1 kg

Base Unit conversion is always 1.

7.2 Supported Units examples

1 bag    = 20 kg
1 pallet = 800 kg

7.3 Validation

Base Unit is required before Add Unit is enabled.

Conversion must be greater than 0.

The same UOM cannot be added twice.

Base Unit conversion cannot differ from 1.

Default Purchase UOM must exist in Supported Units.

Default Request UOM must exist in Supported Units.

Default Sales UOM must exist in Supported Units.

Manage Units opens the Units of Measure setup.

The implementation should reuse verified existing Units logic while reorganising the UI around Base Unit first.

8. Step 3 — Specifications & Coverage

Step 3 contains exactly three cards.

A. Category-driven Product Specifications

Load Dynamic Attributes from the selected Product Category using the existing real query and validation rules.

Do not disable unrelated Dynamic Attributes because Base Unit has not been selected.

B. Actual Physical Product Information

Examples:

Actual Thickness

Actual Width

Actual Length

Actual physical measurements are descriptive Product data, not Product Code identity.

When Product Code Thickness is Z — Unknown, Actual Thickness may be entered later without changing the Product Code.

C. Coverage / Yield

Examples:

1 bag covers approximately 5 sqm
1 box covers 1.824 sqm

When Coverage needs a Base Unit but none is selected, show:

Select the Base Unit in Step 2 before configuring Coverage.

Coverage must remain separate from Dynamic Attributes.

9. Step 4 — Review & Status

Review must show:

Product Code

Product Name

Product Category

Business Product Type

Product Family

Thickness Code

Product Code Type

Size Rule

Product Colour

Variant

Base Unit

Supported Units

Coverage

Stock Item

Service Item

Status

Actions:

Cancel
Save Product

Do not add Save Draft in Phase 1.

Save Product performs the real atomic create or update operation. There is no prototype-only save or console-only save.

10. Add and Edit Behavior

10.1 Add Product

Identity fields are editable.

Frontend live preview and debounced backend preview validation must be valid before save.

Create uses:

create_product_with_units_atomic

10.2 Edit Product

Edit uses the same four-step layout.

Display Product Code as readable clickable segments:

[CC] - [C] - [TTT] - [WWWXLLLL] - [CLR] - [VV]

Clicking a segment may focus or scroll to its corresponding identity detail and show the selected master record. Identity remains read-only.

Do not use low-contrast disabled styling. Use readable locked/read-only presentation.

Editable details include:

Product Name

Description

Search Keywords

Business Product Type

Units & Packaging

Dynamic Attributes

Actual Physical Information

Coverage

Status

Update uses:

update_product_with_units_atomic

Product Code immutability must be tested.

11. Real Data Sources

Use active, non-deleted data from the verified Supabase schema:

product_code_families
product_thickness_codes
product_code_types
product_code_family_types
product_code_size_rules
product_colours
product_categories
units_of_measure

Use existing Product detail queries for Edit load, including:

Product header

Product identity

Supported Units and defaults

Dynamic Attributes

Coverage

Actual physical information where represented in the verified schema

Do not invent fields missing from the generated types. Do not use as any merely to hide schema drift.

12. Approved Component Structure

Primary files:

src/pages/Products.tsx

src/components/products/
    ProductIdentityStep.tsx
    ProductInlineMasterDataDialog.tsx
    ProductDetailsDialog.tsx

Additional components may be created only when they reduce complexity without changing the approved workflow:

src/components/products/product-form/
    ProductFormSteps.tsx
    ProductCodePreview.tsx
    ProductCodeSegments.tsx
    SearchableMasterPicker.tsx
    UnitsPackagingStep.tsx
    SpecificationsCoverageStep.tsx
    ReviewStatusStep.tsx
    productFormTypes.ts
    productFormValidation.ts

Do not create:

productFormMockData.ts
Mock Provider
Prototype Product Form
parallel Product UI

ProductCodeBuilderModal.tsx may remain temporarily for compatibility while references are removed, but it must not remain the main Add/Edit workflow and must not be expanded.

Do not expand the Add/Edit implementation scope into ProductCodeManagement.tsx unless a verified dependency requires a narrowly scoped compatibility correction.

13. Implementation Phases

Phase 1 — Product Identity UI

Convert ProductIdentityStep into a controlled component.

Keep Product form state in the owning Product form.

Remove onConfirm workflow.

Remove Preview and Use This Product Code buttons.

Remove Category / Dimensions / Appearance / Variant identity cards.

Render six controls in Product Code order.

Add immediate frontend preview.

Add debounced preview_product_code_variant_v2 validation.

Phase 2 — Product Information

Combine Product Identity and Product Information in Step 1.

Load real Product Categories.

Use locked Business Product Type values.

Keep Description and Search Keywords in Step 1.

Phase 3 — Units & Packaging

Reuse verified Units logic.

Make Base Unit the first action.

Automatically create the Base Unit row.

Validate duplicates and positive conversions.

Validate default UOM selections against Supported Units.

Phase 4 — Specifications & Coverage

Reuse Dynamic Attributes query and save logic.

Add the Actual Physical Product Information card.

Reuse Coverage logic.

Keep Attributes, Physical Information, and Coverage separate.

Phase 5 — Review

Show the complete review summary.

Validate required fields.

Validate Product Code preview status.

Phase 6 — Create Save

Connect create_product_with_units_atomic.

Test Product, Units, Attributes, Coverage, duplicate rejection, invalid payload, and rollback.

Phase 7 — Edit Load and Save

Load Product header, identity, Units, Attributes, Coverage, and physical information.

Connect update_product_with_units_atomic.

Test identity immutability and existing Product compatibility.

14. Approval Gate Before Production Code

Before writing production code, provide:

Requirement Compliance Table.

Exact component/file structure.

Final wireframe.

Forbidden Changes list.

Verified RPC signatures and relevant generated types.

Exact implementation scope and out-of-scope items.

Test scenarios.

Production code begins only after approval of those items.

Approval is for the real-data implementation plan, not for a Mock prototype.

15. Forbidden Changes

Do not introduce or restore:

Product Code Builder modal as the Add/Edit workflow

Preview Product Code button

Use This Product Code button

Product Code confirmation step

Mock Provider

Mock Product records

Mock Save

Mock permissions

Product Family combined with Thickness

Family name inside Thickness options

Product Type inside Thickness options

legacy Category Variant terminology

Manage Product Code Masters combined button

Manage Variant Codes page in Phase 1

Category / Dimensions / Appearance / Variant identity cards

a fifth Product form step

Save Draft

backend rule changes made only to accommodate UI shortcuts

Product identity edits after Create

Commercial, Inventory, Supplier, purchasing, or unrelated modules added to Products.tsx

unnecessary as any casts that hide schema mismatch

layout changes during integration that have not been approved

16. Testing Standard

Every result must be reported separately as:

PASS
FAIL
NOT TESTED

Required test report:

Test Area

Status

TypeScript Build

PASS / FAIL / NOT TESTED

Master Data Read

PASS / FAIL / NOT TESTED

Live Frontend Preview

PASS / FAIL / NOT TESTED

Preview RPC

PASS / FAIL / NOT TESTED

Add Product Save

PASS / FAIL / NOT TESTED

Duplicate Rejection

PASS / FAIL / NOT TESTED

Invalid Input Rollback

PASS / FAIL / NOT TESTED

Edit Product Load

PASS / FAIL / NOT TESTED

Edit Product Save

PASS / FAIL / NOT TESTED

Product Code Immutability

PASS / FAIL / NOT TESTED

Existing Product Compatibility

PASS / FAIL / NOT TESTED

Desktop UI

PASS / FAIL / NOT TESTED

Mobile UI

PASS / FAIL / NOT TESTED

Permissions

PASS / FAIL / NOT TESTED

Do not use the word Complete while any required item is NOT TESTED.

A successful TypeScript build is not equivalent to workflow approval.

17. Working Method

Before coding:

Read this document.

Read REDS_PRODUCT_UI_IMPLEMENTATION_CONTROL.md.

Inspect the latest full Products.tsx and ProductIdentityStep.tsx.

Inspect related Product components.

Inspect generated types.ts.

Verify schema, permissions, and RPC signatures.

Present the required approval package.

Receive approval.

During coding:

use real Supabase master data

use the real preview RPC

use controlled form state

preserve the approved four-step layout

send complete replacement files or clearly bounded complete components

avoid unrelated refactoring

After coding:

Run TypeScript build.

Run backend/RPC tests with rollback where appropriate.

Test real Add Product.

Test real Edit Product.

Test invalid inputs and rollback.

Test existing Product compatibility.

Test desktop and mobile layouts.

Test permissions.

Record PASS, FAIL, or NOT TESTED.

Update implementation status and commit before the next milestone.

18. Final Locked Direction

Implement the real Product Add/Edit UI directly on verified Supabase data. Preserve the existing backend and RPC business rules. Do not create Mock Data, a Mock Provider, a parallel Product form, or the former Product Code Builder confirmation workflow. Connect atomic Create and Update after the approved four-step UI and validation contract are correctly implemented.