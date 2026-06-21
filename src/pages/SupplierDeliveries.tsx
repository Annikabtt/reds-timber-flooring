import { useMemo, useState } from "react";
import { Truck, Plus, Search } from "lucide-react";
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

const SupplierDeliveries = () => {
    const queryClient = useQueryClient();

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [deliveryNo, setDeliveryNo] = useState("");
    const [purchaseOrderId, setPurchaseOrderId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [siteId, setSiteId] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [receivedBy, setReceivedBy] = useState("");
    const [deliveryStatus, setDeliveryStatus] = useState("Received");
    const [supplierDeliveryNoteNo, setSupplierDeliveryNoteNo] = useState("");
    const [notes, setNotes] = useState("");

    const { data: purchaseOrders = [] } = useQuery({
        queryKey: ["purchase-orders-for-deliveries"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("purchase_orders")
                .select(`
          purchase_order_id,
          purchase_order_no,
          supplier_id,
          project_id,
          site_id,
          order_status,
          total_amount,
          suppliers (
            supplier_code,
            supplier_name
          ),
          projects (
            project_no,
            project_name
          ),
          project_sites (
            site_code,
            site_name
          )
        `)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const { data: employees = [] } = useQuery({
        queryKey: ["employees-for-deliveries"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("employees")
                .select(`
          employee_id,
          employee_code,
          display_name,
          first_name,
          last_name
        `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("display_name", { ascending: true });

            if (error) throw error;
            return data;
        },
    });

    const { data: deliveries = [] } = useQuery({
        queryKey: ["supplier_deliveries"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("supplier_deliveries")
                .select(`
        supplier_delivery_id,
        delivery_no,
        purchase_order_id,
        supplier_id,
        project_id,
        site_id,
        delivery_date,
        received_by,
        delivery_status,
        supplier_delivery_note_no,
        notes,
        telegram_notified,
        telegram_notified_at,
        created_at,
        purchase_orders (
          purchase_order_no,
          order_status,
          total_amount
        ),
        suppliers (
          supplier_code,
          supplier_name
        ),
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
        supplier_delivery_photos (
          supplier_delivery_photo_id
        )
      `)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const resetForm = () => {
        setDeliveryNo("");
        setPurchaseOrderId("");
        setSupplierId("");
        setProjectId("");
        setSiteId("");
        setDeliveryDate("");
        setReceivedBy("");
        setDeliveryStatus("Received");
        setSupplierDeliveryNoteNo("");
        setNotes("");
    };

    const createDelivery = useMutation({
        mutationFn: async () => {
            if (!purchaseOrderId) throw new Error("Please select a purchase order.");
            if (!supplierId) throw new Error("Supplier is missing from selected PO.");
            if (!projectId) throw new Error("Project is missing from selected PO.");
            if (!siteId) throw new Error("Site is missing from selected PO.");
            if (!deliveryDate) throw new Error("Please select delivery date.");
            if (!receivedBy) throw new Error("Please select received by.");

            const { error } = await supabase.from("supplier_deliveries").insert({
                delivery_no: deliveryNo.trim() || null,
                purchase_order_id: purchaseOrderId,
                supplier_id: supplierId,
                project_id: projectId,
                site_id: siteId,
                delivery_date: deliveryDate,
                received_by: receivedBy,
                delivery_status: deliveryStatus,
                supplier_delivery_note_no:
                    supplierDeliveryNoteNo.trim() || null,
                notes: notes.trim() || null,
                telegram_notified: false,
                is_deleted: false,
            });

            if (error) throw error;

            if (
                deliveryStatus === "Received" ||
                deliveryStatus === "Partially Received"
            ) {
                const { error: poError } = await supabase
                    .from("purchase_orders")
                    .update({
                        order_status:
                            deliveryStatus === "Received"
                                ? "Received"
                                : "Partially Received",
                    })
                    .eq("purchase_order_id", purchaseOrderId);

                if (poError) throw poError;
            }
        },
        onSuccess: () => {
            toast.success("Supplier delivery created successfully.");
            queryClient.invalidateQueries({ queryKey: ["supplier_deliveries"] });
            queryClient.invalidateQueries({
                queryKey: ["purchase-orders-for-deliveries"],
            });
            queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
            setShowAddDialog(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const filteredDeliveries = useMemo(() => {
        const keyword = searchTerm.toLowerCase();

        return deliveries.filter((delivery) => {
            const supplierName = delivery.suppliers?.supplier_name || "";
            const projectName = delivery.projects?.project_name || "";
            const customerName = delivery.projects?.customers?.customer_name || "";
            const siteName = delivery.project_sites?.site_name || "";
            const poNo = delivery.purchase_orders?.purchase_order_no || "";
            const receiver = getEmployeeName(delivery.received_by);

            return (
                delivery.delivery_no?.toLowerCase().includes(keyword) ||
                delivery.supplier_delivery_note_no?.toLowerCase().includes(keyword) ||
                delivery.delivery_status?.toLowerCase().includes(keyword) ||
                supplierName.toLowerCase().includes(keyword) ||
                projectName.toLowerCase().includes(keyword) ||
                customerName.toLowerCase().includes(keyword) ||
                siteName.toLowerCase().includes(keyword) ||
                poNo.toLowerCase().includes(keyword) ||
                receiver.toLowerCase().includes(keyword)
            );
        });
    }, [deliveries, searchTerm]);

    const getEmployeeName = (employeeId: string | null) => {
        const employee = employees.find((item) => item.employee_id === employeeId);

        if (!employee) return "-";

        return (
            employee.display_name ||
            `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
            "-"
        );
    };

    const selectedPurchaseOrder = purchaseOrders.find(
        (po) => po.purchase_order_id === purchaseOrderId
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Truck className="h-8 w-8 text-red-600" />
                        <h1 className="text-3xl font-bold text-slate-900">
                            Supplier Deliveries
                        </h1>
                    </div>
                    <p className="text-slate-500 mt-1">
                        Record supplier deliveries received at project sites.
                    </p>
                </div>

                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Delivery
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by delivery, PO, supplier, project, site..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
                    <div className="col-span-2">Delivery</div>
                    <div className="col-span-2">PO</div>
                    <div className="col-span-2">Supplier</div>
                    <div className="col-span-2">Project</div>
                    <div className="col-span-1">Site</div>
                    <div className="col-span-1">Received By</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Photos</div>
                </div>

                {filteredDeliveries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No supplier deliveries found.
                    </div>
                ) : (
                    filteredDeliveries.map((delivery) => (
                        <div
                            key={delivery.supplier_delivery_id}
                            className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                        >
                            <div className="col-span-2">
                                <p className="font-semibold text-slate-900">
                                    {delivery.delivery_no || "-"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {delivery.delivery_date || "-"}
                                </p>
                            </div>

                            <div className="col-span-2 text-slate-700">
                                <p>{delivery.purchase_orders?.purchase_order_no || "-"}</p>
                                <p className="text-xs text-slate-500">
                                    ${Number(delivery.purchase_orders?.total_amount || 0).toFixed(2)}
                                </p>
                            </div>

                            <div className="col-span-2 text-slate-700">
                                <p>{delivery.suppliers?.supplier_name || "-"}</p>
                                <p className="text-xs text-slate-500">
                                    {delivery.suppliers?.supplier_code || "-"}
                                </p>
                            </div>

                            <div className="col-span-2 text-slate-700">
                                <p>{delivery.projects?.project_name || "-"}</p>
                                <p className="text-xs text-slate-500">
                                    {delivery.projects?.project_no || "-"}
                                </p>
                            </div>

                            <div className="col-span-1 text-slate-700">
                                {delivery.project_sites?.site_name || "-"}
                            </div>

                            <div className="col-span-1 text-slate-700">
                                {getEmployeeName(delivery.received_by)}
                            </div>

                            <div className="col-span-1 text-slate-700">
                                {delivery.delivery_status || "-"}
                            </div>

                            <div className="col-span-1 text-slate-700">
                                {delivery.supplier_delivery_photos?.length || 0}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Add Supplier Delivery</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Delivery No</Label>
                            <Input
                                value={deliveryNo}
                                onChange={(e) => setDeliveryNo(e.target.value)}
                                placeholder="SD2606-00001"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={deliveryStatus}
                                onValueChange={setDeliveryStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Received">Received</SelectItem>
                                    <SelectItem value="Partially Received">
                                        Partially Received
                                    </SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Purchase Order *</Label>
                            <Select
                                value={purchaseOrderId}
                                onValueChange={(value) => {
                                    setPurchaseOrderId(value);

                                    const selectedPo = purchaseOrders.find(
                                        (po) => po.purchase_order_id === value
                                    );

                                    if (selectedPo) {
                                        setSupplierId(selectedPo.supplier_id || "");
                                        setProjectId(selectedPo.project_id || "");
                                        setSiteId(selectedPo.site_id || "");
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select purchase order" />
                                </SelectTrigger>
                                <SelectContent>
                                    {purchaseOrders.map((po) => (
                                        <SelectItem
                                            key={po.purchase_order_id}
                                            value={po.purchase_order_id}
                                        >
                                            {po.purchase_order_no || "-"} -{" "}
                                            {po.suppliers?.supplier_name || "-"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPurchaseOrder && (
                            <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                                <p>
                                    <strong>Supplier:</strong>{" "}
                                    {selectedPurchaseOrder.suppliers?.supplier_name || "-"}
                                </p>
                                <p>
                                    <strong>Project:</strong>{" "}
                                    {selectedPurchaseOrder.projects?.project_name || "-"}
                                </p>
                                <p>
                                    <strong>Site:</strong>{" "}
                                    {selectedPurchaseOrder.project_sites?.site_name || "-"}
                                </p>
                                <p>
                                    <strong>PO Total:</strong> $
                                    {Number(selectedPurchaseOrder.total_amount || 0).toFixed(2)}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Delivery Date *</Label>
                            <Input
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Received By *</Label>
                            <Select value={receivedBy} onValueChange={setReceivedBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee) => {
                                        const name =
                                            employee.display_name ||
                                            `${employee.first_name || ""} ${employee.last_name || ""
                                                }`.trim();

                                        return (
                                            <SelectItem
                                                key={employee.employee_id}
                                                value={employee.employee_id}
                                            >
                                                {employee.employee_code || "-"} - {name}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Supplier Delivery Note No</Label>
                            <Input
                                value={supplierDeliveryNoteNo}
                                onChange={(e) =>
                                    setSupplierDeliveryNoteNo(e.target.value)
                                }
                                placeholder="Supplier DO / Docket No"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Telegram Status</Label>
                            <Input value="Not notified" readOnly />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
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
                            onClick={() => createDelivery.mutate()}
                            disabled={createDelivery.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {createDelivery.isPending ? "Saving..." : "Save Delivery"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SupplierDeliveries;