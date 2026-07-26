import { useMemo, useState } from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    AlertTriangle,
    Archive,
    ArrowLeft,
    Banknote,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Download,
    Eye,
    FileText,
    Loader2,
    Plus,
    Printer,
    ReceiptText,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    WalletCards,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type RpcError = {
    message?: string;
} | null;

type RpcCaller = (
    name: string,
    args?: Record<string, unknown>,
) => Promise<{
    data: unknown;
    error: RpcError;
}>;

type PermissionMap = Record<string, boolean>;

type PageMode = "list" | "form" | "detail";

type PaymentRow = {
    customer_payment_id: string;
    payment_no: string;

    customer_id: string;
    customer_code: string;
    customer_name: string;

    payment_date: string;
    payment_method: string;

    amount: number;
    allocated_amount: number;
    unallocated_amount: number;

    currency_code: string;
    reference_no: string | null;
    payment_status: string;

    active_allocation_count: number;

    allocated_invoice_nos?: unknown[];
    allocated_invoices?: unknown[];

    reversed_at: string | null;
    reversed_by?: string | null;
    reversal_reason: string | null;

    total_row_count: number;
};

type PaymentDetail = {
    payment?: Record<string, unknown>;
    allocations?: Array<Record<string, unknown>>;
};

type CustomerOption = {
    customer_id: string;
    customer_code: string;
    customer_name: string;
};

type InvoiceOption = {
    customer_invoice_id: string;
    invoice_no: string;
    customer_id: string;

    invoice_type: string;
    document_status: string;
    payment_status: string;
    due_status: string;

    invoice_date: string;
    due_date: string;

    total_amount: number;
    paid_amount: number;
    balance_amount: number;

    project_no: string | null;
    project_name: string | null;

    site_code: string | null;
    site_name: string | null;
};

type AllocationDraft = {
    key: string;
    customer_invoice_id: string;
    allocated_amount: string;
};

const PAGE_SIZE = 25;

const INPUT_CLASS =
    "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";

const TEXTAREA_CLASS =
    "rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";

const RED_BUTTON =
    "rounded-xl bg-[#8B3F3F] text-white hover:bg-[#743434] shadow-sm";

const PAYMENT_METHODS = [
    "Bank Transfer",
    "Cash",
    "Card",
    "Cheque",
    "Other",
] as const;

const permissionCodes = [
    "payments.view",
    "payments.receive",
    "payments.allocate",
    "payments.reverse",
    "payments.soft_delete",
] as const;

const callRpc = async <T,>(
    name: string,
    args: Record<string, unknown> = {},
): Promise<T> => {
    const { data, error } = await (
        supabase.rpc as unknown as RpcCaller
    )(name, args);

    if (error) {
        throw new Error(
            error.message || `Failed to call ${name}`,
        );
    }

    return data as T;
};

const today = () =>
    new Date().toISOString().slice(0, 10);

const uniqueKey = () =>
    `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

const money = (value: unknown) =>
    new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
    }).format(Number(value || 0));

const numberText = (
    value: unknown,
    maximumFractionDigits = 2,
) =>
    new Intl.NumberFormat("en-AU", {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    }).format(Number(value || 0));

const dateText = (value: unknown) =>
    value
        ? new Date(String(value)).toLocaleDateString("en-AU")
        : "—";

const csvCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

const statusBadgeClass = (status: string) => {
    switch (status) {
        case "Recorded":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "Reversed":
            return "border-red-200 bg-red-50 text-red-700";

        case "Paid":
            return "border-green-200 bg-green-50 text-green-700";

        case "Partially Paid":
            return "border-amber-200 bg-amber-50 text-amber-700";

        case "Unpaid":
            return "border-slate-200 bg-slate-100 text-slate-700";

        case "Overdue":
            return "border-orange-200 bg-orange-50 text-orange-700";

        default:
            return "border-slate-200 bg-white text-slate-700";
    }
};

const SectionHeader = ({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) => {
    return (
        <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B3F3F] text-sm font-bold text-white">
                {number}
            </div>

            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
};

const Payments = () => {
    const queryClient = useQueryClient();

    const [mode, setMode] =
        useState<PageMode>("list");

    const [selectedId, setSelectedId] =
        useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("All");
    const [methodFilter, setMethodFilter] =
        useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const [customerId, setCustomerId] =
        useState("");
    const [paymentDate, setPaymentDate] =
        useState(today());
    const [paymentMethod, setPaymentMethod] =
        useState("Bank Transfer");
    const [amount, setAmount] = useState("");
    const [referenceNo, setReferenceNo] =
        useState("");
    const [notes, setNotes] = useState("");

    const [allocations, setAllocations] = useState<
        AllocationDraft[]
    >([]);

    const [showReverseDialog, setShowReverseDialog] =
        useState(false);
    const [reversalReason, setReversalReason] =
        useState("");

    const permissions = useQuery({
        queryKey: ["payment-ui-permissions-v2"],

        queryFn: async () => {
            const result: PermissionMap = {};

            await Promise.all(
                permissionCodes.map(async (code) => {
                    result[code] = Boolean(
                        await callRpc<boolean>(
                            "has_permission",
                            {
                                p_permission_code: code,
                            },
                        ),
                    );
                }),
            );

            return result;
        },
    });

    const customers = useQuery({
        queryKey: ["payment-customers-v2"],

        queryFn: async () => {
            const { data, error } = await (
                supabase as any
            )
                .from("customers")
                .select(
                    [
                        "customer_id",
                        "customer_code",
                        "customer_name",
                    ].join(", "),
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("customer_name");

            if (error) {
                throw error;
            }

            return (data ?? []) as CustomerOption[];
        },
    });

    const invoiceOptions = useQuery({
        queryKey: [
            "payment-invoice-options-v2",
            customerId,
        ],

        enabled: Boolean(customerId),

        queryFn: async () => {
            const rows =
                await callRpc<InvoiceOption[]>(
                    "list_customer_invoices",
                    {
                        p_search: null,
                        p_document_status: "Issued",
                        p_payment_status: null,
                        p_invoice_type: null,
                        p_customer_id: customerId,
                        p_project_id: null,
                        p_project_site_id: null,
                        p_date_from: null,
                        p_date_to: null,
                        p_limit: 500,
                        p_offset: 0,
                    },
                );

            return rows.filter(
                (invoice) =>
                    Number(
                        invoice.balance_amount || 0,
                    ) > 0 &&
                    invoice.payment_status !== "Paid",
            );
        },
    });

    const paymentList = useQuery({
        queryKey: [
            "payment-list-v2",
            search,
            statusFilter,
            methodFilter,
            dateFrom,
            dateTo,
            page,
        ],

        queryFn: () =>
            callRpc<PaymentRow[]>(
                "list_customer_payments",
                {
                    p_search:
                        search.trim() || null,

                    p_payment_status:
                        statusFilter === "All"
                            ? null
                            : statusFilter,

                    p_payment_method:
                        methodFilter === "All"
                            ? null
                            : methodFilter,

                    p_customer_id: null,

                    p_date_from:
                        dateFrom || null,

                    p_date_to:
                        dateTo || null,

                    p_limit: PAGE_SIZE,

                    p_offset:
                        (page - 1) * PAGE_SIZE,
                },
            ),
    });

    const detail = useQuery({
        queryKey: [
            "payment-detail-v2",
            selectedId,
        ],

        enabled: Boolean(selectedId),

        queryFn: () =>
            callRpc<PaymentDetail>(
                "get_customer_payment_detail",
                {
                    p_payment_id: selectedId,
                },
            ),
    });

    const permission = permissions.data ?? {};
    const rows = paymentList.data ?? [];

    const totalRows = Number(
        rows[0]?.total_row_count || 0,
    );

    const totalPages = Math.max(
        1,
        Math.ceil(totalRows / PAGE_SIZE),
    );

    const selectedCustomer = useMemo(
        () =>
            (customers.data ?? []).find(
                (customer) =>
                    customer.customer_id === customerId,
            ) ?? null,
        [customerId, customers.data],
    );

    const availableInvoices =
        invoiceOptions.data ?? [];

    const summary = useMemo(
        () => ({
            received: rows
                .filter(
                    (payment) =>
                        payment.payment_status ===
                        "Recorded",
                )
                .reduce(
                    (total, payment) =>
                        total +
                        Number(payment.amount || 0),
                    0,
                ),

            allocated: rows
                .filter(
                    (payment) =>
                        payment.payment_status ===
                        "Recorded",
                )
                .reduce(
                    (total, payment) =>
                        total +
                        Number(
                            payment.allocated_amount || 0,
                        ),
                    0,
                ),

            unallocated: rows
                .filter(
                    (payment) =>
                        payment.payment_status ===
                        "Recorded",
                )
                .reduce(
                    (total, payment) =>
                        total +
                        Number(
                            payment.unallocated_amount ||
                                0,
                        ),
                    0,
                ),

            reversed: rows
                .filter(
                    (payment) =>
                        payment.payment_status ===
                        "Reversed",
                )
                .reduce(
                    (total, payment) =>
                        total +
                        Number(payment.amount || 0),
                    0,
                ),
        }),
        [rows],
    );

    const allocationTotal = useMemo(
        () =>
            allocations.reduce(
                (total, allocation) =>
                    total +
                    Number(
                        allocation.allocated_amount || 0,
                    ),
                0,
            ),
        [allocations],
    );

    const paymentAmount = Number(amount || 0);

    const unallocatedPreview =
        paymentAmount - allocationTotal;

    const resetForm = () => {
        setCustomerId("");
        setPaymentDate(today());
        setPaymentMethod("Bank Transfer");
        setAmount("");
        setReferenceNo("");
        setNotes("");
        setAllocations([]);
    };

    const openCreate = () => {
        resetForm();
        setMode("form");
    };

    const openDetail = (paymentId: string) => {
        setSelectedId(paymentId);
        setMode("detail");
    };

    const closeToList = () => {
        setMode("list");
        setSelectedId(null);
        setShowReverseDialog(false);
        setReversalReason("");
        resetForm();
    };

    const selectCustomer = (
        nextCustomerId: string,
    ) => {
        setCustomerId(nextCustomerId);
        setAllocations([]);
    };

    const addAllocation = () => {
        setAllocations((current) => [
            ...current,
            {
                key: uniqueKey(),
                customer_invoice_id: "",
                allocated_amount: "",
            },
        ]);
    };

    const updateAllocation = (
        key: string,
        changes: Partial<AllocationDraft>,
    ) => {
        setAllocations((current) =>
            current.map((allocation) =>
                allocation.key === key
                    ? {
                          ...allocation,
                          ...changes,
                      }
                    : allocation,
            ),
        );
    };

    const removeAllocation = (key: string) => {
        setAllocations((current) =>
            current.filter(
                (allocation) =>
                    allocation.key !== key,
            ),
        );
    };

    const getInvoiceById = (
        invoiceId: string,
    ) =>
        availableInvoices.find(
            (invoice) =>
                invoice.customer_invoice_id ===
                invoiceId,
        ) ?? null;

    const autoAllocate = () => {
        if (paymentAmount <= 0) {
            toast.error(
                "Enter the Payment Amount before auto allocation.",
            );
            return;
        }

        let remaining = paymentAmount;

        const nextAllocations: AllocationDraft[] =
            [];

        for (const invoice of availableInvoices) {
            if (remaining <= 0) {
                break;
            }

            const invoiceBalance = Number(
                invoice.balance_amount || 0,
            );

            if (invoiceBalance <= 0) {
                continue;
            }

            const allocatedAmount = Math.min(
                remaining,
                invoiceBalance,
            );

            nextAllocations.push({
                key: uniqueKey(),
                customer_invoice_id:
                    invoice.customer_invoice_id,
                allocated_amount:
                    allocatedAmount.toFixed(2),
            });

            remaining -= allocatedAmount;
        }

        setAllocations(nextAllocations);
    };

    const receivePayment = useMutation({
        mutationFn: async () => {
            if (!customerId) {
                throw new Error(
                    "Customer is required.",
                );
            }

            if (!paymentDate) {
                throw new Error(
                    "Payment Date is required.",
                );
            }

            if (!paymentMethod) {
                throw new Error(
                    "Payment Method is required.",
                );
            }

            if (
                !Number.isFinite(paymentAmount) ||
                paymentAmount <= 0
            ) {
                throw new Error(
                    "Payment Amount must be greater than zero.",
                );
            }

            const invoiceIds = new Set<string>();

            const cleanAllocations =
                allocations.map(
                    (allocation, index) => {
                        if (
                            !allocation.customer_invoice_id
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Please select an Invoice.`,
                            );
                        }

                        if (
                            invoiceIds.has(
                                allocation.customer_invoice_id,
                            )
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: The same Invoice cannot be allocated twice.`,
                            );
                        }

                        invoiceIds.add(
                            allocation.customer_invoice_id,
                        );

                        const invoice =
                            getInvoiceById(
                                allocation.customer_invoice_id,
                            );

                        if (!invoice) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Invoice is no longer available.`,
                            );
                        }

                        const allocatedAmount =
                            Number(
                                allocation.allocated_amount,
                            );

                        if (
                            !Number.isFinite(
                                allocatedAmount,
                            ) ||
                            allocatedAmount <= 0
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Amount must be greater than zero.`,
                            );
                        }

                        if (
                            allocatedAmount >
                            Number(
                                invoice.balance_amount ||
                                    0,
                            )
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Amount exceeds Invoice balance.`,
                            );
                        }

                        return {
                            customer_invoice_id:
                                allocation.customer_invoice_id,
                            allocated_amount:
                                allocatedAmount,
                        };
                    },
                );

            if (
                allocationTotal >
                paymentAmount
            ) {
                throw new Error(
                    "Total allocation cannot exceed the Payment Amount.",
                );
            }

            return callRpc<string>(
                "receive_customer_payment_atomic",
                {
                    p_payment: {
                        customer_id: customerId,
                        payment_date: paymentDate,
                        payment_method:
                            paymentMethod,
                        amount: paymentAmount,
                        currency_code: "AUD",
                        reference_no:
                            referenceNo.trim() ||
                            null,
                        notes:
                            notes.trim() || null,
                    },

                    p_allocations:
                        cleanAllocations,
                },
            );
        },

        onSuccess: async (paymentId) => {
            toast.success(
                "Customer Payment recorded successfully.",
            );

            setSelectedId(paymentId);
            setMode("detail");
            resetForm();

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-list-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-detail-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-list-v2",
                ],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const allocatePayment = useMutation({
        mutationFn: async ({
            paymentId,
            paymentCustomerId,
            remainingAmount,
        }: {
            paymentId: string;
            paymentCustomerId: string;
            remainingAmount: number;
        }) => {
            if (remainingAmount <= 0) {
                throw new Error(
                    "This Payment has no unallocated amount.",
                );
            }

            if (allocations.length === 0) {
                throw new Error(
                    "Add at least one Invoice allocation.",
                );
            }

            const invoiceIds = new Set<string>();

            const cleanAllocations =
                allocations.map(
                    (allocation, index) => {
                        if (
                            !allocation.customer_invoice_id
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Please select an Invoice.`,
                            );
                        }

                        if (
                            invoiceIds.has(
                                allocation.customer_invoice_id,
                            )
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: The same Invoice cannot be allocated twice.`,
                            );
                        }

                        invoiceIds.add(
                            allocation.customer_invoice_id,
                        );

                        const invoice =
                            getInvoiceById(
                                allocation.customer_invoice_id,
                            );

                        if (
                            !invoice ||
                            invoice.customer_id !==
                                paymentCustomerId
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Invoice does not match the Payment Customer.`,
                            );
                        }

                        const allocatedAmount =
                            Number(
                                allocation.allocated_amount,
                            );

                        if (
                            !Number.isFinite(
                                allocatedAmount,
                            ) ||
                            allocatedAmount <= 0
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Amount must be greater than zero.`,
                            );
                        }

                        if (
                            allocatedAmount >
                            Number(
                                invoice.balance_amount ||
                                    0,
                            )
                        ) {
                            throw new Error(
                                `Allocation ${
                                    index + 1
                                }: Amount exceeds Invoice balance.`,
                            );
                        }

                        return {
                            customer_invoice_id:
                                allocation.customer_invoice_id,
                            allocated_amount:
                                allocatedAmount,
                        };
                    },
                );

            const requestedTotal =
                cleanAllocations.reduce(
                    (total, allocation) =>
                        total +
                        allocation.allocated_amount,
                    0,
                );

            if (
                requestedTotal >
                remainingAmount
            ) {
                throw new Error(
                    "Total allocation exceeds the remaining Payment amount.",
                );
            }

            return callRpc<string>(
                "allocate_customer_payment_atomic",
                {
                    p_payment_id: paymentId,
                    p_allocations:
                        cleanAllocations,
                },
            );
        },

        onSuccess: async () => {
            toast.success(
                "Payment allocation saved successfully.",
            );

            setAllocations([]);

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-list-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-detail-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-list-v2",
                ],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const reversePayment = useMutation({
        mutationFn: async (paymentId: string) => {
            if (!reversalReason.trim()) {
                throw new Error(
                    "Reversal Reason is required.",
                );
            }

            return callRpc<string>(
                "reverse_customer_payment_atomic",
                {
                    p_payment_id: paymentId,
                    p_reason:
                        reversalReason.trim(),
                },
            );
        },

        onSuccess: async () => {
            toast.success(
                "Payment reversed successfully.",
            );

            setShowReverseDialog(false);
            setReversalReason("");

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-list-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-detail-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-list-v2",
                ],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const archivePayment = useMutation({
        mutationFn: async (
            paymentId: string,
        ) =>
            callRpc<string>(
                "soft_delete_customer_payment_atomic",
                {
                    p_payment_id: paymentId,
                },
            ),

        onSuccess: async () => {
            toast.success(
                "Payment archived successfully.",
            );

            closeToList();

            await queryClient.invalidateQueries({
                queryKey: [
                    "payment-list-v2",
                ],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const exportCsv = () => {
        const headers = [
            "Payment",
            "Customer",
            "Payment Date",
            "Payment Method",
            "Reference",
            "Status",
            "Amount",
            "Allocated",
            "Unallocated",
            "Reversal Reason",
        ];

        const body = rows.map((payment) =>
            [
                payment.payment_no,
                `${payment.customer_code} - ${payment.customer_name}`,
                payment.payment_date,
                payment.payment_method,
                payment.reference_no,
                payment.payment_status,
                payment.amount,
                payment.allocated_amount,
                payment.unallocated_amount,
                payment.reversal_reason,
            ]
                .map(csvCell)
                .join(","),
        );

        const content = [
            headers.map(csvCell).join(","),
            ...body,
        ].join("\n");

        const blob = new Blob(
            [`\uFEFF${content}`],
            {
                type: "text/csv;charset=utf-8",
            },
        );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;
        anchor.download =
            `REDS-Payments-${today()}.csv`;

        anchor.click();

        URL.revokeObjectURL(url);
    };

    const printPage = () => {
        window.print();
    };

    // ===== ตอนที่ 1 จบตรงนี้ =====
        const renderAllocationEditor = ({
        maximumAmount,
        paymentCustomerId,
        submitLabel,
        onSubmit,
        isSubmitting,
    }: {
        maximumAmount: number;
        paymentCustomerId: string;
        submitLabel: string;
        onSubmit: () => void;
        isSubmitting: boolean;
    }) => {
        const remainingAfterAllocation =
            maximumAmount - allocationTotal;

        return (
            <div className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <p className="font-semibold text-slate-900">
                            Invoice Allocations
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Allocate the Payment across one or more
                            issued Invoices for the same Customer.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            disabled={
                                !paymentCustomerId ||
                                availableInvoices.length === 0
                            }
                            onClick={autoAllocate}
                        >
                            <CircleDollarSign className="mr-2 h-4 w-4" />
                            Auto Allocate
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            disabled={!paymentCustomerId}
                            onClick={addAllocation}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Allocation
                        </Button>
                    </div>
                </div>

                {paymentCustomerId &&
                    invoiceOptions.isLoading && (
                        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                            Loading outstanding Invoices…
                        </div>
                    )}

                {paymentCustomerId &&
                    !invoiceOptions.isLoading &&
                    availableInvoices.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                            This Customer has no outstanding issued
                            Invoices available for allocation.
                        </div>
                    )}

                {allocations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                        No Invoice allocations added. Any remaining
                        Payment amount will stay unallocated and may be
                        allocated later.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {allocations.map(
                            (allocation, index) => {
                                const selectedInvoice =
                                    getInvoiceById(
                                        allocation.customer_invoice_id,
                                    );

                                const alreadySelectedIds =
                                    new Set(
                                        allocations
                                            .filter(
                                                (item) =>
                                                    item.key !==
                                                    allocation.key,
                                            )
                                            .map(
                                                (item) =>
                                                    item.customer_invoice_id,
                                            )
                                            .filter(Boolean),
                                    );

                                return (
                                    <div
                                        key={allocation.key}
                                        className="rounded-2xl border border-slate-200 p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="font-semibold text-slate-900">
                                                Allocation{" "}
                                                {index + 1}
                                            </p>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl text-red-600"
                                                onClick={() =>
                                                    removeAllocation(
                                                        allocation.key,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-[1fr_190px]">
                                            <div className="space-y-2">
                                                <Label>
                                                    Outstanding
                                                    Invoice{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </Label>

                                                <Select
                                                    value={
                                                        allocation.customer_invoice_id ||
                                                        "none"
                                                    }
                                                    onValueChange={(
                                                        value,
                                                    ) => {
                                                        const invoice =
                                                            getInvoiceById(
                                                                value,
                                                            );

                                                        updateAllocation(
                                                            allocation.key,
                                                            {
                                                                customer_invoice_id:
                                                                    value ===
                                                                    "none"
                                                                        ? ""
                                                                        : value,
                                                                allocated_amount:
                                                                    invoice
                                                                        ? Math.min(
                                                                              Number(
                                                                                  invoice.balance_amount ||
                                                                                      0,
                                                                              ),
                                                                              Math.max(
                                                                                  maximumAmount -
                                                                                      allocations
                                                                                          .filter(
                                                                                              (
                                                                                                  item,
                                                                                              ) =>
                                                                                                  item.key !==
                                                                                                  allocation.key,
                                                                                          )
                                                                                          .reduce(
                                                                                              (
                                                                                                  total,
                                                                                                  item,
                                                                                              ) =>
                                                                                                  total +
                                                                                                  Number(
                                                                                                      item.allocated_amount ||
                                                                                                          0,
                                                                                                  ),
                                                                                              0,
                                                                                          ),
                                                                                  0,
                                                                              ),
                                                                          ).toFixed(
                                                                              2,
                                                                          )
                                                                        : "",
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            INPUT_CLASS
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select Invoice" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Select
                                                            Invoice
                                                        </SelectItem>

                                                        {availableInvoices.map(
                                                            (
                                                                invoice,
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        invoice.customer_invoice_id
                                                                    }
                                                                    value={
                                                                        invoice.customer_invoice_id
                                                                    }
                                                                    disabled={alreadySelectedIds.has(
                                                                        invoice.customer_invoice_id,
                                                                    )}
                                                                >
                                                                    {
                                                                        invoice.invoice_no
                                                                    }{" "}
                                                                    — Balance{" "}
                                                                    {money(
                                                                        invoice.balance_amount,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>
                                                    Allocate Amount{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={
                                                        selectedInvoice
                                                            ? Number(
                                                                  selectedInvoice.balance_amount ||
                                                                      0,
                                                              )
                                                            : undefined
                                                    }
                                                    step="0.01"
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        allocation.allocated_amount
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateAllocation(
                                                            allocation.key,
                                                            {
                                                                allocated_amount:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {selectedInvoice && (
                                            <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4">
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Invoice
                                                    </p>

                                                    <p className="font-medium">
                                                        {
                                                            selectedInvoice.invoice_no
                                                        }
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Due Date
                                                    </p>

                                                    <p className="font-medium">
                                                        {dateText(
                                                            selectedInvoice.due_date,
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Invoice
                                                        Total
                                                    </p>

                                                    <p className="font-medium">
                                                        {money(
                                                            selectedInvoice.total_amount,
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Balance
                                                    </p>

                                                    <p className="font-semibold text-[#8B3F3F]">
                                                        {money(
                                                            selectedInvoice.balance_amount,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-slate-500">
                            Available Amount
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                            {money(maximumAmount)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-slate-500">
                            Allocation Total
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                            {money(allocationTotal)}
                        </p>
                    </div>

                    <div
                        className={`rounded-xl border p-4 ${
                            remainingAfterAllocation < 0
                                ? "border-red-300 bg-red-50"
                                : "border-[#8B3F3F] bg-red-50"
                        }`}
                    >
                        <p className="text-sm text-[#8B3F3F]">
                            Remaining Unallocated
                        </p>

                        <p className="mt-1 text-xl font-bold text-[#8B3F3F]">
                            {money(
                                remainingAfterAllocation,
                            )}
                        </p>
                    </div>
                </div>

                {remainingAfterAllocation < 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertTriangle className="mr-2 inline h-4 w-4" />
                        Allocation total exceeds the available
                        Payment amount.
                    </div>
                )}

                <div className="flex justify-end">
                    <Button
                        type="button"
                        className={RED_BUTTON}
                        disabled={
                            isSubmitting ||
                            allocations.length === 0 ||
                            remainingAfterAllocation < 0
                        }
                        onClick={onSubmit}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}

                        {submitLabel}
                    </Button>
                </div>
            </div>
        );
    };

    const renderList = () => (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <WalletCards className="h-8 w-8 text-[#8B3F3F]" />

                        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                            Customer Payments
                        </h1>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Record customer receipts, allocate payments
                        and monitor available customer credit.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={exportCsv}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>

                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={printPage}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>

                    {permission["payments.receive"] && (
                        <Button
                            className={RED_BUTTON}
                            onClick={openCreate}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Receive Payment
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Received",
                        value: summary.received,
                        icon: Banknote,
                    },
                    {
                        label: "Allocated",
                        value: summary.allocated,
                        icon: CheckCircle2,
                    },
                    {
                        label: "Unallocated Credit",
                        value: summary.unallocated,
                        icon: CircleDollarSign,
                    },
                    {
                        label: "Reversed",
                        value: summary.reversed,
                        icon: RotateCcw,
                    },
                ].map((item) => (
                    <Card
                        key={item.label}
                        className="rounded-2xl"
                    >
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-slate-500">
                                    {item.label}
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {money(item.value)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-100 p-3">
                                <item.icon className="h-5 w-5 text-[#8B3F3F]" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="rounded-2xl">
                <CardContent className="space-y-4 p-4 md:p-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="relative xl:col-span-2">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                            <Input
                                className={`${INPUT_CLASS} pl-10`}
                                placeholder="Search payment, customer or reference"
                                value={search}
                                onChange={(event) => {
                                    setSearch(
                                        event.target.value,
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>

                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                className={INPUT_CLASS}
                            >
                                <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>

                            <SelectContent>
                                {[
                                    "All",
                                    "Recorded",
                                    "Reversed",
                                ].map((status) => (
                                    <SelectItem
                                        key={status}
                                        value={status}
                                    >
                                        {status === "All"
                                            ? "All Payment Statuses"
                                            : status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={methodFilter}
                            onValueChange={(value) => {
                                setMethodFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                className={INPUT_CLASS}
                            >
                                <SelectValue placeholder="Payment Method" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="All">
                                    All Payment Methods
                                </SelectItem>

                                {PAYMENT_METHODS.map(
                                    (method) => (
                                        <SelectItem
                                            key={method}
                                            value={method}
                                        >
                                            {method}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            className="h-11 rounded-xl"
                            onClick={() =>
                                paymentList.refetch()
                            }
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">
                                Payment date from
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={dateFrom}
                                onChange={(event) => {
                                    setDateFrom(
                                        event.target.value,
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">
                                Payment date to
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={dateTo}
                                onChange={(event) => {
                                    setDateTo(
                                        event.target.value,
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        Payment
                                    </TableHead>

                                    <TableHead>
                                        Customer
                                    </TableHead>

                                    <TableHead>
                                        Date / Method
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Amount
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Allocated
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Unallocated
                                    </TableHead>

                                    <TableHead className="w-[90px] text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paymentList.isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-32 text-center"
                                        >
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#8B3F3F]" />
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-32 text-center"
                                        >
                                            <ReceiptText className="mx-auto h-8 w-8 text-slate-300" />

                                            <p className="mt-2 font-medium text-slate-600">
                                                No Payments found
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((payment) => (
                                        <TableRow
                                            key={
                                                payment.customer_payment_id
                                            }
                                            className="cursor-pointer hover:bg-slate-50"
                                            onClick={() =>
                                                openDetail(
                                                    payment.customer_payment_id,
                                                )
                                            }
                                        >
                                            <TableCell>
                                                <p className="font-semibold text-slate-900">
                                                    {
                                                        payment.payment_no
                                                    }
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {payment.reference_no ||
                                                        "No reference"}
                                                </p>
                                            </TableCell>

                                            <TableCell>
                                                <p className="font-medium text-slate-900">
                                                    {
                                                        payment.customer_code
                                                    }{" "}
                                                    —{" "}
                                                    {
                                                        payment.customer_name
                                                    }
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {
                                                        payment.active_allocation_count
                                                    }{" "}
                                                    active
                                                    allocation
                                                    {Number(
                                                        payment.active_allocation_count ||
                                                            0,
                                                    ) === 1
                                                        ? ""
                                                        : "s"}
                                                </p>
                                            </TableCell>

                                            <TableCell>
                                                <p className="text-sm">
                                                    {dateText(
                                                        payment.payment_date,
                                                    )}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {
                                                        payment.payment_method
                                                    }
                                                </p>
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={statusBadgeClass(
                                                        payment.payment_status,
                                                    )}
                                                >
                                                    {
                                                        payment.payment_status
                                                    }
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right font-semibold">
                                                {money(
                                                    payment.amount,
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {money(
                                                    payment.allocated_amount,
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right font-semibold text-[#8B3F3F]">
                                                {money(
                                                    payment.unallocated_amount,
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-xl"
                                                    onClick={(
                                                        event,
                                                    ) => {
                                                        event.stopPropagation();

                                                        openDetail(
                                                            payment.customer_payment_id,
                                                        );
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <p className="text-sm text-slate-500">
                            {totalRows === 0
                                ? "0 records"
                                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                      page * PAGE_SIZE,
                                      totalRows,
                                  )} of ${totalRows}`}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            current - 1,
                                    )
                                }
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm text-slate-600">
                                Page {page} of{" "}
                                {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                disabled={
                                    page >= totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            current + 1,
                                    )
                                }
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderForm = () => (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex items-start gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="mt-1 rounded-xl"
                        onClick={closeToList}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                            Receive Customer Payment
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Payment number is generated
                            automatically when the receipt is
                            recorded.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={closeToList}
                    >
                        Cancel
                    </Button>

                    <Button
                        className={RED_BUTTON}
                        disabled={
                            receivePayment.isPending
                        }
                        onClick={() =>
                            receivePayment.mutate()
                        }
                    >
                        {receivePayment.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}

                        Record Payment
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="01"
                        title="Customer & Receipt"
                        description="Select the Customer and enter the amount received."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2 xl:col-span-2">
                            <Label>
                                Customer{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Select
                                value={customerId}
                                onValueChange={
                                    selectCustomer
                                }
                            >
                                <SelectTrigger
                                    className={INPUT_CLASS}
                                >
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>

                                <SelectContent>
                                    {(customers.data ?? []).map(
                                        (customer) => (
                                            <SelectItem
                                                key={
                                                    customer.customer_id
                                                }
                                                value={
                                                    customer.customer_id
                                                }
                                            >
                                                {
                                                    customer.customer_code
                                                }{" "}
                                                —{" "}
                                                {
                                                    customer.customer_name
                                                }
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Payment Date{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={paymentDate}
                                onChange={(event) =>
                                    setPaymentDate(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Payment Amount{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className={INPUT_CLASS}
                                value={amount}
                                onChange={(event) =>
                                    setAmount(
                                        event.target.value,
                                    )
                                }
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {selectedCustomer && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Selected Customer
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {
                                    selectedCustomer.customer_code
                                }{" "}
                                —{" "}
                                {
                                    selectedCustomer.customer_name
                                }
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="02"
                        title="Payment Method & Reference"
                        description="Record how the payment was received and retain the external transaction reference."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <Label>
                                Payment Method{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Select
                                value={paymentMethod}
                                onValueChange={
                                    setPaymentMethod
                                }
                            >
                                <SelectTrigger
                                    className={INPUT_CLASS}
                                >
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {PAYMENT_METHODS.map(
                                        (method) => (
                                            <SelectItem
                                                key={method}
                                                value={method}
                                            >
                                                {method}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 xl:col-span-3">
                            <Label>
                                Transaction / Reference
                                Number
                            </Label>

                            <Input
                                className={INPUT_CLASS}
                                value={referenceNo}
                                onChange={(event) =>
                                    setReferenceNo(
                                        event.target.value,
                                    )
                                }
                                placeholder="Bank transaction, cheque or receipt reference"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2 xl:col-span-4">
                            <Label>Payment Notes</Label>

                            <Textarea
                                className={TEXTAREA_CLASS}
                                value={notes}
                                onChange={(event) =>
                                    setNotes(
                                        event.target.value,
                                    )
                                }
                                placeholder="Internal notes about this Payment"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="03"
                        title="Invoice Allocation"
                        description="Allocate now or leave the amount unallocated for later use."
                    />

                    {renderAllocationEditor({
                        maximumAmount: paymentAmount,
                        paymentCustomerId: customerId,
                        submitLabel:
                            "Validate Allocations",
                        onSubmit: () => {
                            if (
                                allocationTotal >
                                paymentAmount
                            ) {
                                toast.error(
                                    "Allocation total exceeds the Payment Amount.",
                                );
                                return;
                            }

                            toast.success(
                                "Allocation preview is valid.",
                            );
                        },
                        isSubmitting: false,
                    })}
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="04"
                        title="Payment Summary"
                        description="The Backend validates the final Payment and allocation amounts."
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">
                                Amount Received
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {money(paymentAmount)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">
                                Allocated
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {money(allocationTotal)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#8B3F3F] bg-red-50 p-4">
                            <p className="text-sm text-[#8B3F3F]">
                                Unallocated Credit
                            </p>

                            <p className="mt-1 text-2xl font-bold text-[#8B3F3F]">
                                {money(
                                    unallocatedPreview,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={closeToList}
                        >
                            Cancel
                        </Button>

                        <Button
                            className={RED_BUTTON}
                            disabled={
                                receivePayment.isPending ||
                                unallocatedPreview < 0
                            }
                            onClick={() =>
                                receivePayment.mutate()
                            }
                        >
                            {receivePayment.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}

                            Record Payment
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderDetail = () => {
        const payment =
            detail.data?.payment ?? {};

        const detailAllocations =
            detail.data?.allocations ?? [];

        const paymentId = String(
            payment.customer_payment_id ??
                selectedId ??
                "",
        );

        const paymentCustomerId = String(
            payment.customer_id ?? "",
        );

        const paymentStatus = String(
            payment.payment_status ?? "",
        );

        const remainingAmount = Number(
            payment.unallocated_amount || 0,
        );

        const prepareLaterAllocation = () => {
            setCustomerId(paymentCustomerId);
            setAllocations([
                {
                    key: uniqueKey(),
                    customer_invoice_id: "",
                    allocated_amount: "",
                },
            ]);
        };

        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="mt-1 rounded-xl"
                            onClick={closeToList}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                                    {String(
                                        payment.payment_no ??
                                            "Payment",
                                    )}
                                </h1>

                                <Badge
                                    variant="outline"
                                    className={statusBadgeClass(
                                        paymentStatus,
                                    )}
                                >
                                    {paymentStatus || "—"}
                                </Badge>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                Customer Payment Receipt
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={printPage}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>

                        {paymentStatus === "Recorded" &&
                            permission[
                                "payments.reverse"
                            ] && (
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        setReversalReason(
                                            "",
                                        );
                                        setShowReverseDialog(
                                            true,
                                        );
                                    }}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reverse
                                </Button>
                            )}
                    </div>
                </div>

                {detail.isLoading ? (
                    <Card className="rounded-2xl">
                        <CardContent className="flex h-48 items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-[#8B3F3F]" />
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Card className="rounded-2xl">
                                <CardContent className="p-5">
                                    <p className="text-sm text-slate-500">
                                        Amount Received
                                    </p>

                                    <p className="mt-1 text-2xl font-bold">
                                        {money(
                                            payment.amount,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl">
                                <CardContent className="p-5">
                                    <p className="text-sm text-slate-500">
                                        Allocated
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-green-700">
                                        {money(
                                            payment.allocated_amount,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl">
                                <CardContent className="p-5">
                                    <p className="text-sm text-slate-500">
                                        Unallocated
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-[#8B3F3F]">
                                        {money(
                                            payment.unallocated_amount,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl">
                                <CardContent className="p-5">
                                    <p className="text-sm text-slate-500">
                                        Payment Date
                                    </p>

                                    <p className="mt-1 text-xl font-bold">
                                        {dateText(
                                            payment.payment_date,
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Payment Information
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    [
                                        "Customer",
                                        payment.customer_name,
                                    ],
                                    [
                                        "Customer Code",
                                        payment.customer_code,
                                    ],
                                    [
                                        "Payment Date",
                                        dateText(
                                            payment.payment_date,
                                        ),
                                    ],
                                    [
                                        "Payment Method",
                                        payment.payment_method,
                                    ],
                                    [
                                        "Reference",
                                        payment.reference_no,
                                    ],
                                    [
                                        "Currency",
                                        payment.currency_code ||
                                            "AUD",
                                    ],
                                    [
                                        "Status",
                                        payment.payment_status,
                                    ],
                                    [
                                        "Active Allocations",
                                        payment.active_allocation_count,
                                    ],
                                    [
                                        "Notes",
                                        payment.notes,
                                    ],
                                    [
                                        "Reversed At",
                                        payment.reversed_at
                                            ? dateText(
                                                  payment.reversed_at,
                                              )
                                            : "—",
                                    ],
                                    [
                                        "Reversal Reason",
                                        payment.reversal_reason,
                                    ],
                                ].map(
                                    ([label, value]) => (
                                        <div
                                            key={String(
                                                label,
                                            )}
                                        >
                                            <p className="text-xs text-slate-500">
                                                {String(
                                                    label,
                                                )}
                                            </p>

                                            <p className="mt-1 font-medium text-slate-900">
                                                {String(
                                                    value ??
                                                        "—",
                                                )}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Invoice Allocations
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-0">
                                {detailAllocations.length ===
                                0 ? (
                                    <div className="p-6 text-sm text-slate-500">
                                        This Payment has not
                                        been allocated to an
                                        Invoice.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Invoice
                                                    </TableHead>

                                                    <TableHead>
                                                        Project /
                                                        Site
                                                    </TableHead>

                                                    <TableHead>
                                                        Allocation
                                                        Date
                                                    </TableHead>

                                                    <TableHead>
                                                        Status
                                                    </TableHead>

                                                    <TableHead className="text-right">
                                                        Invoice
                                                        Total
                                                    </TableHead>

                                                    <TableHead className="text-right">
                                                        Allocated
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {detailAllocations.map(
                                                    (
                                                        allocation,
                                                        index,
                                                    ) => (
                                                        <TableRow
                                                            key={String(
                                                                allocation.customer_payment_allocation_id ??
                                                                    index,
                                                            )}
                                                        >
                                                            <TableCell>
                                                                <p className="font-semibold text-slate-900">
                                                                    {String(
                                                                        allocation.invoice_no ??
                                                                            "—",
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {String(
                                                                        allocation.invoice_type ??
                                                                            "",
                                                                    )}
                                                                </p>
                                                            </TableCell>

                                                            <TableCell>
                                                                <p className="text-sm">
                                                                    {String(
                                                                        allocation.project_no ??
                                                                            allocation.project_name ??
                                                                            "—",
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {String(
                                                                        allocation.site_code ??
                                                                            allocation.site_name ??
                                                                            "",
                                                                    )}
                                                                </p>
                                                            </TableCell>

                                                            <TableCell>
                                                                {dateText(
                                                                    allocation.allocated_at ??
                                                                        allocation.created_at,
                                                                )}
                                                            </TableCell>

                                                            <TableCell>
                                                                {allocation.reversed_at ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={statusBadgeClass(
                                                                            "Reversed",
                                                                        )}
                                                                    >
                                                                        Reversed
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={statusBadgeClass(
                                                                            "Recorded",
                                                                        )}
                                                                    >
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-right">
                                                                {money(
                                                                    allocation.invoice_total_amount ??
                                                                        allocation.total_amount,
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-right font-semibold">
                                                                {money(
                                                                    allocation.allocated_amount,
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {paymentStatus === "Recorded" &&
                            remainingAmount > 0 &&
                            permission[
                                "payments.allocate"
                            ] && (
                                <Card className="rounded-2xl">
                                    <CardHeader>
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    Allocate
                                                    Remaining
                                                    Payment
                                                </CardTitle>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    Apply the
                                                    remaining{" "}
                                                    {money(
                                                        remainingAmount,
                                                    )}{" "}
                                                    to outstanding
                                                    Invoices.
                                                </p>
                                            </div>

                                            {customerId !==
                                                paymentCustomerId && (
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl"
                                                    onClick={
                                                        prepareLaterAllocation
                                                    }
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Start
                                                    Allocation
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {customerId ===
                                        paymentCustomerId
                                            ? renderAllocationEditor(
                                                  {
                                                      maximumAmount:
                                                          remainingAmount,
                                                      paymentCustomerId,
                                                      submitLabel:
                                                          "Save Allocations",
                                                      onSubmit:
                                                          () =>
                                                              allocatePayment.mutate(
                                                                  {
                                                                      paymentId,
                                                                      paymentCustomerId,
                                                                      remainingAmount,
                                                                  },
                                                              ),
                                                      isSubmitting:
                                                          allocatePayment.isPending,
                                                  },
                                              )
                                            : (
                                                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                                                      Select
                                                      Start
                                                      Allocation to
                                                      load the
                                                      Customer’s
                                                      outstanding
                                                      Invoices.
                                                  </div>
                                              )}
                                    </CardContent>
                                </Card>
                            )}

                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Workflow Actions
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="flex flex-wrap gap-2">
                                {paymentStatus ===
                                    "Recorded" &&
                                    permission[
                                        "payments.reverse"
                                    ] && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setReversalReason(
                                                    "",
                                                );
                                                setShowReverseDialog(
                                                    true,
                                                );
                                            }}
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Reverse Payment
                                        </Button>
                                    )}

                                {Number(
                                    payment.active_allocation_count ||
                                        0,
                                ) === 0 &&
                                    permission[
                                        "payments.soft_delete"
                                    ] && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            disabled={
                                                archivePayment.isPending
                                            }
                                            onClick={() =>
                                                archivePayment.mutate(
                                                    paymentId,
                                                )
                                            }
                                        >
                                            {archivePayment.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Archive className="mr-2 h-4 w-4" />
                                            )}

                                            Archive Payment
                                        </Button>
                                    )}

                                {Number(
                                    payment.active_allocation_count ||
                                        0,
                                ) > 0 && (
                                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                                        Payments with active
                                        allocations cannot be
                                        archived. Reverse the
                                        Payment first.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            {mode === "list" && renderList()}

            {mode === "form" && renderForm()}

            {mode === "detail" && renderDetail()}

            <Dialog
                open={showReverseDialog}
                onOpenChange={setShowReverseDialog}
            >
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Reverse Customer Payment
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            <AlertTriangle className="mr-2 inline h-4 w-4" />
                            Reversing a Payment also reverses its
                            active Invoice allocations and
                            recalculates the affected Invoice
                            balances.
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Reversal Reason{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Textarea
                                className={TEXTAREA_CLASS}
                                value={reversalReason}
                                onChange={(event) =>
                                    setReversalReason(
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter the required reason for reversing this Payment"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() =>
                                    setShowReverseDialog(
                                        false,
                                    )
                                }
                            >
                                Close
                            </Button>

                            <Button
                                className={RED_BUTTON}
                                disabled={
                                    !reversalReason.trim() ||
                                    reversePayment.isPending ||
                                    !selectedId
                                }
                                onClick={() => {
                                    if (!selectedId) {
                                        return;
                                    }

                                    reversePayment.mutate(
                                        selectedId,
                                    );
                                }}
                            >
                                {reversePayment.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                )}

                                Confirm Reversal
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Payments;