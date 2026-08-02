REDS Timber Flooring — Product UI Implementation Control Plan

Date: 2026-08-01Stage: Real Data UI IntegrationStatus: Approved implementation control documentSupersedes: All earlier sections requiring Mock Data, Mock Provider, prototype-only save, delayed Supabase connection, or Mock prototype approval.

1. Purpose

This document prevents Product UI implementation from drifting away from the approved workflow and backend contract.

The Product Add/Edit interface must now be built directly against real Supabase master data, Product Code validation RPCs, permissions, and atomic Product create/update functions.

There is no preliminary Mock UI stage.

2. Source of Truth

Implementation must follow:

REDS_PRODUCT_WORKFLOW_LOCK_AND_HANDOFF_UPDATED.md

this document

verified current Supabase schema, constraints, RLS, permissions, triggers, and RPC signatures

latest full source files and generated types.ts

Do not implement from chat memory or from assumptions based on the legacy UI.

When an earlier document says to use Mock Data, a Mock Provider, prototype-only save, or delay Supabase integration, this revised document overrides it.

3. Implementation Stage

Stage A — Real Data UI Integration

Build the approved Product Add/Edit workflow using real Supabase data from the beginning.

Required in Stage A:

real Master Data reads

controlled Product form state

immediate frontend Product Code preview

debounced backend preview validation

real Add Product persistence

real Edit Product load and persistence

existing permission model

real validation and rollback behavior

Forbidden in Stage A:

Mock Provider

Mock Product records

Mock permissions

Mock save

prototype-only save

parallel Product form

separate Product Code Builder confirmation workflow

Stage B — Validation and Production Readiness

After implementation:

run TypeScript build

verify Master Data reads

verify preview RPC

test atomic Create

test atomic Update

test duplicate rejection

test invalid payload rollback

test identity immutability

test existing Product compatibility

test desktop and mobile UI

test permissions

Do not call the work Complete while any required result is NOT TESTED.

4. Approval Gates

Gate 1 — Requirement Compliance Approval

Before production code, provide a Requirement Compliance Table mapping each locked requirement to its planned file and implementation.

Gate 2 — File and Component Structure Approval

Provide the exact files to be changed, files to be added, and files explicitly out of scope.

Gate 3 — Wireframe Approval

Present the final four-step wireframe, including Add and Edit behavior.

Gate 4 — Forbidden Changes and Acceptance Criteria Approval

Confirm the forbidden list and the exact PASS/FAIL/NOT TESTED checklist.

Gate 5 — Real Data Integration Plan Approval

Confirm:

exact Supabase master queries

exact generated RPC signatures

frontend preview contract

debounced preview RPC behavior

Create payload and RPC

Edit load queries

Update payload and RPC

permission behavior

rollback and error handling

After Gate 5 approval, write production code. There is no Mock prototype approval gate.

5. Approved Product Form Structure

The Product form has exactly four steps:

Product Identity & Information

Units & Packaging

Specifications & Coverage

Review & Status

Do not add, remove, rename, or reorder these steps without explicit approval.

Add and Edit use the same layout.

6. Step 1 — Product Identity & Information

6.1 Product Code format

Logical segments:

CC-C-TTT-WWWXLLLL-CLR-VV

Completed Product Code:

CCC-TTT-WWWXLLLL-CLR-VV

Example:

012-ENG-190X1200-BLK-01

6.2 Product Code preview

Show above the identity controls:

[CC] [C] [TTT] [WWWXLLLL] [CLR] [VV]

CCC-TTT-WWWXLLLL-CLR-VV

Behavior:

update the frontend preview immediately

debounce backend validation

call preview_product_code_variant_v2

show validating, valid, warning, duplicate, and error states

treat the backend result as authoritative

There is no Preview Product Code button and no Use This Product Code button.

6.3 Required identity order

Product Family

Thickness Code

Product Code Type

Size Rule

Product Colour

Variant Code

Desktop may use a multi-column layout. Mobile stacks the controls while preserving the order.

6.4 Real Master Data

Load from verified active, non-deleted records:

product_code_families
product_thickness_codes
product_code_types
product_code_family_types
product_code_size_rules
product_colours

Dependencies between Family, Thickness, Type, and Size must use the verified schema and RPC context. Do not reproduce backend authority with hard-coded frontend records.

6.5 Searchable master picker

Each picker must:

open with available options

support Code and Name search

rank exact code first

rank code prefix next

rank name prefix next

rank name-containing matches afterward

show loading, empty, and error states

6.6 Manage links

Provide separate links:

Manage Product Families

Manage Thickness Codes

Manage Product Code Types

Manage Size Rules

Manage Product Colours

Variant Code has no master page in Phase 1.

The Product form state must survive opening and closing an inline Manage dialog.

6.7 Variant rules

01    Standard Product
02–99 Special Product Variant

For 02–99, require:

Variant Name

Variant Description

Thickness must not be stored in Variant.

6.8 Product information

After Product Code controls:

Product Name *

Product Category *

Business Product Type *

Description

Search Keywords

Load Product Category from real product_categories data.

Business Product Type values:

Material
Consumable
Tool
Equipment
Service

Product Code Type and Business Product Type must remain clearly differentiated.

7. Step 2 — Units & Packaging

Load real Units from:

units_of_measure

Required behavior:

User selects Base Unit first.

System creates the Base Unit row automatically.

Base conversion is fixed at 1.

User may then add supported Units or Packaging.

Examples:

1 kg     = 1 kg
1 bag    = 20 kg
1 pallet = 800 kg

Validation:

Base Unit is required before Add Unit is enabled.

Conversion must be greater than 0.

UOM cannot be duplicated.

Base row cannot be removed while it is the Product Base Unit.

Purchase, Request, and Sales default UOMs must be in Supported Units.

Manage Units opens the correct Units of Measure setup.

Reuse verified existing Units logic where possible. Do not replace working business rules merely to simplify the new layout.

8. Step 3 — Specifications & Coverage

Step 3 has exactly three cards.

Card A — Category-driven Product Specifications

load Dynamic Attributes from the selected Product Category

reuse verified real queries and validation

preserve required attributes and option rules

do not disable Attributes because Base Unit is missing

Card B — Actual Physical Product Information

Examples:

Actual Thickness

Actual Width

Actual Length

These are physical Product facts, not Product Code identity.

When Code Thickness is Z — Unknown, Actual Thickness may be added later without changing Product Code.

Card C — Coverage / Yield

Examples:

1 bag covers approximately 5 sqm
1 box covers 1.824 sqm

If Base Unit is missing, show:

Select the Base Unit in Step 2 before configuring Coverage.

Coverage must not be merged into Dynamic Attributes.

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

No Save Draft in Phase 1.

Save Product performs the real atomic operation. It must not write only to local state or console output.

10. Add Product Integration

10.1 Form state

Products.tsx or its dedicated Product form owner holds the complete controlled state.

ProductIdentityStep.tsx receives values, options, validation states, and callbacks. It must not own a separate confirmation workflow.

Remove:

onConfirm

Preview button

Use This Product Code button

legacy Identity cards

Builder modal dependency for the main workflow

10.2 Preview validation

Call:

preview_product_code_variant_v2

Use debounce and cancellation/stale-result protection.

Save is blocked when:

required identity is incomplete

preview is still validating

backend preview is invalid

Product Code is duplicate

required Product information is missing

Units, Attributes, or Coverage payload is invalid

10.3 Create

Use:

create_product_with_units_atomic

The exact payload must follow the current generated TypeScript signature and verified function definition.

Test:

Product header

independent identity IDs

Base Unit

Supported Units

default UOMs

Dynamic Attributes

Coverage

duplicate rejection

invalid payload rollback

permissions

11. Edit Product Integration

11.1 Load

Load real Product data:

Product header

identity IDs and display values

Units and defaults

Dynamic Attributes

physical information

Coverage

status

11.2 Identity presentation

Show clickable readable segments:

[CC] - [C] - [TTT] - [WWWXLLLL] - [CLR] - [VV]

The following remain read-only:

Product Family

Thickness Code

Product Code Type

Size identity

Product Colour

Variant Code

Full Product Code

Use readable locked styling, not low-contrast disabled controls.

11.3 Editable data

Product Name

Description

Search Keywords

Business Product Type

Units & Packaging

Dynamic Attributes

Actual Physical Product Information

Coverage

Status

11.4 Update

Use:

update_product_with_units_atomic

Test that an attempted identity change is rejected or omitted according to the verified RPC contract.

12. Component and File Plan

Required existing structure:

src/pages/Products.tsx

src/components/products/
    ProductIdentityStep.tsx
    ProductInlineMasterDataDialog.tsx
    ProductDetailsDialog.tsx

Permitted extra components when they reduce complexity:

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

Forbidden files and structures:

productFormMockData.ts
Mock Provider
Mock permissions layer
Prototype Product Form
parallel Product UI

Do not expand scope into ProductCodeManagement.tsx during Add/Edit implementation except for a verified, narrowly required compatibility fix.

Do not expand ProductCodeBuilderModal.tsx. Remove its Add/Edit dependency and retire it separately when safe.

13. Requirement Compliance Table

This table must be completed and sent before production code.

Requirement

Planned File

Implementation

Four steps only

Products.tsx / form owner

Step 1–4 only

Identity in Step 1

Products.tsx

Before Product information

Six ordered fields

ProductIdentityStep.tsx

Family → Thickness → Type → Size → Colour → Variant

Live frontend preview

ProductIdentityStep.tsx / ProductCodePreview.tsx

Immediate derived preview

Backend preview validation

form owner/query hook

Debounced preview_product_code_variant_v2

No Builder workflow

Products.tsx

No modal or confirmation stage

Separate Manage links

ProductIdentityStep.tsx

Exact master dialog for each field

Variant has no master

ProductIdentityStep.tsx

Managed in Product form

Real Master Data

queries/hooks

Supabase active records

Base Unit first

Units step

Automatic Base row

Step 3 three cards

Specifications step

Attributes / Physical / Coverage

Add/Edit same layout

Products.tsx

Mode-based identity locking

Clickable Edit identity

Code component

Readable locked segments

Full review

Review component

All required summary fields

Atomic Create

save handler

create_product_with_units_atomic

Atomic Update

save handler

update_product_with_units_atomic

14. Final Wireframe

Step 1 — Product Identity & Information

PRODUCT CODE PREVIEW
[CC] [C] [TTT] [WWWXLLLL] [CLR] [VV]
CCC-TTT-WWWXLLLL-CLR-VV
Validation / warning / duplicate status

Product Family *       Manage Product Families
Thickness Code *       Manage Thickness Codes
Product Code Type *    Manage Product Code Types
Size Rule *            Manage Size Rules
Product Colour *       Manage Product Colours
Variant Code *

Variant Name *         shown for 02–99
Variant Description *  shown for 02–99

Product Name *
Product Category *
Business Product Type *
Description
Search Keywords

Step 2 — Units & Packaging

Base Unit *             Manage Units
1 base = 1 base

Supported Units
1 bag = 20 base
1 pallet = 800 base

Default Purchase UOM
Default Request UOM
Default Sales UOM

Step 3 — Specifications & Coverage

A. Category-driven Product Specifications
B. Actual Physical Product Information
C. Coverage / Yield

Step 4 — Review & Status

Complete Product summary
Stock Item
Service Item
Status

Cancel                     Save Product

15. Forbidden Changes

Do not add or restore:

Product Code Builder modal workflow

Preview Product Code button

Use This Product Code button

Product Code confirmation step

Mock Provider

Mock Product records

Mock Save

Mock permissions

Product Family combined with Thickness

Family name in Thickness options

Product Type in Thickness options

legacy Category Variant terminology

combined Manage Product Code Masters button

Manage Variant Codes page

Category / Dimensions / Appearance / Variant cards

more or fewer than four steps

Save Draft

backend changes used only to avoid correct UI integration

identity edits after Product creation

Commercial, Inventory, Supplier, or unrelated scope in Products.tsx

unnecessary as any casts to conceal generated-type drift

unapproved layout changes during data integration

16. Acceptance Criteria

16.1 Structure

exactly four steps

correct Step names and order

Add and Edit share one layout

Step 3 contains three separate cards

16.2 Product identity

six controls in Product Code order

frontend preview updates immediately

debounced preview RPC runs

stale RPC results cannot overwrite newer state

duplicate and validation states are visible

no Builder modal or confirmation buttons

Variant 01 and 02–99 behavior is correct

16.3 Real data

all Master pickers read Supabase data

no Mock records or hard-coded authority records

loading, empty, and error states are implemented

Manage dialogs refresh the relevant picker without clearing form state

16.4 Units

Base Unit selected first

Base row created automatically

conversion 1 enforced

duplicates rejected

positive conversion enforced

default UOMs restricted to Supported Units

16.5 Specifications and Coverage

Dynamic Attributes load by Category

physical data remains separate from identity

Coverage remains separate from Attributes

missing Base Unit blocks Coverage only

Z Product Code remains unchanged when Actual Thickness is later entered

16.6 Create and Edit

Create calls create_product_with_units_atomic

Edit loads real existing Product data

Update calls update_product_with_units_atomic

identity remains immutable

invalid payload rolls back

duplicate Product Code is rejected

existing Product records remain compatible

16.7 Responsive and accessibility

desktop layout is readable

mobile layout preserves field order

dialog content scrolls correctly

inputs and locked values remain legible

errors do not rely on colour alone

keyboard and focus behavior are usable

17. Test Report Format

Use only:

PASS
FAIL
NOT TESTED

Required report:

Test

Status

Evidence / Notes

TypeScript Build





Master Data Read





Live Frontend Preview





Preview RPC





Add Product Save





Duplicate Rejection





Invalid Input Rollback





Edit Product Load





Edit Product Save





Product Code Immutability





Existing Product Compatibility





Desktop UI





Mobile UI





Permissions





Do not state Complete while any required test is NOT TESTED.

18. Required Working Sequence

Read both revised Product control documents.

Inspect the latest full Product source files.

Inspect generated types.ts.

Verify current schema and RPC signatures.

Send Requirement Compliance Table.

Send exact file/component structure.

Send final wireframe.

Send Forbidden Changes list.

Send exact test plan.

Receive approval.

Implement the real-data UI.

Run and report all required tests.

Commit approved work before the next milestone.

19. Final Control Statement

The Product UI is a real Supabase integration, not a Mock prototype. Use real Master Data, real Product Code preview validation, and atomic Create/Update functions while preserving the approved four-step workflow and immutable Product identity.