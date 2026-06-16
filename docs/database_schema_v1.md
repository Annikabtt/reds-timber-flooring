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

## Site Operations

* daily_reports
* daily_report_workers
* daily_report_photos

---

## Material Control

* material_requests
* material_transactions

---

## Payroll

* payroll_periods
* payroll_lines

---

## Sales

* quotations
* quotation_lines

---

## Variations

* variations
* variation_lines

---

## Billing

* invoices
* invoice_lines

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
