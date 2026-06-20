# REDS Timber Flooring - Business Workflow V1

## Purpose

This document defines the main business workflow for the REDS Timber Flooring WebApp.

The goal is to make the system usable for real daily operations before adding advanced features.

---

# Phase 1 Goal

Phase 1 must replace daily WhatsApp-based operation reporting with a structured mobile workflow.

The system must make field reporting easier for staff while giving management clear project, material, payroll, billing, and cash flow visibility.

---

# Core Business Structure

## Project Hierarchy

Customer
→ Project
→ Site
→ Area / Room

This structure allows:

- Partial completion tracking
- Room-level progress tracking
- Site-level progress tracking
- Project-level profit analysis
- Monthly progress claims
- Flexible invoice sources
- Payroll and material cost allocation

---

# MVP Workflow

## 1. Create Customer

The system starts by creating or selecting a customer.

Customer information includes:

- Customer name
- Phone
- Email
- Billing address
- Site address
- Customer type

Customer type examples:

- Walk-in Client
- Residential Client
- Commercial Client
- Builder / Contractor
- Interior Designer
- VIP / Friends & Family

Customer Type is used for customer classification only.

Pricing must be controlled by Price Books.

Customer Type and Pricing Structure are independent.

Example:

A Residential customer normally uses Residential Standard Price Book.

A Commercial customer normally uses Commercial Standard Price Book.

However, a customer can be assigned to a different Price Book if special pricing is required.

---

## 2. Create Project

Each job must belong to one project.

Project information includes:

- Project name
- Customer
- Site address
- Project type
- Start date
- Expected finish date
- Project status

Project types:

- Residential
- Commercial

Project statuses:

- Lead
- Quoted
- Accepted
- Deposit Received
- Scheduled
- Material Ordered
- Ready To Start
- In Progress
- Practical Completion
- Invoiced
- Paid
- Closed
- Cancelled

---

## 3. Create Quotation

A quotation is created before work starts.

Quotation must support:

- Material lines
- Labour lines
- Variation lines
- GST
- Grand total

Each quotation line must include:

- Description
- Qty
- Unit
- Unit price
- Amount
- GST rate
- Account code for Xero

### Quotation Rule

quotations stores the current quotation summary and approval status.

quotation_lines stores the current active quotation lines.

quotation_revisions stores quotation history.

quotation_revision_lines stores line items for each revision.

Never overwrite quotation history.

When a quotation is revised, create a new revision record.

The accepted quotation version must be traceable.

---

## 4. Accept Quotation

After the customer accepts the quotation, the project becomes active.

The system should record:

- Accepted date
- Accepted by
- Deposit required
- Deposit paid status

---

## 5. Project Scheduling

After quotation acceptance and deposit confirmation, the project enters scheduling.

Scheduling information includes:

- Scheduled start date
- Scheduled finish date
- Assigned team
- Material readiness status
- Customer confirmation status

Scheduling statuses:

- Pending
- Confirmed
- Ready
- Delayed
- Rescheduled

No job should be assigned until scheduling is confirmed.

---

## 6. Assign Job

Admin or owner assigns the job to installer or team.

Assignment information includes:

- Project
- Site
- Area / Room
- Work order
- Installer / staff / team
- Planned start date
- Planned finish date
- Job notes

A work order is the main record used to replace WhatsApp job instructions.

---

## 7. Material Request

Installer can request materials from mobile app.

Material request includes:

- Project
- Site
- Area / Room
- Work Order
- Requested by
- Material
- Qty
- Unit
- Notes
- Request status

Request statuses:

- Draft
- Submitted
- Approved
- Rejected
- Partially Issued
- Issued
- Received
- Cancelled

### Material Request Rules

- A stock request can reference Project directly.
- A stock request can reference Site.
- A stock request can reference Area.
- A stock request can reference Work Order.
- Area and Work Order are optional to support general site requests.
- Requested quantity may differ from approved quantity.
- Approved quantity may differ from issued quantity.
- Issued quantity may differ from received quantity.
- Request status must follow workflow.
- Material value should be reusable for project cost calculation in Phase 2.

### Material Sourcing Rule

A material or product is stored once in products.

Supplier options must be linked through material_supplier_links.

The same product can be supplied by multiple suppliers.

Purchase orders select the supplier at order time.

Do not duplicate material records by supplier name.

---

## 8. Daily Site Report

Installer submits daily work report from mobile app.

Daily report includes:

- Project
- Site
- Area / Room
- Work Order
- Work date
- Installer / staff
- Work description
- Hours worked
- Completed SQM
- Materials used
- Photos
- Notes
- Progress percentage

Daily report statuses:

- Draft
- Submitted
- Approved
- Rejected

### Daily Report Rules

- Daily report must belong to a work order.
- Report date is the real working date and replaces WhatsApp date reference.
- Daily report should require at least one site photo before submission.
- If work status is Completed, at least one After photo should be required.
- If work status is Blocked, issue type or issue note should be required.
- Dropdown values must not be hard coded.

---

## 9. Payroll Calculation

Payroll is calculated from approved daily reports, work time logs, work assignments, and manual payroll adjustments.

The system must support multiple payroll calculation methods, even if only some methods are used in Phase 1.

Supported payroll methods:

- Hourly
- SQM Rate
- Fixed Job
- Daily Rate
- Team Rate
- Allowance
- Bonus
- Deduction

Each staff member can have a default payroll method.

The payroll method can be overridden per project, per work order, or per payroll line if required.

### Payroll Must Support

- Hours worked
- Completed SQM
- Fixed amount
- Daily amount
- Team amount
- Bonus amount
- Deduction amount
- Partial payment
- Paid / unpaid status
- Payment date
- Notes

### Payroll UX Rule

The user must select the payroll method first.

The form must only show fields related to the selected payroll method.

Examples:

If payroll method is Hourly, show only:

- Hours worked
- Hourly rate

If payroll method is SQM Rate, show only:

- Completed SQM
- Rate per SQM

If payroll method is Fixed Job, show only:

- Fixed amount

If payroll method is Team Rate, show only:

- Team
- Total team amount
- Split method

The database must support all payroll methods, but the UI must stay simple.

---

## 10. Project Progress Tracking

Owner dashboard must show project progress.

Progress information includes:

- Current project status
- Completed stages
- Progress percentage
- Daily reports
- Photos
- Installer notes
- Work orders
- Material request status

---

## 11. Variation

Any extra work outside the original quotation must be recorded as variation.

Examples:

- Floor levelling
- Grinding
- Moisture barrier
- Carpet removal
- Furniture moving
- Extra skirting
- Additional rooms

Variation must include:

- Project
- Description
- Cost amount
- Sell amount
- Customer approval status
- Invoice status

Variation must not be merged into the original quotation.

---

## 12. Invoice

Invoice can be created from:

- Accepted quotation
- Monthly claim
- Progress claim
- Final invoice
- Approved variation
- Actual material usage
- Actual labour usage
- Manual invoice line

Invoice line must include:

- Description
- Qty
- Unit
- Unit price
- Amount
- GST rate
- Account code for Xero

### Invoice Rule

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

## 13. Xero Export

The system must export invoice and quotation data for Xero.

Required Xero line fields:

- Description
- Qty
- Unit Price
- Amount
- GST / Tax Type
- Account Code
- Customer
- Invoice Number
- Invoice Date
- Due Date

Phase 1 may start with export file format before direct Xero API integration.

---

## 14. Close Project

Project can be closed only when:

- Work is completed
- Daily reports are approved
- Payroll is checked
- Materials are recorded
- Invoice is created
- Customer sign-off is completed if required

---

# Customer Rules

## Customer Contact Rule

A customer may have multiple contact persons.

Contacts must not be stored directly in customers.

Contacts must be stored in customer_contacts.

Contact examples:

- Estimator
- Project Manager
- Site Supervisor
- Accounts Payable

## Customer Address Rule

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

# Cash Flow Rules

The system must track both expected cash inflow and expected cash outflow.

Executive dashboard must show upcoming cash inflow and cash outflow.

Cash inflow includes:

- Customer deposit due
- Progress claim due
- Invoice payment due
- Customer payment due
- Expected customer receipt date
- Accounts receivable overdue

Cash outflow includes:

- Payroll due
- Supplier payment due
- Material payment due
- Other project cost due

Cash flow must be calculated by date range.

## Customer Payment Rules

The system must support one invoice receiving multiple payments.

Examples:

- Deposit
- Progress Payment
- Final Payment
- Adjustment

One payment must belong to one invoice.

Invoice status must be calculated automatically.

Examples:

Invoice Total:
20,000

Payments:
5,000
+
10,000
+
5,000

Invoice Status:
Paid

If total payments are less than invoice total:

Invoice Status:
Partially Paid

Payment methods must be configurable through dropdown options.

Supported methods:

- Bank Transfer
- Credit Card
- Cash
- Cheque
- EFTPOS
- Other

Payment methods must not be hard coded.

The system must support future payment methods without database changes.

---

# Executive Dashboard Rules

Executive dashboard should show:

- Active projects
- Projects in progress
- Work orders in progress
- Daily reports waiting for approval
- Material requests waiting for approval
- Payroll due
- Supplier payment due
- Customer payment due
- Unbilled work
- Under quoted projects
- Variation pending approval
- Upcoming cash inflow
- Upcoming cash outflow

---

# Phase 1 Priority

The first usable version must focus on:

1. Daily Site Report
2. Payroll
3. Project Tracking
4. Material Usage
5. Quotation Lines
6. Invoice Lines
7. Xero Export
8. Executive Dashboard

---

# Not Included in Phase 1

These features are planned for later:

- Public website
- Product showroom
- Customer product catalog
- AI room visualizer
- Customer self-service quote builder
- Marketing pages
- Full accounting system
- Full inventory warehouse system
- Direct Xero API sync

# Future Roadmap - Phase 2
Purpose

Provides executive visibility into quotation performance, sales conversion, customer segments, pricing effectiveness, and business growth opportunities.

Used for:

Sales Planning
Margin Optimization
Customer Analysis
Market Segment Analysis
Executive Decision Making
---
Quotation Segmentation

Quotation numbers should identify customer segment.

Examples:

QT-S1-2606-00001
QT-S2-2606-00001
QT-S3-2606-00001
QT-S4-2606-00001
QT-S5-2606-00001
---
Segment Definitions:

S1 = Retail

S2 = Builder

S3 = Commercial

S4 = VIP

S5 = Promotion
---
Future Table Fields
quotations.quotation_segment

Type:
TEXT

Examples:

Retail
Builder
Commercial
VIP
Promotion

Used for:

Dashboard Reporting
AI Analysis
Sales Performance Tracking
---
quotations.quotation_source

Type:
TEXT

Examples:

Website
Google Ads
Facebook
Instagram
Referral
Builder Referral
Repeat Customer
Phone Call
Walk In

Used for:

Marketing Analysis
Lead Source Tracking
ROI Measurement
---
quotations.quotation_result

Type:
TEXT

Examples:

Won
Lost
Cancelled
Expired
Pending

Used for:

Win Rate Analysis
Sales Performance Reporting
---
quotations.lost_reason

Type:
TEXT

Examples:

Price Too High
Competitor Won
No Budget
No Response
Wrong Product
Client Delayed
Other

Used for:

Sales Improvement
Pricing Review
Competitor Analysis
---
# Phase 2 - AI Business Intelligence
Purpose

Uses historical business data to provide management recommendations.

Supports:

Executive Dashboard
Sales Forecasting
Margin Analysis
Supplier Analysis
Cash Flow Forecasting
---
AI Sales Analysis

Examples:

Builder Segment

Quotes:
45

Won:
30

Lost:
15

Win Rate:
66.7%

AI Recommendation:

Builder pricing performing above target.
Consider increasing marketing investment.
---
AI Pricing Analysis

Examples:

SPC Flooring Oak

Retail Win Rate:
42%

Builder Win Rate:
78%

AI Recommendation:

Retail pricing may be above market expectations.
Review retail pricing strategy.
---
AI Supplier Analysis

Examples:

Premium Floors

On-Time Delivery:
96%

Average Lead Time:
3 Days

AI Recommendation:

Increase purchasing allocation.
---
AI Project Profitability Analysis

Examples:

Project:
PRJ-2606-001

Revenue:
$85,000

Material Cost:
$32,000

Labour Cost:
$18,000

Gross Profit:
$35,000

Margin:
41%
---
AI Cash Flow Forecast

Examples:

Next 60 Days

Expected Receipts:
$180,000

Expected Payments:
$240,000

Risk Level:
Medium

AI Recommendation:

Delay non-critical purchases.
Accelerate overdue invoice collection.
---
Future Executive Dashboard

Executive dashboard should display:

Sales Conversion Rate

Quote Win Rate

Revenue Forecast

Cash Flow Forecast

Top Customers

Top Suppliers

Project Profitability

Outstanding Invoices

Outstanding Purchase Orders

AI Recommendations
---
Implementation Phase
Phase 1
Project Management
Site Operations
Workforce
Payroll
Billing
Purchasing

Phase 2
Sales Intelligence
AI Business Intelligence
Executive Analytics
Forecasting