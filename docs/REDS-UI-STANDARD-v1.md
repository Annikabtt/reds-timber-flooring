# REDS UI STANDARD v1

## 1. Purpose

This document defines the current UI, form, responsive, export, and report presentation standards for the REDS Timber Flooring application.

The **Products module applies the form standards immediately**. Other modules will be aligned during the post-Phase-1 milestone:

**REDS UI/UX REVIEW — FULL APPLICATION**

UI changes must not alter database rules, permissions, calculations, audit history, or business workflows.

---

## 2. Core Colour Palette

| Element | Hex Code | Usage |
|---|---:|---|
| REDS Primary | `#9E4B4B` | Main buttons, header bands, table headers, focus/hover emphasis |
| Primary Light | `#F5DEDE` | Section title bands, soft highlights |
| Information Row | `#FBF1F1` | Report information grids and pale data rows |
| Section Background | `#FCFAFA` | Form section background |
| Card / Panel | `#FFFFFF` | Cards, dialogs, tables |
| Page Background | `#F8FAFC` | Main application background |
| Input Background | `#F7F9FB` | Editable input, textarea and select background |
| Default Border | `#E5E7EB` | Inputs, cards and neutral separators |
| Report Border | `#B98A8A` | Printed report tables and structured report grids |
| Text Primary | `#111827` | Main application text |
| Report Body Text | `#000000` | Printed report body text |
| Text Secondary | `#6B7280` | Helper text and descriptions |
| Disabled Background | `#F1F3F5` | Disabled controls |
| Disabled Text | `#9CA3AF` | Disabled text |
| Success | `#16A34A` | Success status |
| Error | `#EF4444` | Errors and destructive validation |

---

## 3. Input Field Standard

### 3.1 Default Input Appearance

- Background: `#F7F9FB`
- Default border: `#E5E7EB`
- Text: `#111827`
- Placeholder: `#6B7280`
- Height: `44px`
- Border radius: `rounded-xl`
- Padding must allow comfortable desktop and touch interaction.

### 3.2 Interaction States

| State | Background | Border | Notes |
|---|---:|---:|---|
| Default | `#F7F9FB` | `#E5E7EB` | Clearly distinct from white cards |
| Hover | `#F7F9FB` | `#9E4B4B` | Use REDS Primary |
| Focus | `#F7F9FB` | `#9E4B4B` | Add a subtle REDS-coloured focus ring |
| Filled | `#F7F9FB` | `#E5E7EB` | Entered values must be darker than placeholders |
| Disabled | `#F1F3F5` | `#E5E7EB` | Text `#9CA3AF` |
| Read-only | Neutral pale background | `#E5E7EB` | Must look different from editable fields |
| Error | `#F7F9FB` | `#EF4444` | Add a clear message below the field |

### 3.3 Validation Rules

- Required fields use a red `*`.
- Error messages must use user-facing field names, never UUIDs.
- Optional select fields may provide `— Clear selection —`.
- Required select fields must not allow clearing.
- Validation must be enforced in both UI and database/RPC layers.
- Inputs must not rely only on background colour to communicate status.

---

## 4. Numbered Form Sections

Long forms use numbered sections to make data entry easier to follow.

Example for Products:

1. Product Information
2. Product Code Identity
3. Units and UOM
4. UOM Conversions
5. Coverage / Yield
6. Dynamic Attributes
7. Review and Status

Each section should include:

- A numbered circular indicator using REDS Primary.
- A clear section title.
- Optional concise helper text.
- A visually separated card or section.
- Consistent spacing between fields.
- Clear empty, loading, error and completed states.

---

## 5. Form Layout

| Device | Layout |
|---|---|
| Desktop | 2–4 columns depending on field relationships |
| Tablet | Usually 2 columns |
| Mobile / iPhone | 1 column |
| Dialog | `max-h-[90vh]`, internal vertical scrolling |
| Mobile dialog width | `w-[calc(100vw-24px)]` |
| Input height | `44px` |
| Button height | `44px` |
| Section radius | `rounded-2xl` |
| Input radius | `rounded-xl` |

Footer actions must remain easy to reach on long forms and must not overlap scrolling content.

---

## 6. Module List and Card Standard

### Desktop

- Header: icon, title and subtitle.
- Primary Add button uses REDS Primary.
- Summary cards: Total, Active, Inactive.
- Filter row: search, master-data filters, status filter, export actions.
- Desktop table: strong column alignment, status badges, actions at right.
- Product/document codes should use bold monospace text where helpful.

### Mobile

- Use mobile cards instead of compressing desktop tables.
- Avoid nested cards that create excessive framing.
- Keep typography readable on iPhone-width screens.
- Actions should sit at the bottom of each card.
- Avoid overly small helper text and cramped icon buttons.

---

## 7. Dialog Standard

- Width must fit desktop and mobile without touching screen edges.
- Use internal scrolling rather than page-level overflow.
- Header and actions must remain visually clear.
- Use numbered sections for long workflows.
- Destructive, cancel and primary actions must be visually distinct.
- The close icon must remain accessible at all scroll positions.

---

## 8. Report and Print Standard

The REDS Variation Record is the visual reference for formal management reports, printed forms, PDF exports and structured operational records.

### 8.1 Report Colour System

| Report Element | Hex Code | Description |
|---|---:|---|
| Header band / table headers / total highlights | `#9E4B4B` | Dusty brick red |
| Section title background | `#F5DEDE` | Light pastel pink |
| Information grid background | `#FBF1F1` | Very pale blush pink |
| Table and grid borders | `#B98A8A` | Muted rose-grey |
| Header subtitle text | `#F5DEDE` | Light text on dark REDS header |
| Body text | `#000000` | Black |

### 8.2 Report Header

Formal reports should use:

- REDS logo at the left.
- Report title centred or clearly dominant.
- A short subtitle under the title when needed.
- Document number and date aligned at the right.
- A full-width REDS Primary header band.
- White title text and light-pink subtitle text.

### 8.3 Information Grid

The top report information area should:

- Use compact structured rows.
- Use `#FBF1F1` for pale information cells when appropriate.
- Use `#B98A8A` borders.
- Keep labels bold and values readable.
- Group related fields such as Project, Site, Unit/Location, Contractor, Representative, Reference and Priority.

### 8.4 Section Titles

Report section titles should:

- Use `#F5DEDE` background.
- Use REDS Primary or dark readable text.
- Span the width of the related content area.
- Clearly separate Description, Materials, Labour, Attachments, Approval and similar sections.

### 8.5 Report Tables

Tables should follow these rules:

- Header row background: `#9E4B4B`
- Header text: white
- Table borders: `#B98A8A`
- Body background: white
- Body text: black
- Numeric columns aligned consistently
- Totals or key summary rows may reuse `#9E4B4B` or `#F5DEDE`
- Avoid heavy shading that reduces print clarity

### 8.6 Signature and Approval Areas

Approval sections should include:

- Clear role headings.
- Name, signature and date fields.
- Balanced left/right layout on desktop and print.
- Stacked layout on mobile or narrow PDF formats.
- Adequate blank space for handwritten signatures when printing.

### 8.7 Attachments and Checkboxes

- Use simple checkboxes suitable for both screen and print.
- Keep labels short.
- Align options consistently.
- Provide an “Other” line only where required.
- Avoid using colour as the only indicator.

### 8.8 Print and PDF Behaviour

Reports must:

- Fit standard page sizes without clipping.
- Repeat table headers across pages when possible.
- Avoid breaking a heading away from its content.
- Keep signatures together where practical.
- Preserve REDS colours while remaining readable in grayscale.
- Use black body text for maximum legibility.
- Avoid application navigation, buttons and interactive controls in print output.

### 8.9 Export Types

Where relevant, modules should support:

- Print
- PDF
- CSV
- Excel

CSV and Excel exports prioritise structured data. Print and PDF exports follow the REDS report visual standard.

---

## 9. Products Module — Immediate Application

The Products module should apply this standard now to:

- Products list
- Add Product
- Edit Product
- View Product
- Product Code Builder
- UOM Conversion cards
- Coverage / Yield
- Dynamic Attributes
- Validation and empty states
- Desktop and iPhone layouts

The Products form should use the numbered workflow defined in Section 4.

---

## 10. Deferred Full-Application Review

The following modules will be aligned after Phase 1 functionality is complete:

- Dashboard
- Customers
- Projects
- Project Sites
- Project Areas
- Work Orders
- Daily Reports
- Employees
- Payroll
- Suppliers
- Stock Requests
- Quotations
- Variations
- Invoices
- Settings and Master Data

Milestone:

**REDS UI/UX REVIEW — FULL APPLICATION**

The review must cover:

- Visual hierarchy
- Input visibility
- Section separation
- Search and filters
- Empty, selected, loading and error states
- Desktop and mobile consistency
- iPhone typography
- Dialog scrolling
- Action placement
- Colours and icons
- Print/PDF consistency
- Overall usability

---

## 11. Development Rules

- New major UI work must reference this standard.
- Do not create module-specific input colours without a documented reason.
- Prefer reusable shared components once patterns are stable.
- Test desktop, Android-width and iPhone-width layouts separately.
- UI changes must not modify business logic unintentionally.
- Complete functional work first unless a UI issue would cause immediate rework.
- Report layouts must use the REDS report palette and structure described here.