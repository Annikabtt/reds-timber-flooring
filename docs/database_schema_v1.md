# Database Schema V1

## Purpose

This document defines the database structure for REDS Timber Flooring.

The database must support:

* Daily Site Reports
* Payroll
* Project Tracking
* Material Tracking
* Quotations
* Invoices
* Variations
* Xero Export
* Executive Dashboard

---

# Core Modules

## Master Data

* customers
* customer_contacts
* staff
* staff_rates
* materials
* material_categories
* suppliers
- price_books
- price_book_lines
price_book_id

Type:
UUID

FK → price_books.price_book_id

Nullable.

Description:
Default price book assigned to this customer.

Customer Contact Rule

A customer may have multiple contact persons.

Contacts must not be stored directly in customers.

Contacts must be stored in customer_contacts.

Examples:

- Estimator
- Project Manager
- Site Supervisor
- Accounts Payable

Customer Address Rule

A customer may have multiple addresses.

Addresses must not be stored directly in customers.

Addresses must be stored in customer_addresses.

Address types:

- Billing
- Site
- Postal
- Office

A project must be able to link to a site address.

---

## Project Management

* projects
* project_stages
* project_assignments
* project_schedules
- project_sites
- project_areas
- project_progress_claims

---

Project hierarchy:

Customer
→ Project
→ Site
→ Area / Room

This structure allows partial completion, monthly progress claims, room-level tracking, site-level tracking, and project-level profit analysis.

---

## Site Operations

* daily_reports
* daily_report_workers
* daily_report_photos

---

## Material Control

* material_requests
* material_transactions
Material sourcing rule:

A material is stored once in materials.

Supplier options must be linked through material_supplier_links.

The same material can be supplied by multiple suppliers.

Purchase orders select the supplier at order time.

Do not duplicate material records by supplier name.


Material/Procurement:
- material_supplier_links
- purchase_orders
- purchase_order_lines
- supplier_deliveries
- consumable_requests
- consumable_issues

---

## Payroll

* payroll_periods
* payroll_lines

---

## Sales

* quotations
* quotation_lines

Quotation rule:

quotations stores the current quotation summary and approval status.

quotation_lines stores the current active quotation lines.

quotation_revisions stores quotation history.

quotation_revision_lines stores line items for each revision.

Never overwrite quotation history.

When a quotation is revised, create a new revision record.

The accepted quotation version must be traceable.

---

## Variations

* variations
* variation_lines

---

## Billing

* invoices
* invoice_lines
- quotation_revisions
- quotation_revision_lines

Invoice rule:

Invoices must support multiple source types.

Supported invoice source types:

- Accepted Quotation
- Monthly Progress Claim
- Actual Material Usage
- Actual Labour Usage
- Approved Variation
- Manual Invoice Line

invoices stores the invoice header and totals.

invoice_lines stores the invoice line items.

invoice_sources links an invoice back to the source records used to create it.

Do not assume that every invoice comes from a quotation only.


---

## Finance

* payments

---

## Integrations

* xero_exports

---

## System

* profiles
* user_roles
* settings

---
# Table: customers

## Purpose

Stores customer master records.

A customer can own one or many projects.

A customer must never be duplicated.

---

## Columns

customer_id

Type:
UUID

Description:
Primary key.

---

customer_code

Type:
TEXT

Description:
Human readable customer code.

Example:

CUS-00001

Unique.

---

customer_type

Type:
TEXT

Values:

* Residential
* Commercial
* Builder
* Designer
* VIP

---

customer_name

Type:
TEXT

Required.

---

company_name

Type:
TEXT

Nullable.

Used for commercial customers.

---

abn

Type:
TEXT

Nullable.

Australian Business Number.

---

email

Type:
TEXT

Nullable.

---

phone

Type:
TEXT

Nullable.

---

billing_address

Type:
TEXT

Nullable.

---

site_address

Type:
TEXT

Nullable.

---

suburb

Type:
TEXT

Nullable.

---

state

Type:
TEXT

Nullable.

---

postcode

Type:
TEXT

Nullable.

---

status

Type:
TEXT

Values:

* Active
* Inactive

Default:

Active

---

notes

Type:
TEXT

Nullable.

---

created_at

Type:
TIMESTAMPTZ

---

updated_at

Type:
TIMESTAMPTZ

---

created_by

Type:
UUID

FK → profiles.id

---

updated_by

Type:
UUID

FK → profiles.id

Nullable.

---

is_deleted

Type:
BOOLEAN

Default:

false

---

## Indexes

customer_code

email

phone

customer_name

---

## Future Expansion

Customer Portal

Customer Sign-Off

Customer Quotation Approval

Customer Invoice History
