export type ScreenMode =
  | "dashboard"
  | "view"
  | "edit"
  | "receive"
  | "resolution";

export type ResolutionIssueType =
  | "Damaged"
  | "Rejected / Return"
  | "Short / Missing";

export type EmployeeLite = {
  employee_id: string;
  employee_code?: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  auth_user_id?: string | null;
};

export type ProductLite = {
  product_id: string;
  product_code: string | null;
  product_name: string | null;
  base_uom_code: string | null;
};

export type DeliveryItem = {
  supplier_delivery_item_id: string;
  supplier_delivery_id: string;
  purchase_order_line_id: string | null;
  product_id: string;
  line_no: number;
  received_quantity: number | string;
  received_uom_code: string;
  conversion_factor_to_base: number | string | null;
  accepted_quantity: number | string;
  damaged_quantity: number | string;
  rejected_quantity: number | string;
  short_quantity: number | string | null;
  short_base_quantity?: number | string | null;
  products: ProductLite | null;
};

export type SupplierDelivery = {
  supplier_delivery_id: string;
  delivery_no: string;
  purchase_order_id: string | null;
  supplier_id: string;
  project_id: string | null;
  site_id: string | null;
  delivery_date: string;
  delivery_status: string;
  supplier_delivery_note_no: string | null;
  notes: string | null;
  created_at: string;
  purchase_orders: {
    purchase_order_no: string | null;
    order_status?: string | null;
    expected_delivery_date?: string | null;
  } | null;
  suppliers: {
    supplier_code: string | null;
    supplier_name: string | null;
  } | null;
  projects: {
    project_no: string | null;
    project_name: string | null;
  } | null;
  project_sites: {
    site_code: string | null;
    site_name: string | null;
  } | null;
  supplier_delivery_items: DeliveryItem[];
};

export type Receipt = {
  supplier_delivery_receipt_id: string;
  supplier_delivery_id: string;
  project_id: string;
  site_id: string;
  received_by_employee_id: string;
  received_at: string;
  receipt_status: string;
  notes: string | null;
};

export type ReceiptItem = {
  supplier_delivery_receipt_item_id: string;
  supplier_delivery_receipt_id: string;
  supplier_delivery_item_id: string;

  stock_location_id?: string | null;
  stock_lot_id?: string | null;
  stock_movement_id?: string | null;

  expected_quantity: number | string | null;
  expected_uom_code: string | null;
  expected_base_quantity: number | string | null;

  received_quantity: number | string;
  received_uom_code: string;

  accepted_quantity: number | string;
  accepted_input_quantity?: number | string | null;
  accepted_input_uom_code?: string | null;
  accepted_base_quantity: number | string | null;

  damaged_quantity: number | string;
  damaged_input_quantity?: number | string | null;
  damaged_input_uom_code?: string | null;
  damaged_base_quantity: number | string | null;

  rejected_quantity: number | string;
  rejected_input_quantity?: number | string | null;
  rejected_input_uom_code?: string | null;
  rejected_base_quantity: number | string | null;

  short_quantity: number | string | null;
  short_input_quantity?: number | string | null;
  short_input_uom_code?: string | null;
  short_base_quantity: number | string | null;

  accepted_components?: unknown;
  damaged_components?: unknown;
  rejected_components?: unknown;
  short_components?: unknown;

  damage_description: string | null;
  rejection_reason: string | null;
  short_reason: string | null;

  replacement_required_quantity?: number | string | null;
  replacement_required_uom_code?: string | null;
  replacement_received_quantity?: number | string | null;

  notes: string | null;
};

export type DeliveryPhoto = {
  supplier_delivery_photo_id: string;
  supplier_delivery_id: string;
  supplier_delivery_receipt_id: string | null;
  photo_url: string;
  photo_type: string;
  caption: string | null;
  sort_order: number | null;
  created_at: string;
  signedUrl?: string | null;
};

export type StockLocation = {
  stock_location_id: string;
  location_code: string;
  location_name: string;
  location_type?: string | null;
  site_id: string | null;
  project_id?: string | null;
  supplier_id?: string | null;
};

export type PurchaseOrder = {
  purchase_order_id: string;
  purchase_order_no: string | null;
  supplier_id: string | null;
  project_id: string | null;
  site_id: string | null;
  order_status: string | null;
  expected_delivery_date: string | null;
  suppliers: {
    supplier_code: string | null;
    supplier_name: string | null;
  } | null;
  projects: {
    project_no: string | null;
    project_name: string | null;
  } | null;
  project_sites: {
    site_code: string | null;
    site_name: string | null;
  } | null;
};

export type PurchaseOrderLine = {
  purchase_order_line_id: string;
  purchase_order_id: string;
  product_id: string;
  line_no: number;
  description: string | null;
  quantity: number | string;
  unit_of_measure: string;
  purchase_uom_code: string | null;
  base_uom_code: string | null;
  conversion_factor_to_base: number | string | null;
  products: ProductLite | null;
};

export type ProductUnit = {
  product_unit_id: string;
  product_id: string;
  uom_code: string;
  conversion_to_base: number | string;
  allow_fractional_quantity: boolean | null;
  sort_order: number;
};
