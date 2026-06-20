# Database Schema V1 — FINAL FOR SQL MIGRATION

## Purpose

This document defines the database structure for REDS Timber Flooring.

The database supports:

- Customer and supplier master data
- Project and site management
- Site operations and daily reporting
- Material requests, purchase orders, and supplier deliveries
- Workforce assignment and time logging
- Payroll
- Quotations and quotation revisions
- Variations
- Customer invoicing
- Customer payments and allocations
- Xero export audit logs
- Executive reporting and dashboard foundations

---

# Core Modules

## Master Data

- customers
- customer_contacts
- customer_addresses
- suppliers
- supplier_contacts
- supplier_addresses
- product_categories
- products
- price_books
- price_book_lines

## Project Management

- projects
- project_sites
- project_areas

## Site Operations

- work_orders
- daily_reports
- daily_report_photos

## Material Control

- stock_requests
- stock_request_items
- material_supplier_links
- purchase_orders
- purchase_order_lines
- supplier_deliveries
- supplier_delivery_photos

## Workforce

- employees
- work_assignments
- work_time_logs

## Payroll

- payroll_periods
- payroll_entries
- payroll_payments
- payroll_payment_lines

## Sales

- quotations
- quotation_lines
- quotation_revisions
- quotation_revision_lines

## Variations

- variations
- variation_lines

## Billing

- customer_invoices
- customer_invoice_items
- invoice_sources

## Finance

- customer_payments
- customer_payment_allocations

## Integrations

- xero_export_logs

---

# Master Data

---

# Table: customers

## Purpose

Stores customer master records.

A customer can own one or many projects.

A customer must never be duplicated.

## Columns

### customer_id

Type:
UUID

Description:

Primary key.

---

### customer_code

Type:
TEXT

Unique.

Example:

CUS-00001

Description:

Human-readable customer code.

---

### customer_type

Type:
TEXT

Required.

Examples:

- Residential
- Commercial
- Builder
- Designer
- VIP

Description:

Customer classification.

---

### customer_name

Type:
TEXT

Required.

Description:

Customer display name.

---

### company_name

Type:
TEXT

Nullable.

Description:

Company name for commercial or builder customers.

---

### abn

Type:
TEXT

Nullable.

Description:

Australian Business Number.

---

### email

Type:
TEXT

Nullable.

Description:

Primary customer email.

---

### phone

Type:
TEXT

Nullable.

Description:

Primary customer phone.

---

### status

Type:
TEXT

Default:
Active

Examples:

- Active
- Inactive

Description:

Customer status.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created the record.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated the record.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple contacts.

One customer can have multiple addresses.

One customer can have multiple projects.

Customer code must be unique.

Soft delete must be used instead of physical delete.

---

# Table: customer_contacts

## Purpose

Stores customer contact persons.

A customer can have multiple contacts.

Contacts must not be stored directly in customers.

## Columns

### customer_contact_id

Type:
UUID

Description:

Primary key.

---

### customer_id

Type:
UUID

FK → customers.customer_id

Required.

Description:

Parent customer.

---

### contact_name

Type:
TEXT

Required.

Description:

Contact person name.

---

### contact_role

Type:
TEXT

Nullable.

Examples:

- Director
- Owner
- Estimator
- Project Manager
- Site Supervisor
- Accounts Payable

Description:

Role of this contact.

---

### phone

Type:
TEXT

Nullable.

Description:

Contact phone.

---

### mobile

Type:
TEXT

Nullable.

Description:

Contact mobile phone.

---

### email

Type:
TEXT

Nullable.

Description:

Contact email.

---

### is_primary_contact

Type:
BOOLEAN

Default:
false

Description:

Marks primary contact for this customer.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple contacts.

Only one primary contact should exist per customer unless business rules allow otherwise.

Customer deletion must not physically delete customer contacts.

Soft delete must be used instead of physical delete.

---

# Table: customer_addresses

## Purpose

Stores customer addresses.

A customer can have multiple addresses.

Addresses must not be stored directly in customers.

## Columns

### customer_address_id

Type:
UUID

Description:

Primary key.

---

### customer_id

Type:
UUID

FK → customers.customer_id

Required.

Description:

Parent customer.

---

### address_type

Type:
TEXT

Required.

Examples:

- Billing
- Site
- Postal
- Office

Description:

Address type.

---

### address_name

Type:
TEXT

Nullable.

Examples:

- Head Office
- Warehouse
- Main Site

Description:

Address label.

---

### address_line_1

Type:
TEXT

Required.

Description:

Main address line.

---

### address_line_2

Type:
TEXT

Nullable.

Description:

Additional address line.

---

### suburb

Type:
TEXT

Nullable.

Description:

Suburb.

---

### state

Type:
TEXT

Nullable.

Description:

State.

---

### postcode

Type:
TEXT

Nullable.

Description:

Postcode.

---

### country

Type:
TEXT

Default:
Australia

Description:

Country.

---

### is_primary

Type:
BOOLEAN

Default:
false

Description:

Primary address flag.

---

### google_map_url

Type:
TEXT

Nullable.

Description:

Map link.

---

### access_note

Type:
TEXT

Nullable.

Description:

Site access instructions.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple addresses.

Only one primary address per address type should exist per customer.

Customer deletion must not physically delete customer addresses.

Soft delete must be used instead of physical delete.

---

# Table: suppliers

## Purpose

Stores supplier master records.

Suppliers provide products, consumables, tools, transport services, subcontract services, and other materials.

A supplier must exist only once in the system.

Supplier contacts and addresses must not be duplicated inside this table.

## Columns

### supplier_id

Type:
UUID

Description:

Primary key.

---

### supplier_code

Type:
TEXT

Unique.

Example:

SUP-00001

Description:

Human-readable supplier code.

---

### supplier_name

Type:
TEXT

Required.

Description:

Trading name or supplier name.

---

### supplier_type

Type:
TEXT

Required.

Examples:

- Material Supplier
- Equipment Supplier
- Transport Provider
- Subcontractor
- Service Provider
- Other

Description:

Supplier classification.

---

### company_name

Type:
TEXT

Nullable.

Description:

Registered company name.

---

### abn

Type:
TEXT

Nullable.

Description:

Australian Business Number.

---

### email

Type:
TEXT

Nullable.

Description:

Primary supplier email.

---

### phone

Type:
TEXT

Nullable.

Description:

Primary supplier phone.

---

### website

Type:
TEXT

Nullable.

Description:

Supplier website.

---

### payment_terms

Type:
TEXT

Nullable.

Examples:

- COD
- 7 Days
- 14 Days
- 30 Days
- 60 Days

Description:

Supplier payment terms.

---

### credit_limit

Type:
NUMERIC(12,2)

Nullable.

Description:

Approved supplier credit limit.

---

### supplier_status

Type:
TEXT

Default:
Active

Examples:

- Active
- Inactive
- Blacklisted

Description:

Supplier status.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this supplier.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this supplier.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One supplier can have multiple contacts.

One supplier can have multiple addresses.

Supplier code must be unique.

Soft delete must be used instead of physical delete.

---

# Table: supplier_contacts

## Purpose

Stores supplier contact persons.

A supplier can have multiple contacts.

Contacts must not be stored directly in suppliers.

## Columns

### supplier_contact_id

Type:
UUID

Description:

Primary key.

---

### supplier_id

Type:
UUID

FK → suppliers.supplier_id

Required.

Description:

Parent supplier.

---

### contact_name

Type:
TEXT

Required.

Description:

Contact person name.

---

### contact_role

Type:
TEXT

Nullable.

Examples:

- Sales Representative
- Account Manager
- Accounts Payable
- Warehouse Manager
- Delivery Coordinator

Description:

Role of this contact.

---

### phone

Type:
TEXT

Nullable.

Description:

Contact phone.

---

### mobile

Type:
TEXT

Nullable.

Description:

Contact mobile phone.

---

### email

Type:
TEXT

Nullable.

Description:

Contact email.

---

### is_primary_contact

Type:
BOOLEAN

Default:
false

Description:

Primary contact flag.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One supplier can have multiple contacts.

Only one primary contact should exist per supplier unless business rules allow otherwise.

Supplier deletion must not physically delete supplier contacts.

Soft delete must be used instead of physical delete.

---

# Table: supplier_addresses

## Purpose

Stores supplier addresses.

A supplier can have multiple addresses.

Addresses must not be stored directly in suppliers.

## Columns

### supplier_address_id

Type:
UUID

Description:

Primary key.

---

### supplier_id

Type:
UUID

FK → suppliers.supplier_id

Required.

Description:

Parent supplier.

---

### address_type

Type:
TEXT

Required.

Examples:

- Head Office
- Warehouse
- Distribution Centre
- Pickup Location
- Returns Address

Description:

Address type.

---

### address_name

Type:
TEXT

Nullable.

Examples:

- Sydney Warehouse
- Melbourne Distribution Centre
- Main Office

Description:

Address label.

---

### address_line_1

Type:
TEXT

Required.

Description:

Main address line.

---

### address_line_2

Type:
TEXT

Nullable.

Description:

Additional address line.

---

### suburb

Type:
TEXT

Nullable.

Description:

Suburb.

---

### state

Type:
TEXT

Nullable.

Description:

State.

---

### postcode

Type:
TEXT

Nullable.

Description:

Postcode.

---

### country

Type:
TEXT

Default:
Australia

Description:

Country.

---

### is_primary

Type:
BOOLEAN

Default:
false

Description:

Primary supplier address flag.

---

### google_map_url

Type:
TEXT

Nullable.

Description:

Map link.

---

### delivery_note

Type:
TEXT

Nullable.

Description:

Delivery instruction.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One supplier can have multiple addresses.

Only one primary address per address type should exist per supplier.

Supplier deletion must not physically delete supplier addresses.

Soft delete must be used instead of physical delete.

---

# Table: product_categories

## Purpose

Stores product category master records.

Used for product classification, reporting, quotation grouping, inventory reporting, and purchasing.

## Columns

### product_category_id

Type:
UUID

Description:

Primary key.

---

### category_code

Type:
TEXT

Unique.

Example:

CAT-SPC

Description:

Category code.

---

### category_name

Type:
TEXT

Required.

Examples:

- SPC Flooring
- Engineered Timber
- Solid Timber
- Laminate Flooring
- Skirting
- Adhesive
- Underlay
- Consumables

Description:

Category name.

---

### parent_category_id

Type:
UUID

FK → product_categories.product_category_id

Nullable.

Description:

Parent category for hierarchy.

---

### sort_order

Type:
INTEGER

Nullable.

Description:

Display order.

---

### is_active

Type:
BOOLEAN

Default:
true

Description:

Active flag.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One product category can have many products.

A category can have a parent category.

Category code must be unique.

Inactive categories must not be used for new products.

Soft delete must be used instead of physical delete.

---

# Table: products

## Purpose

Stores material and product master records.

Products are referenced by quotations, material requests, purchase orders, invoices, inventory, and reporting.

A product must exist only once.

Supplier information must not be duplicated inside products.

## Columns

### product_id

Type:
UUID

Description:

Primary key.

---

### product_code

Type:
TEXT

Unique.

Example:

PRD-00001

Description:

Product code.

---

### product_category_id

Type:
UUID

FK → product_categories.product_category_id

Required.

Description:

Product category.

---

### product_name

Type:
TEXT

Required.

Description:

Product name.

---

### product_description

Type:
TEXT

Nullable.

Description:

Product description.

---

### brand

Type:
TEXT

Nullable.

Description:

Product brand.

---

### unit_name

Type:
TEXT

Required.

Examples:

- sqm
- box
- piece
- tube
- roll
- litre

Description:

Default unit of measure.

---

### default_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Default estimated cost.

---

### default_sell_price

Type:
NUMERIC(12,2)

Nullable.

Description:

Default selling price.

---

### is_stock_item

Type:
BOOLEAN

Default:
true

Description:

Indicates whether stock is tracked.

---

### is_active

Type:
BOOLEAN

Default:
true

Description:

Active flag.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

Product code must be unique.

Products must retain historical pricing snapshots in documents.

Supplier-specific pricing must be stored in material_supplier_links or purchase documents.

Inactive products must not be used for new sales or purchase documents.

Soft delete must be used instead of physical delete.

---

# Table: price_books

## Purpose

Stores pricing groups used for quotations, sales, and project estimation.

A price book defines a pricing strategy for a specific customer group, market segment, promotion, or sales campaign.

## Columns

### price_book_id

Type:
UUID

Description:

Primary key.

---

### price_book_code

Type:
TEXT

Unique.

Examples:

- PB-RETAIL
- PB-BUILDER
- PB-COMMERCIAL
- PB-VIP
- PB-PROMO

Description:

Price book code.

---

### price_book_name

Type:
TEXT

Required.

Description:

Price book name.

---

### price_book_type

Type:
TEXT

Required.

Examples:

- Retail
- Builder
- Commercial
- VIP
- Promotion
- Contract

Description:

Price book type.

---

### effective_from

Type:
DATE

Nullable.

Description:

Price effective start date.

---

### effective_until

Type:
DATE

Nullable.

Description:

Price expiration date.

---

### is_default

Type:
BOOLEAN

Default:
false

Description:

Default price book flag.

---

### price_book_status

Type:
TEXT

Default:
Active

Examples:

- Draft
- Active
- Expired
- Archived

Description:

Price book status.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this price book.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this price book.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One price book can have multiple price book lines.

Only one default price book should exist at a time.

Expired price books must not be selectable for new quotations.

Historical quotations must retain original price snapshots even if price books change later.

Soft delete must be used instead of physical delete.

---

# Table: price_book_lines

## Purpose

Stores pricing line records within a price book.

Price book lines define selling prices, estimated costs, and pricing rules for products, materials, labour, transport, and services.

Quotation pricing may be generated from price book lines, but quotation records must retain their own pricing snapshots.

## Columns

### price_book_line_id

Type:
UUID

Description:

Primary key.

---

### price_book_id

Type:
UUID

FK → price_books.price_book_id

Required.

Description:

Parent price book.

---

### line_no

Type:
INTEGER

Required.

Description:

Line sequence number.

---

### item_type

Type:
TEXT

Required.

Examples:

- Product
- Material
- Labour
- Transport
- Service

Description:

Type of pricing item.

---

### product_id

Type:
UUID

FK → products.product_id

Nullable.

Description:

Referenced product.

Can be null for labour, transport, or service pricing.

---

### item_code

Type:
TEXT

Nullable.

Description:

Item code used for search and reporting.

---

### item_name

Type:
TEXT

Required.

Description:

Item description.

---

### uom

Type:
TEXT

Nullable.

Examples:

- sqm
- m
- pcs
- lot
- day

Description:

Unit of measure.

---

### standard_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Estimated standard cost.

---

### selling_price

Type:
NUMERIC(12,2)

Required.

Description:

Default selling price.

---

### minimum_price

Type:
NUMERIC(12,2)

Nullable.

Description:

Minimum allowable selling price.

---

### margin_percent

Type:
NUMERIC(5,2)

Nullable.

Description:

Target margin percentage.

---

### effective_from

Type:
DATE

Nullable.

Description:

Price effective start date.

---

### effective_until

Type:
DATE

Nullable.

Description:

Price expiration date.

---

### is_active

Type:
BOOLEAN

Default:
true

Description:

Active flag.

---

### remarks

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One price book can have multiple price book lines.

One product can appear in multiple price books.

Product ID can be nullable for labour, transport, or service pricing.

Selling price must be greater than or equal to zero.

Historical quotations must not be updated when price book lines change.

Inactive price book lines must not be used for new quotations.

Soft delete must be used instead of physical delete.

---

# Project Management

---

# Table: projects

## Purpose

Stores project master records.

A project belongs to one customer.

A project can have one or many sites.

## Columns

### project_id

Type:
UUID

Description:

Primary key.

---

### project_code

Type:
TEXT

Unique.

Example:

PRJ2606-00001

Description:

Project document number.

---

### customer_id

Type:
UUID

FK → customers.customer_id

Required.

Description:

Parent customer.

---

### project_name

Type:
TEXT

Required.

Description:

Project name.

---

### project_type

Type:
TEXT

Nullable.

Examples:

- Residential
- Commercial

Description:

Project type.

---

### project_status

Type:
TEXT

Default:
Lead

Examples:

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

Description:

Project status.

---

### expected_start_date

Type:
DATE

Nullable.

Description:

Expected project start date.

---

### expected_end_date

Type:
DATE

Nullable.

Description:

Expected project end date.

---

### actual_start_date

Type:
DATE

Nullable.

Description:

Actual start date.

---

### actual_end_date

Type:
DATE

Nullable.

Description:

Actual end date.

---

### quoted_amount

Type:
NUMERIC(12,2)

Nullable.

Description:

Quoted amount.

---

### approved_contract_value

Type:
NUMERIC(12,2)

Nullable.

Description:

Approved contract value.

---

### internal_note

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### customer_note

Type:
TEXT

Nullable.

Description:

Customer-facing notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this project.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this project.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple projects.

Only accepted quotations should be converted into projects.

Project code must be unique.

Soft delete must be used instead of physical delete.

---

# Table: project_sites

## Purpose

Stores site records under a project.

A project can have one or many sites.

## Columns

### site_id

Type:
UUID

Description:

Primary key.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Parent project.

---

### site_name

Type:
TEXT

Required.

Examples:

- Main House
- Building A
- Unit 1203

Description:

Site name.

---

### site_type

Type:
TEXT

Nullable.

Examples:

- House
- Apartment
- Office
- Hotel
- Showroom
- Other

Description:

Site type.

---

### contact_person

Type:
TEXT

Nullable.

Description:

Site contact person.

---

### contact_phone

Type:
TEXT

Nullable.

Description:

Site contact phone.

---

### address_line

Type:
TEXT

Nullable.

Description:

Site address.

---

### suburb

Type:
TEXT

Nullable.

Description:

Suburb.

---

### state

Type:
TEXT

Nullable.

Description:

State.

---

### postcode

Type:
TEXT

Nullable.

Description:

Postcode.

---

### google_map_url

Type:
TEXT

Nullable.

Description:

Map link.

---

### access_note

Type:
TEXT

Nullable.

Description:

Site access notes.

---

### site_status

Type:
TEXT

Default:
Active

Examples:

- Active
- Paused
- Completed
- Cancelled

Description:

Site status.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this site.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this site.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One project can have multiple sites.

A site belongs to one project.

Soft delete must be used instead of physical delete.

---

# Table: project_areas

## Purpose

Stores area or room records under a project site.

An area is the smallest work location used for work orders, daily reports, material requests, payroll, progress tracking, and invoice sources.

## Columns

### area_id

Type:
UUID

Description:

Primary key.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Required.

Description:

Parent site.

---

### area_name

Type:
TEXT

Required.

Examples:

- Master Bedroom
- Living Room
- Staircase
- Hallway
- Balcony

Description:

Area or room name.

---

### area_type

Type:
TEXT

Nullable.

Examples:

- Bedroom
- Living Room
- Stair
- Corridor
- Outdoor
- Other

Description:

Area type.

---

### floor_level

Type:
TEXT

Nullable.

Description:

Floor level.

---

### width_m

Type:
NUMERIC(12,2)

Nullable.

Description:

Measured width in metres.

---

### length_m

Type:
NUMERIC(12,2)

Nullable.

Description:

Measured length in metres.

---

### measured_area_sqm

Type:
NUMERIC(12,2)

Nullable.

Description:

Measured area.

---

### chargeable_area_sqm

Type:
NUMERIC(12,2)

Nullable.

Description:

Chargeable area.

---

### waste_percent

Type:
NUMERIC(5,2)

Nullable.

Description:

Waste percentage.

---

### installation_method

Type:
TEXT

Nullable.

Examples:

- Glue Down
- Nail Down
- Floating
- Other

Description:

Installation method.

---

### substrate_type

Type:
TEXT

Nullable.

Examples:

- Concrete
- Plywood
- Existing Floor
- Other

Description:

Substrate type.

---

### area_status

Type:
TEXT

Default:
Draft

Examples:

- Draft
- Measured
- Assigned
- In Progress
- Completed
- Cancelled

Description:

Area status.

---

### progress_percent

Type:
NUMERIC(5,2)

Nullable.

Description:

Work progress percentage.

---

### note

Type:
TEXT

Nullable.

Description:

Internal note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this area.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this area.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One project site can have multiple areas.

Project ID is stored directly for reporting.

Soft delete must be used instead of physical delete.

---

# Site Operations

---

# Table: work_orders

## Purpose

Stores work orders assigned to employees, installers, subcontractors, or teams.

A work order connects project areas to daily reports, material requests, time logs, and payroll.

## Columns

### work_order_id

Type:
UUID

Description:

Primary key.

---

### work_order_no

Type:
TEXT

Unique.

Example:

WO2606-00001

Description:

Work order number.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Required.

Description:

Related site.

---

### area_id

Type:
UUID

FK → project_areas.area_id

Nullable.

Description:

Related area. Nullable when work order applies to whole site.

---

### assigned_employee_id

Type:
UUID

FK → employees.employee_id

Nullable.

Description:

Main responsible employee.

---

### assigned_team_id

Type:
UUID

Nullable.

Description:

Future team reference.

---

### work_type

Type:
TEXT

Required.

Examples:

- Site Check
- Floor Preparation
- Installation
- Sanding
- Coating
- Repair
- Final Inspection
- Other

Description:

Work type.

---

### work_title

Type:
TEXT

Required.

Description:

Work order title.

---

### work_description

Type:
TEXT

Nullable.

Description:

Work order description.

---

### planned_start_date

Type:
DATE

Nullable.

Description:

Planned start date.

---

### planned_end_date

Type:
DATE

Nullable.

Description:

Planned end date.

---

### actual_start_date

Type:
DATE

Nullable.

Description:

Actual start date.

---

### actual_end_date

Type:
DATE

Nullable.

Description:

Actual end date.

---

### planned_area_sqm

Type:
NUMERIC(12,2)

Nullable.

Description:

Planned area.

---

### completed_area_sqm

Type:
NUMERIC(12,2)

Nullable.

Description:

Completed area.

---

### progress_percent

Type:
NUMERIC(5,2)

Nullable.

Description:

Progress percentage.

---

### work_status

Type:
TEXT

Default:
Assigned

Examples:

- Draft
- Assigned
- In Progress
- Paused
- Completed
- Cancelled

Description:

Work order status.

---

### block_reason

Type:
TEXT

Nullable.

Description:

Reason work is blocked.

---

### priority

Type:
TEXT

Default:
Normal

Examples:

- Normal
- Urgent

Description:

Priority level.

---

### instruction_note

Type:
TEXT

Nullable.

Description:

Instruction for workers.

---

### internal_note

Type:
TEXT

Nullable.

Description:

Internal note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this work order.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this work order.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One project can have multiple work orders.

One work order can have multiple daily reports.

One work order can have multiple employee assignments.

Work order number must be unique.

Soft delete must be used instead of physical delete.

---

# Table: daily_reports

## Purpose

Stores daily site reports submitted from mobile.

A daily report must belong to a work order.

## Columns

### daily_report_id

Type:
UUID

Description:

Primary key.

---

### work_order_id

Type:
UUID

FK → work_orders.work_order_id

Required.

Description:

Related work order.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Required.

Description:

Related site.

---

### area_id

Type:
UUID

FK → project_areas.area_id

Nullable.

Description:

Related area.

---

### report_date

Type:
DATE

Required.

Description:

Actual working date.

---

### reported_by_employee_id

Type:
UUID

FK → employees.employee_id

Required.

Description:

Employee who submitted report.

---

### work_status

Type:
TEXT

Required.

Examples:

- Working
- Completed
- Blocked
- Waiting Material
- Waiting Client
- No Work

Description:

Work status for the day.

---

### progress_percent

Type:
NUMERIC(5,2)

Nullable.

Description:

Progress percentage.

---

### completed_area_sqm

Type:
NUMERIC(12,2)

Nullable.

Description:

Completed area.

---

### manpower_count

Type:
NUMERIC(12,2)

Nullable.

Description:

Number of workers on site.

---

### work_summary

Type:
TEXT

Nullable.

Description:

Summary of work performed.

---

### issue_type

Type:
TEXT

Nullable.

Description:

Issue type.

---

### issue_note

Type:
TEXT

Nullable.

Description:

Issue details.

---

### next_action

Type:
TEXT

Nullable.

Description:

Next action.

---

### weather_condition

Type:
TEXT

Nullable.

Description:

Weather condition.

---

### material_status

Type:
TEXT

Nullable.

Examples:

- Enough
- Shortage
- Waiting Delivery
- Damaged
- Not Required

Description:

Material status.

---

### submitted_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Submission timestamp.

---

### approval_status

Type:
TEXT

Default:
Draft

Examples:

- Draft
- Submitted
- Approved
- Rejected

Description:

Approval status.

---

### approved_by

Type:
UUID

Nullable.

Description:

Approver.

---

### approved_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Approval timestamp.

---

### reject_reason

Type:
TEXT

Nullable.

Description:

Rejection reason.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this daily report.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this daily report.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One work order can have multiple daily reports.

Daily reports should store project and site IDs directly for reporting.

Submitted daily reports should not be physically deleted.

Soft delete must be used instead of physical delete.

---

# Table: daily_report_photos

## Purpose

Stores photos attached to daily site reports.

One daily report can have many photos.

## Columns

### photo_id

Type:
UUID

Description:

Primary key.

---

### daily_report_id

Type:
UUID

FK → daily_reports.daily_report_id

Required.

Description:

Parent daily report.

---

### work_order_id

Type:
UUID

FK → work_orders.work_order_id

Required.

Description:

Related work order.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Required.

Description:

Related site.

---

### area_id

Type:
UUID

FK → project_areas.area_id

Nullable.

Description:

Related area.

---

### photo_url

Type:
TEXT

Required.

Description:

Photo URL.

---

### photo_type

Type:
TEXT

Required.

Examples:

- Before
- During
- After
- Issue
- Material
- Safety
- Other

Description:

Photo type.

---

### caption

Type:
TEXT

Nullable.

Description:

Photo caption.

---

### taken_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Photo taken timestamp.

---

### uploaded_by_employee_id

Type:
UUID

FK → employees.employee_id

Nullable.

Description:

Employee who uploaded the photo.

---

### uploaded_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Upload timestamp.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

## Business Rules

One daily report can have multiple photos.

Photos must not be physically deleted.

Soft delete must be used instead of physical delete.

---

# Material Control

---

# Table: stock_requests

## Purpose

Stores material requests from employees assigned to site operations.

A stock request can be linked to project, site, area, and work order.

## Columns

### stock_request_id

Type:
UUID

Description:

Primary key.

---

### stock_request_no

Type:
TEXT

Unique.

Example:

SR2606-00001

Description:

Stock request number.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Required.

Description:

Related site.

---

### area_id

Type:
UUID

FK → project_areas.area_id

Nullable.

Description:

Related area.

---

### work_order_id

Type:
UUID

FK → work_orders.work_order_id

Nullable.

Description:

Related work order.

---

### request_date

Type:
DATE

Required.

Description:

Request date.

---

### required_date

Type:
DATE

Nullable.

Description:

Required date.

---

### requested_by_employee_id

Type:
UUID

FK → employees.employee_id

Required.

Description:

Employee requesting materials.

---

### approved_by

Type:
UUID

Nullable.

Description:

Approver.

---

### issued_by

Type:
UUID

Nullable.

Description:

Issuer.

---

### received_by_employee_id

Type:
UUID

FK → employees.employee_id

Nullable.

Description:

Employee receiving materials.

---

### request_status

Type:
TEXT

Default:
Draft

Examples:

- Draft
- Submitted
- Approved
- Rejected
- Partially Issued
- Issued
- Received
- Cancelled

Description:

Request status.

---

### request_note

Type:
TEXT

Nullable.

Description:

Request note.

---

### approval_note

Type:
TEXT

Nullable.

Description:

Approval note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One project can have multiple stock requests.

One stock request can have multiple stock request items.

Stock request number must be unique.

Soft delete must be used instead of physical delete.

---

# Table: stock_request_items

## Purpose

Stores requested materials within a stock request.

One stock request can contain multiple products.

## Columns

### stock_request_item_id

Type:
UUID

Description:

Primary key.

---

### stock_request_id

Type:
UUID

FK → stock_requests.stock_request_id

Required.

Description:

Parent stock request.

---

### product_id

Type:
UUID

FK → products.product_id

Required.

Description:

Requested product.

---

### requested_qty

Type:
NUMERIC(12,2)

Required.

Description:

Requested quantity.

---

### approved_qty

Type:
NUMERIC(12,2)

Nullable.

Description:

Approved quantity.

---

### issued_qty

Type:
NUMERIC(12,2)

Nullable.

Description:

Issued quantity.

---

### received_qty

Type:
NUMERIC(12,2)

Nullable.

Description:

Received quantity.

---

### unit_name

Type:
TEXT

Required.

Description:

Unit of measure snapshot.

---

### unit_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Estimated unit cost.

---

### total_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Estimated total cost.

---

### item_note

Type:
TEXT

Nullable.

Description:

Item note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One stock request can have multiple stock request items.

Quantity fields must not be negative.

Soft delete must be used instead of physical delete.

---

# Table: material_supplier_links

## Purpose

Stores supplier-product relationships.

This table defines which suppliers can supply which products.

A product can be supplied by multiple suppliers.

A supplier can supply multiple products.

## Columns

### material_supplier_link_id

Type:
UUID

Description:

Primary key.

---

### product_id

Type:
UUID

FK → products.product_id

Required.

Description:

Related product.

---

### supplier_id

Type:
UUID

FK → suppliers.supplier_id

Required.

Description:

Related supplier.

---

### supplier_product_code

Type:
TEXT

Nullable.

Description:

Supplier product code.

---

### supplier_product_name

Type:
TEXT

Nullable.

Description:

Supplier product name.

---

### supplier_unit_name

Type:
TEXT

Nullable.

Description:

Supplier unit name.

---

### supplier_unit_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Latest supplier unit cost.

---

### last_purchase_date

Type:
DATE

Nullable.

Description:

Last purchase date.

---

### last_purchase_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Last purchase cost.

---

### minimum_order_qty

Type:
NUMERIC(12,2)

Nullable.

Description:

Minimum order quantity.

---

### lead_time_days

Type:
INTEGER

Nullable.

Description:

Estimated lead time.

---

### preferred_supplier

Type:
BOOLEAN

Default:
false

Description:

Preferred supplier flag.

---

### supplier_status

Type:
TEXT

Default:
Active

Examples:

- Active
- Inactive
- Discontinued

Description:

Supplier-product status.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this link.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this link.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One product can have multiple suppliers.

One supplier can supply multiple products.

Only one preferred supplier should exist per product.

The combination of product_id and supplier_id should be unique.

Historical purchase prices must remain in purchase order lines and must not change when supplier prices change.

Soft delete must be used instead of physical delete.

---

# Table: purchase_orders

## Purpose

Stores purchase order header records.

Purchase orders are created when REDS Timber Flooring orders products, consumables, tools, or services from suppliers.

A purchase order belongs to one supplier.

A purchase order can contain multiple purchase order lines.

## Columns

### purchase_order_id

Type:
UUID

Description:

Primary key.

---

### purchase_order_no

Type:
TEXT

Unique.

Example:

PO2606-00001

Description:

Purchase order number.

---

### supplier_id

Type:
UUID

FK → suppliers.supplier_id

Required.

Description:

Supplier.

---

### project_id

Type:
UUID

FK → projects.project_id

Nullable.

Description:

Related project. Nullable for general stock or office purchases.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Nullable.

Description:

Related site.

---

### order_date

Type:
DATE

Required.

Description:

Order date.

---

### expected_delivery_date

Type:
DATE

Nullable.

Description:

Expected delivery date.

---

### purchase_order_status

Type:
TEXT

Default:
Draft

Examples:

- Draft
- Sent
- Confirmed
- Partially Delivered
- Delivered
- Cancelled

Description:

Purchase order status.

---

### subtotal_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Subtotal amount.

---

### tax_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Tax amount.

---

### total_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Total amount.

---

### delivery_address

Type:
TEXT

Nullable.

Description:

Snapshot delivery address.

---

### supplier_reference_no

Type:
TEXT

Nullable.

Description:

Supplier reference number.

---

### note

Type:
TEXT

Nullable.

Description:

Internal note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this purchase order.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this purchase order.

---

### approved_by

Type:
UUID

Nullable.

Description:

Approver.

---

### approved_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Approval timestamp.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One purchase order belongs to one supplier.

One purchase order can contain multiple purchase order lines.

Purchase order prices must be stored as snapshots.

Updating product or supplier prices must not change old purchase orders.

A purchase order may be linked to project and site, or may be general stock.

Soft delete must be used instead of physical delete.

---

# Table: purchase_order_lines

## Purpose

Stores purchase order line items.

One purchase order can contain multiple products, materials, consumables, tools, or services.

Purchase order lines must store price snapshots.

## Columns

### purchase_order_line_id

Type:
UUID

Description:

Primary key.

---

### purchase_order_id

Type:
UUID

FK → purchase_orders.purchase_order_id

Required.

Description:

Parent purchase order.

---

### line_no

Type:
INTEGER

Nullable.

Description:

Line sequence number.

---

### product_id

Type:
UUID

FK → products.product_id

Nullable.

Description:

Product reference. Nullable for service or manual items.

---

### material_supplier_link_id

Type:
UUID

FK → material_supplier_links.material_supplier_link_id

Nullable.

Description:

Supplier-product relationship reference.

---

### item_description

Type:
TEXT

Required.

Description:

Snapshot item description.

---

### quantity_ordered

Type:
NUMERIC(12,2)

Required.

Description:

Quantity ordered.

---

### quantity_received

Type:
NUMERIC(12,2)

Default:
0

Description:

Quantity received.

---

### unit_name

Type:
TEXT

Required.

Description:

Unit of measure snapshot.

---

### unit_cost

Type:
NUMERIC(12,2)

Required.

Description:

Snapshot unit cost.

---

### tax_rate

Type:
NUMERIC(5,2)

Default:
0

Description:

Tax rate.

---

### tax_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Tax amount.

---

### line_amount

Type:
NUMERIC(12,2)

Required.

Description:

Line amount before tax.

---

### total_amount

Type:
NUMERIC(12,2)

Required.

Description:

Line amount plus tax.

---

### delivery_status

Type:
TEXT

Default:
Not Delivered

Examples:

- Not Delivered
- Partially Delivered
- Delivered
- Cancelled

Description:

Delivery status.

---

### note

Type:
TEXT

Nullable.

Description:

Line note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One purchase order can have multiple purchase order lines.

Product ID can be nullable for service or one-off purchase items.

Unit cost must be stored as a snapshot.

Quantity received must never exceed quantity ordered unless manually approved.

Delivery status should be calculated from quantity ordered and quantity received.

Soft delete must be used instead of physical delete.

---

# Table: supplier_deliveries

## Purpose

Stores supplier delivery records.

Supplier deliveries record actual goods or materials received from suppliers.

A purchase order can have multiple deliveries.

Supplier can deliver directly to site, warehouse, office, or other locations.

## Columns

### supplier_delivery_id

Type:
UUID

Description:

Primary key.

---

### delivery_no

Type:
TEXT

Unique.

Example:

SD2606-00001

Description:

Supplier delivery number.

---

### purchase_order_id

Type:
UUID

FK → purchase_orders.purchase_order_id

Required.

Description:

Related purchase order.

---

### supplier_id

Type:
UUID

FK → suppliers.supplier_id

Required.

Description:

Related supplier.

---

### delivery_date

Type:
DATE

Required.

Description:

Delivery date.

---

### delivery_location_type

Type:
TEXT

Default:
Site

Examples:

- Site
- Warehouse
- Office
- Other

Description:

Delivery location type.

---

### project_id

Type:
UUID

FK → projects.project_id

Nullable.

Description:

Related project when delivered directly to site.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Nullable.

Description:

Related site when delivered directly to site.

---

### received_by_employee_id

Type:
UUID

FK → employees.employee_id

Nullable.

Description:

Employee or site worker who physically received the goods.

---

### received_by_profile_id

Type:
UUID

Nullable.

Description:

System user who recorded the delivery.

---

### supplier_delivery_note_no

Type:
TEXT

Nullable.

Description:

Supplier delivery docket, delivery note, or invoice number.

---

### delivery_status

Type:
TEXT

Default:
Received

Examples:

- Pending
- Received
- Partially Received
- Rejected
- Cancelled

Description:

Delivery status.

---

### delivery_note

Type:
TEXT

Nullable.

Description:

Delivery note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this delivery.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this delivery.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One purchase order can have multiple supplier deliveries.

Supplier delivery number must be unique.

Supplier delivery can be linked directly to project and site.

Delivery records must not update old purchase prices.

Delivery quantities should update purchase_order_lines.quantity_received.

Purchase order status should be recalculated after receiving goods.

Soft delete must be used instead of physical delete.

---

# Table: supplier_delivery_photos

## Purpose

Stores photos and documents attached to supplier deliveries.

Used when materials are delivered to a project site, warehouse, or office.

Photos provide evidence of received materials, delivery condition, supplier docket, invoice, or damaged goods.

## Columns

### supplier_delivery_photo_id

Type:
UUID

Description:

Primary key.

---

### supplier_delivery_id

Type:
UUID

FK → supplier_deliveries.supplier_delivery_id

Required.

Description:

Parent supplier delivery.

---

### purchase_order_id

Type:
UUID

FK → purchase_orders.purchase_order_id

Required.

Description:

Related purchase order.

---

### project_id

Type:
UUID

FK → projects.project_id

Nullable.

Description:

Related project.

---

### site_id

Type:
UUID

FK → project_sites.site_id

Nullable.

Description:

Related site.

---

### photo_url

Type:
TEXT

Required.

Description:

Photo or document URL.

---

### photo_type

Type:
TEXT

Required.

Examples:

- Material Photo
- Delivery Docket
- Supplier Invoice
- Damaged Goods
- Other

Description:

Photo type.

---

### caption

Type:
TEXT

Nullable.

Description:

Photo caption.

---

### taken_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Photo taken timestamp.

---

### uploaded_by

Type:
UUID

Nullable.

Description:

User who uploaded this photo.

---

### uploaded_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Upload timestamp.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

## Business Rules

One supplier delivery can have multiple photos or documents.

Photos may include material condition, delivery docket, supplier invoice, damaged goods, or site receiving evidence.

Delivery photos must not be physically deleted.

Soft delete must be used instead of physical delete.

When a delivery is recorded, notification may be sent to related users.

---

# Workforce

---

# Table: employees

## Purpose

Stores employee, installer, subcontractor, and team leader records.

Employees can be assigned to projects, work orders, daily reports, and payroll.

## Columns

### employee_id

Type:
UUID

Description:

Primary key.

---

### employee_code

Type:
TEXT

Unique.

Example:

EMP-00001

Description:

Employee code.

---

### employee_name

Type:
TEXT

Required.

Description:

Employee name.

---

### employee_type

Type:
TEXT

Required.

Examples:

- Employee
- Subcontractor
- Team Leader

Description:

Employee type.

---

### default_payroll_method

Type:
TEXT

Required.

Examples:

- Hourly
- SQM Rate
- Fixed Job
- Daily Rate
- Team Rate

Description:

Default payroll calculation method.

---

### phone

Type:
TEXT

Nullable.

Description:

Phone.

---

### email

Type:
TEXT

Nullable.

Description:

Email.

---

### bank_name

Type:
TEXT

Nullable.

Description:

Bank name.

---

### bank_account

Type:
TEXT

Nullable.

Description:

Bank account.

---

### is_active

Type:
BOOLEAN

Default:
true

Description:

Active flag.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One employee can have multiple work assignments.

One employee can have multiple time logs.

Inactive employees should not be assigned to new work orders.

Soft delete must be used instead of physical delete.

---

# Table: work_assignments

## Purpose

Stores assignment records between employees and work orders.

This table records who is assigned to which job.

## Columns

### assignment_id

Type:
UUID

Description:

Primary key.

---

### employee_id

Type:
UUID

FK → employees.employee_id

Required.

Description:

Assigned employee.

---

### work_order_id

Type:
UUID

FK → work_orders.work_order_id

Required.

Description:

Related work order.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### role_on_job

Type:
TEXT

Nullable.

Examples:

- Installer
- Team Leader
- Supervisor
- Helper

Description:

Role on job.

---

### assigned_date

Type:
DATE

Required.

Description:

Assignment date.

---

### planned_hours

Type:
NUMERIC(12,2)

Nullable.

Description:

Planned hours.

---

### assignment_status

Type:
TEXT

Default:
Assigned

Examples:

- Assigned
- In Progress
- Completed
- Cancelled

Description:

Assignment status.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One work order can have multiple employees assigned.

One employee can work on multiple work orders.

Soft delete must be used instead of physical delete.

---

# Table: work_time_logs

## Purpose

Stores actual working time records.

This table is the primary source for payroll calculation, productivity tracking, attendance tracking, and project labour cost reporting.

## Columns

### time_log_id

Type:
UUID

Description:

Primary key.

---

### employee_id

Type:
UUID

FK → employees.employee_id

Required.

Description:

Employee.

---

### assignment_id

Type:
UUID

FK → work_assignments.assignment_id

Nullable.

Description:

Related work assignment.

---

### work_order_id

Type:
UUID

FK → work_orders.work_order_id

Required.

Description:

Related work order.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### work_date

Type:
DATE

Required.

Description:

Actual working date.

---

### clock_in_time

Type:
TIMESTAMPTZ

Nullable.

Description:

Actual start time.

---

### clock_out_time

Type:
TIMESTAMPTZ

Nullable.

Description:

Actual finish time.

---

### hours_worked

Type:
NUMERIC(12,2)

Nullable.

Description:

Calculated working hours.

---

### completed_area_sqm

Type:
NUMERIC(12,2)

Nullable.

Description:

Completed area for SQM payroll.

---

### payroll_method

Type:
TEXT

Required.

Examples:

- Hourly
- SQM Rate
- Fixed Job
- Daily Rate
- Team Rate

Description:

Payroll calculation method.

---

### work_status

Type:
TEXT

Default:
Completed

Examples:

- Completed
- Partial
- Absent
- Sick Leave
- Annual Leave
- Public Holiday

Description:

Work status.

---

### gps_latitude

Type:
NUMERIC(12,8)

Nullable.

Description:

GPS latitude.

---

### gps_longitude

Type:
NUMERIC(12,8)

Nullable.

Description:

GPS longitude.

---

### note

Type:
TEXT

Nullable.

Description:

Internal note.

---

### approved_by

Type:
UUID

Nullable.

Description:

Approver.

---

### approved_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Approval timestamp.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One employee can have multiple time logs.

One work order can have multiple time logs.

Project ID is stored directly for reporting and payroll.

Approved time logs should be locked from editing except through adjustment procedure.

Soft delete must be used instead of physical delete.

---

# Payroll

---

# Table: payroll_periods

## Purpose

Stores payroll periods.

Payroll calculations and payments are grouped into payroll periods.

## Columns

### payroll_period_id

Type:
UUID

Description:

Primary key.

---

### period_code

Type:
TEXT

Unique.

Example:

PAY2606-00001

Description:

Payroll period code.

---

### period_name

Type:
TEXT

Required.

Description:

Period name.

---

### period_type

Type:
TEXT

Required.

Examples:

- Weekly
- 10 Days
- 15 Days
- Monthly
- Custom

Description:

Payroll period type.

---

### start_date

Type:
DATE

Required.

Description:

Start date.

---

### end_date

Type:
DATE

Required.

Description:

End date.

---

### payment_date

Type:
DATE

Nullable.

Description:

Planned payment date.

---

### period_status

Type:
TEXT

Default:
Draft

Examples:

- Draft
- Processing
- Approved
- Paid
- Closed

Description:

Period status.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created the period.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated the period.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

Payroll periods may be weekly, 10 days, 15 days, monthly, or custom.

Actual period length is controlled by start_date and end_date.

Payroll period code must be unique.

Soft delete must be used instead of physical delete.

---

# Table: payroll_entries

## Purpose

Stores calculated payroll line items for employees.

Each payroll entry represents one payable payroll item.

Payroll entries can come from time logs, completed area, fixed job amount, team rate, allowance, bonus, deduction, or manual adjustment.

## Columns

### payroll_entry_id

Type:
UUID

Description:

Primary key.

---

### payroll_period_id

Type:
UUID

FK → payroll_periods.payroll_period_id

Required.

Description:

Related payroll period.

---

### employee_id

Type:
UUID

FK → employees.employee_id

Required.

Description:

Employee.

---

### project_id

Type:
UUID

FK → projects.project_id

Nullable.

Description:

Related project if applicable.

---

### work_order_id

Type:
UUID

FK → work_orders.work_order_id

Nullable.

Description:

Related work order if applicable.

---

### time_log_id

Type:
UUID

FK → work_time_logs.time_log_id

Nullable.

Description:

Source time log when generated from actual work time.

---

### payroll_method

Type:
TEXT

Required.

Examples:

- Hourly
- SQM Rate
- Fixed Job
- Daily Rate
- Team Rate
- Allowance
- Bonus
- Deduction
- Manual Adjustment

Description:

Payroll calculation method.

---

### source_type

Type:
TEXT

Required.

Examples:

- Work Time Log
- Daily Report
- Work Order
- Manual Entry
- Allowance
- Bonus
- Deduction

Description:

Payroll source type.

---

### description

Type:
TEXT

Nullable.

Description:

Payroll item description.

---

### quantity

Type:
NUMERIC(12,2)

Nullable.

Description:

Quantity such as hours, sqm, days, or units.

---

### unit_rate

Type:
NUMERIC(12,2)

Nullable.

Description:

Rate used for calculation.

---

### gross_amount

Type:
NUMERIC(12,2)

Required.

Description:

Amount before deduction.

---

### deduction_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Deduction amount.

---

### net_amount

Type:
NUMERIC(12,2)

Required.

Description:

Net payable amount.

---

### approval_status

Type:
TEXT

Default:
Draft

Examples:

- Draft
- Pending Approval
- Approved
- Rejected

Description:

Approval status.

---

### payment_status

Type:
TEXT

Default:
Unpaid

Examples:

- Unpaid
- Partially Paid
- Paid

Description:

Payment status.

---

### approved_by

Type:
UUID

Nullable.

Description:

Approver.

---

### approved_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Approval timestamp.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this payroll entry.

---

### updated_by

Type:
UUID

Nullable.

Description:

User who last updated this payroll entry.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One payroll period can have multiple payroll entries.

One employee can have multiple payroll entries.

Approved payroll entries should be locked from editing.

Payroll entries can be paid through payroll_payment_lines.

Soft delete must be used instead of physical delete.

---

# Table: payroll_payments

## Purpose

Stores actual payroll payment records.

This table records money paid to employees, installers, subcontractors, or team leaders.

One payroll payment can pay one or many approved payroll entries.

## Columns

### payroll_payment_id

Type:
UUID

Description:

Primary key.

---

### payroll_period_id

Type:
UUID

FK → payroll_periods.payroll_period_id

Required.

Description:

Related payroll period.

---

### employee_id

Type:
UUID

FK → employees.employee_id

Required.

Description:

Payee employee.

---

### payment_date

Type:
DATE

Required.

Description:

Payment date.

---

### payment_method

Type:
TEXT

Required.

Examples:

- Bank Transfer
- Cash
- Cheque
- Other

Description:

Payment method.

---

### paid_amount

Type:
NUMERIC(12,2)

Required.

Description:

Paid amount.

---

### reference_no

Type:
TEXT

Nullable.

Description:

Payment reference number.

---

### payment_status

Type:
TEXT

Default:
Paid

Examples:

- Draft
- Paid
- Cancelled

Description:

Payment status.

---

### paid_by

Type:
UUID

Nullable.

Description:

User who paid.

---

### note

Type:
TEXT

Nullable.

Description:

Internal note.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One payroll payment can pay multiple payroll entries.

Cancelled payroll payments must not affect payroll balances.

Soft delete must be used instead of physical delete.

---

# Table: payroll_payment_lines

## Purpose

Links payroll payments to payroll entries.

Supports full payment, partial payment, multiple payroll entries in one payment, and multiple payments against one payroll entry.

## Columns

### payroll_payment_line_id

Type:
UUID

Description:

Primary key.

---

### payroll_payment_id

Type:
UUID

FK → payroll_payments.payroll_payment_id

Required.

Description:

Related payroll payment.

---

### payroll_entry_id

Type:
UUID

FK → payroll_entries.payroll_entry_id

Required.

Description:

Related payroll entry.

---

### paid_amount

Type:
NUMERIC(12,2)

Required.

Description:

Amount allocated from payroll payment to payroll entry.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One payroll payment can have multiple payment lines.

One payroll entry can be paid by multiple payroll payments.

Total paid amount for a payroll entry must not exceed net amount.

Soft delete must be used instead of physical delete.

---

# Sales

---

# Table: quotations

## Purpose

Stores customer quotation header records.

Quotations are used to estimate flooring supply, installation, materials, labour, transport, and other project-related costs.

A quotation may have multiple revisions before customer approval.

An accepted quotation can be converted into a project.

## Columns

### quotation_id

Type:
UUID

Description:

Primary key.

---

### quotation_no

Type:
TEXT

Unique.

Example:

QT2606-00001

Description:

Quotation number.

---

### customer_id

Type:
UUID

FK → customers.customer_id

Required.

Description:

Customer receiving the quotation.

---

### project_site_id

Type:
UUID

FK → project_sites.site_id

Nullable.

Description:

Target site for quotation.

---

### price_book_id

Type:
UUID

FK → price_books.price_book_id

Nullable.

Description:

Price book used for pricing calculations.

---

### quotation_segment

Type:
TEXT

Required.

Examples:

- Retail
- Builder
- Commercial
- VIP
- Promotion

Description:

Customer or pricing segment.

---

### quotation_source

Type:
TEXT

Nullable.

Examples:

- Walk-in
- Phone
- Website
- Referral
- Existing Customer
- Salesperson

Description:

Source of quotation lead.

---

### quotation_status

Type:
TEXT

Required.

Examples:

- Draft
- Sent
- Revised
- Accepted
- Rejected
- Cancelled
- Expired

Description:

Current quotation status.

---

### quotation_date

Type:
DATE

Required.

Description:

Quotation issue date.

---

### valid_until

Type:
DATE

Nullable.

Description:

Quotation expiry date.

---

### subtotal_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Subtotal before discount and tax.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Discount amount.

---

### tax_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

VAT or tax amount.

---

### total_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Final quotation amount.

---

### accepted_revision_id

Type:
UUID

FK → quotation_revisions.revision_id

Nullable.

Description:

Accepted quotation revision.

---

### accepted_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Acceptance timestamp.

---

### accepted_by

Type:
TEXT

Nullable.

Description:

Customer contact who accepted the quotation.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this quotation.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple quotations.

One quotation can have multiple quotation lines.

One quotation can have multiple revisions.

Only accepted quotations can be converted into projects.

Accepted quotations should be locked from editing.

Quotation totals should be calculated from quotation lines or accepted quotation revision lines.

Updating products or price books must not change old quotation records.

Soft delete must be used instead of physical delete.

---

# Table: quotation_lines

## Purpose

Stores quotation line item records.

Each record represents one product, material, labour, transport, service, discount, or manual item within a quotation.

Quotation lines are used to calculate quotation totals and provide detailed costing information.

## Columns

### quotation_line_id

Type:
UUID

Description:

Primary key.

---

### quotation_id

Type:
UUID

FK → quotations.quotation_id

Required.

Description:

Parent quotation.

---

### line_no

Type:
INTEGER

Required.

Description:

Line sequence number.

---

### item_type

Type:
TEXT

Required.

Examples:

- Product
- Material
- Labour
- Transport
- Service
- Discount
- Other

Description:

Type of quotation item.

---

### product_id

Type:
UUID

FK → products.product_id

Nullable.

Description:

Referenced product.

Can be null for labour, transport, service, discount, or manual items.

---

### item_code

Type:
TEXT

Nullable.

Description:

Snapshot item code.

---

### item_name

Type:
TEXT

Required.

Description:

Snapshot item name.

---

### item_description

Type:
TEXT

Nullable.

Description:

Additional item details.

---

### uom

Type:
TEXT

Nullable.

Examples:

- sqm
- m
- pcs
- lot
- day

Description:

Unit of measure.

---

### quantity

Type:
NUMERIC(12,2)

Required.

Description:

Quantity.

---

### unit_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Snapshot unit cost.

---

### unit_price

Type:
NUMERIC(12,2)

Required.

Description:

Snapshot selling price.

---

### discount_percent

Type:
NUMERIC(5,2)

Default:
0

Description:

Line discount percentage.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Line discount amount.

---

### line_total

Type:
NUMERIC(12,2)

Required.

Description:

Final line amount after discount.

---

### remarks

Type:
TEXT

Nullable.

Description:

Additional notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One quotation can have multiple quotation lines.

Product ID can be nullable for manual, labour, service, transport, discount, or other non-product items.

Unit price must be stored as a snapshot.

Unit cost should be stored when margin tracking is required.

Updating products or price books must not change old quotation lines.

Quotation totals should be calculated from quotation lines.

Soft delete must be used instead of physical delete.

---

# Table: quotation_revisions

## Purpose

Stores quotation revision header records.

Quotation revisions are used to preserve each version of a quotation before customer approval.

A quotation can have multiple revisions, but only one revision should be marked as the latest active revision.

When a quotation is accepted, the accepted revision becomes the pricing baseline for the project.

## Columns

### revision_id

Type:
UUID

Description:

Primary key.

---

### quotation_id

Type:
UUID

FK → quotations.quotation_id

Required.

Description:

Parent quotation.

---

### revision_no

Type:
INTEGER

Required.

Examples:

1

2

3

Description:

Revision running number for the same quotation.

---

### revision_code

Type:
TEXT

Nullable.

Examples:

QT2606-00001-REV01

QT2606-00001-REV02

Description:

Human-readable revision code.

---

### revision_status

Type:
TEXT

Required.

Examples:

- Draft
- Sent
- Accepted
- Rejected
- Cancelled

Description:

Status of this quotation revision.

---

### revision_reason

Type:
TEXT

Nullable.

Description:

Reason for creating this revision.

---

### subtotal_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Subtotal before discount and tax.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Discount amount for this revision.

---

### tax_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

VAT or tax amount.

---

### total_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Final total amount for this revision.

---

### margin_amount

Type:
NUMERIC(12,2)

Nullable.

Description:

Estimated gross margin amount.

---

### margin_percent

Type:
NUMERIC(5,2)

Nullable.

Description:

Estimated gross margin percentage.

---

### sent_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Timestamp when sent to customer.

---

### accepted_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Customer acceptance timestamp.

---

### accepted_by

Type:
TEXT

Nullable.

Description:

Customer contact who accepted this revision.

---

### notes

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_latest

Type:
BOOLEAN

Default:
true

Description:

Latest revision flag.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created this revision.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One quotation can have multiple quotation revisions.

Revision number must be unique within the same quotation.

Only one revision per quotation should have is_latest = true.

When a new revision is created, previous latest revision should be changed to is_latest = false.

Accepted revision should be locked from editing.

Accepted revision becomes the pricing baseline when converting quotation to project.

Quotation revision totals should be calculated from quotation_revision_lines.

Updating quotation_lines must not change old quotation_revisions.

Soft delete must be used instead of physical delete.

---

# Table: quotation_revision_lines

## Purpose

Stores quotation revision line item records.

Each record represents one product, labour, service, transport, discount, or manual item within a quotation revision.

Quotation revision lines preserve the exact pricing, quantities, costs, and descriptions used in that specific revision.

Updating products, price books, or quotation lines must not affect historical revision lines.

## Columns

### revision_line_id

Type:
UUID

Description:

Primary key.

---

### revision_id

Type:
UUID

FK → quotation_revisions.revision_id

Required.

Description:

Parent quotation revision.

---

### quotation_line_id

Type:
UUID

FK → quotation_lines.quotation_line_id

Nullable.

Description:

Original quotation line reference.

---

### line_no

Type:
INTEGER

Required.

Description:

Line sequence number.

---

### item_type

Type:
TEXT

Required.

Examples:

- Product
- Material
- Labour
- Transport
- Service
- Discount
- Other

Description:

Type of item in the revision.

---

### product_id

Type:
UUID

FK → products.product_id

Nullable.

Description:

Referenced product.

Can be null for labour, transport, service, discount, or manual items.

---

### item_code

Type:
TEXT

Nullable.

Description:

Snapshot item code.

---

### item_name

Type:
TEXT

Required.

Description:

Snapshot item description.

---

### item_description

Type:
TEXT

Nullable.

Description:

Additional details.

---

### uom

Type:
TEXT

Nullable.

Examples:

- sqm
- m
- pcs
- lot
- day

Description:

Unit of measure.

---

### quantity

Type:
NUMERIC(12,2)

Required.

Description:

Quantity.

---

### unit_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Snapshot unit cost.

---

### unit_price

Type:
NUMERIC(12,2)

Required.

Description:

Snapshot selling price.

---

### discount_percent

Type:
NUMERIC(5,2)

Default:
0

Description:

Line discount percentage.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Line discount amount.

---

### line_total

Type:
NUMERIC(12,2)

Required.

Description:

Final line amount after discount.

---

### remarks

Type:
TEXT

Nullable.

Description:

Additional notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One quotation revision can have multiple quotation revision lines.

Product ID can be nullable for manual, labour, service, transport, discount, or other non-product items.

Unit price must be stored as a snapshot.

Unit cost should be stored when margin tracking is required.

Updating products, price books, quotations, or quotation lines must not change historical revision lines.

Revision totals should be calculated from quotation revision lines.

Soft delete must be used instead of physical delete.

---

# Variations

---

# Table: variations

## Purpose

Stores variation header records.

Variations are used to record approved changes to project scope after a quotation has already been accepted.

Variations may increase or decrease project value.

Each variation can contain multiple variation lines.

Approved variations may later be billed to customers through invoices.

## Columns

### variation_id

Type:
UUID

Description:

Primary key.

---

### variation_no

Type:
TEXT

Unique.

Example:

VAR2606-00001

Description:

Variation document number.

---

### project_id

Type:
UUID

FK → projects.project_id

Required.

Description:

Related project.

---

### quotation_id

Type:
UUID

FK → quotations.quotation_id

Nullable.

Description:

Original quotation reference.

---

### variation_type

Type:
TEXT

Required.

Examples:

- Addition
- Deduction
- Change

Description:

Type of variation.

---

### variation_status

Type:
TEXT

Required.

Examples:

- Draft
- Submitted
- Approved
- Rejected
- Cancelled

Description:

Current variation status.

---

### variation_date

Type:
DATE

Required.

Description:

Variation issue date.

---

### requested_by

Type:
TEXT

Nullable.

Description:

Customer or internal requester.

---

### approved_by

Type:
TEXT

Nullable.

Description:

Approver name.

---

### approved_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Approval timestamp.

---

### subtotal_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Subtotal amount.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Discount amount.

---

### tax_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Tax amount.

---

### total_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Final variation amount.

---

### remarks

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created the variation.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One project can have multiple variations.

One quotation can have multiple variations.

Variation totals should be calculated from variation lines.

Only approved variations can be billed.

Approved variations should be locked from editing.

Variation value can be positive or negative.

Soft delete must be used instead of physical delete.

---

# Table: variation_lines

## Purpose

Stores variation line item records.

Each record represents one added, deducted, changed, material, labour, service, transport, discount, or manual item inside a variation.

Variation lines are used to calculate the total value of each variation.

## Columns

### variation_line_id

Type:
UUID

Description:

Primary key.

---

### variation_id

Type:
UUID

FK → variations.variation_id

Required.

Description:

Parent variation.

---

### line_no

Type:
INTEGER

Required.

Description:

Line sequence number.

---

### item_type

Type:
TEXT

Required.

Examples:

- Product
- Material
- Labour
- Transport
- Service
- Discount
- Other

Description:

Type of variation item.

---

### product_id

Type:
UUID

FK → products.product_id

Nullable.

Description:

Referenced product.

Can be null for labour, transport, service, discount, or manual items.

---

### item_code

Type:
TEXT

Nullable.

Description:

Snapshot item code.

---

### item_name

Type:
TEXT

Required.

Description:

Snapshot item name.

---

### item_description

Type:
TEXT

Nullable.

Description:

Additional item details.

---

### uom

Type:
TEXT

Nullable.

Examples:

- sqm
- m
- pcs
- lot
- day

Description:

Unit of measure.

---

### quantity

Type:
NUMERIC(12,2)

Required.

Description:

Variation quantity.

---

### unit_cost

Type:
NUMERIC(12,2)

Nullable.

Description:

Snapshot unit cost.

---

### unit_price

Type:
NUMERIC(12,2)

Required.

Description:

Snapshot selling price.

---

### discount_percent

Type:
NUMERIC(5,2)

Default:
0

Description:

Line discount percentage.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Line discount amount.

---

### line_total

Type:
NUMERIC(12,2)

Required.

Description:

Final line amount after discount.

---

### remarks

Type:
TEXT

Nullable.

Description:

Additional notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One variation can have multiple variation lines.

Product ID can be nullable for manual, labour, service, transport, discount, or other non-product items.

Unit price must be stored as a snapshot.

Unit cost should be stored when margin tracking is required.

Variation line value can be positive or negative.

Variation totals should be calculated from variation lines.

Approved variation lines should be locked from editing.

Soft delete must be used instead of physical delete.

---

# Billing

---

# Table: customer_invoices

## Purpose

Stores customer invoice header records.

Invoices are issued to customers for completed work, approved variations, project progress claims, or other billable project activities.

An invoice may contain items originating from quotations, variations, or manual billing entries.

Invoice source tracking is handled through invoice_sources.

## Columns

### invoice_id

Type:
UUID

Description:

Primary key.

---

### invoice_no

Type:
TEXT

Unique.

Example:

INV2606-00001

Description:

Customer invoice number.

---

### customer_id

Type:
UUID

FK → customers.customer_id

Required.

Description:

Customer being billed.

---

### project_id

Type:
UUID

FK → projects.project_id

Nullable.

Description:

Related project.

---

### quotation_id

Type:
UUID

FK → quotations.quotation_id

Nullable.

Description:

Original quotation reference.

---

### invoice_date

Type:
DATE

Required.

Description:

Invoice issue date.

---

### due_date

Type:
DATE

Nullable.

Description:

Payment due date.

---

### invoice_status

Type:
TEXT

Required.

Examples:

- Draft
- Issued
- Partially Paid
- Paid
- Cancelled
- Overdue

Description:

Current invoice status.

---

### subtotal_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Subtotal before discount and tax.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Invoice discount amount.

---

### tax_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

VAT or tax amount.

---

### total_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Final invoice amount.

---

### paid_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Total amount received from customer.

---

### balance_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Outstanding balance.

---

### remarks

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created the invoice.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple invoices.

One project can have multiple invoices.

Invoice totals should be calculated from customer_invoice_items.

Paid amount should be updated from customer_payment_allocations.

Balance amount should equal total_amount minus paid_amount.

Cancelled invoices must not be included in receivable calculations.

Soft delete must be used instead of physical delete.

---

# Table: customer_invoice_items

## Purpose

Stores customer invoice line item records.

Each record represents one billable item included in a customer invoice.

Invoice items may originate from quotations, variations, project progress billing, or manual billing entries.

Invoice item totals are used to calculate invoice totals.

## Columns

### invoice_item_id

Type:
UUID

Description:

Primary key.

---

### invoice_id

Type:
UUID

FK → customer_invoices.invoice_id

Required.

Description:

Parent invoice.

---

### line_no

Type:
INTEGER

Required.

Description:

Line sequence number.

---

### item_type

Type:
TEXT

Required.

Examples:

- Product
- Material
- Labour
- Transport
- Service
- Variation
- Progress
- Other

Description:

Type of invoice item.

---

### product_id

Type:
UUID

FK → products.product_id

Nullable.

Description:

Referenced product.

Can be null for labour, transport, service, variation, progress, or manual items.

---

### item_code

Type:
TEXT

Nullable.

Description:

Snapshot item code.

---

### item_name

Type:
TEXT

Required.

Description:

Snapshot item name.

---

### item_description

Type:
TEXT

Nullable.

Description:

Additional billing details.

---

### uom

Type:
TEXT

Nullable.

Examples:

- sqm
- m
- pcs
- lot
- day

Description:

Unit of measure.

---

### quantity

Type:
NUMERIC(12,2)

Required.

Description:

Billed quantity.

---

### unit_price

Type:
NUMERIC(12,2)

Required.

Description:

Snapshot billing unit price.

---

### discount_percent

Type:
NUMERIC(5,2)

Default:
0

Description:

Line discount percentage.

---

### discount_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Line discount amount.

---

### line_total

Type:
NUMERIC(12,2)

Required.

Description:

Final line amount after discount.

---

### remarks

Type:
TEXT

Nullable.

Description:

Additional notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One invoice can have multiple invoice items.

Product ID can be nullable for labour, transport, service, variation, progress, or manual billing items.

Unit price must be stored as a snapshot.

Updating products, quotations, variations, or price books must not change historical invoice items.

Invoice totals should be calculated from invoice items.

Soft delete must be used instead of physical delete.

---

# Table: invoice_sources

## Purpose

Stores source references used to generate customer invoice items.

This table provides full traceability between invoices and their originating business documents.

An invoice may contain multiple source records from quotations, quotation revisions, variations, project progress claims, or manual billing entries.

This structure allows a single invoice to combine billable items from multiple sources.

## Columns

### invoice_source_id

Type:
UUID

Description:

Primary key.

---

### invoice_id

Type:
UUID

FK → customer_invoices.invoice_id

Required.

Description:

Related invoice.

---

### source_type

Type:
TEXT

Required.

Examples:

- Quotation
- Quotation Revision
- Variation
- Progress
- Manual

Description:

Type of source document.

---

### source_id

Type:
UUID

Required.

Description:

Source document identifier.

---

### source_line_id

Type:
UUID

Nullable.

Description:

Source line item identifier.

---

### source_document_no

Type:
TEXT

Nullable.

Examples:

- QT2606-00001
- QT2606-00001-REV02
- VAR2607-00001

Description:

Human-readable source document number.

---

### billed_amount

Type:
NUMERIC(12,2)

Required.

Description:

Amount billed from this source.

---

### remarks

Type:
TEXT

Nullable.

Description:

Additional notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One invoice can have multiple invoice source records.

One source document can be referenced by multiple invoices when progress billing is allowed.

Source references must remain unchanged after invoice issuance.

Invoice source records provide full audit trail and billing traceability.

Updating quotations, quotation revisions, variations, or source documents must not change historical invoice source records.

Soft delete must be used instead of physical delete.

---

# Finance

---

# Table: customer_payments

## Purpose

Stores customer payment header records.

Customer payments are used to record money received from customers against one or more invoices.

A single payment may be allocated to multiple invoices.

Customer payments are used to calculate accounts receivable balances, cash flow, and payment history.

## Columns

### payment_id

Type:
UUID

Description:

Primary key.

---

### payment_no

Type:
TEXT

Unique.

Example:

RC2606-00001

Description:

Customer receipt/payment number.

---

### customer_id

Type:
UUID

FK → customers.customer_id

Required.

Description:

Customer making the payment.

---

### payment_date

Type:
DATE

Required.

Description:

Date payment was received.

---

### payment_method

Type:
TEXT

Required.

Examples:

- Bank Transfer
- Cash
- Credit Card
- Cheque
- QR Payment
- Other

Description:

Payment method.

---

### reference_no

Type:
TEXT

Nullable.

Description:

Bank transaction number, cheque number, slip number, or external reference.

---

### payment_amount

Type:
NUMERIC(12,2)

Required.

Description:

Total amount received.

---

### allocated_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Amount allocated to invoices.

---

### unapplied_amount

Type:
NUMERIC(12,2)

Default:
0

Description:

Amount not yet allocated to invoices.

---

### payment_status

Type:
TEXT

Required.

Examples:

- Pending
- Cleared
- Partially Allocated
- Fully Allocated
- Cancelled

Description:

Current payment status.

---

### received_by_employee_id

Type:
UUID

FK → employees.employee_id

Nullable.

Description:

Employee who recorded or received the payment.

---

### bank_account_name

Type:
TEXT

Nullable.

Description:

Receiving bank account name.

---

### bank_account_no

Type:
TEXT

Nullable.

Description:

Receiving bank account number.

---

### bank_name

Type:
TEXT

Nullable.

Description:

Receiving bank.

---

### remarks

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### attachment_url

Type:
TEXT

Nullable.

Description:

Payment slip, receipt, or supporting document.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created the payment record.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One customer can have multiple payments.

One payment can be allocated to multiple invoices.

Allocated amount must not exceed payment amount.

Unapplied amount should equal payment amount minus allocated amount.

Cancelled payments must not affect invoice balances.

Customer invoice balances should be updated based on allocated payments.

Payment history must remain immutable after posting, except through approved adjustment procedures.

Soft delete must be used instead of physical delete.

---

# Table: customer_payment_allocations

## Purpose

Stores allocation records between customer payments and customer invoices.

This table allows a single customer payment to be allocated across multiple invoices.

It also allows an invoice to be settled using multiple payments.

Customer payment allocations provide full accounts receivable traceability and payment audit history.

## Columns

### allocation_id

Type:
UUID

Description:

Primary key.

---

### payment_id

Type:
UUID

FK → customer_payments.payment_id

Required.

Description:

Related customer payment.

---

### invoice_id

Type:
UUID

FK → customer_invoices.invoice_id

Required.

Description:

Related customer invoice.

---

### allocation_date

Type:
DATE

Required.

Description:

Allocation date.

---

### allocated_amount

Type:
NUMERIC(12,2)

Required.

Description:

Amount allocated from payment to invoice.

---

### allocation_status

Type:
TEXT

Required.

Examples:

- Pending
- Allocated
- Reversed
- Cancelled

Description:

Allocation status.

---

### remarks

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### is_deleted

Type:
BOOLEAN

Default:
false

Description:

Soft delete flag.

---

### created_by

Type:
UUID

Nullable.

Description:

User who created the allocation.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One payment can have multiple allocation records.

One invoice can have multiple allocation records.

Allocated amount must be greater than zero.

Total allocated amount for a payment must not exceed customer_payments.payment_amount.

Total allocated amount for an invoice must not exceed customer_invoices.total_amount.

Invoice paid_amount should be calculated from customer_payment_allocations.

Invoice balance_amount should equal total_amount minus paid_amount.

Reversed allocations must preserve historical audit records.

Updating or deleting allocations must not remove financial audit history.

Soft delete must be used instead of physical delete.

---

# Integrations

---

# Table: xero_export_logs

## Purpose

Stores export history records between the application and Xero.

This table provides full audit tracking of all data exported to Xero, including customers, suppliers, invoices, payments, purchase orders, and other accounting-related transactions.

Export logs are used for troubleshooting, reconciliation, error handling, and preventing duplicate exports.

## Columns

### export_log_id

Type:
UUID

Description:

Primary key.

---

### export_type

Type:
TEXT

Required.

Examples:

- Customer
- Supplier
- Invoice
- Payment
- Credit Note
- Purchase Order
- Bill
- Item

Description:

Type of record exported to Xero.

---

### source_table

Type:
TEXT

Required.

Examples:

- customers
- suppliers
- customer_invoices
- customer_payments
- purchase_orders

Description:

Source table name.

---

### source_id

Type:
UUID

Required.

Description:

Primary key value of the source record.

---

### source_document_no

Type:
TEXT

Nullable.

Examples:

- INV2606-00001
- RC2606-00001
- PO2606-00001

Description:

Human-readable document number.

---

### xero_record_id

Type:
TEXT

Nullable.

Description:

Record identifier returned by Xero.

---

### export_status

Type:
TEXT

Required.

Examples:

- Pending
- Success
- Failed
- Cancelled

Description:

Export processing status.

---

### export_attempt_count

Type:
INTEGER

Default:
0

Description:

Number of export attempts.

---

### exported_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Date and time successfully exported.

---

### last_attempt_at

Type:
TIMESTAMPTZ

Nullable.

Description:

Date and time of most recent export attempt.

---

### error_message

Type:
TEXT

Nullable.

Description:

Error returned by Xero.

---

### request_payload

Type:
JSONB

Nullable.

Description:

Payload sent to Xero.

---

### response_payload

Type:
JSONB

Nullable.

Description:

Response returned by Xero.

---

### remarks

Type:
TEXT

Nullable.

Description:

Internal notes.

---

### created_by

Type:
UUID

Nullable.

Description:

User or process that initiated export.

---

### created_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record creation timestamp.

---

### updated_at

Type:
TIMESTAMPTZ

Default:
now()

Description:

Record last update timestamp.

## Business Rules

One source record can have multiple export attempts.

Successful exports should store the Xero record identifier.

Failed exports should preserve error details.

Export logs must never be physically deleted.

Historical export records must remain available for audit and reconciliation.

Duplicate exports should be prevented by checking existing successful export records.

Request and response payloads should be retained for troubleshooting.

Export history should remain immutable except for status updates and retry attempts.

---

# Document Number Standards

## Purpose

Defines document numbering standards used across REDS Timber Flooring.

All document numbers should follow a consistent format.

Format:

PREFIX + YYMM + Running Number

Examples:

- PRJ2606-00001
- QT2606-00001
- VAR2606-00001
- WO2606-00001
- SR2606-00001
- PO2606-00001
- SD2606-00001
- PAY2606-00001
- INV2606-00001
- RC2606-00001
- CUS-00001
- EMP-00001
- SUP-00001
- PRD-00001

## Business Rules

Document numbers should be generated by document type.

Running numbers should reset monthly for transaction documents.

Master data codes may use continuous running numbers.

Document numbers must be unique within each document type.

Historical document numbers must never be changed.

Document numbers should be generated automatically by the system.

Manual editing of generated document numbers should not be allowed except by authorized administrators.

---

# SQL Migration V1 Order

## Recommended Migration Files

1. 001_master_data.sql
2. 002_project_management.sql
3. 003_site_operations.sql
4. 004_material_control.sql
5. 005_workforce.sql
6. 006_payroll.sql
7. 007_sales.sql
8. 008_variations.sql
9. 009_billing.sql
10. 010_finance.sql
11. 011_integrations.sql

## Notes

Create parent tables before child tables.

Create lookup/master tables before transaction tables.

Add indexes after table creation.

Add triggers and functions after all dependent tables exist.

Apply Row Level Security policies after table structure is stable.

