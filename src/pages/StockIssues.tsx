import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Camera,
  Download,
  Edit3,
  Eye,
  FileDown,
  FilterX,
  MapPin,
  PackageCheck,
  PackageOpen,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Send,
  Truck,
  Warehouse,
  X,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IssueStatus =
  | "Draft"
  | "Prepared"
  | "Issued"
  | "Dispatched"
  | "Delivered"
  | "PartiallyReceived"
  | "Received"
  | "Cancelled";

type PermissionMap = {
  view: boolean;
  create: boolean;
  updateDraft: boolean;
  prepare: boolean;
  issue: boolean;
  dispatch: boolean;
  confirmReceipt: boolean;
  cancel: boolean;
  print: boolean;
  exportPdf: boolean;
  exportCsv: boolean;
  viewPhotos: boolean;
  uploadPhotos: boolean;
  deletePhotos: boolean;
};

type StockIssueRow = {
  stock_issue_id: string;
  stock_issue_no: string;
  stock_request_id: string;
  project_id: string;
  site_id: string;
  area_id: string;
  work_order_id: string | null;
  from_stock_location_id: string;
  to_stock_location_id: string | null;
  issue_status: IssueStatus;
  delivery_method: "SiteDelivery" | "Pickup" | "StockTransfer";
  priority: "Low" | "Normal" | "High" | "Urgent";
  issue_date: string;
  required_date: string | null;
  prepared_at: string | null;
  issued_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  received_at: string | null;
  recipient_auth_user_id: string | null;
  recipient_employee_id: string | null;
  recipient_name: string | null;
  vehicle_reference: string | null;
  dispatch_reference: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  projects: {
    project_no: string | null;
    project_name: string;
    customers: { customer_name: string } | null;
  } | null;
  project_sites: {
    site_code: string | null;
    site_name: string;
  } | null;
  project_areas: {
    area_code: string | null;
    area_name: string;
  } | null;
  stock_locations: {
    location_code: string;
    location_name: string;
  } | null;
  destination_location: {
    location_code: string;
    location_name: string;
  } | null;
  stock_requests: {
    stock_request_no: string | null;
    request_status: string;
  } | null;
  stock_issue_lines: Array<{
    stock_issue_line_id: string;
    stock_request_item_id: string;
    line_no: number;
    requested_product_id: string;
    issued_product_id: string;
    description: string | null;
    issue_quantity: number;
    issue_uom_code: string;
    issue_base_quantity: number;
    base_uom_code: string;
    line_status: string;
    substitution_reason: string | null;
    preparation_notes: string | null;
    issue_notes: string | null;
    received_base_quantity: number;
    damaged_base_quantity: number;
    short_base_quantity: number;
    requested_product: {
      product_code: string | null;
      product_name: string;
    } | null;
    issued_product: {
      product_code: string | null;
      product_name: string;
    } | null;
    stock_issue_allocations: Array<{
      stock_issue_allocation_id: string;
      stock_lot_id: string;
      allocated_base_quantity: number;
      notes: string | null;
      stock_lots: {
        lot_no: string;
        remaining_quantity: number;
        reserved_quantity: number;
        stock_location_id: string;
        stock_locations: {
          location_code: string;
          location_name: string;
        } | null;
      } | null;
    }>;
  }>;
  stock_issue_receipts: Array<{
    stock_issue_receipt_id: string;
    receipt_no: number;
    receipt_status: string;
    received_at: string | null;
    received_by_name: string | null;
    receipt_notes: string | null;
    confirmed_at: string | null;
    stock_issue_receipt_lines: Array<{
      stock_issue_receipt_line_id: string;
      stock_issue_line_id: string;
      line_no: number;
      received_base_quantity: number;
      damaged_base_quantity: number;
      short_base_quantity: number;
      condition_status: string;
      notes: string | null;
    }>;
  }>;
  stock_issue_audit_events: Array<{
    stock_issue_audit_event_id: string;
    event_code: string;
    event_name: string;
    event_severity: string;
    old_status: string | null;
    new_status: string | null;
    event_at: string;
    notes: string | null;
    notification_queued: boolean;
  }>;
};

type ApprovedRequest = {
  stock_request_id: string;
  stock_request_no: string | null;
  request_status: string;
  project_id: string;
  site_id: string;
  area_id: string;
  work_order_id: string | null;
  required_date: string | null;
  projects: {
    project_no: string | null;
    project_name: string;
    customers: { customer_name: string } | null;
  } | null;
  project_sites: { site_code: string | null; site_name: string } | null;
  project_areas: { area_code: string | null; area_name: string } | null;
  stock_request_items: Array<{
    stock_request_item_id: string;
    line_no: number;
    product_id: string;
    description: string | null;
    requested_quantity: number;
    approved_quantity: number | null;
    approved_base_quantity: number | null;
    request_uom_code: string | null;
    unit_of_measure: string | null;
    base_uom_code: string | null;
    conversion_factor_to_base: number | null;
    allow_fractional_quantity: boolean | null;
    fulfilment_method: string | null;
    line_status: string;
    products: {
      product_code: string | null;
      product_name: string;
      base_uom_code: string;
    } | null;
  }>;
};

type StockLocation = {
  stock_location_id: string;
  location_code: string;
  location_name: string;
};

type StockLot = {
  stock_lot_id: string;
  lot_no: string;
  product_id: string;
  stock_location_id: string;
  base_uom_code: string;
  remaining_quantity: number;
  reserved_quantity: number;
  lot_status: string;
  received_date: string | null;
};

type ProductOption = {
  product_id: string;
  product_code: string | null;
  product_name: string;
  product_type: string;
  base_uom_code: string;
};

type FormAllocation = {
  key: string;
  stockLotId: string;
  quantity: string;
  notes: string;
};

type FormLine = {
  key: string;
  stockRequestItemId: string;
  requestedProductId: string;
  requestedProductCode: string;
  requestedProductName: string;
  approvedQuantity: number;
  approvedBaseQuantity: number;
  requestedUom: string;
  baseUomCode: string;
  issuedProductId: string;
  description: string;
  issueQuantity: string;
  issueUomCode: string;
  substitutionReason: string;
  preparationNotes: string;
  issueNotes: string;
  allocations: FormAllocation[];
};

type ReceiptFormLine = {
  stockIssueLineId: string;
  lineNo: number;
  productName: string;
  baseUomCode: string;
  outstandingQuantity: number;
  receivedQuantity: string;
  damagedQuantity: string;
  shortQuantity: string;
  conditionStatus: "Good" | "Partial" | "Damaged" | "Short";
  notes: string;
};

type InventoryPhoto = {
  inventory_transaction_photo_id: string;
  source_id: string;
  photo_type: string;
  caption: string | null;
  storage_bucket: string;
  storage_path: string;
  original_file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  condition_status: string | null;
  created_at: string;
};

const STATUS_ORDER: IssueStatus[] = [
  "Draft",
  "Prepared",
  "Issued",
  "Dispatched",
  "Delivered",
  "PartiallyReceived",
  "Received",
  "Cancelled",
];

const STATUS_LABEL: Record<IssueStatus, string> = {
  Draft: "Draft",
  Prepared: "Prepared",
  Issued: "Issued",
  Dispatched: "Dispatched",
  Delivered: "Delivered",
  PartiallyReceived: "Partially Received",
  Received: "Received",
  Cancelled: "Cancelled",
};

const STATUS_CLASS: Record<IssueStatus, string> = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  Prepared: "border-amber-200 bg-amber-50 text-amber-700",
  Issued: "border-blue-200 bg-blue-50 text-blue-700",
  Dispatched: "border-violet-200 bg-violet-50 text-violet-700",
  Delivered: "border-cyan-200 bg-cyan-50 text-cyan-700",
  PartiallyReceived: "border-orange-200 bg-orange-50 text-orange-700",
  Received: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

const PRIORITY_CLASS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Normal: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700",
};

const newKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "â€”";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "â€”";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const numberValue = (value: unknown) => Number(value ?? 0);

const csvCell = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const StockIssues = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [requiredFrom, setRequiredFrom] = useState("");
  const [requiredTo, setRequiredTo] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [sourceRequestId, setSourceRequestId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<"SiteDelivery" | "Pickup" | "StockTransfer">("SiteDelivery");
  const [priority, setPriority] =
    useState<"Low" | "Normal" | "High" | "Urgent">("Normal");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [requiredDate, setRequiredDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formLines, setFormLines] = useState<FormLine[]>([]);

  const [actionType, setActionType] = useState<
    "prepare" | "issue" | "dispatch" | "deliver" | "cancel" | null
  >(null);
  const [actionNotes, setActionNotes] = useState("");
  const [movementDate, setMovementDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dispatchReference, setDispatchReference] = useState("");
  const [vehicleReference, setVehicleReference] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receivedByName, setReceivedByName] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [receiptLines, setReceiptLines] = useState<ReceiptFormLine[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const { data: permissions } = useQuery<PermissionMap>({
    queryKey: ["stock-issue-permissions"],
    queryFn: async () => {
      const codes = [
        "stock_issues.view",
        "stock_issues.create",
        "stock_issues.update_draft",
        "stock_issues.prepare",
        "stock_issues.issue",
        "stock_issues.dispatch",
        "stock_issues.confirm_receipt",
        "stock_issues.cancel",
        "stock_issues.print",
        "stock_issues.export_pdf",
        "stock_issues.export_csv",
        "stock_issues.view_photos",
        "stock_issues.upload_photos",
        "stock_issues.delete_photos",
      ];

      const values = await Promise.all(
        codes.map(async (code) => {
          const { data, error } = await supabase.rpc("has_permission", {
            p_permission_code: code,
          });
          if (error) throw error;
          return Boolean(data);
        }),
      );

      return {
        view: values[0],
        create: values[1],
        updateDraft: values[2],
        prepare: values[3],
        issue: values[4],
        dispatch: values[5],
        confirmReceipt: values[6],
        cancel: values[7],
        print: values[8],
        exportPdf: values[9],
        exportCsv: values[10],
        viewPhotos: values[11],
        uploadPhotos: values[12],
        deletePhotos: values[13],
      };
    },
  });

  const {
    data: stockIssues = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<StockIssueRow[]>({
    queryKey: ["stock-issues"],
    enabled: permissions?.view !== false,
    queryFn: async () => {
      const { data, error: queryError } = await db
        .from("stock_issues")
        .select(`
          stock_issue_id,
          stock_issue_no,
          stock_request_id,
          project_id,
          site_id,
          area_id,
          work_order_id,
          from_stock_location_id,
          to_stock_location_id,
          issue_status,
          delivery_method,
          priority,
          issue_date,
          required_date,
          prepared_at,
          issued_at,
          dispatched_at,
          delivered_at,
          received_at,
          recipient_auth_user_id,
          recipient_employee_id,
          recipient_name,
          vehicle_reference,
          dispatch_reference,
          notes,
          cancellation_reason,
          created_at,
          projects (
            project_no,
            project_name,
            customers (
              customer_name
            )
          ),
          project_sites (
            site_code,
            site_name
          ),
          project_areas (
            area_code,
            area_name
          ),
          stock_locations!stock_issues_from_stock_location_id_fkey (
            location_code,
            location_name
          ),
          destination_location:stock_locations!stock_issues_to_stock_location_id_fkey (
            location_code,
            location_name
          ),
          stock_requests (
            stock_request_no,
            request_status
          ),
          stock_issue_lines (
            stock_issue_line_id,
            stock_request_item_id,
            line_no,
            requested_product_id,
            issued_product_id,
            description,
            issue_quantity,
            issue_uom_code,
            issue_base_quantity,
            base_uom_code,
            line_status,
            substitution_reason,
            preparation_notes,
            issue_notes,
            received_base_quantity,
            damaged_base_quantity,
            short_base_quantity,
            requested_product:products!stock_issue_lines_requested_product_id_fkey (
              product_code,
              product_name
            ),
            issued_product:products!stock_issue_lines_issued_product_id_fkey (
              product_code,
              product_name
            ),
            stock_issue_allocations (
              stock_issue_allocation_id,
              stock_lot_id,
              allocated_base_quantity,
              notes,
              stock_lots (
                lot_no,
                remaining_quantity,
                reserved_quantity,
                stock_location_id,
                stock_locations (
                  location_code,
                  location_name
                )
              )
            )
          ),
          stock_issue_receipts (
            stock_issue_receipt_id,
            receipt_no,
            receipt_status,
            received_at,
            received_by_name,
            receipt_notes,
            confirmed_at,
            stock_issue_receipt_lines (
              stock_issue_receipt_line_id,
              stock_issue_line_id,
              line_no,
              received_base_quantity,
              damaged_base_quantity,
              short_base_quantity,
              condition_status,
              notes
            )
          ),
          stock_issue_audit_events (
            stock_issue_audit_event_id,
            event_code,
            event_name,
            event_severity,
            old_status,
            new_status,
            event_at,
            notes,
            notification_queued
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .order("line_no", {
          referencedTable: "stock_issue_lines",
          ascending: true,
        })
        .order("event_at", {
          referencedTable: "stock_issue_audit_events",
          ascending: false,
        });

      if (queryError) throw queryError;
      return (data ?? []) as StockIssueRow[];
    },
  });

  const { data: approvedRequests = [] } = useQuery<ApprovedRequest[]>({
    queryKey: ["approved-stock-requests-for-issues"],
    enabled: Boolean(permissions?.create || permissions?.updateDraft),
    queryFn: async () => {
      const { data, error: queryError } = await db
        .from("stock_requests")
        .select(`
          stock_request_id,
          stock_request_no,
          request_status,
          project_id,
          site_id,
          area_id,
          work_order_id,
          required_date,
          projects (
            project_no,
            project_name,
            customers (
              customer_name
            )
          ),
          project_sites (
            site_code,
            site_name
          ),
          project_areas (
            area_code,
            area_name
          ),
          stock_request_items (
            stock_request_item_id,
            line_no,
            product_id,
            description,
            requested_quantity,
            approved_quantity,
            approved_base_quantity,
            request_uom_code,
            unit_of_measure,
            base_uom_code,
            conversion_factor_to_base,
            allow_fractional_quantity,
            fulfilment_method,
            line_status,
            products (
              product_code,
              product_name,
              base_uom_code
            )
          )
        `)
        .eq("is_deleted", false)
        .in("request_status", [
          "Approved",
          "Partially Approved",
          "Partially Reserved",
          "Reserved",
          "Partially Issued",
        ])
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      return (data ?? []) as ApprovedRequest[];
    },
  });

  const { data: stockLocations = [] } = useQuery<StockLocation[]>({
    queryKey: ["stock-locations-for-stock-issues"],
    queryFn: async () => {
      const { data, error: queryError } = await db
        .from("stock_locations")
        .select("stock_location_id, location_code, location_name")
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("location_name");

      if (queryError) throw queryError;
      return (data ?? []) as StockLocation[];
    },
  });

  const { data: stockLots = [] } = useQuery<StockLot[]>({
    queryKey: ["stock-lots-for-stock-issue-editor"],
    queryFn: async () => {
      const { data, error: queryError } = await db
        .from("stock_lots")
        .select(`
          stock_lot_id,
          lot_no,
          product_id,
          stock_location_id,
          base_uom_code,
          remaining_quantity,
          reserved_quantity,
          lot_status,
          received_date
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("received_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;
      return (data ?? []) as StockLot[];
    },
  });

  const { data: productOptions = [] } = useQuery<ProductOption[]>({
    queryKey: ["material-consumable-products-for-stock-issues"],
    queryFn: async () => {
      const { data, error: queryError } = await db
        .from("products")
        .select(
          "product_id, product_code, product_name, product_type, base_uom_code",
        )
        .eq("is_deleted", false)
        .eq("is_active", true)
        .in("product_type", ["Material", "Consumable"])
        .order("product_name");

      if (queryError) throw queryError;
      return (data ?? []) as ProductOption[];
    },
  });

  const selectedRequest =
    approvedRequests.find(
      (request) => request.stock_request_id === sourceRequestId,
    ) ?? null;

  const projectOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    stockIssues.forEach((issue) => {
      map.set(issue.project_id, {
        id: issue.project_id,
        label:
          [issue.projects?.project_no, issue.projects?.project_name]
            .filter(Boolean)
            .join(" â€” ") || issue.project_id,
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [stockIssues]);

  const siteOptions = useMemo(() => {
    const map = new Map<string, { id: string; projectId: string; label: string }>();
    stockIssues.forEach((issue) => {
      map.set(issue.site_id, {
        id: issue.site_id,
        projectId: issue.project_id,
        label:
          [issue.project_sites?.site_code, issue.project_sites?.site_name]
            .filter(Boolean)
            .join(" â€” ") || issue.site_id,
      });
    });

    return Array.from(map.values())
      .filter((site) => projectFilter === "all" || site.projectId === projectFilter)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projectFilter, stockIssues]);

  const filteredIssues = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return stockIssues.filter((issue) => {
      if (statusFilter !== "all" && issue.issue_status !== statusFilter) {
        return false;
      }
      if (projectFilter !== "all" && issue.project_id !== projectFilter) {
        return false;
      }
      if (siteFilter !== "all" && issue.site_id !== siteFilter) {
        return false;
      }
      if (deliveryFilter !== "all" && issue.delivery_method !== deliveryFilter) {
        return false;
      }
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) {
        return false;
      }
      if (
        requiredFrom &&
        (!issue.required_date || issue.required_date < requiredFrom)
      ) {
        return false;
      }
      if (requiredTo && (!issue.required_date || issue.required_date > requiredTo)) {
        return false;
      }

      if (!keyword) return true;

      const searchable = [
        issue.stock_issue_no,
        issue.stock_requests?.stock_request_no,
        issue.projects?.project_no,
        issue.projects?.project_name,
        issue.projects?.customers?.customer_name,
        issue.project_sites?.site_code,
        issue.project_sites?.site_name,
        issue.project_areas?.area_code,
        issue.project_areas?.area_name,
        issue.recipient_name,
        issue.delivery_method,
        issue.issue_status,
        ...(issue.stock_issue_lines ?? []).flatMap((line) => [
          line.issued_product?.product_code,
          line.issued_product?.product_name,
          line.requested_product?.product_code,
          line.requested_product?.product_name,
          line.description,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [
    deliveryFilter,
    priorityFilter,
    projectFilter,
    requiredFrom,
    requiredTo,
    searchTerm,
    siteFilter,
    statusFilter,
    stockIssues,
  ]);

  const selectedIssue =
    stockIssues.find((issue) => issue.stock_issue_id === selectedIssueId) ?? null;

  const selectedReceiptIds = useMemo(
    () =>
      (selectedIssue?.stock_issue_receipts ?? []).map(
        (receipt) => receipt.stock_issue_receipt_id,
      ),
    [selectedIssue],
  );

  const { data: receiptPhotos = [] } = useQuery<InventoryPhoto[]>({
    queryKey: ["stock-issue-receipt-photos", selectedIssueId],
    enabled:
      Boolean(permissions?.viewPhotos && selectedIssueId) &&
      selectedReceiptIds.length > 0,
    queryFn: async () => {
      const { data, error: queryError } = await db
        .from("inventory_transaction_photos")
        .select(`
          inventory_transaction_photo_id,
          source_id,
          photo_type,
          caption,
          storage_bucket,
          storage_path,
          original_file_name,
          mime_type,
          file_size_bytes,
          condition_status,
          created_at
        `)
        .eq("source_type", "StockIssueReceipt")
        .in("source_id", selectedReceiptIds)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;
      return (data ?? []) as InventoryPhoto[];
    },
  });

  const summary = useMemo(() => {
    const active = filteredIssues.filter(
      (issue) => !["Received", "Cancelled"].includes(issue.issue_status),
    ).length;
    const waitingReceipt = filteredIssues.filter((issue) =>
      ["Delivered", "PartiallyReceived"].includes(issue.issue_status),
    ).length;
    const urgent = filteredIssues.filter(
      (issue) =>
        issue.priority === "Urgent" &&
        !["Received", "Cancelled"].includes(issue.issue_status),
    ).length;

    return {
      total: filteredIssues.length,
      active,
      waitingReceipt,
      urgent,
    };
  }, [filteredIssues]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProjectFilter("all");
    setSiteFilter("all");
    setDeliveryFilter("all");
    setPriorityFilter("all");
    setRequiredFrom("");
    setRequiredTo("");
  };

  const resetForm = () => {
    setSourceRequestId("");
    setFromLocationId("");
    setToLocationId("");
    setDeliveryMethod("SiteDelivery");
    setPriority("Normal");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setRequiredDate("");
    setRecipientName("");
    setFormNotes("");
    setFormLines([]);
    setEditingIssueId(null);
  };

  const loadRequestLines = (requestId: string) => {
    const request = approvedRequests.find(
      (row) => row.stock_request_id === requestId,
    );

    setSourceRequestId(requestId);
    setRequiredDate(request?.required_date ?? "");

    const eligible = (request?.stock_request_items ?? []).filter(
      (item) =>
        (item.fulfilment_method ?? "Issue") === "Issue" &&
        numberValue(item.approved_base_quantity) > 0,
    );

    setFormLines(
      eligible.map((item) => ({
        key: newKey(),
        stockRequestItemId: item.stock_request_item_id,
        requestedProductId: item.product_id,
        requestedProductCode: item.products?.product_code ?? "",
        requestedProductName:
          item.products?.product_name ?? item.description ?? "Unnamed product",
        approvedQuantity: numberValue(
          item.approved_quantity ?? item.requested_quantity,
        ),
        approvedBaseQuantity: numberValue(item.approved_base_quantity),
        requestedUom:
          item.request_uom_code ??
          item.unit_of_measure ??
          item.products?.base_uom_code ??
          "",
        baseUomCode:
          item.base_uom_code ?? item.products?.base_uom_code ?? "",
        issuedProductId: item.product_id,
        description:
          item.description ?? item.products?.product_name ?? "Unnamed product",
        issueQuantity: String(
          numberValue(item.approved_quantity ?? item.requested_quantity),
        ),
        issueUomCode:
          item.request_uom_code ??
          item.unit_of_measure ??
          item.products?.base_uom_code ??
          "",
        substitutionReason: "",
        preparationNotes: "",
        issueNotes: "",
        allocations: [
          {
            key: newKey(),
            stockLotId: "",
            quantity: "",
            notes: "",
          },
        ],
      })),
    );
  };

  const openCreate = () => {
    resetForm();
    setFormMode("create");
    setShowFormDialog(true);
  };

  const openEdit = (issue: StockIssueRow) => {
    resetForm();
    setFormMode("edit");
    setEditingIssueId(issue.stock_issue_id);
    setSourceRequestId(issue.stock_request_id);
    setFromLocationId(issue.from_stock_location_id);
    setToLocationId(issue.to_stock_location_id ?? "");
    setDeliveryMethod(issue.delivery_method);
    setPriority(issue.priority);
    setIssueDate(issue.issue_date);
    setRequiredDate(issue.required_date ?? "");
    setRecipientName(issue.recipient_name ?? "");
    setFormNotes(issue.notes ?? "");
    setFormLines(
      issue.stock_issue_lines.map((line) => ({
        key: line.stock_issue_line_id,
        stockRequestItemId: line.stock_request_item_id,
        requestedProductId: line.requested_product_id,
        requestedProductCode: line.requested_product?.product_code ?? "",
        requestedProductName:
          line.requested_product?.product_name ?? line.description ?? "",
        approvedQuantity: numberValue(line.issue_quantity),
        approvedBaseQuantity: numberValue(line.issue_base_quantity),
        requestedUom: line.issue_uom_code,
        baseUomCode: line.base_uom_code,
        issuedProductId: line.issued_product_id,
        description: line.description ?? "",
        issueQuantity: String(line.issue_quantity),
        issueUomCode: line.issue_uom_code,
        substitutionReason: line.substitution_reason ?? "",
        preparationNotes: line.preparation_notes ?? "",
        issueNotes: line.issue_notes ?? "",
        allocations: line.stock_issue_allocations.map((allocation) => ({
          key: allocation.stock_issue_allocation_id,
          stockLotId: allocation.stock_lot_id,
          quantity: String(allocation.allocated_base_quantity),
          notes: allocation.notes ?? "",
        })),
      })),
    );
    setShowFormDialog(true);
  };

  const updateLine = (
    lineKey: string,
    changes: Partial<FormLine>,
  ) => {
    setFormLines((current) =>
      current.map((line) =>
        line.key === lineKey ? { ...line, ...changes } : line,
      ),
    );
  };

  const updateAllocation = (
    lineKey: string,
    allocationKey: string,
    changes: Partial<FormAllocation>,
  ) => {
    setFormLines((current) =>
      current.map((line) =>
        line.key === lineKey
          ? {
              ...line,
              allocations: line.allocations.map((allocation) =>
                allocation.key === allocationKey
                  ? { ...allocation, ...changes }
                  : allocation,
              ),
            }
          : line,
      ),
    );
  };

  const addAllocation = (lineKey: string) => {
    setFormLines((current) =>
      current.map((line) =>
        line.key === lineKey
          ? {
              ...line,
              allocations: [
                ...line.allocations,
                {
                  key: newKey(),
                  stockLotId: "",
                  quantity: "",
                  notes: "",
                },
              ],
            }
          : line,
      ),
    );
  };

  const removeAllocation = (lineKey: string, allocationKey: string) => {
    setFormLines((current) =>
      current.map((line) =>
        line.key === lineKey
          ? {
              ...line,
              allocations: line.allocations.filter(
                (allocation) => allocation.key !== allocationKey,
              ),
            }
          : line,
      ),
    );
  };

  const formMutation = useMutation({
    mutationFn: async () => {
      if (!sourceRequestId) throw new Error("Select an approved Stock Request.");
      if (!fromLocationId) throw new Error("Select a source Stock Location.");
      if (deliveryMethod === "StockTransfer" && !toLocationId) {
        throw new Error("Select a destination Stock Location.");
      }
      if (
        deliveryMethod === "StockTransfer" &&
        fromLocationId === toLocationId
      ) {
        throw new Error("Source and destination locations must be different.");
      }
      if (formLines.length === 0) {
        throw new Error("At least one Stock Issue line is required.");
      }

      const payloadLines = formLines.map((line, index) => {
        const issueQuantity = Number(line.issueQuantity);
        if (!Number.isFinite(issueQuantity) || issueQuantity <= 0) {
          throw new Error(`Line ${index + 1}: issue quantity must be greater than zero.`);
        }
        if (!line.issuedProductId) {
          throw new Error(`Line ${index + 1}: issued product is required.`);
        }
        if (
          line.issuedProductId !== line.requestedProductId &&
          !line.substitutionReason.trim()
        ) {
          throw new Error(`Line ${index + 1}: substitution reason is required.`);
        }
        if (line.allocations.length === 0) {
          throw new Error(`Line ${index + 1}: add at least one Stock Lot allocation.`);
        }

        const allocations = line.allocations.map((allocation) => {
          const quantity = Number(allocation.quantity);
          if (!allocation.stockLotId) {
            throw new Error(`Line ${index + 1}: select a Stock Lot.`);
          }
          if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(
              `Line ${index + 1}: allocation quantity must be greater than zero.`,
            );
          }

          return {
            stock_lot_id: allocation.stockLotId,
            allocated_base_quantity: quantity,
            notes: allocation.notes.trim() || null,
          };
        });

        return {
          stock_request_item_id: line.stockRequestItemId,
          issued_product_id: line.issuedProductId,
          description: line.description.trim() || null,
          issue_quantity: issueQuantity,
          issue_uom_code: line.issueUomCode,
          substitution_reason: line.substitutionReason.trim() || null,
          preparation_notes: line.preparationNotes.trim() || null,
          issue_notes: line.issueNotes.trim() || null,
          allocations,
        };
      });

      const header = {
        stock_request_id: sourceRequestId,
        from_stock_location_id: fromLocationId,
        to_stock_location_id:
          deliveryMethod === "StockTransfer" ? toLocationId : null,
        delivery_method: deliveryMethod,
        priority,
        issue_date: issueDate,
        required_date: requiredDate || null,
        recipient_name: recipientName.trim() || null,
        notes: formNotes.trim() || null,
      };

      if (formMode === "create") {
        const { data, error: rpcError } = await supabase.rpc(
          "create_stock_issue_atomic",
          {
            p_header: header,
            p_lines: payloadLines,
          },
        );
        if (rpcError) throw rpcError;
        return data as string;
      }

      if (!editingIssueId) {
        throw new Error("Draft Stock Issue ID is missing.");
      }

      const { data, error: rpcError } = await supabase.rpc(
        "update_draft_stock_issue_atomic",
        {
          p_stock_issue_id: editingIssueId,
          p_header: header,
          p_lines: payloadLines,
        },
      );
      if (rpcError) throw rpcError;
      return data as string;
    },
    onSuccess: (issueId) => {
      toast.success(
        formMode === "create"
          ? "Stock Issue created successfully."
          : "Draft Stock Issue updated successfully.",
      );
      setShowFormDialog(false);
      resetForm();
      setSelectedIssueId(issueId);
      void queryClient.invalidateQueries({ queryKey: ["stock-issues"] });
      void queryClient.invalidateQueries({
        queryKey: ["approved-stock-requests-for-issues"],
      });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const closeActionDialog = () => {
    setActionType(null);
    setActionNotes("");
    setDispatchReference("");
    setVehicleReference("");
    setCancelReason("");
    setMovementDate(new Date().toISOString().slice(0, 10));
  };

  const workflowMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIssue || !actionType) {
        throw new Error("Stock Issue action data is incomplete.");
      }

      if (actionType === "prepare") {
        const { error: rpcError } = await supabase.rpc(
          "prepare_stock_issue_atomic",
          {
            p_stock_issue_id: selectedIssue.stock_issue_id,
            p_notes: actionNotes.trim() || null,
          },
        );
        if (rpcError) throw rpcError;
        return "Stock Issue prepared successfully.";
      }

      if (actionType === "issue") {
        const { error: rpcError } = await supabase.rpc(
          "issue_stock_issue_atomic",
          {
            p_stock_issue_id: selectedIssue.stock_issue_id,
            p_movement_date: movementDate,
            p_notes: actionNotes.trim() || null,
          },
        );
        if (rpcError) throw rpcError;
        return "Stock issued and source stock deducted successfully.";
      }

      if (actionType === "dispatch") {
        const { error: rpcError } = await supabase.rpc(
          "dispatch_stock_issue_atomic",
          {
            p_stock_issue_id: selectedIssue.stock_issue_id,
            p_dispatch_reference: dispatchReference.trim() || null,
            p_vehicle_reference: vehicleReference.trim() || null,
            p_notes: actionNotes.trim() || null,
          },
        );
        if (rpcError) throw rpcError;
        return "Stock Issue dispatched successfully.";
      }

      if (actionType === "deliver") {
        const { error: rpcError } = await supabase.rpc(
          "deliver_stock_issue_atomic",
          {
            p_stock_issue_id: selectedIssue.stock_issue_id,
            p_delivered_at: new Date().toISOString(),
            p_notes: actionNotes.trim() || null,
          },
        );
        if (rpcError) throw rpcError;
        return "Stock Issue marked as delivered.";
      }

      if (!cancelReason.trim()) {
        throw new Error("Cancellation reason is required.");
      }

      const { error: rpcError } = await supabase.rpc(
        "cancel_stock_issue_atomic",
        {
          p_stock_issue_id: selectedIssue.stock_issue_id,
          p_reason: cancelReason.trim(),
        },
      );
      if (rpcError) throw rpcError;
      return "Stock Issue cancelled successfully.";
    },
    onSuccess: (message) => {
      toast.success(message);
      closeActionDialog();
      void queryClient.invalidateQueries({ queryKey: ["stock-issues"] });
      void queryClient.invalidateQueries({ queryKey: ["stock_requests"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const openAction = (
    issue: StockIssueRow,
    action: "prepare" | "issue" | "dispatch" | "deliver" | "cancel",
  ) => {
    setSelectedIssueId(issue.stock_issue_id);
    setActionType(action);
    setActionNotes("");
    setDispatchReference(issue.dispatch_reference ?? "");
    setVehicleReference(issue.vehicle_reference ?? "");
    setCancelReason("");
  };

  const buildReceiptLines = (issue: StockIssueRow): ReceiptFormLine[] =>
    issue.stock_issue_lines
      .map((line) => {
        const outstandingQuantity = Math.max(
          0,
          numberValue(line.issue_base_quantity) -
            numberValue(line.received_base_quantity) -
            numberValue(line.damaged_base_quantity) -
            numberValue(line.short_base_quantity),
        );

        return {
          stockIssueLineId: line.stock_issue_line_id,
          lineNo: line.line_no,
          productName:
            line.issued_product?.product_name ??
            line.requested_product?.product_name ??
            line.description ??
            "Unnamed product",
          baseUomCode: line.base_uom_code,
          outstandingQuantity,
          receivedQuantity: "",
          damagedQuantity: "",
          shortQuantity: "",
          conditionStatus: "Good" as const,
          notes: "",
        };
      })
      .filter((line) => line.outstandingQuantity > 0);

  const openReceipt = (issue: StockIssueRow) => {
    const draft = issue.stock_issue_receipts.find(
      (receipt) => receipt.receipt_status === "Draft",
    );
    setSelectedIssueId(issue.stock_issue_id);
    setReceiptId(draft?.stock_issue_receipt_id ?? null);
    setReceivedByName(
      draft?.received_by_name ?? issue.recipient_name ?? "",
    );
    setReceiptNotes(draft?.receipt_notes ?? "");
    setReceivedAt(new Date().toISOString().slice(0, 16));
    setReceiptLines(buildReceiptLines(issue));
    setShowReceiptDialog(true);
  };

  const closeReceiptDialog = () => {
    if (isUploadingPhotos) return;
    setShowReceiptDialog(false);
    setReceiptId(null);
    setReceiptLines([]);
    setReceiptNotes("");
  };

  const createReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIssue) throw new Error("Stock Issue was not found.");
      if (!receivedByName.trim()) {
        throw new Error("Receiving person is required.");
      }

      const { data, error: rpcError } = await supabase.rpc(
        "create_stock_issue_receipt_draft",
        {
          p_stock_issue_id: selectedIssue.stock_issue_id,
          p_received_by_auth_user_id: null,
          p_received_by_employee_id: null,
          p_received_by_name: receivedByName.trim(),
          p_receipt_notes: receiptNotes.trim() || null,
        },
      );
      if (rpcError) throw rpcError;
      return data as string;
    },
    onSuccess: (newReceiptId) => {
      setReceiptId(newReceiptId);
      toast.success("Receipt draft created. Add at least one photo before confirming.");
      void queryClient.invalidateQueries({ queryKey: ["stock-issues"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const updateReceiptLine = (
    stockIssueLineId: string,
    changes: Partial<ReceiptFormLine>,
  ) => {
    setReceiptLines((current) =>
      current.map((line) =>
        line.stockIssueLineId === stockIssueLineId
          ? { ...line, ...changes }
          : line,
      ),
    );
  };

  const uploadReceiptPhotos = async (files: FileList | null) => {
    if (!files?.length || !receiptId || !selectedIssue) return;
    if (!permissions?.uploadPhotos) {
      toast.error("You do not have permission to upload receipt photos.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024,
    );
    if (invalidFile) {
      toast.error("Photos must be JPEG, PNG or WebP and no larger than 10 MB.");
      return;
    }

    setIsUploadingPhotos(true);
    try {
      for (const [index, file] of selectedFiles.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `stock-issues/${selectedIssue.stock_issue_id}/receipts/${receiptId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("inventory-transaction-photos")
          .upload(storagePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { error: metadataError } = await db
          .from("inventory_transaction_photos")
          .insert({
            source_type: "StockIssueReceipt",
            source_id: receiptId,
            photo_type: "Received",
            caption: null,
            storage_bucket: "inventory-transaction-photos",
            storage_path: storagePath,
            original_file_name: file.name,
            mime_type: file.type,
            file_size_bytes: file.size,
            source_method: "DeviceUpload",
            condition_status: "Received",
            is_primary: receiptPhotos.filter((photo) => photo.source_id === receiptId).length === 0 && index === 0,
            sort_order:
              receiptPhotos.filter((photo) => photo.source_id === receiptId).length + index,
            is_active: true,
            is_deleted: false,
          });

        if (metadataError) {
          await supabase.storage
            .from("inventory-transaction-photos")
            .remove([storagePath]);
          throw metadataError;
        }
      }

      toast.success("Receipt photo uploaded.");
      await queryClient.invalidateQueries({
        queryKey: ["stock-issue-receipt-photos", selectedIssueId],
      });
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : "Receipt photo upload failed.",
      );
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const deleteReceiptPhotoMutation = useMutation({
    mutationFn: async (photo: InventoryPhoto) => {
      if (!permissions?.deletePhotos) {
        throw new Error("You do not have permission to delete receipt photos.");
      }
      const { error: storageError } = await supabase.storage
        .from(photo.storage_bucket)
        .remove([photo.storage_path]);
      if (storageError) throw storageError;

      const { error: metadataError } = await db
        .from("inventory_transaction_photos")
        .update({
          is_active: false,
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq(
          "inventory_transaction_photo_id",
          photo.inventory_transaction_photo_id,
        );
      if (metadataError) throw metadataError;
    },
    onSuccess: () => {
      toast.success("Receipt photo deleted.");
      void queryClient.invalidateQueries({
        queryKey: ["stock-issue-receipt-photos", selectedIssueId],
      });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!receiptId) throw new Error("Create the receipt draft first.");
      const photos = receiptPhotos.filter((photo) => photo.source_id === receiptId);
      if (photos.length === 0) {
        throw new Error("Upload at least one receipt photo before confirming.");
      }

      const payloadLines = receiptLines
        .map((line) => {
          const received = numberValue(line.receivedQuantity);
          const damaged = numberValue(line.damagedQuantity);
          const short = numberValue(line.shortQuantity);
          const total = received + damaged + short;
          if ([received, damaged, short].some((value) => value < 0)) {
            throw new Error(`Line ${line.lineNo}: quantities cannot be negative.`);
          }
          if (total > line.outstandingQuantity + 0.000001) {
            throw new Error(
              `Line ${line.lineNo}: total exceeds outstanding quantity.`,
            );
          }
          if ((damaged > 0 || short > 0) && !line.notes.trim()) {
            throw new Error(
              `Line ${line.lineNo}: notes are required for damaged or short quantities.`,
            );
          }
          return {
            line,
            total,
            payload: {
              stock_issue_line_id: line.stockIssueLineId,
              received_base_quantity: received,
              damaged_base_quantity: damaged,
              short_base_quantity: short,
              condition_status: line.conditionStatus,
              notes: line.notes.trim() || null,
            },
          };
        })
        .filter((item) => item.total > 0)
        .map((item) => item.payload);

      if (payloadLines.length === 0) {
        throw new Error("Record a quantity on at least one receipt line.");
      }

      const hasDamage = payloadLines.some(
        (line) => numberValue(line.damaged_base_quantity) > 0,
      );
      if (
        hasDamage &&
        !photos.some((photo) => photo.photo_type === "DamagedOnDelivery")
      ) {
        throw new Error(
          "A Damaged On Delivery photo is required when damaged quantity is recorded.",
        );
      }

      const { data, error: rpcError } = await supabase.rpc(
        "confirm_stock_issue_receipt_atomic",
        {
          p_stock_issue_receipt_id: receiptId,
          p_lines: payloadLines,
          p_received_at: new Date(receivedAt).toISOString(),
          p_receipt_notes: receiptNotes.trim() || null,
        },
      );
      if (rpcError) throw rpcError;
      return data;
    },
    onSuccess: () => {
      toast.success("Stock Issue receipt confirmed.");
      closeReceiptDialog();
      void queryClient.invalidateQueries({ queryKey: ["stock-issues"] });
      void queryClient.invalidateQueries({
        queryKey: ["stock-issue-receipt-photos", selectedIssueId],
      });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const cancelReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!receiptId) throw new Error("Receipt draft was not found.");
      const photos = receiptPhotos.filter((photo) => photo.source_id === receiptId);
      for (const photo of photos) {
        const { error: storageError } = await supabase.storage
          .from(photo.storage_bucket)
          .remove([photo.storage_path]);
        if (storageError) throw storageError;
        const { error: photoError } = await db
          .from("inventory_transaction_photos")
          .update({
            is_active: false,
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq(
            "inventory_transaction_photo_id",
            photo.inventory_transaction_photo_id,
          );
        if (photoError) throw photoError;
      }

      const { error: rpcError } = await supabase.rpc(
        "cancel_stock_issue_receipt_draft",
        { p_stock_issue_receipt_id: receiptId },
      );
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      toast.success("Receipt draft cancelled.");
      closeReceiptDialog();
      void queryClient.invalidateQueries({ queryKey: ["stock-issues"] });
      void queryClient.invalidateQueries({
        queryKey: ["stock-issue-receipt-photos", selectedIssueId],
      });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const exportCsv = () => {
    if (!permissions?.exportCsv) {
      toast.error("You do not have permission to export Stock Issues.");
      return;
    }

    const rows = [
      [
        "Stock Issue No",
        "Stock Request No",
        "Customer",
        "Project",
        "Site",
        "Area",
        "Status",
        "Priority",
        "Delivery Method",
        "Source Location",
        "Destination Location",
        "Issue Date",
        "Required Date",
        "Recipient",
        "Line Count",
      ],
      ...filteredIssues.map((issue) => [
        issue.stock_issue_no,
        issue.stock_requests?.stock_request_no ?? "",
        issue.projects?.customers?.customer_name ?? "",
        [issue.projects?.project_no, issue.projects?.project_name]
          .filter(Boolean)
          .join(" â€” "),
        [issue.project_sites?.site_code, issue.project_sites?.site_name]
          .filter(Boolean)
          .join(" â€” "),
        [issue.project_areas?.area_code, issue.project_areas?.area_name]
          .filter(Boolean)
          .join(" â€” "),
        STATUS_LABEL[issue.issue_status],
        issue.priority,
        issue.delivery_method,
        issue.stock_locations?.location_name ?? "",
        issue.destination_location?.location_name ?? "",
        issue.issue_date,
        issue.required_date ?? "",
        issue.recipient_name ?? "",
        issue.stock_issue_lines.length,
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reds-stock-issues-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openPrintWindow = (html: string, title: string) => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      toast.error("Allow pop-ups to print or save the report as PDF.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
            h1 { margin: 0; font-size: 24px; }
            .brand { color: #8B3F3F; font-weight: 800; }
            .meta { margin: 5px 0 18px; color: #596579; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #8B3F3F; color: white; text-align: left; padding: 7px; }
            td { border-bottom: 1px solid #ddd; padding: 7px; vertical-align: top; }
            .section { margin-top: 18px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 9px; }
            .label { color: #6B7280; font-size: 10px; text-transform: uppercase; }
            .value { margin-top: 3px; font-weight: 700; }
            .no-print { margin-bottom: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()">Print / Save PDF</button>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const printFilteredList = () => {
    if (!permissions?.print && !permissions?.exportPdf) {
      toast.error("You do not have permission to print Stock Issues.");
      return;
    }

    const body = `
      <h1><span class="brand">REDS</span> Stock Issue & Dispatch List</h1>
      <div class="meta">
        Printed ${new Date().toLocaleString("en-AU")} Â·
        ${filteredIssues.length} filtered record(s)
      </div>
      <table>
        <thead>
          <tr>
            <th>Issue</th><th>Request</th><th>Customer / Project</th>
            <th>Site / Area</th><th>Delivery</th><th>Required</th>
            <th>Status</th><th>Lines</th>
          </tr>
        </thead>
        <tbody>
          ${filteredIssues
            .map(
              (issue) => `
                <tr>
                  <td><strong>${issue.stock_issue_no}</strong><br/>${issue.priority}</td>
                  <td>${issue.stock_requests?.stock_request_no ?? "â€”"}</td>
                  <td>${issue.projects?.customers?.customer_name ?? "â€”"}<br/>
                    ${[issue.projects?.project_no, issue.projects?.project_name]
                      .filter(Boolean)
                      .join(" â€” ")}</td>
                  <td>${[issue.project_sites?.site_code, issue.project_sites?.site_name]
                    .filter(Boolean)
                    .join(" â€” ")}<br/>
                    ${[issue.project_areas?.area_code, issue.project_areas?.area_name]
                      .filter(Boolean)
                      .join(" â€” ")}</td>
                  <td>${issue.delivery_method}<br/>${issue.stock_locations?.location_name ?? "â€”"}</td>
                  <td>${formatDate(issue.required_date)}</td>
                  <td>${STATUS_LABEL[issue.issue_status]}</td>
                  <td>${issue.stock_issue_lines.length}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `;

    openPrintWindow(body, "REDS Stock Issue & Dispatch List");
  };

  const printSelectedIssue = (issue: StockIssueRow) => {
    if (!permissions?.print && !permissions?.exportPdf) {
      toast.error("You do not have permission to print Stock Issues.");
      return;
    }

    const body = `
      <h1><span class="brand">REDS</span> Stock Issue ${issue.stock_issue_no}</h1>
      <div class="meta">
        Status ${STATUS_LABEL[issue.issue_status]} Â· Printed
        ${new Date().toLocaleString("en-AU")}
      </div>
      <div class="grid">
        <div class="card"><div class="label">Request</div><div class="value">${issue.stock_requests?.stock_request_no ?? "â€”"}</div></div>
        <div class="card"><div class="label">Customer</div><div class="value">${issue.projects?.customers?.customer_name ?? "â€”"}</div></div>
        <div class="card"><div class="label">Project</div><div class="value">${[issue.projects?.project_no, issue.projects?.project_name].filter(Boolean).join(" â€” ")}</div></div>
        <div class="card"><div class="label">Site</div><div class="value">${[issue.project_sites?.site_code, issue.project_sites?.site_name].filter(Boolean).join(" â€” ")}</div></div>
        <div class="card"><div class="label">Area</div><div class="value">${[issue.project_areas?.area_code, issue.project_areas?.area_name].filter(Boolean).join(" â€” ")}</div></div>
        <div class="card"><div class="label">Delivery</div><div class="value">${issue.delivery_method}</div></div>
        <div class="card"><div class="label">Source</div><div class="value">${issue.stock_locations?.location_name ?? "â€”"}</div></div>
        <div class="card"><div class="label">Destination</div><div class="value">${issue.destination_location?.location_name ?? "â€”"}</div></div>
        <div class="card"><div class="label">Recipient</div><div class="value">${issue.recipient_name ?? "â€”"}</div></div>
      </div>
      <div class="section">
        <table>
          <thead>
            <tr><th>No.</th><th>Product</th><th>Issue Qty</th><th>Lot Allocations</th><th>Received</th><th>Damaged</th><th>Short</th></tr>
          </thead>
          <tbody>
            ${issue.stock_issue_lines
              .map(
                (line) => `
                  <tr>
                    <td>${String(line.line_no).padStart(2, "0")}</td>
                    <td><strong>${line.issued_product?.product_name ?? line.requested_product?.product_name ?? line.description ?? "â€”"}</strong><br/>
                      ${line.issued_product?.product_code ?? line.requested_product?.product_code ?? "â€”"}</td>
                    <td>${line.issue_quantity} ${line.issue_uom_code}</td>
                    <td>${line.stock_issue_allocations
                      .map(
                        (allocation) =>
                          `${allocation.stock_lots?.lot_no ?? "â€”"}: ${allocation.allocated_base_quantity} ${line.base_uom_code}`,
                      )
                      .join("<br/>")}</td>
                    <td>${line.received_base_quantity} ${line.base_uom_code}</td>
                    <td>${line.damaged_base_quantity} ${line.base_uom_code}</td>
                    <td>${line.short_base_quantity} ${line.base_uom_code}</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <strong>Notes:</strong> ${issue.notes ?? "â€”"}
      </div>
    `;

    openPrintWindow(body, `REDS Stock Issue ${issue.stock_issue_no}`);
  };

  if (permissions && !permissions.view) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold">Access denied</h1>
              <p className="text-sm">
                Your account does not have the stock_issues.view permission.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <PackageCheck className="h-8 w-8 text-[#8B3F3F]" />
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Stock Issue & Dispatch
            </h1>
          </div>
          <p className="mt-1 text-slate-500">
            Prepare, issue, dispatch, deliver and receive approved stock.
          </p>
        </div>

        {permissions?.create && (
          <div className="flex shrink-0 justify-end">
            <Button
              type="button"
              onClick={openCreate}
              className="min-h-11 rounded-xl bg-[#DF2F2F] px-6 font-bold text-white shadow-md shadow-red-200 hover:bg-[#C92525] hover:shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Stock Issue
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {permissions?.exportCsv && (
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            className="min-h-11 rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
        {(permissions?.print || permissions?.exportPdf) && (
          <Button
            type="button"
            variant="outline"
            onClick={printFilteredList}
            className="min-h-11 rounded-xl"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="min-h-11 rounded-xl border-[#B98A8A]/60"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Filtered Issues"
          value={summary.total}
          icon={<PackageCheck className="h-5 w-5 text-[#8B3F3F]" />}
        />
        <SummaryCard
          label="Active Workflow"
          value={summary.active}
          icon={<ArrowRight className="h-5 w-5 text-[#8B3F3F]" />}
        />
        <SummaryCard
          label="Waiting Receipt"
          value={summary.waitingReceipt}
          icon={<PackageOpen className="h-5 w-5 text-[#8B3F3F]" />}
        />
        <SummaryCard
          label="Urgent Open"
          value={summary.urgent}
          icon={<AlertTriangle className="h-5 w-5 text-[#8B3F3F]" />}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-12">
          <div className="relative xl:col-span-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search issue, request, project, site, product..."
              className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10 hover:border-[#9E4B4B]"
            />
          </div>
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            className="xl:col-span-2"
            options={[
              { value: "all", label: "All statuses" },
              ...STATUS_ORDER.map((status) => ({
                value: status,
                label: STATUS_LABEL[status],
              })),
            ]}
          />
          <FilterSelect
            value={projectFilter}
            onChange={(value) => {
              setProjectFilter(value);
              setSiteFilter("all");
            }}
            placeholder="Project"
            className="xl:col-span-2"
            options={[
              { value: "all", label: "All projects" },
              ...projectOptions.map((project) => ({
                value: project.id,
                label: project.label,
              })),
            ]}
          />
          <FilterSelect
            value={siteFilter}
            onChange={setSiteFilter}
            placeholder="Site"
            className="xl:col-span-2"
            options={[
              { value: "all", label: "All sites" },
              ...siteOptions.map((site) => ({
                value: site.id,
                label: site.label,
              })),
            ]}
          />
          <FilterSelect
            value={deliveryFilter}
            onChange={setDeliveryFilter}
            placeholder="Delivery"
            className="xl:col-span-2"
            options={[
              { value: "all", label: "All delivery methods" },
              { value: "SiteDelivery", label: "Site Delivery" },
              { value: "Pickup", label: "Pickup" },
              { value: "StockTransfer", label: "Stock Transfer" },
            ]}
          />
          <FilterSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="Priority"
            className="xl:col-span-2"
            options={[
              { value: "all", label: "All priorities" },
              { value: "Low", label: "Low" },
              { value: "Normal", label: "Normal" },
              { value: "High", label: "High" },
              { value: "Urgent", label: "Urgent" },
            ]}
          />
          <div className="xl:col-span-2">
            <Input
              type="date"
              value={requiredFrom}
              onChange={(event) => setRequiredFrom(event.target.value)}
              className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB]"
              title="Required date from"
            />
          </div>
          <div className="xl:col-span-2">
            <Input
              type="date"
              value={requiredTo}
              onChange={(event) => setRequiredTo(event.target.value)}
              className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB]"
              title="Required date to"
            />
          </div>
          <div className="xl:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="min-h-11 w-full rounded-xl"
            >
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading Stock Issues...
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-bold text-slate-800">
            No Stock Issues found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a Stock Issue from an approved Stock Request or adjust the
            current filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#9E4B4B] text-left text-xs uppercase tracking-wide text-white">
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Customer / Project</th>
                  <th className="px-4 py-3">Site / Area</th>
                  <th className="px-4 py-3">From / Delivery</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.stock_issue_id}
                    className="border-b border-[#B98A8A]/35 align-top last:border-b-0 hover:bg-[#FBF1F1]/55"
                  >
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-900">
                        {issue.stock_issue_no}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Request {issue.stock_requests?.stock_request_no ?? "â€”"}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${
                          PRIORITY_CLASS[issue.priority] ?? PRIORITY_CLASS.Normal
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {issue.projects?.customers?.customer_name ?? "â€”"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[issue.projects?.project_no, issue.projects?.project_name]
                          .filter(Boolean)
                          .join(" â€” ") || "â€”"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-800">
                        {[issue.project_sites?.site_code, issue.project_sites?.site_name]
                          .filter(Boolean)
                          .join(" â€” ") || "â€”"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[issue.project_areas?.area_code, issue.project_areas?.area_name]
                          .filter(Boolean)
                          .join(" â€” ") || "â€”"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {issue.stock_locations?.location_name ?? "â€”"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {issue.delivery_method}
                        {issue.destination_location
                          ? ` â†’ ${issue.destination_location.location_name}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {formatDate(issue.required_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                          STATUS_CLASS[issue.issue_status]
                        }`}
                      >
                        {STATUS_LABEL[issue.issue_status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">
                        {issue.stock_issue_lines?.length ?? 0} line(s)
                      </p>
                      <p className="mt-1 max-w-[230px] truncate text-xs text-slate-500">
                        {(issue.stock_issue_lines ?? [])
                          .slice(0, 2)
                          .map(
                            (line) =>
                              line.issued_product?.product_name ??
                              line.requested_product?.product_name ??
                              line.description,
                          )
                          .filter(Boolean)
                          .join(", ") || "â€”"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedIssueId(issue.stock_issue_id)}
                          className="rounded-lg"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        {issue.issue_status === "Draft" &&
                          permissions?.updateDraft && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(issue)}
                              className="rounded-lg"
                            >
                              <Edit3 className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        {(permissions?.print || permissions?.exportPdf) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => printSelectedIssue(issue)}
                            className="rounded-lg"
                          >
                            <Printer className="mr-1 h-4 w-4" />
                            Print
                          </Button>
                        )}
                        {issue.issue_status === "Draft" && permissions?.prepare && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openAction(issue, "prepare")}
                            className="rounded-lg bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
                          >
                            Prepare
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={showFormDialog}
        onOpenChange={(open) => {
          if (!open && !formMutation.isPending) {
            setShowFormDialog(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {formMode === "create"
                ? "New Stock Issue"
                : "Edit Draft Stock Issue"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <FormSection number="01" title="Source Request">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Approved Stock Request *</Label>
                  <Select
                    value={sourceRequestId}
                    onValueChange={loadRequestLines}
                    disabled={formMode === "edit"}
                  >
                    <SelectTrigger className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB]">
                      <SelectValue placeholder="Select approved Stock Request" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedRequests.map((request) => (
                        <SelectItem
                          key={request.stock_request_id}
                          value={request.stock_request_id}
                        >
                          {request.stock_request_no ?? "No request number"} â€”{" "}
                          {request.projects?.customers?.customer_name ?? "â€”"} â€”{" "}
                          {request.projects?.project_name ?? "â€”"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ReadOnlyField
                  label="Customer"
                  value={
                    selectedRequest?.projects?.customers?.customer_name ?? "â€”"
                  }
                />
                <ReadOnlyField
                  label="Project"
                  value={
                    [
                      selectedRequest?.projects?.project_no,
                      selectedRequest?.projects?.project_name,
                    ]
                      .filter(Boolean)
                      .join(" â€” ") || "â€”"
                  }
                />
                <ReadOnlyField
                  label="Site"
                  value={
                    [
                      selectedRequest?.project_sites?.site_code,
                      selectedRequest?.project_sites?.site_name,
                    ]
                      .filter(Boolean)
                      .join(" â€” ") || "â€”"
                  }
                />
                <ReadOnlyField
                  label="Area"
                  value={
                    [
                      selectedRequest?.project_areas?.area_code,
                      selectedRequest?.project_areas?.area_name,
                    ]
                      .filter(Boolean)
                      .join(" â€” ") || "â€”"
                  }
                />
              </div>
            </FormSection>

            <FormSection number="02" title="Issue & Delivery">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FormSelect
                  label="Source Stock Location *"
                  value={fromLocationId}
                  onChange={setFromLocationId}
                  options={stockLocations.map((location) => ({
                    value: location.stock_location_id,
                    label: `${location.location_code} â€” ${location.location_name}`,
                  }))}
                />
                <FormSelect
                  label="Delivery Method *"
                  value={deliveryMethod}
                  onChange={(value) => {
                    setDeliveryMethod(
                      value as "SiteDelivery" | "Pickup" | "StockTransfer",
                    );
                    if (value !== "StockTransfer") setToLocationId("");
                  }}
                  options={[
                    { value: "SiteDelivery", label: "Site Delivery" },
                    { value: "Pickup", label: "Pickup" },
                    { value: "StockTransfer", label: "Stock Transfer" },
                  ]}
                />
                {deliveryMethod === "StockTransfer" && (
                  <FormSelect
                    label="Destination Stock Location *"
                    value={toLocationId}
                    onChange={setToLocationId}
                    options={stockLocations
                      .filter(
                        (location) =>
                          location.stock_location_id !== fromLocationId,
                      )
                      .map((location) => ({
                        value: location.stock_location_id,
                        label: `${location.location_code} â€” ${location.location_name}`,
                      }))}
                  />
                )}
                <FormSelect
                  label="Priority *"
                  value={priority}
                  onChange={(value) =>
                    setPriority(value as "Low" | "Normal" | "High" | "Urgent")
                  }
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Normal", label: "Normal" },
                    { value: "High", label: "High" },
                    { value: "Urgent", label: "Urgent" },
                  ]}
                />
                <FormInput
                  label="Issue Date *"
                  type="date"
                  value={issueDate}
                  onChange={setIssueDate}
                />
                <FormInput
                  label="Required Date"
                  type="date"
                  value={requiredDate}
                  onChange={setRequiredDate}
                />
                <FormInput
                  label="Recipient"
                  value={recipientName}
                  onChange={setRecipientName}
                />
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  <Label>Notes</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(event) => setFormNotes(event.target.value)}
                    rows={3}
                    className="rounded-xl border-[#E5E7EB] bg-[#F7F9FB]"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection number="03" title="Issue Lines & Stock Lots">
              {formLines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Select an approved Stock Request to load eligible Issue lines.
                </div>
              ) : (
                <div className="space-y-4">
                  {formLines.map((line, lineIndex) => {
                    const eligibleLots = stockLots.filter(
                      (lot) =>
                        lot.product_id === line.issuedProductId &&
                        lot.stock_location_id === fromLocationId &&
                        numberValue(lot.remaining_quantity) -
                          numberValue(lot.reserved_quantity) >
                          0,
                    );

                    return (
                      <div
                        key={line.key}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-black text-slate-900">
                              {String(lineIndex + 1).padStart(2, "0")} Â·{" "}
                              {line.requestedProductName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {line.requestedProductCode || "â€”"} Â· Approved{" "}
                              {line.approvedQuantity.toLocaleString("en-AU")}{" "}
                              {line.requestedUom}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#FBF1F1] px-3 py-1 text-xs font-bold text-[#8B3F3F]">
                            Base approved{" "}
                            {line.approvedBaseQuantity.toLocaleString("en-AU")}{" "}
                            {line.baseUomCode}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <FormSelect
                            label="Issued Product *"
                            value={line.issuedProductId}
                            onChange={(value) => {
                              const product = productOptions.find(
                                (option) => option.product_id === value,
                              );
                              updateLine(line.key, {
                                issuedProductId: value,
                                issueUomCode:
                                  product?.base_uom_code ?? line.issueUomCode,
                                allocations: [
                                  {
                                    key: newKey(),
                                    stockLotId: "",
                                    quantity: "",
                                    notes: "",
                                  },
                                ],
                              });
                            }}
                            options={productOptions.map((product) => ({
                              value: product.product_id,
                              label: `${product.product_code ?? "â€”"} â€” ${product.product_name}`,
                            }))}
                          />
                          <FormInput
                            label="Issue Quantity *"
                            type="number"
                            value={line.issueQuantity}
                            onChange={(value) =>
                              updateLine(line.key, { issueQuantity: value })
                            }
                          />
                          <FormInput
                            label="Issue UOM *"
                            value={line.issueUomCode}
                            onChange={(value) =>
                              updateLine(line.key, { issueUomCode: value })
                            }
                          />
                          <FormInput
                            label="Description"
                            value={line.description}
                            onChange={(value) =>
                              updateLine(line.key, { description: value })
                            }
                          />
                        </div>

                        {line.issuedProductId !== line.requestedProductId && (
                          <div className="mt-4">
                            <FormInput
                              label="Substitution Reason *"
                              value={line.substitutionReason}
                              onChange={(value) =>
                                updateLine(line.key, {
                                  substitutionReason: value,
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="mt-5 rounded-xl bg-[#F7F9FB] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-slate-900">
                                Stock Lot Allocations
                              </p>
                              <p className="text-xs text-slate-500">
                                Allocation quantities use Base UOM{" "}
                                {line.baseUomCode}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAllocation(line.key)}
                              className="rounded-lg"
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Add Lot
                            </Button>
                          </div>

                          <div className="mt-3 space-y-3">
                            {line.allocations.map((allocation) => {
                              const selectedLot = stockLots.find(
                                (lot) =>
                                  lot.stock_lot_id === allocation.stockLotId,
                              );

                              return (
                                <div
                                  key={allocation.key}
                                  className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_180px_1fr_auto]"
                                >
                                  <FormSelect
                                    label="Stock Lot *"
                                    value={allocation.stockLotId}
                                    onChange={(value) =>
                                      updateAllocation(
                                        line.key,
                                        allocation.key,
                                        { stockLotId: value },
                                      )
                                    }
                                    options={eligibleLots.map((lot) => ({
                                      value: lot.stock_lot_id,
                                      label: `${lot.lot_no} â€” Available ${(
                                        numberValue(lot.remaining_quantity) -
                                        numberValue(lot.reserved_quantity)
                                      ).toLocaleString("en-AU")} ${lot.base_uom_code}`,
                                    }))}
                                  />
                                  <FormInput
                                    label={`Quantity (${line.baseUomCode}) *`}
                                    type="number"
                                    value={allocation.quantity}
                                    onChange={(value) =>
                                      updateAllocation(
                                        line.key,
                                        allocation.key,
                                        { quantity: value },
                                      )
                                    }
                                  />
                                  <FormInput
                                    label="Allocation Notes"
                                    value={allocation.notes}
                                    onChange={(value) =>
                                      updateAllocation(
                                        line.key,
                                        allocation.key,
                                        { notes: value },
                                      )
                                    }
                                  />
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      disabled={line.allocations.length === 1}
                                      onClick={() =>
                                        removeAllocation(
                                          line.key,
                                          allocation.key,
                                        )
                                      }
                                      className="h-11 w-11 rounded-xl border-red-200 text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {selectedLot && (
                                    <p className="text-xs text-slate-500 md:col-span-4">
                                      Lot {selectedLot.lot_no} Â· Available{" "}
                                      {(
                                        numberValue(
                                          selectedLot.remaining_quantity,
                                        ) -
                                        numberValue(
                                          selectedLot.reserved_quantity,
                                        )
                                      ).toLocaleString("en-AU")}{" "}
                                      {selectedLot.base_uom_code}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </FormSection>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFormDialog(false);
                resetForm();
              }}
              disabled={formMutation.isPending}
              className="min-h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => formMutation.mutate()}
              disabled={formMutation.isPending}
              className="min-h-11 rounded-xl bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
            >
              {formMutation.isPending
                ? "Saving..."
                : formMode === "create"
                  ? "Create Stock Issue"
                  : "Save Draft Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedIssue) && actionType === null}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-2xl">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-3 text-2xl">
                  <PackageCheck className="h-6 w-6 text-[#8B3F3F]" />
                  {selectedIssue.stock_issue_no}
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                      STATUS_CLASS[selectedIssue.issue_status]
                    }`}
                  >
                    {STATUS_LABEL[selectedIssue.issue_status]}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                {selectedIssue.issue_status === "Draft" &&
                  permissions?.updateDraft && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedIssueId(null);
                        openEdit(selectedIssue);
                      }}
                      className="rounded-xl"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit Draft
                    </Button>
                  )}
                {(permissions?.print || permissions?.exportPdf) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => printSelectedIssue(selectedIssue)}
                    className="rounded-xl"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Print / Save PDF
                  </Button>
                )}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <FormSection number="01" title="Issue Overview">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <ReadOnlyField
                        label="Customer"
                        value={
                          selectedIssue.projects?.customers?.customer_name ?? "â€”"
                        }
                      />
                      <ReadOnlyField
                        label="Project"
                        value={
                          [
                            selectedIssue.projects?.project_no,
                            selectedIssue.projects?.project_name,
                          ]
                            .filter(Boolean)
                            .join(" â€” ") || "â€”"
                        }
                      />
                      <ReadOnlyField
                        label="Request"
                        value={
                          selectedIssue.stock_requests?.stock_request_no ?? "â€”"
                        }
                      />
                      <ReadOnlyField
                        label="Site"
                        value={
                          [
                            selectedIssue.project_sites?.site_code,
                            selectedIssue.project_sites?.site_name,
                          ]
                            .filter(Boolean)
                            .join(" â€” ") || "â€”"
                        }
                      />
                      <ReadOnlyField
                        label="Area"
                        value={
                          [
                            selectedIssue.project_areas?.area_code,
                            selectedIssue.project_areas?.area_name,
                          ]
                            .filter(Boolean)
                            .join(" â€” ") || "â€”"
                        }
                      />
                      <ReadOnlyField
                        label="Recipient"
                        value={selectedIssue.recipient_name ?? "â€”"}
                      />
                      <ReadOnlyField
                        label="Source Location"
                        value={
                          selectedIssue.stock_locations
                            ? `${selectedIssue.stock_locations.location_code} â€” ${selectedIssue.stock_locations.location_name}`
                            : "â€”"
                        }
                      />
                      <ReadOnlyField
                        label="Delivery Method"
                        value={selectedIssue.delivery_method}
                      />
                      <ReadOnlyField
                        label="Destination"
                        value={
                          selectedIssue.destination_location
                            ? `${selectedIssue.destination_location.location_code} â€” ${selectedIssue.destination_location.location_name}`
                            : "â€”"
                        }
                      />
                    </div>
                  </FormSection>

                  <FormSection number="02" title="Issue Lines">
                    <div className="space-y-3">
                      {selectedIssue.stock_issue_lines.map((line) => (
                        <div
                          key={line.stock_issue_line_id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-black text-slate-900">
                                {String(line.line_no).padStart(2, "0")} Â·{" "}
                                {line.issued_product?.product_name ??
                                  line.requested_product?.product_name ??
                                  line.description ??
                                  "Unnamed product"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {line.issued_product?.product_code ??
                                  line.requested_product?.product_code ??
                                  "â€”"}{" "}
                                Â· {line.line_status}
                              </p>
                            </div>
                            <p className="font-black text-slate-900">
                              {numberValue(line.issue_quantity).toLocaleString(
                                "en-AU",
                              )}{" "}
                              {line.issue_uom_code}
                            </p>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <QuantityItem
                              label="Base Quantity"
                              value={line.issue_base_quantity}
                              unit={line.base_uom_code}
                            />
                            <QuantityItem
                              label="Received"
                              value={line.received_base_quantity}
                              unit={line.base_uom_code}
                            />
                            <QuantityItem
                              label="Damaged"
                              value={line.damaged_base_quantity}
                              unit={line.base_uom_code}
                            />
                            <QuantityItem
                              label="Outstanding"
                              value={Math.max(
                                0,
                                numberValue(line.issue_base_quantity) -
                                  numberValue(line.received_base_quantity) -
                                  numberValue(line.damaged_base_quantity) -
                                  numberValue(line.short_base_quantity),
                              )}
                              unit={line.base_uom_code}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormSection>

                  <FormSection number="03" title="Receipts & Audit Timeline">
                    <div className="mb-5 space-y-3">
                      {selectedIssue.stock_issue_receipts.length === 0 ? (
                        <p className="rounded-xl bg-[#F7F9FB] p-4 text-sm text-slate-500">
                          No receipt sessions have been created.
                        </p>
                      ) : (
                        selectedIssue.stock_issue_receipts
                          .slice()
                          .sort((a, b) => b.receipt_no - a.receipt_no)
                          .map((receipt) => (
                            <div
                              key={receipt.stock_issue_receipt_id}
                              className="rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-black text-slate-900">
                                  Receipt #{receipt.receipt_no}
                                </p>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                  {receipt.receipt_status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {receipt.received_by_name ?? "â€”"} Â· {formatDateTime(receipt.received_at ?? receipt.confirmed_at)}
                              </p>
                              {receipt.stock_issue_receipt_lines.length > 0 && (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {receipt.stock_issue_receipt_lines.map((line) => (
                                    <div key={line.stock_issue_receipt_line_id} className="rounded-lg bg-[#F7F9FB] p-3 text-xs">
                                      <p className="font-bold text-slate-700">Line {line.line_no} Â· {line.condition_status}</p>
                                      <p className="mt-1 text-slate-500">Received {numberValue(line.received_base_quantity).toLocaleString("en-AU")} Â· Damaged {numberValue(line.damaged_base_quantity).toLocaleString("en-AU")} Â· Short {numberValue(line.short_base_quantity).toLocaleString("en-AU")}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {permissions?.viewPhotos && receiptPhotos.some((photo) => photo.source_id === receipt.stock_issue_receipt_id) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {receiptPhotos.filter((photo) => photo.source_id === receipt.stock_issue_receipt_id).map((photo) => (
                                    <span key={photo.inventory_transaction_photo_id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                                      <Camera className="mr-1 inline h-3.5 w-3.5" />
                                      {photo.original_file_name ?? photo.photo_type}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                    <div className="space-y-3 border-t border-slate-200 pt-5">
                      {selectedIssue.stock_issue_audit_events.map((event) => (
                        <div
                          key={event.stock_issue_audit_event_id}
                          className="relative pl-7"
                        >
                          <span
                            className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${
                              event.event_severity === "Critical"
                                ? "bg-red-500"
                                : event.event_severity === "Warning"
                                  ? "bg-amber-500"
                                  : "bg-[#8B3F3F]"
                            }`}
                          />
                          <p className="font-bold text-slate-900">
                            {event.event_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(event.event_at)}
                            {event.notification_queued
                              ? " Â· Telegram queued"
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-[#F7F9FB] p-5">
                    <h2 className="font-black text-slate-900">Workflow</h2>
                    <div className="mt-4 space-y-3">
                      <WorkflowStep
                        icon={<ClipboardList className="h-4 w-4" />}
                        label="Created"
                        date={selectedIssue.created_at}
                        complete
                      />
                      <WorkflowStep
                        icon={<PackageOpen className="h-4 w-4" />}
                        label="Prepared"
                        date={selectedIssue.prepared_at}
                        complete={Boolean(selectedIssue.prepared_at)}
                      />
                      <WorkflowStep
                        icon={<Warehouse className="h-4 w-4" />}
                        label="Issued"
                        date={selectedIssue.issued_at}
                        complete={Boolean(selectedIssue.issued_at)}
                      />
                      <WorkflowStep
                        icon={<Truck className="h-4 w-4" />}
                        label="Dispatched"
                        date={selectedIssue.dispatched_at}
                        complete={Boolean(selectedIssue.dispatched_at)}
                      />
                      <WorkflowStep
                        icon={<MapPin className="h-4 w-4" />}
                        label="Delivered"
                        date={selectedIssue.delivered_at}
                        complete={Boolean(selectedIssue.delivered_at)}
                      />
                      <WorkflowStep
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Received"
                        date={selectedIssue.received_at}
                        complete={Boolean(selectedIssue.received_at)}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="font-black text-slate-900">
                      Available Actions
                    </h2>
                    <div className="mt-4 grid gap-2">
                      {selectedIssue.issue_status === "Draft" &&
                        permissions?.prepare && (
                          <ActionButton
                            label="Prepare Stock Issue"
                            icon={<PackageOpen className="mr-2 h-4 w-4" />}
                            onClick={() => openAction(selectedIssue, "prepare")}
                          />
                        )}
                      {selectedIssue.issue_status === "Prepared" &&
                        permissions?.issue && (
                          <ActionButton
                            label="Issue & Deduct Stock"
                            icon={<Warehouse className="mr-2 h-4 w-4" />}
                            onClick={() => openAction(selectedIssue, "issue")}
                          />
                        )}
                      {selectedIssue.issue_status === "Issued" &&
                        permissions?.dispatch && (
                          <ActionButton
                            label="Dispatch"
                            icon={<Send className="mr-2 h-4 w-4" />}
                            onClick={() => openAction(selectedIssue, "dispatch")}
                          />
                        )}
                      {selectedIssue.issue_status === "Dispatched" &&
                        permissions?.dispatch && (
                          <ActionButton
                            label="Mark Delivered"
                            icon={<Truck className="mr-2 h-4 w-4" />}
                            onClick={() => openAction(selectedIssue, "deliver")}
                          />
                        )}
                      {["Delivered", "PartiallyReceived"].includes(
                        selectedIssue.issue_status,
                      ) &&
                        permissions?.confirmReceipt && (
                          <ActionButton
                            label="Record Receipt"
                            icon={<PackageCheck className="mr-2 h-4 w-4" />}
                            onClick={() => openReceipt(selectedIssue)}
                          />
                        )}
                      {["Draft", "Prepared"].includes(
                        selectedIssue.issue_status,
                      ) &&
                        permissions?.cancel && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openAction(selectedIssue, "cancel")}
                            className="min-h-11 rounded-xl border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Stock Issue
                          </Button>
                        )}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptDialog} onOpenChange={(open) => !open && closeReceiptDialog()}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Stock Issue Receipt</DialogTitle>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-5">
              <div className="rounded-xl bg-[#F7F9FB] p-4">
                <p className="font-black text-slate-900">{selectedIssue.stock_issue_no}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedIssue.projects?.project_name ?? "â€”"} Â· {selectedIssue.project_sites?.site_name ?? "â€”"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput label="Received By *" value={receivedByName} onChange={setReceivedByName} />
                <FormInput label="Received At *" type="datetime-local" value={receivedAt} onChange={setReceivedAt} />
              </div>
              <div className="space-y-2">
                <Label>Receipt Notes</Label>
                <Textarea value={receiptNotes} onChange={(event) => setReceiptNotes(event.target.value)} rows={3} className="rounded-xl border-[#E5E7EB] bg-[#F7F9FB]" />
              </div>

              {!receiptId ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Create a Draft Receipt before entering quantities or uploading evidence photos.
                  </p>
                  <Button type="button" onClick={() => createReceiptMutation.mutate()} disabled={createReceiptMutation.isPending} className="mt-3 min-h-11 rounded-xl bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]">
                    {createReceiptMutation.isPending ? "Creating..." : "Create Receipt Draft"}
                  </Button>
                </div>
              ) : (
                <>
                  <FormSection number="01" title="Receipt Quantities">
                    <div className="space-y-4">
                      {receiptLines.map((line) => (
                        <div key={line.stockIssueLineId} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap justify-between gap-2">
                            <div>
                              <p className="font-black text-slate-900">{String(line.lineNo).padStart(2, "0")} Â· {line.productName}</p>
                              <p className="text-xs text-slate-500">Outstanding {line.outstandingQuantity.toLocaleString("en-AU")} {line.baseUomCode}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <FormInput label={`Received (${line.baseUomCode})`} type="number" value={line.receivedQuantity} onChange={(value) => updateReceiptLine(line.stockIssueLineId, { receivedQuantity: value })} />
                            <FormInput label={`Damaged (${line.baseUomCode})`} type="number" value={line.damagedQuantity} onChange={(value) => updateReceiptLine(line.stockIssueLineId, { damagedQuantity: value, conditionStatus: numberValue(value) > 0 ? "Damaged" : line.conditionStatus })} />
                            <FormInput label={`Short (${line.baseUomCode})`} type="number" value={line.shortQuantity} onChange={(value) => updateReceiptLine(line.stockIssueLineId, { shortQuantity: value, conditionStatus: numberValue(value) > 0 ? "Short" : line.conditionStatus })} />
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <FormSelect label="Condition" value={line.conditionStatus} onChange={(value) => updateReceiptLine(line.stockIssueLineId, { conditionStatus: value as ReceiptFormLine["conditionStatus"] })} options={[{ value: "Good", label: "Good" }, { value: "Partial", label: "Partial" }, { value: "Damaged", label: "Damaged" }, { value: "Short", label: "Short" }]} />
                            <div className="space-y-2"><Label>Line Notes</Label><Input value={line.notes} onChange={(event) => updateReceiptLine(line.stockIssueLineId, { notes: event.target.value })} className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB]" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormSection>

                  <FormSection number="02" title="Receipt Evidence Photos">
                    <div className="rounded-xl border border-dashed border-slate-300 bg-[#F7F9FB] p-5 text-center">
                      <Camera className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm font-bold text-slate-700">At least one photo is required</p>
                      <p className="mt-1 text-xs text-slate-500">JPEG, PNG or WebP Â· maximum 10 MB per file</p>
                      {permissions?.uploadPhotos && (
                        <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-[#8B3F3F] px-4 py-2 text-sm font-bold text-white hover:bg-[#9E4B4B]">
                          {isUploadingPhotos ? "Uploading..." : "Choose Photos"}
                          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={isUploadingPhotos} onChange={(event) => { void uploadReceiptPhotos(event.target.files); event.currentTarget.value = ""; }} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      {receiptPhotos.filter((photo) => photo.source_id === receiptId).map((photo) => (
                        <div key={photo.inventory_transaction_photo_id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                          <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{photo.original_file_name ?? photo.photo_type}</p><p className="text-xs text-slate-500">{photo.photo_type} Â· {formatDateTime(photo.created_at)}</p></div>
                          {permissions?.deletePhotos && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => deleteReceiptPhotoMutation.mutate(photo)} disabled={deleteReceiptPhotoMutation.isPending}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <div>{receiptId && <Button type="button" variant="outline" onClick={() => cancelReceiptMutation.mutate()} disabled={cancelReceiptMutation.isPending || confirmReceiptMutation.isPending || isUploadingPhotos} className="min-h-11 rounded-xl border-red-300 text-red-700 hover:bg-red-50">Cancel Draft Receipt</Button>}</div>
                <div className="flex gap-3"><Button type="button" variant="outline" onClick={closeReceiptDialog} disabled={confirmReceiptMutation.isPending || isUploadingPhotos} className="min-h-11 rounded-xl">Close</Button>{receiptId && <Button type="button" onClick={() => confirmReceiptMutation.mutate()} disabled={confirmReceiptMutation.isPending || isUploadingPhotos} className="min-h-11 rounded-xl bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]">{confirmReceiptMutation.isPending ? "Confirming..." : "Confirm Receipt"}</Button>}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(actionType)}
        onOpenChange={(open) => {
          if (!open && !workflowMutation.isPending) closeActionDialog();
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "prepare" && "Prepare Stock Issue"}
              {actionType === "issue" && "Issue and Deduct Stock"}
              {actionType === "dispatch" && "Dispatch Stock Issue"}
              {actionType === "deliver" && "Mark Stock Issue Delivered"}
              {actionType === "cancel" && "Cancel Stock Issue"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "issue" && (
              <FormInput
                label="Movement Date *"
                type="date"
                value={movementDate}
                onChange={setMovementDate}
              />
            )}
            {actionType === "dispatch" && (
              <>
                <FormInput
                  label="Dispatch Reference"
                  value={dispatchReference}
                  onChange={setDispatchReference}
                />
                <FormInput
                  label="Vehicle Reference"
                  value={vehicleReference}
                  onChange={setVehicleReference}
                />
              </>
            )}
            {actionType === "cancel" ? (
              <div className="space-y-2">
                <Label>Cancellation Reason *</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  rows={4}
                  className="rounded-xl border-[#E5E7EB] bg-[#F7F9FB]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={actionNotes}
                  onChange={(event) => setActionNotes(event.target.value)}
                  rows={3}
                  className="rounded-xl border-[#E5E7EB] bg-[#F7F9FB]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeActionDialog}
              disabled={workflowMutation.isPending}
              className="min-h-11 rounded-xl"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => workflowMutation.mutate()}
              disabled={workflowMutation.isPending}
              className={`min-h-11 rounded-xl text-white ${
                actionType === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#8B3F3F] hover:bg-[#9E4B4B]"
              }`}
            >
              {workflowMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      {icon}
    </div>
    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
  </div>
);

const FilterSelect = ({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) => (
  <div className={className}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const FormSection = ({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B3F3F] text-sm font-black text-white">
        {number}
      </span>
      <h2 className="font-black text-slate-900">{title}</h2>
    </div>
    {children}
  </section>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-[#F7F9FB] p-3">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 break-words font-semibold text-slate-800">{value}</p>
  </div>
);

const FormInput = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      step={type === "number" ? "0.000001" : undefined}
      className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B]"
    />
  </div>
);

const FormSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B]">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const QuantityItem = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) => (
  <div className="rounded-lg bg-[#F7F9FB] p-3">
    <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
    <p className="mt-1 font-black text-slate-900">
      {numberValue(value).toLocaleString("en-AU")} {unit}
    </p>
  </div>
);

const WorkflowStep = ({
  icon,
  label,
  date,
  complete,
}: {
  icon: React.ReactNode;
  label: string;
  date: string | null;
  complete: boolean;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full ${
        complete
          ? "bg-[#8B3F3F] text-white"
          : "bg-slate-200 text-slate-400"
      }`}
    >
      {icon}
    </div>
    <div>
      <p
        className={`text-sm font-bold ${
          complete ? "text-slate-900" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="text-xs text-slate-500">{formatDateTime(date)}</p>
    </div>
  </div>
);

const ActionButton = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <Button
    type="button"
    onClick={onClick}
    className="min-h-11 rounded-xl bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
  >
    {icon}
    {label}
  </Button>
);

export default StockIssues;


