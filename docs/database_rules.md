# REDS Timber Flooring - Database Rules V1

## Purpose

This document defines business rules, validation rules, workflow rules, and calculation rules used by the REDS Timber Flooring system.

Database schema defines structure.

Database rules define behavior.

---

# Global Rules

## Soft Delete Rule

Business records must not be permanently deleted.

Records must use:

is_deleted = true

instead of physical deletion.

Applies to:

- customers
- projects
- work_orders
- daily_reports
- employees
- payroll records
- invoices

---

## Audit Rule

All major business tables should support:

created_at
updated_at

Where applicable:

created_by
updated_by

---

## Dropdown Rule

Dropdown values must not be hard coded.

Dropdown values should be managed through:

dropdown_options

Examples:

- Project Status
- Work Status
- Payroll Method
- Invoice Status
- Material Status

---

# Customer Rules

## Customer Contact Rule

A customer may have multiple contacts.

Contacts must be stored in:

customer_contacts

not inside customers.

---

## Customer Address Rule

A customer may have multiple addresses.

Addresses must be stored in:

customer_addresses

not inside customers.

---

# Project Rules

## Project Hierarchy Rule

Customer
→ Project
→ Site
→ Area

Projects cannot exist without a customer.

Sites cannot exist without a project.

Areas cannot exist without a site.

---

## Project Close Rule

A project may only be closed when:

- All work orders are completed
- All required invoices are issued
- Outstanding payroll is reviewed
- Outstanding material requests are resolved

Project Status:

Closed

cannot be selected if validation fails.

---

# Work Order Rules

## Assignment Rule

A work order may have multiple employees.

Employees are assigned through:

work_assignments

not directly through work_orders.

---

## Progress Rule

Work order progress should be calculated from approved daily reports.

Manual override should be restricted to management roles.

---

# Daily Report Rules

## Submission Rule

A daily report must belong to a work order.

A daily report must contain:

- Report Date
- Work Status

before submission.

---

## Photo Rule

At least one photo is recommended before submission.

If Work Status = Completed

At least one After photo should exist.

---

## Approval Rule

Only approved daily reports contribute to:

- Payroll
- Productivity reporting
- Project progress

---

# Material Rules

## Material Request Rule

A stock request may reference:

- Project
- Site
- Area
- Work Order

Area and Work Order are optional.

---

## Quantity Rule

Requested Qty
≠ Approved Qty
≠ Issued Qty
≠ Received Qty

All quantities must be stored separately.

---

## Supplier Rule

Products must exist only once.

Supplier relationships must be stored in:

material_supplier_links

The same product may have multiple suppliers.

---

# Payroll Rules

## Payroll Period Rule

Payroll periods support:

- Weekly
- 10 Days
- 15 Days
- Monthly
- Custom

Period length is determined by:

start_date
end_date

---

## Payroll Source Rule

Payroll may be generated from:

- Work Time Logs
- Daily Reports
- Work Orders
- Manual Entries

---

## Payment Rule

One payroll payment may pay multiple payroll entries.

One payroll entry may be paid by multiple payments.

Relationship stored through:

payroll_payment_lines

---

## Payroll Approval Rule

Only approved payroll entries may be paid.

---

# Invoice Rules

## Flexible Invoice Source Rule

Invoices may originate from:

- Quotation
- Progress Claim
- Variation
- Material Usage
- Labour Usage
- Work Order
- Manual Entry

Invoice source tracking must use:

invoice_sources

---

## Payment Rule

One invoice may receive multiple payments.

Payments stored in:

customer_payments

---

## Invoice Status Rule

Invoice status is calculated.

Examples:

Invoice Total = 20,000

Payments = 20,000

Status = Paid

---

Invoice Total = 20,000

Payments = 10,000

Status = Partially Paid

---

Invoice Total = 20,000

Payments = 0

Status = Sent

---

# Cash Flow Rules

## Cash Inflow Rule

Cash inflow includes:

- Deposits
- Progress Payments
- Final Payments
- Customer Payments

---

## Cash Outflow Rule

Cash outflow includes:

- Payroll Payments
- Supplier Payments
- Material Purchases
- Other Project Costs

---

## Dashboard Rule

Executive dashboard should display:

- Active Projects
- Work Orders In Progress
- Payroll Due
- Outstanding Invoices
- Upcoming Cash Inflow
- Upcoming Cash Outflow
- Unbilled Work
- Variation Pending Approval

---

# Future Rules

Reserved for:

- Inventory
- Purchase Orders
- Supplier Management
- Multi-Team Scheduling
- Direct Xero Integration