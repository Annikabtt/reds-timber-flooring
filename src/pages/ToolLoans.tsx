import { useMemo, useState, type ReactNode } from "react";
import {
  Download,
  Edit3,
  Eye,
  FilterX,
  PackageOpen,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Undo2,
  Wrench,
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

type LoanStatus =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "Approved"
  | "Prepared"
  | "Issued"
  | "InUse"
  | "PartiallyReturned"
  | "Returned"
  | "Overdue"
  | "Damaged"
  | "Lost"
  | "Closed"
  | "Cancelled";

type PermissionMap = Record<string, boolean>;

type FormItem = {
  key: string;
  stockRequestItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  approvedQuantity: string;
  loanUomCode: string;
  assetReference: string;
  serialNumber: string;
  description: string;
  conditionBefore: string;
  conditionNotesBefore: string;
  notes: string;
};

type EmployeeLookup = {
  employee_id: string;
  auth_user_id?: string | null;
  employee_code?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type ProductSummary = {
  product_code?: string | null;
  product_name?: string | null;
  product_type?: string | null;
  base_uom_code?: string | null;
};

type ToolLoanItem = {
  tool_loan_item_id: string;
  tool_loan_id?: string;
  stock_request_item_id?: string | null;
  line_no: number;
  product_id: string;
  asset_reference?: string | null;
  serial_number?: string | null;
  description: string;
  loan_uom_code: string;
  approved_quantity: number;
  approved_base_quantity?: number;
  base_uom_code?: string;
  issued_quantity?: number;
  returned_quantity?: number;
  damaged_quantity?: number;
  lost_quantity?: number;
  condition_before?: string | null;
  condition_notes_before?: string | null;
  item_status?: string;
  notes?: string | null;
  products?: ProductSummary | null;
};

type CustomerSummary = {
  customer_name?: string | null;
};

type ProjectSummary = {
  project_no?: string | null;
  project_name?: string | null;
  customers?: CustomerSummary | null;
};

type SiteSummary = {
  site_code?: string | null;
  site_name?: string | null;
};

type AreaSummary = {
  area_code?: string | null;
  area_name?: string | null;
};

type StockRequestItem = {
  stock_request_item_id: string;
  line_no: number;
  product_id: string;
  description?: string | null;
  approved_quantity?: number | null;
  approved_base_quantity?: number | null;
  request_uom_code?: string | null;
  unit_of_measure?: string | null;
  fulfilment_method?: string | null;
  line_status?: string | null;
  products?: ProductSummary | null;
};

type StockRequest = {
  stock_request_id: string;
  stock_request_no: string;
  request_status: string;
  project_id?: string;
  site_id?: string;
  area_id?: string | null;
  work_order_id?: string | null;
  required_date?: string | null;
  projects?: ProjectSummary | null;
  project_sites?: SiteSummary | null;
  project_areas?: AreaSummary | null;
  stock_request_items?: StockRequestItem[] | null;
};

type StockLocation = {
  stock_location_id: string;
  location_code: string;
  location_name: string;
};

type ToolLoanReturnSummary = {
  tool_loan_return_id: string;
  return_no: number;
  return_status: string;
  returned_at?: string | null;
  received_by_name?: string | null;
  return_notes?: string | null;
};

type ToolLoan = {
  tool_loan_id: string;
  tool_loan_no: string;
  stock_request_id?: string | null;
  from_stock_location_id: string;
  borrower_employee_id: string;
  loan_date: string;
  due_date?: string | null;
  priority: string;
  loan_status: LoanStatus;
  notes?: string | null;
  stock_requests?: {
    stock_request_no?: string | null;
    request_status?: string | null;
  } | null;
  projects?: ProjectSummary | null;
  project_sites?: SiteSummary | null;
  project_areas?: AreaSummary | null;
  stock_locations?: {
    location_code?: string | null;
    location_name?: string | null;
  } | null;
  employees?: EmployeeLookup | null;
  tool_loan_items?: ToolLoanItem[] | null;
  tool_loan_returns?: ToolLoanReturnSummary[] | null;
};


type StockLot = {
  stock_lot_id: string;
  lot_no: string;
  product_id: string;
  stock_location_id: string;
  base_uom_code: string;
  received_quantity: number;
  remaining_quantity: number;
  reserved_quantity: number;
  damaged_quantity: number;
  lot_status: string;
};

type IssuePosting = {
  tool_loan_issue_posting_id: string;
  tool_loan_id: string;
  tool_loan_item_id: string;
  stock_lot_id: string;
  issued_base_quantity: number;
  base_uom_code: string;
  issued_at: string;
  notes?: string | null;
  stock_lots?: {
    lot_no?: string | null;
    product_id?: string | null;
    stock_location_id?: string | null;
  } | null;
  tool_loan_items?: {
    line_no?: number | null;
    product_id?: string | null;
    description?: string | null;
    products?: ProductSummary | null;
  } | null;
};

type ReturnPosting = {
  tool_loan_issue_posting_id: string;
  returned_base_quantity: number;
  damaged_base_quantity: number;
  lost_base_quantity: number;
};

type IssueAllocationForm = {
  key: string;
  toolLoanItemId: string;
  stockLotId: string;
  issueBaseQuantity: string;
};

type ReturnAllocationForm = {
  issuePostingId: string;
  returnedBaseQuantity: string;
  damagedBaseQuantity: string;
  lostBaseQuantity: string;
  damageNotes: string;
  missingNotes: string;
  notes: string;
};

const PERMISSIONS = [
  "tool_loans.view",
  "tool_loans.view_own",
  "tool_loans.create",
  "tool_loans.update_draft",
  "tool_loans.submit",
  "tool_loans.approve",
  "tool_loans.prepare",
  "tool_loans.issue",
  "tool_loans.return",
  "tool_loans.cancel",
  "tool_loans.print",
  "tool_loans.export_pdf",
  "tool_loans.export_csv",
];

const STATUS_ORDER: LoanStatus[] = [
  "Draft",
  "Submitted",
  "UnderReview",
  "Approved",
  "Prepared",
  "Issued",
  "InUse",
  "PartiallyReturned",
  "Returned",
  "Overdue",
  "Damaged",
  "Lost",
  "Closed",
  "Cancelled",
];

const STATUS_LABEL: Record<LoanStatus, string> = {
  Draft: "Draft",
  Submitted: "Submitted",
  UnderReview: "Under Review",
  Approved: "Approved",
  Prepared: "Prepared",
  Issued: "Issued",
  InUse: "In Use",
  PartiallyReturned: "Partially Returned",
  Returned: "Returned",
  Overdue: "Overdue",
  Damaged: "Damaged",
  Lost: "Lost",
  Closed: "Closed",
  Cancelled: "Cancelled",
};

const STATUS_CLASS: Record<LoanStatus, string> = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  Submitted: "border-blue-200 bg-blue-50 text-blue-700",
  UnderReview: "border-violet-200 bg-violet-50 text-violet-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Prepared: "border-amber-200 bg-amber-50 text-amber-700",
  Issued: "border-cyan-200 bg-cyan-50 text-cyan-700",
  InUse: "border-indigo-200 bg-indigo-50 text-indigo-700",
  PartiallyReturned: "border-orange-200 bg-orange-50 text-orange-700",
  Returned: "border-green-200 bg-green-50 text-green-700",
  Overdue: "border-red-200 bg-red-50 text-red-700",
  Damaged: "border-rose-200 bg-rose-50 text-rose-700",
  Lost: "border-red-300 bg-red-100 text-red-800",
  Closed: "border-slate-300 bg-slate-200 text-slate-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

const newKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const employeeName = (employee?: EmployeeLookup | null) =>
  employee?.display_name ||
  `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
  employee?.employee_code ||
  "—";

const csvCell = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const ToolLoans = () => {
  // Temporary bridge until Supabase generated types include the latest Tool Loan RPCs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [borrowerEmployeeId, setBorrowerEmployeeId] = useState("");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);

  const [action, setAction] = useState<
    "submit" | "approve" | "prepare" | "cancel" | null
  >(null);
  const [actionNotes, setActionNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueNotes, setIssueNotes] = useState("");
  const [issueAllocations, setIssueAllocations] = useState<IssueAllocationForm[]>(
    [],
  );

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnAllocations, setReturnAllocations] = useState<
    ReturnAllocationForm[]
  >([]);

  const permissionQuery = useQuery({
    queryKey: ["tool-loan-permissions"],
    queryFn: async () => {
      const entries = await Promise.all(
        PERMISSIONS.map(async (code) => {
          const { data, error } = await db.rpc("has_permission", {
            p_permission_code: code,
          });
          if (error) throw error;
          return [code, Boolean(data)] as const;
        }),
      );
      return Object.fromEntries(entries) as PermissionMap;
    },
  });

  const can = (code: string) => permissionQuery.data?.[code] === true;

  const loansQuery = useQuery({
    queryKey: ["tool-loans"],
    enabled:
      can("tool_loans.view") || can("tool_loans.view_own"),
    queryFn: async () => {
      const { data, error } = await db
        .from("tool_loans")
        .select(`
          *,
          stock_requests(stock_request_no, request_status),
          projects(project_no, project_name, customers(customer_name)),
          project_sites(site_code, site_name),
          project_areas(area_code, area_name),
          stock_locations(location_code, location_name),
          employees!tool_loans_borrower_employee_id_fkey(
            employee_code, display_name, first_name, last_name
          ),
          tool_loan_items(
            *,
            products(product_code, product_name, product_type)
          ),
          tool_loan_returns(
            tool_loan_return_id, return_no, return_status, returned_at,
            received_by_name, return_notes
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .order("line_no", {
          referencedTable: "tool_loan_items",
          ascending: true,
        });

      if (error) throw error;
      return (data ?? []) as ToolLoan[];
    },
  });

  const requestsQuery = useQuery({
    queryKey: ["approved-loan-stock-requests"],
    enabled: can("tool_loans.create"),
    queryFn: async () => {
      const { data, error } = await db
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
          projects(project_no, project_name, customers(customer_name)),
          project_sites(site_code, site_name),
          project_areas(area_code, area_name),
          stock_request_items(
            stock_request_item_id,
            line_no,
            product_id,
            description,
            approved_quantity,
            approved_base_quantity,
            request_uom_code,
            unit_of_measure,
            fulfilment_method,
            line_status,
            products(product_code, product_name, product_type, base_uom_code)
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

      if (error) throw error;

      return ((data ?? []) as StockRequest[]).filter((request) =>
        (request.stock_request_items ?? []).some(
          (item) =>
            item.fulfilment_method === "Loan" &&
            Number(item.approved_base_quantity ?? 0) > 0 &&
            ["Tool", "Equipment"].includes(item.products?.product_type),
        ),
      );
    },
  });

  const lookupsQuery = useQuery({
    queryKey: ["tool-loan-lookups"],
    queryFn: async () => {
      const [employees, locations] = await Promise.all([
        db
          .from("employees")
          .select(
            "employee_id, auth_user_id, employee_code, display_name, first_name, last_name",
          )
          .eq("is_deleted", false)
          .eq("is_active", true)
          .order("first_name"),
        db
          .from("stock_locations")
          .select("stock_location_id, location_code, location_name")
          .eq("is_deleted", false)
          .eq("is_active", true)
          .order("location_name"),
      ]);

      if (employees.error) throw employees.error;
      if (locations.error) throw locations.error;

      return {
        employees: (employees.data ?? []) as EmployeeLookup[],
        locations: (locations.data ?? []) as StockLocation[],
      };
    },
  });

  const loans = useMemo(() => loansQuery.data ?? [], [loansQuery.data]);
  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );
  const employees = useMemo(
    () => lookupsQuery.data?.employees ?? [],
    [lookupsQuery.data?.employees],
  );
  const locations = useMemo(
    () => lookupsQuery.data?.locations ?? [],
    [lookupsQuery.data?.locations],
  );
  const selectedLoan = loans.find((loan) => loan.tool_loan_id === selectedId);
  const selectedRequest = requests.find(
    (request) => request.stock_request_id === requestId,
  );


  const stockLotsQuery = useQuery({
    queryKey: [
      "tool-loan-stock-lots",
      selectedLoan?.tool_loan_id,
      selectedLoan?.from_stock_location_id,
    ],
    enabled: issueOpen && Boolean(selectedLoan),
    queryFn: async () => {
      if (!selectedLoan) return [] as StockLot[];

      const productIds = [
        ...new Set(
          (selectedLoan.tool_loan_items ?? []).map((item) => item.product_id),
        ),
      ];

      if (productIds.length === 0) return [] as StockLot[];

      const { data, error } = await db
        .from("stock_lots")
        .select(
          "stock_lot_id, lot_no, product_id, stock_location_id, base_uom_code, received_quantity, remaining_quantity, reserved_quantity, damaged_quantity, lot_status",
        )
        .eq("stock_location_id", selectedLoan.from_stock_location_id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .in("product_id", productIds)
        .gt("remaining_quantity", 0)
        .order("received_date", { ascending: true })
        .order("lot_no", { ascending: true });

      if (error) throw error;
      return (data ?? []) as StockLot[];
    },
  });

  const canConfirmIssue = useMemo(() => {
    if (!selectedLoan || stockLotsQuery.isLoading || stockLotsQuery.isError) {
      return false;
    }

    const lots = stockLotsQuery.data ?? [];
    const items = selectedLoan.tool_loan_items ?? [];
    if (items.length === 0 || issueAllocations.length === 0) return false;

    return items.every((item) => {
      const required = Number(
        item.approved_base_quantity ?? item.approved_quantity,
      );
      const allocations = issueAllocations.filter(
        (allocation) => allocation.toolLoanItemId === item.tool_loan_item_id,
      );

      if (allocations.length === 0) return false;

      const seenLots = new Set<string>();
      let total = 0;

      for (const allocation of allocations) {
        const quantity = Number(allocation.issueBaseQuantity);
        const lot = lots.find(
          (row) => row.stock_lot_id === allocation.stockLotId,
        );

        if (
          !allocation.stockLotId ||
          !lot ||
          seenLots.has(allocation.stockLotId) ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          quantity > Number(lot.remaining_quantity)
        ) {
          return false;
        }

        seenLots.add(allocation.stockLotId);
        total += quantity;
      }

      return Math.abs(total - required) <= 0.000001;
    });
  }, [
    issueAllocations,
    selectedLoan,
    stockLotsQuery.data,
    stockLotsQuery.isError,
    stockLotsQuery.isLoading,
  ]);

  const issuePostingsQuery = useQuery({
    queryKey: ["tool-loan-issue-postings", selectedLoan?.tool_loan_id],
    enabled: returnOpen && Boolean(selectedLoan),
    queryFn: async () => {
      if (!selectedLoan) {
        return {
          issuePostings: [] as IssuePosting[],
          returnPostings: [] as ReturnPosting[],
        };
      }

      const [issues, returns] = await Promise.all([
        db
          .from("tool_loan_issue_postings")
          .select(`
            tool_loan_issue_posting_id,
            tool_loan_id,
            tool_loan_item_id,
            stock_lot_id,
            issued_base_quantity,
            base_uom_code,
            issued_at,
            notes,
            stock_lots(lot_no, product_id, stock_location_id),
            tool_loan_items(
              line_no,
              product_id,
              description,
              products(product_code, product_name, product_type, base_uom_code)
            )
          `)
          .eq("tool_loan_id", selectedLoan.tool_loan_id)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("issued_at", { ascending: true }),
        db
          .from("tool_loan_return_postings")
          .select(
            "tool_loan_issue_posting_id, returned_base_quantity, damaged_base_quantity, lost_base_quantity",
          )
          .eq("tool_loan_id", selectedLoan.tool_loan_id)
          .eq("is_active", true)
          .eq("is_deleted", false),
      ]);

      if (issues.error) throw issues.error;
      if (returns.error) throw returns.error;

      return {
        issuePostings: (issues.data ?? []) as IssuePosting[],
        returnPostings: (returns.data ?? []) as ReturnPosting[],
      };
    },
  });


  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return loans.filter((loan) => {
      if (status !== "all" && loan.loan_status !== status) return false;
      if (priorityFilter !== "all" && loan.priority !== priorityFilter) {
        return false;
      }

      if (!keyword) return true;

      const text = [
        loan.tool_loan_no,
        loan.stock_requests?.stock_request_no,
        loan.projects?.customers?.customer_name,
        loan.projects?.project_no,
        loan.projects?.project_name,
        loan.project_sites?.site_code,
        loan.project_sites?.site_name,
        loan.project_areas?.area_code,
        loan.project_areas?.area_name,
        employeeName(loan.employees),
        ...(loan.tool_loan_items ?? []).flatMap((item) => [
          item.products?.product_code,
          item.products?.product_name,
          item.asset_reference,
          item.serial_number,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [loans, priorityFilter, search, status]);

  const summary = useMemo(
    () => ({
      total: filtered.length,
      pending: filtered.filter((loan) =>
        ["Draft", "Submitted", "UnderReview", "Approved", "Prepared"].includes(
          loan.loan_status,
        ),
      ).length,
      inUse: filtered.filter((loan) =>
        ["Issued", "InUse", "PartiallyReturned"].includes(loan.loan_status),
      ).length,
      overdue: filtered.filter(
        (loan) =>
          loan.loan_status === "Overdue" ||
          (loan.due_date &&
            loan.due_date < new Date().toISOString().slice(0, 10) &&
            !["Returned", "Closed", "Cancelled"].includes(loan.loan_status)),
      ).length,
    }),
    [filtered],
  );

  const resetForm = () => {
    setEditingId(null);
    setRequestId("");
    setLocationId("");
    setBorrowerEmployeeId("");
    setLoanDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setPriority("Normal");
    setNotes("");
    setItems([]);
  };

  const loadRequest = (value: string) => {
    setRequestId(value);
    const request = requests.find(
      (row) => row.stock_request_id === value,
    );
    setDueDate(request?.required_date ?? "");

    setItems(
      (request?.stock_request_items ?? [])
        .filter(
          (item) =>
            item.fulfilment_method === "Loan" &&
            Number(item.approved_base_quantity ?? 0) > 0 &&
            ["Tool", "Equipment"].includes(item.products?.product_type),
        )
        .map((item) => ({
          key: newKey(),
          stockRequestItemId: item.stock_request_item_id,
          productId: item.product_id,
          productCode: item.products?.product_code ?? "",
          productName:
            item.products?.product_name ?? item.description ?? "Unnamed tool",
          approvedQuantity: String(item.approved_quantity ?? 0),
          loanUomCode:
            item.request_uom_code ??
            item.unit_of_measure ??
            item.products?.base_uom_code ??
            "",
          assetReference: "",
          serialNumber: "",
          description:
            item.description ?? item.products?.product_name ?? "Unnamed tool",
          conditionBefore: "Good",
          conditionNotesBefore: "",
          notes: "",
        })),
    );
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
    setFormOpen(true);
  };

  const openEdit = (loan) => {
    resetForm();
    setMode("edit");
    setEditingId(loan.tool_loan_id);
    setRequestId(loan.stock_request_id ?? "");
    setLocationId(loan.from_stock_location_id);
    setBorrowerEmployeeId(loan.borrower_employee_id);
    setLoanDate(loan.loan_date);
    setDueDate(loan.due_date ?? "");
    setPriority(loan.priority);
    setNotes(loan.notes ?? "");
    setItems(
      (loan.tool_loan_items ?? []).map((item) => ({
        key: item.tool_loan_item_id,
        stockRequestItemId: item.stock_request_item_id,
        productId: item.product_id,
        productCode: item.products?.product_code ?? "",
        productName: item.products?.product_name ?? item.description,
        approvedQuantity: String(item.approved_quantity),
        loanUomCode: item.loan_uom_code,
        assetReference: item.asset_reference ?? "",
        serialNumber: item.serial_number ?? "",
        description: item.description,
        conditionBefore: item.condition_before ?? "Good",
        conditionNotesBefore: item.condition_notes_before ?? "",
        notes: item.notes ?? "",
      })),
    );
    setFormOpen(true);
  };

  const updateItem = (key: string, changes: Partial<FormItem>) => {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );
  };


  const openIssue = (loan: ToolLoan) => {
    setSelectedId(loan.tool_loan_id);
    setIssueNotes("");
    setIssueAllocations(
      (loan.tool_loan_items ?? []).map((item) => ({
        key: newKey(),
        toolLoanItemId: item.tool_loan_item_id,
        stockLotId: "",
        issueBaseQuantity: String(
          item.approved_base_quantity ?? item.approved_quantity ?? "",
        ),
      })),
    );
    setIssueOpen(true);
  };

  const addIssueAllocation = (item: ToolLoanItem) => {
    setIssueAllocations((current) => [
      ...current,
      {
        key: newKey(),
        toolLoanItemId: item.tool_loan_item_id,
        stockLotId: "",
        issueBaseQuantity: "",
      },
    ]);
  };

  const updateIssueAllocation = (
    key: string,
    changes: Partial<IssueAllocationForm>,
  ) => {
    setIssueAllocations((current) =>
      current.map((allocation) =>
        allocation.key === key ? { ...allocation, ...changes } : allocation,
      ),
    );
  };

  const removeIssueAllocation = (key: string) => {
    setIssueAllocations((current) =>
      current.filter((allocation) => allocation.key !== key),
    );
  };


  const openReturn = async (loan: ToolLoan) => {
    setSelectedId(loan.tool_loan_id);
    setReturnNotes("");
    setReturnOpen(true);

    const result = await queryClient.fetchQuery({
      queryKey: ["tool-loan-issue-postings", loan.tool_loan_id],
      queryFn: async () => {
        const [issues, returns] = await Promise.all([
          db
            .from("tool_loan_issue_postings")
            .select(`
              tool_loan_issue_posting_id,
              tool_loan_id,
              tool_loan_item_id,
              stock_lot_id,
              issued_base_quantity,
              base_uom_code,
              issued_at,
              notes,
              stock_lots(lot_no, product_id, stock_location_id),
              tool_loan_items(
                line_no,
                product_id,
                description,
                products(product_code, product_name, product_type, base_uom_code)
              )
            `)
            .eq("tool_loan_id", loan.tool_loan_id)
            .eq("is_active", true)
            .eq("is_deleted", false)
            .order("issued_at", { ascending: true }),
          db
            .from("tool_loan_return_postings")
            .select(
              "tool_loan_issue_posting_id, returned_base_quantity, damaged_base_quantity, lost_base_quantity",
            )
            .eq("tool_loan_id", loan.tool_loan_id)
            .eq("is_active", true)
            .eq("is_deleted", false),
        ]);

        if (issues.error) throw issues.error;
        if (returns.error) throw returns.error;

        return {
          issuePostings: (issues.data ?? []) as IssuePosting[],
          returnPostings: (returns.data ?? []) as ReturnPosting[],
        };
      },
    });

    setReturnAllocations(
      result.issuePostings
        .filter((posting) => {
          const processed = result.returnPostings
            .filter(
              (returned) =>
                returned.tool_loan_issue_posting_id ===
                posting.tool_loan_issue_posting_id,
            )
            .reduce(
              (total, returned) =>
                total +
                Number(returned.returned_base_quantity ?? 0) +
                Number(returned.damaged_base_quantity ?? 0) +
                Number(returned.lost_base_quantity ?? 0),
              0,
            );
          return Number(posting.issued_base_quantity) - processed > 0;
        })
        .map((posting) => ({
          issuePostingId: posting.tool_loan_issue_posting_id,
          returnedBaseQuantity: "",
          damagedBaseQuantity: "",
          lostBaseQuantity: "",
          damageNotes: "",
          missingNotes: "",
          notes: "",
        })),
    );
  };

  const remainingForIssuePosting = (
    issuePostingId: string,
    issuedQuantity: number,
  ) => {
    const processed = (
      issuePostingsQuery.data?.returnPostings ?? []
    ).reduce((total, posting) => {
      if (posting.tool_loan_issue_posting_id !== issuePostingId) return total;
      return (
        total +
        Number(posting.returned_base_quantity ?? 0) +
        Number(posting.damaged_base_quantity ?? 0) +
        Number(posting.lost_base_quantity ?? 0)
      );
    }, 0);

    return Math.max(0, Number(issuedQuantity) - processed);
  };

  const updateReturnAllocation = (
    issuePostingId: string,
    changes: Partial<ReturnAllocationForm>,
  ) => {
    setReturnAllocations((current) =>
      current.map((allocation) =>
        allocation.issuePostingId === issuePostingId
          ? { ...allocation, ...changes }
          : allocation,
      ),
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!requestId) throw new Error("Select an approved Stock Request.");
      if (!locationId) throw new Error("Select a source Stock Location.");
      if (!borrowerEmployeeId) throw new Error("Select a borrower.");
      if (!loanDate) throw new Error("Loan Date is required.");
      if (dueDate && dueDate < loanDate) {
        throw new Error("Due Date cannot be before Loan Date.");
      }
      if (items.length === 0) {
        throw new Error("At least one Tool or Equipment item is required.");
      }

      const borrower = employees.find(
        (employee) => employee.employee_id === borrowerEmployeeId,
      );

      const header = {
        stock_request_id: requestId,
        from_stock_location_id: locationId,
        borrower_employee_id: borrowerEmployeeId,
        borrower_auth_user_id: borrower?.auth_user_id ?? null,
        loan_date: loanDate,
        due_date: dueDate || null,
        priority,
        notes: notes.trim() || null,
      };

      const payloadItems = items.map((item, index) => {
        const quantity = Number(item.approvedQuantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(
            `Line ${index + 1}: approved quantity must be greater than zero.`,
          );
        }
        if (!item.conditionBefore) {
          throw new Error(
            `Line ${index + 1}: Condition Before Issue is required.`,
          );
        }

        return {
          stock_request_item_id: item.stockRequestItemId,
          approved_quantity: quantity,
          loan_uom_code: item.loanUomCode,
          asset_reference: item.assetReference.trim() || null,
          serial_number: item.serialNumber.trim() || null,
          description: item.description.trim(),
          condition_before: item.conditionBefore,
          condition_notes_before:
            item.conditionNotesBefore.trim() || null,
          notes: item.notes.trim() || null,
        };
      });

      if (mode === "create") {
        const { data, error } = await db.rpc("create_tool_loan_atomic", {
          p_header: header,
          p_items: payloadItems,
        });
        if (error) throw error;
        return data;
      }

      const { data, error } = await db.rpc(
        "update_draft_tool_loan_atomic",
        {
          p_tool_loan_id: editingId,
          p_header: header,
          p_items: payloadItems,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (id) => {
      toast.success(
        mode === "create"
          ? "Tool Loan created successfully."
          : "Draft Tool Loan updated successfully.",
      );
      setFormOpen(false);
      resetForm();
      setSelectedId(id);
      void queryClient.invalidateQueries({ queryKey: ["tool-loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["approved-loan-stock-requests"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });


  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLoan) throw new Error("Select a Tool Loan to issue.");

      const itemsById = new Map(
        (selectedLoan.tool_loan_items ?? []).map((item) => [
          item.tool_loan_item_id,
          item,
        ]),
      );

      const payload = issueAllocations.map((allocation, index) => {
        const quantity = Number(allocation.issueBaseQuantity);
        if (!allocation.stockLotId) {
          throw new Error(`Allocation ${index + 1}: select a Stock Lot.`);
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(
            `Allocation ${index + 1}: issue quantity must be greater than zero.`,
          );
        }

        const lot = (stockLotsQuery.data ?? []).find(
          (row) => row.stock_lot_id === allocation.stockLotId,
        );
        if (!lot) {
          throw new Error(`Allocation ${index + 1}: Stock Lot is unavailable.`);
        }
        if (quantity > Number(lot.remaining_quantity)) {
          throw new Error(
            `Allocation ${index + 1}: quantity exceeds lot ${lot.lot_no} availability.`,
          );
        }

        return {
          tool_loan_item_id: allocation.toolLoanItemId,
          stock_lot_id: allocation.stockLotId,
          issue_base_quantity: quantity,
        };
      });

      for (const [itemId, item] of itemsById) {
        const rows = payload.filter(
          (allocation) => allocation.tool_loan_item_id === itemId,
        );
        const total = rows.reduce(
          (sum, allocation) => sum + allocation.issue_base_quantity,
          0,
        );
        const required = Number(
          item.approved_base_quantity ?? item.approved_quantity,
        );

        if (Math.abs(total - required) > 0.000001) {
          throw new Error(
            `Line ${item.line_no}: allocation total ${total} must equal approved base quantity ${required} ${item.base_uom_code ?? item.loan_uom_code}.`,
          );
        }

        const duplicateLots = rows
          .map((row) => row.stock_lot_id)
          .filter((lotId, index, all) => all.indexOf(lotId) !== index);
        if (duplicateLots.length > 0) {
          throw new Error(
            `Line ${item.line_no}: the same Stock Lot cannot be selected twice.`,
          );
        }
      }

      const { data, error } = await db.rpc("issue_tool_loan_atomic", {
        p_tool_loan_id: selectedLoan.tool_loan_id,
        p_allocations: payload,
        p_notes: issueNotes.trim() || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tool Loan issued and stock deducted successfully.");
      setIssueOpen(false);
      setIssueNotes("");
      setIssueAllocations([]);
      void queryClient.invalidateQueries({ queryKey: ["tool-loans"] });
      void queryClient.invalidateQueries({ queryKey: ["tool-loan-stock-lots"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLoan) throw new Error("Select a Tool Loan to return.");

      const payload = returnAllocations
        .map((allocation) => {
          const returned = Number(allocation.returnedBaseQuantity || 0);
          const damaged = Number(allocation.damagedBaseQuantity || 0);
          const lost = Number(allocation.lostBaseQuantity || 0);

          if (
            !Number.isFinite(returned) ||
            !Number.isFinite(damaged) ||
            !Number.isFinite(lost) ||
            returned < 0 ||
            damaged < 0 ||
            lost < 0
          ) {
            throw new Error("Return quantities must be valid non-negative numbers.");
          }

          const issuePosting = (
            issuePostingsQuery.data?.issuePostings ?? []
          ).find(
            (posting) =>
              posting.tool_loan_issue_posting_id === allocation.issuePostingId,
          );
          if (!issuePosting) {
            throw new Error("An Issue Posting is no longer available.");
          }

          const remaining = remainingForIssuePosting(
            issuePosting.tool_loan_issue_posting_id,
            issuePosting.issued_base_quantity,
          );
          const total = returned + damaged + lost;

          if (total > remaining + 0.000001) {
            throw new Error(
              `Return for lot ${issuePosting.stock_lots?.lot_no ?? "—"} exceeds remaining quantity ${remaining}.`,
            );
          }
          if (damaged > 0 && !allocation.damageNotes.trim()) {
            throw new Error(
              `Damage notes are required for lot ${issuePosting.stock_lots?.lot_no ?? "—"}.`,
            );
          }
          if (lost > 0 && !allocation.missingNotes.trim()) {
            throw new Error(
              `Missing notes are required for lot ${issuePosting.stock_lots?.lot_no ?? "—"}.`,
            );
          }

          return {
            tool_loan_issue_posting_id: allocation.issuePostingId,
            returned_base_quantity: returned,
            damaged_base_quantity: damaged,
            lost_base_quantity: lost,
            damage_notes: allocation.damageNotes.trim() || null,
            missing_notes: allocation.missingNotes.trim() || null,
            notes: allocation.notes.trim() || null,
          };
        })
        .filter(
          (allocation) =>
            allocation.returned_base_quantity +
              allocation.damaged_base_quantity +
              allocation.lost_base_quantity >
            0,
        );

      if (payload.length === 0) {
        throw new Error("Enter at least one returned, damaged or lost quantity.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("The current authenticated user was not found.");

      const receiver = employees.find(
        (employee) => employee.auth_user_id === user.id,
      );

      const { data, error } = await db.rpc("return_tool_loan_atomic", {
        p_tool_loan_id: selectedLoan.tool_loan_id,
        p_allocations: payload,
        p_received_by_auth_user_id: user.id,
        p_received_by_employee_id: receiver?.employee_id ?? null,
        p_received_by_name: employeeName(receiver) || user.email || "Current user",
        p_return_notes: returnNotes.trim() || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tool Loan return posted successfully.");
      setReturnOpen(false);
      setReturnNotes("");
      setReturnAllocations([]);
      void queryClient.invalidateQueries({ queryKey: ["tool-loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["tool-loan-issue-postings"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const workflowMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLoan || !action) {
        throw new Error("Tool Loan action is incomplete.");
      }

      const rpc =
        action === "submit"
          ? "submit_tool_loan_atomic"
          : action === "approve"
            ? "approve_tool_loan_atomic"
            : action === "prepare"
              ? "prepare_tool_loan_atomic"
              : "cancel_tool_loan_atomic";

      const args =
        action === "cancel"
          ? {
              p_tool_loan_id: selectedLoan.tool_loan_id,
              p_reason: cancelReason.trim(),
            }
          : {
              p_tool_loan_id: selectedLoan.tool_loan_id,
              p_notes: actionNotes.trim() || null,
            };

      if (action === "cancel" && !cancelReason.trim()) {
        throw new Error("Cancellation reason is required.");
      }

      const { error } = await db.rpc(rpc, args);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tool Loan workflow updated successfully.");
      setAction(null);
      setActionNotes("");
      setCancelReason("");
      void queryClient.invalidateQueries({ queryKey: ["tool-loans"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const exportCsv = () => {
    const rows = [
      [
        "Tool Loan No",
        "Stock Request",
        "Customer",
        "Project",
        "Site",
        "Borrower",
        "Loan Date",
        "Due Date",
        "Priority",
        "Status",
        "Items",
      ],
      ...filtered.map((loan) => [
        loan.tool_loan_no,
        loan.stock_requests?.stock_request_no ?? "",
        loan.projects?.customers?.customer_name ?? "",
        [loan.projects?.project_no, loan.projects?.project_name]
          .filter(Boolean)
          .join(" — "),
        [loan.project_sites?.site_code, loan.project_sites?.site_name]
          .filter(Boolean)
          .join(" — "),
        employeeName(loan.employees),
        loan.loan_date,
        loan.due_date ?? "",
        loan.priority,
        STATUS_LABEL[loan.loan_status as LoanStatus],
        loan.tool_loan_items?.length ?? 0,
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reds-tool-loans-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printList = () => {
    const popup = window.open("", "_blank", "width=1100,height=800");
    if (!popup) {
      toast.error("Allow pop-ups to print or save as PDF.");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html><head><meta charset="utf-8"><title>REDS Tool Loans</title>
      <style>
        @page{size:A4 landscape;margin:12mm}
        body{font-family:Arial,sans-serif;color:#172033}
        h1{margin:0}.brand{color:#8B3F3F}.meta{margin:6px 0 18px;color:#64748b}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#8B3F3F;color:#fff;text-align:left;padding:7px}
        td{padding:7px;border-bottom:1px solid #ddd;vertical-align:top}
        @media print{button{display:none}}
      </style></head><body>
      <button onclick="window.print()">Print / Save PDF</button>
      <h1><span class="brand">REDS</span> Tool Loans</h1>
      <div class="meta">${filtered.length} filtered record(s) · ${new Date().toLocaleString("en-AU")}</div>
      <table><thead><tr>
        <th>Tool Loan</th><th>Request</th><th>Customer / Project</th>
        <th>Site</th><th>Borrower</th><th>Loan / Due</th><th>Status</th><th>Items</th>
      </tr></thead><tbody>
      ${filtered
        .map(
          (loan) => `<tr>
          <td><strong>${loan.tool_loan_no}</strong><br>${loan.priority}</td>
          <td>${loan.stock_requests?.stock_request_no ?? "—"}</td>
          <td>${loan.projects?.customers?.customer_name ?? "—"}<br>${[
            loan.projects?.project_no,
            loan.projects?.project_name,
          ]
            .filter(Boolean)
            .join(" — ")}</td>
          <td>${[
            loan.project_sites?.site_code,
            loan.project_sites?.site_name,
          ]
            .filter(Boolean)
            .join(" — ")}</td>
          <td>${employeeName(loan.employees)}</td>
          <td>${formatDate(loan.loan_date)}<br>${formatDate(loan.due_date)}</td>
          <td>${STATUS_LABEL[loan.loan_status as LoanStatus]}</td>
          <td>${loan.tool_loan_items?.length ?? 0}</td>
        </tr>`,
        )
        .join("")}
      </tbody></table></body></html>
    `);
    popup.document.close();
    popup.focus();
  };

  if (
    permissionQuery.data &&
    !can("tool_loans.view") &&
    !can("tool_loans.view_own")
  ) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          You do not have permission to view Tool Loans.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-[#8B3F3F]" />
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Tool Loans
            </h1>
          </div>
          <p className="mt-1 text-slate-500">
            Manage tool custody, due dates, condition and returns.
          </p>
        </div>

        {can("tool_loans.create") && (
          <Button
            type="button"
            onClick={openCreate}
            className="min-h-11 rounded-xl bg-[#DF2F2F] px-6 font-bold text-white shadow-md shadow-red-200 hover:bg-[#C92525]"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Tool Loan
          </Button>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {can("tool_loans.export_csv") && (
          <Button variant="outline" onClick={exportCsv} className="min-h-11 rounded-xl">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
        {(can("tool_loans.print") || can("tool_loans.export_pdf")) && (
          <Button variant="outline" onClick={printList} className="min-h-11 rounded-xl">
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => void loansQuery.refetch()}
          disabled={loansQuery.isFetching}
          className="min-h-11 rounded-xl"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loansQuery.isFetching ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Filtered Loans" value={summary.total} />
        <SummaryCard label="Pending Preparation" value={summary.pending} />
        <SummaryCard label="Currently In Use" value={summary.inUse} />
        <SummaryCard label="Overdue" value={summary.overdue} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search loan, request, project, borrower, tool..."
              className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="min-h-11 rounded-xl bg-[#F7F9FB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="min-h-11 rounded-xl bg-[#F7F9FB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {["Low", "Normal", "High", "Urgent"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPriorityFilter("all");
            }}
            className="min-h-11 rounded-xl"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {loansQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {(loansQuery.error as Error).message}
        </div>
      ) : loansQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading Tool Loans...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Wrench className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-bold text-slate-900">No Tool Loans found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Approve a Stock Request line with fulfilment method Loan, then create
            the Tool Loan here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="bg-[#9E4B4B] text-left text-xs uppercase text-white">
                  <th className="px-4 py-3">Tool Loan</th>
                  <th className="px-4 py-3">Customer / Project</th>
                  <th className="px-4 py-3">Site / Area</th>
                  <th className="px-4 py-3">Borrower</th>
                  <th className="px-4 py-3">Loan / Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan) => (
                  <tr
                    key={loan.tool_loan_id}
                    className="border-b border-[#B98A8A]/35 align-top hover:bg-[#FBF1F1]/55"
                  >
                    <td className="px-4 py-4">
                      <p className="font-black">{loan.tool_loan_no}</p>
                      <p className="text-xs text-slate-500">
                        {loan.stock_requests?.stock_request_no ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {loan.projects?.customers?.customer_name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[loan.projects?.project_no, loan.projects?.project_name]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p>
                        {[loan.project_sites?.site_code, loan.project_sites?.site_name]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[loan.project_areas?.area_code, loan.project_areas?.area_name]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">{employeeName(loan.employees)}</td>
                    <td className="px-4 py-4">
                      <p>{formatDate(loan.loan_date)}</p>
                      <p className="text-xs text-slate-500">
                        Due {formatDate(loan.due_date)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                          STATUS_CLASS[loan.loan_status as LoanStatus]
                        }`}
                      >
                        {STATUS_LABEL[loan.loan_status as LoanStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {loan.tool_loan_items?.length ?? 0} line(s)
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedId(loan.tool_loan_id)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        {loan.loan_status === "Draft" &&
                          can("tool_loans.update_draft") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(loan)}
                            >
                              <Edit3 className="mr-1 h-4 w-4" />
                              Edit
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mode === "create" ? "New Tool Loan" : "Edit Draft Tool Loan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <Section number="01" title="Source Request">
              <div className="space-y-2">
                <Label>Approved Stock Request *</Label>
                <Select
                  value={requestId}
                  onValueChange={loadRequest}
                  disabled={mode === "edit"}
                >
                  <SelectTrigger className="min-h-11 rounded-xl bg-[#F7F9FB]">
                    <SelectValue placeholder="Select approved Loan request" />
                  </SelectTrigger>
                  <SelectContent>
                    {requests.map((request) => (
                      <SelectItem
                        key={request.stock_request_id}
                        value={request.stock_request_id}
                      >
                        {request.stock_request_no} —{" "}
                        {request.projects?.customers?.customer_name ?? "—"} —{" "}
                        {request.projects?.project_name ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ReadOnly
                  label="Customer"
                  value={selectedRequest?.projects?.customers?.customer_name ?? "—"}
                />
                <ReadOnly
                  label="Project"
                  value={
                    [
                      selectedRequest?.projects?.project_no,
                      selectedRequest?.projects?.project_name,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "—"
                  }
                />
                <ReadOnly
                  label="Site"
                  value={
                    [
                      selectedRequest?.project_sites?.site_code,
                      selectedRequest?.project_sites?.site_name,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "—"
                  }
                />
                <ReadOnly
                  label="Area"
                  value={
                    [
                      selectedRequest?.project_areas?.area_code,
                      selectedRequest?.project_areas?.area_name,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "—"
                  }
                />
              </div>
            </Section>

            <Section number="02" title="Loan & Borrower">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FormSelect
                  label="Source Stock Location *"
                  value={locationId}
                  onChange={setLocationId}
                  options={locations.map((location) => ({
                    value: location.stock_location_id,
                    label: `${location.location_code} — ${location.location_name}`,
                  }))}
                />
                <FormSelect
                  label="Borrower *"
                  value={borrowerEmployeeId}
                  onChange={setBorrowerEmployeeId}
                  options={employees.map((employee) => ({
                    value: employee.employee_id,
                    label: `${employee.employee_code} — ${employeeName(employee)}`,
                  }))}
                />
                <FormSelect
                  label="Priority *"
                  value={priority}
                  onChange={setPriority}
                  options={["Low", "Normal", "High", "Urgent"].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <FormInput
                  label="Loan Date *"
                  type="date"
                  value={loanDate}
                  onChange={setLoanDate}
                />
                <FormInput
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={setDueDate}
                />
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    className="rounded-xl bg-[#F7F9FB]"
                  />
                </div>
              </div>
            </Section>

            <Section number="03" title="Tool & Equipment Items">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
                  Select an approved Stock Request containing Loan items.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <p className="font-black">
                        {String(index + 1).padStart(2, "0")} · {item.productName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.productCode || "—"}
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <FormInput
                          label={`Approved Quantity (${item.loanUomCode}) *`}
                          type="number"
                          value={item.approvedQuantity}
                          onChange={(value) =>
                            updateItem(item.key, { approvedQuantity: value })
                          }
                        />
                        <FormInput
                          label="Asset Reference"
                          value={item.assetReference}
                          onChange={(value) =>
                            updateItem(item.key, { assetReference: value })
                          }
                        />
                        <FormInput
                          label="Serial Number"
                          value={item.serialNumber}
                          onChange={(value) =>
                            updateItem(item.key, { serialNumber: value })
                          }
                        />
                        <FormSelect
                          label="Condition Before Issue *"
                          value={item.conditionBefore}
                          onChange={(value) =>
                            updateItem(item.key, { conditionBefore: value })
                          }
                          options={["New", "Good", "Fair", "Worn", "Damaged"].map(
                            (value) => ({ value, label: value }),
                          )}
                        />
                        <FormInput
                          label="Condition Notes"
                          value={item.conditionNotesBefore}
                          onChange={(value) =>
                            updateItem(item.key, {
                              conditionNotesBefore: value,
                            })
                          }
                        />
                        <FormInput
                          label="Item Notes"
                          value={item.notes}
                          onChange={(value) =>
                            updateItem(item.key, { notes: value })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saveMutation.isPending}
              className="min-h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="min-h-11 rounded-xl bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
            >
              {saveMutation.isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create Tool Loan"
                  : "Save Draft Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedLoan) && action === null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-2xl">
          {selectedLoan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <Wrench className="h-6 w-6 text-[#8B3F3F]" />
                  {selectedLoan.tool_loan_no}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <ReadOnly
                  label="Borrower"
                  value={employeeName(selectedLoan.employees)}
                />
                <ReadOnly
                  label="Loan Date"
                  value={formatDate(selectedLoan.loan_date)}
                />
                <ReadOnly
                  label="Due Date"
                  value={formatDate(selectedLoan.due_date)}
                />
                <ReadOnly
                  label="Customer"
                  value={
                    selectedLoan.projects?.customers?.customer_name ?? "—"
                  }
                />
                <ReadOnly
                  label="Project"
                  value={
                    [
                      selectedLoan.projects?.project_no,
                      selectedLoan.projects?.project_name,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "—"
                  }
                />
                <ReadOnly
                  label="Status"
                  value={
                    STATUS_LABEL[selectedLoan.loan_status as LoanStatus]
                  }
                />
              </div>

              <div className="space-y-3">
                {(selectedLoan.tool_loan_items ?? []).map(
                  (item) => (
                    <div
                      key={item.tool_loan_item_id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-black">
                            {String(item.line_no).padStart(2, "0")} ·{" "}
                            {item.products?.product_name ?? item.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.products?.product_code ?? "—"} · Asset{" "}
                            {item.asset_reference ?? "—"} · Serial{" "}
                            {item.serial_number ?? "—"}
                          </p>
                        </div>
                        <p className="font-black">
                          {item.approved_quantity} {item.loan_uom_code}
                        </p>
                      </div>
                      <div className="mt-3 rounded-lg bg-[#F7F9FB] p-3 text-sm">
                        Condition before issue:{" "}
                        <strong>{item.condition_before ?? "—"}</strong>
                        {item.condition_notes_before
                          ? ` — ${item.condition_notes_before}`
                          : ""}
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {selectedLoan.loan_status === "Draft" &&
                  can("tool_loans.update_draft") && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedId(null);
                          openEdit(selectedLoan);
                        }}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Draft
                      </Button>
                      {can("tool_loans.submit") && (
                        <Button
                        onClick={() => setAction("submit")}
                        className="bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit
                        </Button>
                      )}
                    </>
                  )}
                {["Submitted", "UnderReview"].includes(
                  selectedLoan.loan_status,
                ) &&
                  can("tool_loans.approve") && (
                    <Button
                      onClick={() => setAction("approve")}
                      className="bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                {selectedLoan.loan_status === "Approved" &&
                  can("tool_loans.prepare") && (
                    <Button
                      onClick={() => setAction("prepare")}
                      className="bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
                    >
                      <PackageOpen className="mr-2 h-4 w-4" />
                      Prepare
                    </Button>
                  )}

                {selectedLoan.loan_status === "Prepared" &&
                  can("tool_loans.issue") && (
                    <Button
                      onClick={() => openIssue(selectedLoan)}
                      className="bg-cyan-700 text-white hover:bg-cyan-800"
                    >
                      <PackageOpen className="mr-2 h-4 w-4" />
                      Issue
                    </Button>
                  )}
                {["Issued", "InUse", "PartiallyReturned", "Overdue"].includes(
                  selectedLoan.loan_status,
                ) &&
                  can("tool_loans.return") && (
                    <Button
                      onClick={() => void openReturn(selectedLoan)}
                      className="bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Return
                    </Button>
                  )}
                {["Draft", "Submitted", "UnderReview", "Approved", "Prepared"].includes(
                  selectedLoan.loan_status,
                ) &&
                  can("tool_loans.cancel") && (
                    <Button
                      variant="outline"
                      onClick={() => setAction("cancel")}
                      className="border-red-300 text-red-700"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      <Dialog
        open={issueOpen}
        onOpenChange={(open) => {
          setIssueOpen(open);
          if (!open) {
            setIssueNotes("");
            setIssueAllocations([]);
          }
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Issue Tool Loan</DialogTitle>
          </DialogHeader>

          {stockLotsQuery.isLoading ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Loading available Stock Lots...
            </div>
          ) : stockLotsQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {(stockLotsQuery.error as Error).message}
            </div>
          ) : (
            <div className="space-y-5">
              {(selectedLoan?.tool_loan_items ?? []).map((item) => {
                const allocations = issueAllocations.filter(
                  (allocation) =>
                    allocation.toolLoanItemId === item.tool_loan_item_id,
                );
                const matchingLots = (stockLotsQuery.data ?? []).filter(
                  (lot) => lot.product_id === item.product_id,
                );
                const allocatedTotal = allocations.reduce(
                  (total, allocation) =>
                    total + Number(allocation.issueBaseQuantity || 0),
                  0,
                );
                const required = Number(
                  item.approved_base_quantity ?? item.approved_quantity,
                );

                return (
                  <section
                    key={item.tool_loan_item_id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black">
                          {String(item.line_no).padStart(2, "0")} ·{" "}
                          {item.products?.product_name ?? item.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.products?.product_code ?? "—"}
                        </p>
                      </div>
                      <div className="text-sm font-bold">
                        Required: {required}{" "}
                        {item.base_uom_code ?? item.loan_uom_code}
                      </div>
                    </div>

                    {matchingLots.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        No available Stock Lot exists for this product at the
                        source location.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {allocations.map((allocation, allocationIndex) => (
                          <div
                            key={allocation.key}
                            className="grid gap-3 rounded-xl bg-[#F7F9FB] p-3 lg:grid-cols-[1fr_220px_auto]"
                          >
                            <FormSelect
                              label={`Stock Lot ${allocationIndex + 1}`}
                              value={allocation.stockLotId}
                              onChange={(value) =>
                                updateIssueAllocation(allocation.key, {
                                  stockLotId: value,
                                })
                              }
                              options={matchingLots.map((lot) => ({
                                value: lot.stock_lot_id,
                                label: `${lot.lot_no} — Available ${lot.remaining_quantity} ${lot.base_uom_code}`,
                              }))}
                            />
                            <FormInput
                              label="Issue Base Quantity"
                              type="number"
                              value={allocation.issueBaseQuantity}
                              onChange={(value) =>
                                updateIssueAllocation(allocation.key, {
                                  issueBaseQuantity: value,
                                })
                              }
                            />
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={allocations.length === 1}
                                onClick={() =>
                                  removeIssueAllocation(allocation.key)
                                }
                                className="min-h-11 w-full rounded-xl text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addIssueAllocation(item)}
                            className="rounded-xl"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Stock Lot
                          </Button>
                          <p
                            className={`text-sm font-bold ${
                              Math.abs(allocatedTotal - required) <= 0.000001
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            Allocated {allocatedTotal} / {required}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}

              <div className="space-y-2">
                <Label>Issue Notes</Label>
                <Textarea
                  value={issueNotes}
                  onChange={(event) => setIssueNotes(event.target.value)}
                  rows={3}
                  className="rounded-xl bg-[#F7F9FB]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setIssueOpen(false)}
              disabled={issueMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => issueMutation.mutate()}
              disabled={issueMutation.isPending || !canConfirmIssue}
              className="bg-cyan-700 text-white hover:bg-cyan-800"
            >
              {issueMutation.isPending ? "Issuing..." : "Confirm Issue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={returnOpen}
        onOpenChange={(open) => {
          setReturnOpen(open);
          if (!open) {
            setReturnNotes("");
            setReturnAllocations([]);
          }
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Return Tool Loan</DialogTitle>
          </DialogHeader>

          {issuePostingsQuery.isLoading ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Loading Issue Postings...
            </div>
          ) : issuePostingsQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {(issuePostingsQuery.error as Error).message}
            </div>
          ) : returnAllocations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No outstanding issued quantity remains to return.
            </div>
          ) : (
            <div className="space-y-4">
              {returnAllocations.map((allocation) => {
                const posting = (
                  issuePostingsQuery.data?.issuePostings ?? []
                ).find(
                  (row) =>
                    row.tool_loan_issue_posting_id ===
                    allocation.issuePostingId,
                );
                if (!posting) return null;

                const remaining = remainingForIssuePosting(
                  posting.tool_loan_issue_posting_id,
                  posting.issued_base_quantity,
                );
                const entered =
                  Number(allocation.returnedBaseQuantity || 0) +
                  Number(allocation.damagedBaseQuantity || 0) +
                  Number(allocation.lostBaseQuantity || 0);

                return (
                  <section
                    key={allocation.issuePostingId}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black">
                          Line{" "}
                          {String(posting.tool_loan_items?.line_no ?? "").padStart(
                            2,
                            "0",
                          )}{" "}
                          ·{" "}
                          {posting.tool_loan_items?.products?.product_name ??
                            posting.tool_loan_items?.description ??
                            "Tool"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {posting.tool_loan_items?.products?.product_code ??
                            "—"}{" "}
                          · Lot {posting.stock_lots?.lot_no ?? "—"}
                        </p>
                      </div>
                      <p className="text-sm font-bold">
                        Outstanding: {remaining} {posting.base_uom_code}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <FormInput
                        label="Normal Return"
                        type="number"
                        value={allocation.returnedBaseQuantity}
                        onChange={(value) =>
                          updateReturnAllocation(allocation.issuePostingId, {
                            returnedBaseQuantity: value,
                          })
                        }
                      />
                      <FormInput
                        label="Damaged"
                        type="number"
                        value={allocation.damagedBaseQuantity}
                        onChange={(value) =>
                          updateReturnAllocation(allocation.issuePostingId, {
                            damagedBaseQuantity: value,
                          })
                        }
                      />
                      <FormInput
                        label="Lost"
                        type="number"
                        value={allocation.lostBaseQuantity}
                        onChange={(value) =>
                          updateReturnAllocation(allocation.issuePostingId, {
                            lostBaseQuantity: value,
                          })
                        }
                      />
                    </div>

                    {Number(allocation.damagedBaseQuantity || 0) > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label>Damage Notes *</Label>
                        <Textarea
                          value={allocation.damageNotes}
                          onChange={(event) =>
                            updateReturnAllocation(allocation.issuePostingId, {
                              damageNotes: event.target.value,
                            })
                          }
                          rows={2}
                          className="rounded-xl bg-[#F7F9FB]"
                        />
                      </div>
                    )}

                    {Number(allocation.lostBaseQuantity || 0) > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label>Missing Notes *</Label>
                        <Textarea
                          value={allocation.missingNotes}
                          onChange={(event) =>
                            updateReturnAllocation(allocation.issuePostingId, {
                              missingNotes: event.target.value,
                            })
                          }
                          rows={2}
                          className="rounded-xl bg-[#F7F9FB]"
                        />
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <Label>Posting Notes</Label>
                      <Input
                        value={allocation.notes}
                        onChange={(event) =>
                          updateReturnAllocation(allocation.issuePostingId, {
                            notes: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-xl bg-[#F7F9FB]"
                      />
                    </div>

                    <p
                      className={`mt-3 text-right text-sm font-bold ${
                        entered <= remaining
                          ? "text-slate-600"
                          : "text-red-700"
                      }`}
                    >
                      Entered {entered} / {remaining} {posting.base_uom_code}
                    </p>
                  </section>
                );
              })}

              <div className="space-y-2">
                <Label>Overall Return Notes</Label>
                <Textarea
                  value={returnNotes}
                  onChange={(event) => setReturnNotes(event.target.value)}
                  rows={3}
                  className="rounded-xl bg-[#F7F9FB]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setReturnOpen(false)}
              disabled={returnMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => returnMutation.mutate()}
              disabled={
                returnMutation.isPending ||
                issuePostingsQuery.isLoading ||
                issuePostingsQuery.isError ||
                returnAllocations.length === 0
              }
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {returnMutation.isPending
                ? "Posting Return..."
                : "Confirm Return"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {action === "submit" && "Submit Tool Loan"}
              {action === "approve" && "Approve Tool Loan"}
              {action === "prepare" && "Prepare Tool Loan"}
              {action === "cancel" && "Cancel Tool Loan"}
            </DialogTitle>
          </DialogHeader>

          {action === "cancel" ? (
            <div className="space-y-2">
              <Label>Cancellation Reason *</Label>
              <Textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={4}
                className="rounded-xl bg-[#F7F9FB]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={actionNotes}
                onChange={(event) => setActionNotes(event.target.value)}
                rows={3}
                className="rounded-xl bg-[#F7F9FB]"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAction(null)}>
              Back
            </Button>
            <Button
              onClick={() => workflowMutation.mutate()}
              disabled={workflowMutation.isPending}
              className={
                action === "cancel"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#8B3F3F] text-white hover:bg-[#9E4B4B]"
              }
            >
              {workflowMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
  </div>
);

const Section = ({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
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

const ReadOnly = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-[#F7F9FB] p-3">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 font-semibold text-slate-800">{value}</p>
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
      step={type === "number" ? "0.000001" : undefined}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB]"
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
      <SelectTrigger className="min-h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB]">
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

export default ToolLoans;