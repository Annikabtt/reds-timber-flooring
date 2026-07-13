import { useMemo, useState } from "react";
import { PackagePlus, Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

const StockRequests = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestItemId, setSelectedRequestItemId] =
    useState<string | null>(null);
  const [approvalQuantity, setApprovalQuantity] = useState("");
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [reserveRequestId, setReserveRequestId] = useState<string | null>(null);
  const [reserveRequestItemId, setReserveRequestItemId] =
    useState<string | null>(null);
  const [reserveProductId, setReserveProductId] = useState<string | null>(null);
  const [selectedStockLotId, setSelectedStockLotId] = useState("");
  const [reserveQuantity, setReserveQuantity] = useState("");
  const [reserveUnitOfMeasure, setReserveUnitOfMeasure] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueRequestItemId, setIssueRequestItemId] =
    useState<string | null>(null);
  const [selectedIssueStockLotId, setSelectedIssueStockLotId] =
    useState("");
  const [issueQuantity, setIssueQuantity] = useState("");
  const [issueUnitOfMeasure, setIssueUnitOfMeasure] = useState("");
  const [issueNotes, setIssueNotes] = useState("");

  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [requestDate, setRequestDate] = useState("");

  const [notes, setNotes] = useState("");

  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");

  const [itemNotes, setItemNotes] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          project_id,
          project_no,
          project_name,
          customers (
            customer_name
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          project_id,
          site_code,
          site_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          project_id,
          site_id,
          area_code,
          area_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
                product_id,
                product_code,
                product_name,
                description,
                unit,
                base_uom_code,
                default_request_uom_code
            `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .eq("is_stock_item", true)
        .order("product_name", { ascending: true });

      if (error) throw error;

      return data ?? [];
    },
  });

  const { data: stockRequests = [] } = useQuery({
    queryKey: ["stock_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_requests")
        .select(`
          stock_request_id,
          stock_request_no,
          project_id,
          site_id,
          area_id,
          request_date,
          required_date,
          request_status,
          notes,
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
          stock_request_items (
            stock_request_item_id,
            product_id,
            requested_quantity,
            approved_quantity,
            unit_of_measure,
            products (
              product_code,
              product_name
            )
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: reserveStockLots = [] } = useQuery({
    queryKey: ["stock-lots-for-reserve", reserveProductId],
    enabled: Boolean(reserveProductId),
    queryFn: async () => {
      if (!reserveProductId) return [];

      const { data, error } = await supabase
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
          received_date,
          stock_locations (
            location_code,
            location_name
          )
        `)
        .eq("product_id", reserveProductId)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .gt("remaining_quantity", 0)
        .order("received_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data ?? [];
    },
  });

  const { data: issueStockMovements = [] } = useQuery({
    queryKey: [
      "stock-movements-for-issue",
      issueRequestItemId,
    ],
    enabled: Boolean(issueRequestItemId),
    queryFn: async () => {
      if (!issueRequestItemId) return [];

      const { data, error } = await supabase
        .from("stock_movements")
        .select(`
          stock_movement_id,
          stock_lot_id,
          stock_request_item_id,
          movement_type,
          quantity,
          base_uom_code,
          movement_date,
          stock_lots (
            lot_no,
            base_uom_code,
            remaining_quantity,
            reserved_quantity,
            lot_status,
            stock_locations (
              location_code,
              location_name
            )
          )
        `)
        .eq(
          "stock_request_item_id",
          issueRequestItemId
        )
        .eq("is_deleted", false)
        .in("movement_type", [
          "Reserve",
          "Release Reservation",
          "Issue",
        ])
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data ?? [];
    },
  });

  const issueReservations = useMemo(() => {
    const reservationByLot = new Map<
      string,
      {
        stockLotId: string;
        lotNo: string;
        baseUomCode: string;
        reservedRemaining: number;
        locationName: string;
      }
    >();

    issueStockMovements.forEach((movement) => {
      const stockLotId = movement.stock_lot_id;

      if (!stockLotId) return;

      const existing = reservationByLot.get(stockLotId);

      const quantity = Number(movement.quantity) || 0;

      const quantityChange =
        movement.movement_type === "Reserve"
          ? quantity
          : movement.movement_type ===
            "Release Reservation" ||
            movement.movement_type === "Issue"
            ? -quantity
            : 0;

      reservationByLot.set(stockLotId, {
        stockLotId,
        lotNo:
          movement.stock_lots?.lot_no || "-",
        baseUomCode:
          movement.stock_lots?.base_uom_code ||
          movement.base_uom_code ||
          "",
        reservedRemaining:
          (existing?.reservedRemaining || 0) +
          quantityChange,
        locationName:
          movement.stock_lots?.stock_locations
            ?.location_name || "",
      });
    });

    return Array.from(reservationByLot.values()).filter(
      (reservation) =>
        reservation.reservedRemaining > 0
    );
  }, [issueStockMovements]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.project_id === projectId);
  }, [sites, projectId]);

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) => area.project_id === projectId && area.site_id === siteId
    );
  }, [areas, projectId, siteId]);

  const resetForm = () => {
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setRequestDate("");

    setNotes("");
    setProductId("");
    setDescription("");
    setUnitOfMeasure("");
    setRequestedQuantity("");

    setItemNotes("");
  };

  const createStockRequest = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Please select a project.");
      if (!siteId) throw new Error("Please select a project site.");
      if (!areaId) throw new Error("Please select a project area.");
      if (!requestDate) throw new Error("Please select request date.");
      if (!productId) {
        throw new Error("Please select a product.");
      }

      if (!unitOfMeasure.trim()) {
        throw new Error(
          "The selected product does not have a unit of measure."
        );
      }

      const numericRequestedQuantity = Number(requestedQuantity);

      if (
        !Number.isFinite(numericRequestedQuantity) ||
        numericRequestedQuantity <= 0
      ) {
        throw new Error(
          "Requested quantity must be greater than zero."
        );
      }

      const { data: requestData, error: requestError } = await supabase
        .from("stock_requests")
        .insert({
          stock_request_no: null,
          project_id: projectId,
          site_id: siteId,
          area_id: areaId,
          request_date: requestDate,
          required_date: null,
          request_status: "Draft",
          notes: notes.trim() || null,
          is_deleted: false,
        })
        .select("stock_request_id")
        .single();

      if (requestError) throw requestError;

      const { error: itemError } = await supabase
        .from("stock_request_items")
        .insert({
          stock_request_id: requestData.stock_request_id,
          product_id: productId,
          line_no: 1,
          description: description.trim() || null,
          unit_of_measure: unitOfMeasure.trim(),
          requested_quantity: numericRequestedQuantity,
          approved_quantity: null,
          notes: itemNotes.trim() || null,
          is_deleted: false,
        });

      if (itemError) throw itemError;
    },
    onSuccess: () => {
      toast.success("Stock request created successfully.");
      queryClient.invalidateQueries({ queryKey: ["stock_requests"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitStockRequest = useMutation({
    mutationFn: async (stockRequestId: string) => {
      const request = stockRequests.find(
        (item) => item.stock_request_id === stockRequestId
      );

      if (!request) {
        throw new Error("Stock request was not found.");
      }

      if (request.request_status !== "Draft") {
        throw new Error(
          "Only a Draft stock request can be submitted."
        );
      }

      const activeItems = request.stock_request_items ?? [];

      if (activeItems.length === 0) {
        throw new Error(
          "Add at least one request item before submitting."
        );
      }

      const hasInvalidItem = activeItems.some((item) => {
        const quantity = Number(item.requested_quantity);

        return (
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !item.unit_of_measure
        );
      });

      if (hasInvalidItem) {
        throw new Error(
          "Every request item must have a valid quantity and unit."
        );
      }

      const { data, error } = await supabase
        .from("stock_requests")
        .update({
          request_status: "Submitted",
        })
        .eq("stock_request_id", stockRequestId)
        .eq("request_status", "Draft")
        .eq("is_deleted", false)
        .select("stock_request_id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "The stock request is no longer in Draft status. Refresh and try again."
        );
      }
    },

    onSuccess: () => {
      toast.success("Stock request submitted successfully.");

      queryClient.invalidateQueries({
        queryKey: ["stock_requests"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const approveStockRequest = useMutation({
    mutationFn: async () => {
      if (!selectedRequestId || !selectedRequestItemId) {
        throw new Error("Stock request approval data is incomplete.");
      }

      const numericApprovalQuantity = Number(approvalQuantity);

      if (
        !Number.isFinite(numericApprovalQuantity) ||
        numericApprovalQuantity < 0
      ) {
        throw new Error(
          "Approved quantity must be zero or greater."
        );
      }

      const { error } = await supabase.rpc(
        "approve_stock_request_item",
        {
          p_stock_request_id: selectedRequestId,
          p_stock_request_item_id: selectedRequestItemId,
          p_approved_quantity: numericApprovalQuantity,
        }
      );

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Stock request approved successfully.");

      queryClient.invalidateQueries({
        queryKey: ["stock_requests"],
      });

      setShowApprovalDialog(false);
      setSelectedRequestId(null);
      setSelectedRequestItemId(null);
      setApprovalQuantity("");
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectStockRequest = useMutation({
    mutationFn: async (stockRequestId: string) => {
      const { error } = await supabase.rpc(
        "reject_stock_request",
        {
          p_stock_request_id: stockRequestId,
        }
      );

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Stock request rejected successfully.");

      queryClient.invalidateQueries({
        queryKey: ["stock_requests"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reserveStockRequestItem = useMutation({
    mutationFn: async () => {
      if (!reserveRequestItemId) {
        throw new Error("Stock request item is required.");
      }

      if (!selectedStockLotId) {
        throw new Error("Please select a stock lot.");
      }

      const numericReserveQuantity = Number(reserveQuantity);

      if (
        !Number.isFinite(numericReserveQuantity) ||
        numericReserveQuantity <= 0
      ) {
        throw new Error(
          "Reserve quantity must be greater than zero."
        );
      }

      const { error } = await supabase.rpc(
        "reserve_stock_request_item",
        {
          p_stock_request_item_id: reserveRequestItemId,
          p_stock_lot_id: selectedStockLotId,
          p_quantity: numericReserveQuantity,
          p_movement_date: new Date().toISOString().slice(0, 10),
          p_notes: reserveNotes.trim() || undefined,
        }
      );

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Stock reserved successfully.");

      queryClient.invalidateQueries({
        queryKey: ["stock_requests"],
      });

      queryClient.invalidateQueries({
        queryKey: ["stock-lots-for-reserve"],
      });

      setShowReserveDialog(false);
      setReserveRequestId(null);
      setReserveRequestItemId(null);
      setReserveProductId(null);
      setSelectedStockLotId("");
      setReserveQuantity("");
      setReserveUnitOfMeasure("");
      setReserveNotes("");
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const issueStockRequestItem = useMutation({
    mutationFn: async () => {
      if (!issueRequestItemId) {
        throw new Error("Stock request item is required.");
      }

      if (!selectedIssueStockLotId) {
        throw new Error("Please select a reserved stock lot.");
      }

      const numericIssueQuantity = Number(issueQuantity);

      if (
        !Number.isFinite(numericIssueQuantity) ||
        numericIssueQuantity <= 0
      ) {
        throw new Error(
          "Issue quantity must be greater than zero."
        );
      }

      const { error } = await supabase.rpc(
        "issue_stock_request_item",
        {
          p_stock_request_item_id: issueRequestItemId,
          p_stock_lot_id: selectedIssueStockLotId,
          p_quantity: numericIssueQuantity,
          p_movement_date: new Date().toISOString().slice(0, 10),
          p_notes: issueNotes.trim() || undefined,
        }
      );

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Stock issued successfully.");

      queryClient.invalidateQueries({
        queryKey: ["stock_requests"],
      });

      queryClient.invalidateQueries({
        queryKey: ["stock-movements-for-issue"],
      });

      queryClient.invalidateQueries({
        queryKey: ["stock-lots-for-reserve"],
      });

      setShowIssueDialog(false);
      setIssueRequestItemId(null);
      setSelectedIssueStockLotId("");
      setIssueQuantity("");
      setIssueUnitOfMeasure("");
      setIssueNotes("");
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredStockRequests = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return stockRequests.filter((request) => {
      const projectName = request.projects?.project_name || "";
      const customerName = request.projects?.customers?.customer_name || "";
      const siteName = request.project_sites?.site_name || "";
      const areaName = request.project_areas?.area_name || "";

      return (
        request.stock_request_no?.toLowerCase().includes(keyword) ||
        request.request_status?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        areaName.toLowerCase().includes(keyword)
      );
    });
  }, [stockRequests, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <PackagePlus className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Stock Requests
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage material requests from project sites.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Request
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by request no, project, site, area, status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1.35fr_1.35fr_1.35fr_0.7fr_0.65fr_2.2fr_0.75fr] items-center gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          <div>Request No.</div>
          <div>Project</div>
          <div>Site / Area</div>
          <div>Request Date</div>
          <div>Status</div>
          <div>Items</div>
          <div className="text-right">Actions</div>
        </div>

        {filteredStockRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No stock requests found.
          </div>
        ) : (
          filteredStockRequests.map((request) => (
            <div
              key={request.stock_request_id}
              className="grid grid-cols-[1.35fr_1.35fr_1.35fr_0.7fr_0.65fr_2.2fr_0.75fr] items-start gap-4 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {request.stock_request_no || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {request.stock_request_items?.length || 0} item(s)
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-800">
                  {request.projects?.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {request.projects?.project_no || "-"} ·{" "}
                  {request.projects?.customers?.customer_name || "-"}
                </p>
              </div>

              <div className="text-slate-700">
                <p>{request.project_sites?.site_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {request.project_areas?.area_name || "-"}
                </p>
              </div>

              <div className="whitespace-nowrap text-sm text-slate-700">
                {request.request_date || "-"}
              </div>

              <div className="text-slate-700">
                {request.request_status || "-"}
              </div>

              <div className="min-w-0 text-sm text-slate-700">
                {(request.stock_request_items || [])
                  .slice(0, 2)
                  .map((item) => (
                    <p
                      key={item.stock_request_item_id}
                      className="break-words"
                    >
                      {item.products?.product_name || "-"} ·{" "}
                      {item.requested_quantity ?? "-"}{" "}
                      {item.unit_of_measure || ""}
                    </p>
                  ))}
              </div>

              <div className="flex justify-end gap-2">
                {request.request_status === "Draft" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      submitStockRequest.mutate(request.stock_request_id)
                    }
                    disabled={submitStockRequest.isPending}
                    className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    {submitStockRequest.isPending
                      ? "Submitting..."
                      : "Submit"}
                  </Button>
                )}

                {request.request_status === "Submitted" && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const requestItem =
                          request.stock_request_items?.[0];

                        if (!requestItem) {
                          toast.error(
                            "This stock request does not contain an item."
                          );
                          return;
                        }

                        setSelectedRequestId(request.stock_request_id);
                        setSelectedRequestItemId(
                          requestItem.stock_request_item_id
                        );
                        setApprovalQuantity(
                          String(requestItem.requested_quantity ?? "")
                        );
                        setShowApprovalDialog(true);
                      }}
                      className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Approve
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={rejectStockRequest.isPending}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Reject stock request ${request.stock_request_no}?`
                        );

                        if (!confirmed) return;

                        rejectStockRequest.mutate(request.stock_request_id);
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      {rejectStockRequest.isPending ? "Rejecting..." : "Reject"}
                    </Button>
                  </>
                )}

                {request.request_status === "Rejected" && (
                  <span className="text-xs font-medium text-red-600">
                    Request Rejected
                  </span>
                )}

                {["Approved", "Partially Reserved"].includes(
                  request.request_status || ""
                ) && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const requestItem = request.stock_request_items?.[0];

                        if (!requestItem) {
                          toast.error(
                            "This stock request does not contain an item."
                          );
                          return;
                        }

                        if (!requestItem.product_id) {
                          toast.error(
                            "The stock request item does not contain a product."
                          );
                          return;
                        }

                        setReserveRequestId(request.stock_request_id);
                        setReserveRequestItemId(
                          requestItem.stock_request_item_id
                        );
                        setReserveProductId(requestItem.product_id);
                        setSelectedStockLotId("");
                        setReserveQuantity(
                          String(requestItem.approved_quantity ?? "")
                        );
                        setReserveUnitOfMeasure(
                          requestItem.unit_of_measure || ""
                        );
                        setReserveNotes("");
                        setShowReserveDialog(true);
                      }}
                      className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {request.request_status === "Partially Reserved"
                        ? "Continue Reserve"
                        : "Reserve"}
                    </Button>
                  )}

                {["Reserved", "Partially Issued"].includes(
                  request.request_status || ""
                ) && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const requestItem = request.stock_request_items?.[0];

                        if (!requestItem) {
                          toast.error(
                            "This stock request does not contain an item."
                          );
                          return;
                        }

                        setIssueRequestItemId(
                          requestItem.stock_request_item_id
                        );
                        setSelectedIssueStockLotId("");
                        setIssueQuantity(
                          String(requestItem.approved_quantity ?? "")
                        );
                        setIssueUnitOfMeasure(
                          requestItem.unit_of_measure || ""
                        );
                        setIssueNotes("");
                        setShowIssueDialog(true);
                      }}
                      className="h-8 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {request.request_status === "Partially Issued"
                        ? "Continue Issue"
                        : "Issue"}
                    </Button>
                  )}

                {request.request_status === "Issued" && (
                  <span className="text-xs font-medium text-slate-700">
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={showIssueDialog}
        onOpenChange={(open) => {
          setShowIssueDialog(open);

          if (!open) {
            setIssueRequestItemId(null);
            setSelectedIssueStockLotId("");
            setIssueQuantity("");
            setIssueUnitOfMeasure("");
            setIssueNotes("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Stock</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reserved Stock Lot *</Label>

              <Select
                value={selectedIssueStockLotId}
                onValueChange={setSelectedIssueStockLotId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reserved stock lot" />
                </SelectTrigger>

                <SelectContent>
                  {issueReservations.map((reservation) => (
                    <SelectItem
                      key={reservation.stockLotId}
                      value={reservation.stockLotId}
                    >
                      {reservation.lotNo} · Reserved{" "}
                      {reservation.reservedRemaining.toFixed(2)}{" "}
                      {reservation.baseUomCode}
                      {reservation.locationName
                        ? ` · ${reservation.locationName}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {issueReservations.length === 0 && (
                <p className="text-xs text-red-600">
                  No remaining reservation is available for this request item.
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-2">
                <Label>Issue Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={issueQuantity}
                  onChange={(event) =>
                    setIssueQuantity(event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={issueUnitOfMeasure}
                  readOnly
                  className="w-28 bg-slate-50 text-slate-600"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              The entered quantity uses the request unit. The system converts
              it to the product base unit before issuing stock.
            </p>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={issueNotes}
                onChange={(event) =>
                  setIssueNotes(event.target.value)
                }
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
              disabled={issueStockRequestItem.isPending}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={() => issueStockRequestItem.mutate()}
              disabled={
                issueStockRequestItem.isPending ||
                !selectedIssueStockLotId ||
                issueReservations.length === 0
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {issueStockRequestItem.isPending
                ? "Issuing..."
                : "Issue Stock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showReserveDialog}
        onOpenChange={(open) => {
          setShowReserveDialog(open);

          if (!open) {
            setReserveRequestId(null);
            setReserveRequestItemId(null);
            setReserveProductId(null);
            setSelectedStockLotId("");
            setReserveQuantity("");
            setReserveUnitOfMeasure("");
            setReserveNotes("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reserve Stock</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stock Lot *</Label>

              <Select
                value={selectedStockLotId}
                onValueChange={setSelectedStockLotId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stock lot" />
                </SelectTrigger>

                <SelectContent>
                  {reserveStockLots.map((lot) => {
                    const availableQuantity =
                      Number(lot.remaining_quantity) -
                      Number(lot.reserved_quantity);

                    return (
                      <SelectItem
                        key={lot.stock_lot_id}
                        value={lot.stock_lot_id}
                        disabled={availableQuantity <= 0}
                      >
                        {lot.lot_no} · Available{" "}
                        {availableQuantity.toFixed(2)}{" "}
                        {lot.base_uom_code}
                        {lot.stock_locations?.location_name
                          ? ` · ${lot.stock_locations.location_name}`
                          : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {reserveStockLots.length === 0 && (
                <p className="text-xs text-red-600">
                  No active stock lot is available for this product.
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-2">
                <Label>Reserve Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={reserveQuantity}
                  onChange={(event) =>
                    setReserveQuantity(event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={reserveUnitOfMeasure}
                  readOnly
                  className="w-28 bg-slate-50 text-slate-600"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              The entered quantity uses the request unit. The system converts
              it to the product base unit before reserving stock.
            </p>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={reserveNotes}
                onChange={(event) =>
                  setReserveNotes(event.target.value)
                }
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReserveDialog(false)}
              disabled={reserveStockRequestItem.isPending}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={() => reserveStockRequestItem.mutate()}
              disabled={
                reserveStockRequestItem.isPending ||
                !selectedStockLotId ||
                reserveStockLots.length === 0
              }
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {reserveStockRequestItem.isPending
                ? "Reserving..."
                : "Reserve Stock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showApprovalDialog}
        onOpenChange={(open) => {
          setShowApprovalDialog(open);

          if (!open) {
            setSelectedRequestId(null);
            setSelectedRequestItemId(null);
            setApprovalQuantity("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Stock Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Approved Quantity *</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={approvalQuantity}
                onChange={(event) =>
                  setApprovalQuantity(event.target.value)
                }
              />
              <p className="text-xs text-slate-500">
                The approved quantity cannot exceed the requested quantity.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={approveStockRequest.isPending}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={() => approveStockRequest.mutate()}
              disabled={approveStockRequest.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {approveStockRequest.isPending
                ? "Approving..."
                : "Approve Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Stock Request</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="font-semibold text-slate-800">Request Header</h3>
            </div>

            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-800">
                New request
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Request number will be generated automatically. New requests start as Draft.
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Project *</Label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setSiteId("");
                  setAreaId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.project_id}
                      value={project.project_id}
                    >
                      {project.project_no || "-"} - {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Site *</Label>
              <Select
                value={siteId}
                onValueChange={(value) => {
                  setSiteId(value);
                  setAreaId("");
                }}
                disabled={!projectId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      projectId ? "Select project site" : "Select project first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSites.map((site) => (
                    <SelectItem key={site.site_id} value={site.site_id}>
                      {site.site_code || "-"} - {site.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Area *</Label>
              <Select
                value={areaId}
                onValueChange={setAreaId}
                disabled={!siteId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      siteId ? "Select project area" : "Select site first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredAreas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_code || "-"} - {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Request Date *</Label>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Header Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-semibold text-slate-800">
                Request Item
              </h3>
              <p className="text-sm text-slate-500">
                Phase 1 supports one item per request. Multiple items can be added in the next step.
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Product *</Label>
              <Select
                value={productId}
                onValueChange={(value) => {
                  setProductId(value);

                  const selectedProduct = products.find(
                    (product) => product.product_id === value
                  );

                  if (!selectedProduct) {
                    setDescription("");
                    setUnitOfMeasure("");
                    return;
                  }

                  const requestUom =
                    selectedProduct.default_request_uom_code ||
                    selectedProduct.base_uom_code ||
                    selectedProduct.unit ||
                    "";

                  setDescription(selectedProduct.description || "");
                  setUnitOfMeasure(requestUom);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem
                      key={product.product_id}
                      value={product.product_id}
                    >
                      {product.product_code || "-"} - {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={unitOfMeasure}
                readOnly
                placeholder="Selected from product"
                className="bg-slate-50 text-slate-600"
              />
              <p className="text-xs text-slate-500">
                Unit is taken from the selected product.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Requested Quantity *</Label>
              <Input
                type="number"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(e.target.value)}
              />
            </div>


            <div className="space-y-2">
              <Label>Item Notes</Label>
              <Input
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => createStockRequest.mutate()}
              disabled={createStockRequest.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createStockRequest.isPending ? "Saving..." : "Save Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default StockRequests;