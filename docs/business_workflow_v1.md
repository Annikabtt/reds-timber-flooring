# REDS Timber Flooring - Business Workflow V1

## Purpose

This document defines the main business workflow for the REDS Timber Flooring WebApp.

The goal is to make the system usable for real daily operations before adding advanced features.

---

## MVP Workflow

### 1. Create Customer

The system starts by creating or selecting a customer.

Customer information includes:

* Customer name
* Phone
* Email
* Billing address
* Site address
* Customer type

Customer type examples:

* Walk-in Client
* Residential Client
* Commercial Client
* Builder / Contractor
* Interior Designer
* VIP / Friends & Family
Customer Type is used for customer classification only.

Pricing must be controlled by Price Books.

Customer Type and Pricing Structure are independent.

Example:

A Residential customer normally uses Residential Standard Price Book.

A Commercial customer normally uses Commercial Standard Price Book.

However, a customer can be assigned to a different Price Book if special pricing is required.

---

### 2. Create Project

Each job must belong to one project.

Project information includes:

* Project name
* Customer
* Site address
* Project type
* Start date
* Expected finish date
* Project status

Project types:

* Residential
* Commercial

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

### 3. Create Quotation

A quotation is created before work starts.

Quotation must support:

* Material lines
* Labour lines
* Variation lines
* GST
* Grand total

Each quotation line must include:

* Description
* Qty
* Unit
* Unit price
* Amount
* GST rate
* Account code for Xero

---

### 4. Accept Quotation

After the customer accepts the quotation, the project becomes active.

The system should record:

* Accepted date
* Accepted by
* Deposit required
* Deposit paid status
---

### 5. Project Scheduling

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

### 6. Assign Job

Admin or owner assigns the job to installer or team.

Assignment information includes:

* Project
* Installer / team
* Planned start date
* Planned finish date
* Job notes

---

### 7. Material Request

Installer can request materials from mobile app.

Material request includes:

* Project
* Requested by
* Material
* Qty
* Unit
* Notes
* Request status

Request statuses:

* Draft
* Submitted
* Approved
* Rejected
* Issued

---

### 8. Daily Site Report

Installer submits daily work report from mobile app.

Daily report includes:

* Project
* Work date
* Installer / staff
* Work description
* Hours worked
* Completed SQM
* Materials used
* Photos
* Notes
* Progress percentage

Daily report statuses:

* Draft
* Submitted
* Approved
* Rejected

---

### 9. Payroll Calculation

Payroll is calculated from approved daily reports and manual payroll adjustments.

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

Each staff member can have a default payroll method, but the payroll method can be overridden per project or per payroll line if required.

Payroll must support:

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

UX rule:

The user must select the payroll method first.

The form must only show fields related to the selected payroll method.

Example:

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

### 10. Project Progress Tracking

Owner dashboard must show project progress.

Progress information includes:

* Current project status
* Completed stages
* Progress percentage
* Daily reports
* Photos
* Installer notes

---

### 11. Variation

Any extra work outside the original quotation must be recorded as variation.

Examples:

* Floor levelling
* Grinding
* Moisture barrier
* Carpet removal
* Furniture moving
* Extra skirting
* Additional rooms

Variation must include:

* Project
* Description
* Cost amount
* Sell amount
* Customer approval status
* Invoice status

Variation must not be merged into the original quotation.

---

### 12. Invoice

Invoice can be created from:

* Accepted quotation
* Monthly claim
* Progress claim
* Final invoice
* Approved variation

Invoice line must include:

* Description
* Qty
* Unit
* Unit price
* Amount
* GST rate
* Account code for Xero

---

### 13. Xero Export

The system must export invoice and quotation data for Xero.

Required Xero line fields:

* Description
* Qty
* Unit Price
* Amount
* GST / Tax Type
* Account Code
* Customer
* Invoice Number
* Invoice Date
* Due Date

---

### 14. Close Project

Project can be closed only when:

* Work is completed
* Daily reports are approved
* Payroll is checked
* Materials are recorded
* Invoice is created
* Customer sign-off is completed if required

---

## Phase 1 Priority

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

## Not Included in Phase 1

These features are planned for later:

* Public website
* Product showroom
* Customer product catalog
* AI room visualizer
* Customer self-service quote builder
* Marketing pages
