import { useMemo, useState } from "react";
import {
    Building2,
    Download,
    FileSpreadsheet,
    FileText,
    Mail,
    Phone,
    Plus,
    Printer,
    Search,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import { StandardActions } from "@/components/common/StandardActions";
import { toast } from "sonner";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierInsert = Database["public"]["Tables"]["suppliers"]["Insert"];
type SupplierUpdate = Database["public"]["Tables"]["suppliers"]["Update"];
type SupplierContactRow =
    Database["public"]["Tables"]["supplier_contacts"]["Row"];
type SupplierAddressRow =
    Database["public"]["Tables"]["supplier_addresses"]["Row"];
type SupplierContactInsert =
    Database["public"]["Tables"]["supplier_contacts"]["Insert"];

type SupplierAddressInsert =
    Database["public"]["Tables"]["supplier_addresses"]["Insert"];

type SupplierListRow = SupplierRow & {
    supplier_contacts: SupplierContactRow[] | null;
    supplier_addresses: SupplierAddressRow[] | null;
};

type SupplierTypeFilter = "all" | string;
type StatusFilter = "all" | "active" | "inactive";
type XeroFilter = "all" | "synced" | "not-synced" | "error";
type FormMode = "add" | "edit";
type SupplierContactDraft = {
    contact_id: string | null;
    contact_name: string;
    contact_type: string;
    position: string;
    phone: string;
    mobile: string;
    email: string;
    notes: string;
    is_primary: boolean;
    is_active: boolean;
};

type SupplierAddressDraft = {
    address_id: string | null;
    address_type: string;
    address_line1: string;
    address_line2: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    notes: string;
    is_primary: boolean;
    is_active: boolean;
};

const createEmptyContact = (
    isPrimary = false
): SupplierContactDraft => ({
    contact_id: null,
    contact_name: "",
    contact_type: "General",
    position: "",
    phone: "",
    mobile: "",
    email: "",
    notes: "",
    is_primary: isPrimary,
    is_active: true,
});

const createEmptyAddress = (
    isPrimary = false
): SupplierAddressDraft => ({
    address_id: null,
    address_type: "Business",
    address_line1: "",
    address_line2: "",
    suburb: "",
    state: "",
    postcode: "",
    country: "Australia",
    notes: "",
    is_primary: isPrimary,
    is_active: true,
});

const supplierSelect = `
  supplier_id,
  supplier_code,
  supplier_name,
  legal_name,
  supplier_type,
  abn,
  phone,
  email,
  website,
  payment_terms_days,
  payment_terms_type,
  default_currency,
  default_tax_type,
  default_expense_account_code,
  delivery_lead_days,
  minimum_order_value,
  freight_notes,
  notes,
  xero_contact_id,
  xero_contact_name,
  xero_contact_number,
  xero_last_synced_at,
  xero_status,
  xero_sync_error,
  is_active,
  is_deleted,
  created_at,
  supplier_contacts (
    contact_id,
    supplier_id,
    contact_name,
    contact_type,
    position,
    phone,
    mobile,
    email,
    notes,
    is_primary,
    is_active,
    is_deleted,
    created_at,
    created_by,
    updated_at,
    updated_by,
    deleted_at
  ),
  supplier_addresses (
    address_id,
    supplier_id,
    address_type,
    address_line1,
    address_line2,
    suburb,
    state,
    postcode,
    country,
    notes,
    is_primary,
    is_active,
    is_deleted,
    created_at,
    created_by,
    updated_at,
    updated_by,
    deleted_at
  )
`;

const Suppliers = () => {
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<SupplierTypeFilter>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [xeroFilter, setXeroFilter] = useState<XeroFilter>("all");

    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewingSupplier, setViewingSupplier] =
        useState<SupplierListRow | null>(null);

    const [showFormDialog, setShowFormDialog] = useState(false);
    const [formMode, setFormMode] = useState<FormMode>("add");
    const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

    const [supplierName, setSupplierName] = useState("");
    const [legalName, setLegalName] = useState("");
    const [supplierType, setSupplierType] = useState("Material");
    const [abn, setAbn] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [paymentTermsDays, setPaymentTermsDays] = useState("30");
    const [paymentTermsType, setPaymentTermsType] = useState("Days After Bill");
    const [defaultCurrency, setDefaultCurrency] = useState("AUD");
    const [defaultTaxType, setDefaultTaxType] = useState("");
    const [defaultExpenseAccountCode, setDefaultExpenseAccountCode] = useState("");
    const [deliveryLeadDays, setDeliveryLeadDays] = useState("");
    const [minimumOrderValue, setMinimumOrderValue] = useState("");
    const [freightNotes, setFreightNotes] = useState("");
    const [notes, setNotes] = useState("");
    const [xeroContactId, setXeroContactId] = useState("");
    const [xeroContactName, setXeroContactName] = useState("");
    const [xeroContactNumber, setXeroContactNumber] = useState("");
    const [xeroStatus, setXeroStatus] = useState("Not Connected");
    const [isActive, setIsActive] = useState(true);
    const [supplierContacts, setSupplierContacts] = useState<
        SupplierContactDraft[]
    >([createEmptyContact(true)]);

    const [supplierAddresses, setSupplierAddresses] = useState<
        SupplierAddressDraft[]
    >([createEmptyAddress(true)]);

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("suppliers")
                .select(supplierSelect)
                .eq("is_deleted", false)
                .eq("supplier_contacts.is_deleted", false)
                .eq("supplier_addresses.is_deleted", false)
                .order("supplier_name", { ascending: true });

            if (error) throw error;
            return data as SupplierListRow[];
        },
    });

    const supplierTypes = useMemo(() => {
        return Array.from(
            new Set(
                suppliers
                    .map((supplier) => supplier.supplier_type)
                    .filter((value): value is string => Boolean(value))
            )
        ).sort((a, b) => a.localeCompare(b));
    }, [suppliers]);

    const summary = useMemo(() => {
        return {
            total: suppliers.length,
            active: suppliers.filter((supplier) => supplier.is_active).length,
            inactive: suppliers.filter((supplier) => !supplier.is_active).length,
            xeroSynced: suppliers.filter((supplier) =>
                supplier.xero_status.toLowerCase().includes("sync") &&
                !supplier.xero_status.toLowerCase().includes("not")
            ).length,
        };
    }, [suppliers]);

    const filteredSuppliers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return suppliers.filter((supplier) => {
            const matchesType =
                typeFilter === "all" || supplier.supplier_type === typeFilter;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && supplier.is_active) ||
                (statusFilter === "inactive" && !supplier.is_active);

            const xeroStatusText = supplier.xero_status.toLowerCase();
            const matchesXero =
                xeroFilter === "all" ||
                (xeroFilter === "synced" &&
                    xeroStatusText.includes("sync") &&
                    !xeroStatusText.includes("not") &&
                    !xeroStatusText.includes("error")) ||
                (xeroFilter === "not-synced" &&
                    (xeroStatusText.includes("not") || !supplier.xero_contact_id)) ||
                (xeroFilter === "error" &&
                    (xeroStatusText.includes("error") || Boolean(supplier.xero_sync_error)));

            const primaryContact =
                supplier.supplier_contacts?.find((contact) => contact.is_primary) ||
                supplier.supplier_contacts?.[0];

            const matchesKeyword =
                !keyword ||
                supplier.supplier_code.toLowerCase().includes(keyword) ||
                supplier.supplier_name.toLowerCase().includes(keyword) ||
                (supplier.legal_name || "").toLowerCase().includes(keyword) ||
                supplier.supplier_type.toLowerCase().includes(keyword) ||
                (supplier.abn || "").toLowerCase().includes(keyword) ||
                (supplier.phone || "").toLowerCase().includes(keyword) ||
                (supplier.email || "").toLowerCase().includes(keyword) ||
                (supplier.xero_contact_name || "").toLowerCase().includes(keyword) ||
                (primaryContact?.contact_name || "").toLowerCase().includes(keyword);

            return matchesType && matchesStatus && matchesXero && matchesKeyword;
        });
    }, [suppliers, searchTerm, typeFilter, statusFilter, xeroFilter]);

    const resetForm = () => {
        setSupplierName("");
        setLegalName("");
        setSupplierType("Material");
        setAbn("");
        setPhone("");
        setEmail("");
        setWebsite("");
        setPaymentTermsDays("30");
        setPaymentTermsType("Days After Bill");
        setDefaultCurrency("AUD");
        setDefaultTaxType("");
        setDefaultExpenseAccountCode("");
        setDeliveryLeadDays("");
        setMinimumOrderValue("");
        setFreightNotes("");
        setNotes("");
        setXeroContactId("");
        setXeroContactName("");
        setXeroContactNumber("");
        setXeroStatus("Not Connected");
        setIsActive(true);
        setSupplierContacts([createEmptyContact(true)]);
        setSupplierAddresses([createEmptyAddress(true)]);
        setEditingSupplierId(null);
    };

    const updateSupplierContact = (
        index: number,
        field: keyof SupplierContactDraft,
        value: string | boolean
    ) => {
        setSupplierContacts((currentContacts) =>
            currentContacts.map((contact, contactIndex) =>
                contactIndex === index
                    ? {
                        ...contact,
                        [field]: value,
                    }
                    : contact
            )
        );
    };

    const addSupplierContact = () => {
        setSupplierContacts((currentContacts) => [
            ...currentContacts,
            createEmptyContact(currentContacts.length === 0),
        ]);
    };

    const removeSupplierContact = (index: number) => {
        setSupplierContacts((currentContacts) => {
            if (currentContacts.length === 1) {
                return [createEmptyContact(true)];
            }

            const removedContact = currentContacts[index];
            const remainingContacts = currentContacts.filter(
                (_, contactIndex) => contactIndex !== index
            );

            if (
                removedContact?.is_primary &&
                remainingContacts.length > 0 &&
                !remainingContacts.some((contact) => contact.is_primary)
            ) {
                return remainingContacts.map((contact, contactIndex) => ({
                    ...contact,
                    is_primary: contactIndex === 0,
                }));
            }

            return remainingContacts;
        });
    };

    const setPrimarySupplierContact = (index: number) => {
        setSupplierContacts((currentContacts) =>
            currentContacts.map((contact, contactIndex) => ({
                ...contact,
                is_primary: contactIndex === index,
            }))
        );
    };

    const updateSupplierAddress = (
        index: number,
        field: keyof SupplierAddressDraft,
        value: string | boolean
    ) => {
        setSupplierAddresses((currentAddresses) =>
            currentAddresses.map((address, addressIndex) =>
                addressIndex === index
                    ? {
                        ...address,
                        [field]: value,
                    }
                    : address
            )
        );
    };

    const addSupplierAddress = () => {
        setSupplierAddresses((currentAddresses) => [
            ...currentAddresses,
            createEmptyAddress(currentAddresses.length === 0),
        ]);
    };

    const removeSupplierAddress = (index: number) => {
        setSupplierAddresses((currentAddresses) => {
            if (currentAddresses.length === 1) {
                return [createEmptyAddress(true)];
            }

            const removedAddress = currentAddresses[index];
            const remainingAddresses = currentAddresses.filter(
                (_, addressIndex) => addressIndex !== index
            );

            if (
                removedAddress?.is_primary &&
                remainingAddresses.length > 0 &&
                !remainingAddresses.some((address) => address.is_primary)
            ) {
                return remainingAddresses.map((address, addressIndex) => ({
                    ...address,
                    is_primary: addressIndex === 0,
                }));
            }

            return remainingAddresses;
        });
    };

    const setPrimarySupplierAddress = (index: number) => {
        setSupplierAddresses((currentAddresses) =>
            currentAddresses.map((address, addressIndex) => ({
                ...address,
                is_primary: addressIndex === index,
            }))
        );
    };

    const openAddSupplier = () => {
        resetForm();
        setFormMode("add");
        setShowFormDialog(true);
    };

    const openEditSupplier = (supplier: SupplierListRow) => {
        setFormMode("edit");
        setEditingSupplierId(supplier.supplier_id);
        setSupplierName(supplier.supplier_name);
        setLegalName(supplier.legal_name || "");
        setSupplierType(supplier.supplier_type);
        setAbn(supplier.abn || "");
        setPhone(supplier.phone || "");
        setEmail(supplier.email || "");
        setWebsite(supplier.website || "");
        setPaymentTermsDays(String(supplier.payment_terms_days));
        setPaymentTermsType(supplier.payment_terms_type);
        setDefaultCurrency(supplier.default_currency);
        setDefaultTaxType(supplier.default_tax_type || "");
        setDefaultExpenseAccountCode(supplier.default_expense_account_code || "");
        setDeliveryLeadDays(
            supplier.delivery_lead_days === null ? "" : String(supplier.delivery_lead_days)
        );
        setMinimumOrderValue(
            supplier.minimum_order_value === null
                ? ""
                : String(supplier.minimum_order_value)
        );
        setFreightNotes(supplier.freight_notes || "");
        setNotes(supplier.notes || "");
        setXeroContactId(supplier.xero_contact_id || "");
        setXeroContactName(supplier.xero_contact_name || "");
        setXeroContactNumber(supplier.xero_contact_number || "");
        setXeroStatus(supplier.xero_status);
        setIsActive(supplier.is_active);

        setSupplierContacts(
            supplier.supplier_contacts?.length
                ? supplier.supplier_contacts.map((contact) => ({
                    contact_id: contact.contact_id,
                    contact_name: contact.contact_name,
                    contact_type: contact.contact_type,
                    position: contact.position || "",
                    phone: contact.phone || "",
                    mobile: contact.mobile || "",
                    email: contact.email || "",
                    notes: contact.notes || "",
                    is_primary: contact.is_primary,
                    is_active: contact.is_active,
                }))
                : [createEmptyContact(true)]
        );

        setSupplierAddresses(
            supplier.supplier_addresses?.length
                ? supplier.supplier_addresses.map((address) => ({
                    address_id: address.address_id,
                    address_type: address.address_type,
                    address_line1: address.address_line1,
                    address_line2: address.address_line2 || "",
                    suburb: address.suburb || "",
                    state: address.state || "",
                    postcode: address.postcode || "",
                    country: address.country,
                    notes: address.notes || "",
                    is_primary: address.is_primary,
                    is_active: address.is_active,
                }))
                : [createEmptyAddress(true)]
        );

        setShowFormDialog(true);
    };

    const buildSupplierPayload = (): SupplierInsert => {
        if (!supplierName.trim()) throw new Error("Supplier name is required.");
        if (email.trim() && !email.trim().includes("@")) {
            throw new Error("Please enter a valid email address.");
        }

        const parsedPaymentTermsDays = Number(paymentTermsDays || 0);
        const parsedDeliveryLeadDays = deliveryLeadDays
            ? Number(deliveryLeadDays)
            : null;
        const parsedMinimumOrderValue = minimumOrderValue
            ? Number(minimumOrderValue)
            : null;

        if (parsedPaymentTermsDays < 0) {
            throw new Error("Payment terms days cannot be negative.");
        }

        return {
            supplier_name: supplierName.trim(),
            legal_name: legalName.trim() || null,
            supplier_type: supplierType,
            abn: abn.trim() || null,
            phone: phone.trim() || null,
            email: email.trim() || null,
            website: website.trim() || null,
            payment_terms_days: parsedPaymentTermsDays,
            payment_terms_type: paymentTermsType,
            default_currency: defaultCurrency,
            default_tax_type: defaultTaxType.trim() || null,
            default_expense_account_code:
                defaultExpenseAccountCode.trim() || null,
            delivery_lead_days: parsedDeliveryLeadDays,
            minimum_order_value: parsedMinimumOrderValue,
            freight_notes: freightNotes.trim() || null,
            notes: notes.trim() || null,
            xero_contact_id: xeroContactId.trim() || null,
            xero_contact_name: xeroContactName.trim() || null,
            xero_contact_number: xeroContactNumber.trim() || null,
            xero_status: xeroStatus,
            is_active: isActive,
            is_deleted: false,
        };
    };

    const saveSupplier = useMutation({
        mutationFn: async () => {
            const payload = buildSupplierPayload();

            if (formMode === "add") {
                const validContacts = supplierContacts.filter(
                    (contact) => contact.contact_name.trim().length > 0
                );

                const validAddresses = supplierAddresses.filter(
                    (address) => address.address_line1.trim().length > 0
                );

                const invalidContactEmail = validContacts.find(
                    (contact) =>
                        contact.email.trim() &&
                        !contact.email.trim().includes("@")
                );

                if (invalidContactEmail) {
                    throw new Error(
                        `Please enter a valid email address for ${invalidContactEmail.contact_name}.`
                    );
                }

                const { data: createdSupplier, error: supplierError } = await supabase
                    .from("suppliers")
                    .insert(payload)
                    .select("supplier_id")
                    .single();

                if (supplierError) throw supplierError;

                if (!createdSupplier?.supplier_id) {
                    throw new Error(
                        "Supplier was created but supplier ID was not returned."
                    );
                }

                const supplierId = createdSupplier.supplier_id;

                if (validContacts.length > 0) {
                    const contactRows: SupplierContactInsert[] =
                        validContacts.map((contact, index) => ({
                            supplier_id: supplierId,
                            contact_name: contact.contact_name.trim(),
                            contact_type: contact.contact_type,
                            position: contact.position.trim() || null,
                            phone: contact.phone.trim() || null,
                            mobile: contact.mobile.trim() || null,
                            email: contact.email.trim() || null,
                            notes: contact.notes.trim() || null,
                            is_primary:
                                validContacts.some((item) => item.is_primary)
                                    ? contact.is_primary
                                    : index === 0,
                            is_active: contact.is_active,
                            is_deleted: false,
                        }));

                    const { error: contactsError } = await supabase
                        .from("supplier_contacts")
                        .insert(contactRows);

                    if (contactsError) throw contactsError;
                }

                if (validAddresses.length > 0) {
                    const addressRows: SupplierAddressInsert[] =
                        validAddresses.map((address, index) => ({
                            supplier_id: supplierId,
                            address_type: address.address_type,
                            address_line1: address.address_line1.trim(),
                            address_line2: address.address_line2.trim() || null,
                            suburb: address.suburb.trim() || null,
                            state: address.state.trim() || null,
                            postcode: address.postcode.trim() || null,
                            country: address.country.trim() || "Australia",
                            notes: address.notes.trim() || null,
                            is_primary:
                                validAddresses.some((item) => item.is_primary)
                                    ? address.is_primary
                                    : index === 0,
                            is_active: address.is_active,
                            is_deleted: false,
                        }));

                    const { error: addressesError } = await supabase
                        .from("supplier_addresses")
                        .insert(addressRows);

                    if (addressesError) throw addressesError;
                }

                return;
            }

            if (!editingSupplierId) {
                throw new Error("No supplier selected for editing.");
            }

            const updatePayload: SupplierUpdate = payload;
            const { error } = await supabase
                .from("suppliers")
                .update(updatePayload)
                .eq("supplier_id", editingSupplierId)
                .eq("is_deleted", false);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(
                formMode === "add"
                    ? "Supplier created successfully."
                    : "Supplier updated successfully."
            );
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            setShowFormDialog(false);
            resetForm();
        },
        onError: (error) => toast.error(error.message),
    });

    const toggleSupplierActive = useMutation({
        mutationFn: async ({ supplierId, nextActive }: { supplierId: string; nextActive: boolean }) => {
            const { error } = await supabase
                .from("suppliers")
                .update({ is_active: nextActive })
                .eq("supplier_id", supplierId)
                .eq("is_deleted", false);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            toast.success(
                variables.nextActive
                    ? "Supplier reactivated successfully."
                    : "Supplier marked inactive successfully."
            );
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteSupplier = useMutation({
        mutationFn: async (supplierId: string) => {
            const deletedAt = new Date().toISOString();
            const { error } = await supabase
                .from("suppliers")
                .update({ is_active: false, is_deleted: true, deleted_at: deletedAt })
                .eq("supplier_id", supplierId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Supplier deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const exportRows = useMemo(
        () =>
            filteredSuppliers.map((supplier) => ({
                Code: supplier.supplier_code,
                Supplier: supplier.supplier_name,
                "Legal Name": supplier.legal_name || "",
                Type: supplier.supplier_type,
                ABN: supplier.abn || "",
                Phone: supplier.phone || "",
                Email: supplier.email || "",
                "Payment Terms": `${supplier.payment_terms_days} ${supplier.payment_terms_type}`,
                Currency: supplier.default_currency,
                "Lead Days": String(supplier.delivery_lead_days ?? ""),
                "Minimum Order": String(supplier.minimum_order_value ?? ""),
                "Xero Status": supplier.xero_status,
                Status: supplier.is_active ? "Active" : "Inactive",
            })),
        [filteredSuppliers]
    );

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const escapeHtml = (value: string) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleExportCsv = () => {
        if (!exportRows.length) return toast.error("No suppliers to export.");
        const headers = Object.keys(exportRows[0]);
        const content = [
            headers.map(escapeCsv).join(","),
            ...exportRows.map((row) =>
                headers
                    .map((header) => escapeCsv(String(row[header as keyof typeof row])))
                    .join(",")
            ),
        ].join("\n");
        downloadFile(`\uFEFF${content}`, "suppliers.csv", "text/csv;charset=utf-8;");
    };

    const handleExportExcel = () => {
        if (!exportRows.length) return toast.error("No suppliers to export.");
        const headers = Object.keys(exportRows[0]);
        const html = `<table border="1"><thead><tr>${headers
            .map((header) => `<th>${escapeHtml(header)}</th>`)
            .join("")}</tr></thead><tbody>${exportRows
                .map(
                    (row) =>
                        `<tr>${headers
                            .map(
                                (header) =>
                                    `<td>${escapeHtml(String(row[header as keyof typeof row]))}</td>`
                            )
                            .join("")}</tr>`
                )
                .join("")}</tbody></table>`;
        downloadFile(html, "suppliers.xls", "application/vnd.ms-excel;charset=utf-8;");
    };

    const handlePrint = (mode: "print" | "pdf") => {
        if (!exportRows.length) return toast.error("No suppliers to print.");
        const printWindow = window.open("", "_blank");
        if (!printWindow) return toast.error("Unable to open print window.");
        const headers = Object.keys(exportRows[0]);
        printWindow.document.write(`
      <html><head><title>REDS Suppliers</title><style>
      @page{size:A4 landscape;margin:12mm}body{font-family:Arial;color:#0f172a}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}th{background:#f1f5f9}h1{margin-bottom:4px}p{color:#64748b;font-size:11px}
      </style></head><body><h1>REDS Suppliers</h1><p>Generated ${escapeHtml(
            new Date().toLocaleString("en-AU")
        )} | Records ${exportRows.length}</p><table><thead><tr>${headers
            .map((header) => `<th>${escapeHtml(header)}</th>`)
            .join("")}</tr></thead><tbody>${exportRows
                .map(
                    (row) =>
                        `<tr>${headers
                            .map(
                                (header) =>
                                    `<td>${escapeHtml(String(row[header as keyof typeof row]))}</td>`
                            )
                            .join("")}</tr>`
                )
                .join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>
    `);
        printWindow.document.close();
        if (mode === "pdf") toast.info("Choose Save as PDF in the print dialog.");
    };

    const getPrimaryContact = (supplier: SupplierListRow) =>
        supplier.supplier_contacts?.find((contact) => contact.is_primary) ||
        supplier.supplier_contacts?.[0] ||
        null;

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Supplier master data, purchasing defaults and Xero mapping.
                    </p>
                </div>
                <Button onClick={openAddSupplier} className="h-11 gap-2 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700">
                    <Plus className="h-4 w-4" /> Add Supplier
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    ["Total Suppliers", summary.total],
                    ["Active", summary.active],
                    ["Inactive", summary.inactive],
                    ["Xero Synced", summary.xeroSynced],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_170px_180px_auto]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search supplier, code, ABN, contact or Xero..." className="h-10 pl-9" />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger><SelectValue placeholder="Supplier type" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Types</SelectItem>{supplierTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active Only</SelectItem><SelectItem value="inactive">Inactive Only</SelectItem></SelectContent>
                    </Select>
                    <Select value={xeroFilter} onValueChange={(value) => setXeroFilter(value as XeroFilter)}>
                        <SelectTrigger><SelectValue placeholder="Xero status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Xero Status</SelectItem><SelectItem value="synced">Synced</SelectItem><SelectItem value="not-synced">Not Synced</SelectItem><SelectItem value="error">Sync Error</SelectItem></SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
                        <Button variant="outline" onClick={() => handlePrint("print")} className="gap-2"><Printer className="h-4 w-4" />Print</Button>
                        <Button variant="outline" onClick={() => handlePrint("pdf")} className="gap-2"><FileText className="h-4 w-4" />PDF</Button>
                        <Button variant="outline" onClick={handleExportCsv} className="gap-2"><Download className="h-4 w-4" />CSV</Button>
                        <Button variant="outline" onClick={handleExportExcel} className="gap-2"><FileSpreadsheet className="h-4 w-4" />Excel</Button>
                    </div>
                </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="grid grid-cols-12 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <div className="col-span-3">Supplier</div><div className="col-span-2">Contact</div><div className="col-span-2">Purchasing</div><div className="col-span-2">Xero</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Actions</div>
                </div>
                {isLoading ? <div className="p-8 text-center text-slate-500">Loading suppliers...</div> : filteredSuppliers.length === 0 ? <div className="p-8 text-center text-slate-500">No suppliers found.</div> : filteredSuppliers.map((supplier) => {
                    const contact = getPrimaryContact(supplier);
                    return <div key={supplier.supplier_id} className="grid grid-cols-12 border-b px-4 py-4 last:border-0 hover:bg-slate-50">
                        <div className="col-span-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-red-50 p-2 text-red-600"><Building2 className="h-5 w-5" /></div><div><p className="font-bold text-slate-900">{supplier.supplier_name}</p><p className="text-xs text-slate-500">{supplier.supplier_code} · {supplier.supplier_type}</p><p className="mt-1 text-xs text-slate-500">ABN: {supplier.abn || "-"}</p></div></div></div>
                        <div className="col-span-2 text-sm"><p className="font-medium">{contact?.contact_name || "-"}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" />{contact?.phone || supplier.phone || "-"}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" />{contact?.email || supplier.email || "-"}</p></div>
                        <div className="col-span-2 text-sm"><p>{supplier.payment_terms_days} {supplier.payment_terms_type}</p><p className="text-xs text-slate-500">{supplier.default_currency} · Lead {supplier.delivery_lead_days ?? 0} days</p><p className="text-xs text-slate-500">Min. order {supplier.minimum_order_value === null ? "-" : supplier.minimum_order_value.toLocaleString("en-AU", { style: "currency", currency: supplier.default_currency })}</p></div>
                        <div className="col-span-2 text-sm"><p className="font-medium">{supplier.xero_status}</p><p className="text-xs text-slate-500">{supplier.xero_contact_name || "Not mapped"}</p><p className="text-xs text-slate-500">{supplier.xero_last_synced_at ? new Date(supplier.xero_last_synced_at).toLocaleString("en-AU") : "Never synced"}</p></div>
                        <div className="col-span-1"><ActiveStatusBadge isActive={supplier.is_active} /></div>
                        <div className="col-span-2"><StandardActions isActive={supplier.is_active} onView={() => { setViewingSupplier(supplier); setShowViewDialog(true); }} onEdit={() => openEditSupplier(supplier)} onToggleActive={() => toggleSupplierActive.mutate({ supplierId: supplier.supplier_id, nextActive: !supplier.is_active })} onDelete={() => { if (window.confirm(`Delete supplier: ${supplier.supplier_name}?`)) deleteSupplier.mutate(supplier.supplier_id); }} isStatusPending={toggleSupplierActive.isPending} isDeletePending={deleteSupplier.isPending} size="desktop" align="end" /></div>
                    </div>;
                })}
            </div>

            <div className="space-y-3 lg:hidden">
                {filteredSuppliers.map((supplier) => {
                    const contact = getPrimaryContact(supplier);
                    return <div key={supplier.supplier_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-red-600">{supplier.supplier_code}</p><h2 className="mt-1 text-base font-bold text-slate-900">{supplier.supplier_name}</h2><p className="text-xs text-slate-500">{supplier.supplier_type}</p></div><ActiveStatusBadge isActive={supplier.is_active} /></div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Primary Contact</p><p className="font-medium">{contact?.contact_name || "-"}</p></div><div><p className="text-xs text-slate-500">Xero</p><p className="font-medium">{supplier.xero_status}</p></div><div><p className="text-xs text-slate-500">Phone</p><p>{contact?.phone || supplier.phone || "-"}</p></div><div><p className="text-xs text-slate-500">Payment Terms</p><p>{supplier.payment_terms_days} days</p></div></div>
                        <div className="mt-4 border-t pt-4"><StandardActions isActive={supplier.is_active} onView={() => { setViewingSupplier(supplier); setShowViewDialog(true); }} onEdit={() => openEditSupplier(supplier)} onToggleActive={() => toggleSupplierActive.mutate({ supplierId: supplier.supplier_id, nextActive: !supplier.is_active })} onDelete={() => { if (window.confirm(`Delete supplier: ${supplier.supplier_name}?`)) deleteSupplier.mutate(supplier.supplier_id); }} isStatusPending={toggleSupplierActive.isPending} isDeletePending={deleteSupplier.isPending} size="mobile" /></div>
                    </div>;
                })}
            </div>

            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Supplier Details</DialogTitle></DialogHeader>{viewingSupplier && <div className="space-y-5">
                    <div className="rounded-2xl border bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-red-600">{viewingSupplier.supplier_code}</p><h2 className="text-xl font-bold">{viewingSupplier.supplier_name}</h2><p className="text-sm text-slate-500">{viewingSupplier.legal_name || "No separate legal name"}</p></div><ActiveStatusBadge isActive={viewingSupplier.is_active} /></div></div>

                    <div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border p-4">
                        <h3 className="font-bold">Supplier Information</h3>
                        <div className="mt-3 space-y-2 text-sm">
                            <p><span className="text-slate-500">Type:</span> {viewingSupplier.supplier_type}</p>
                            <p><span className="text-slate-500">ABN:</span> {viewingSupplier.abn || "-"}</p>
                            <p><span className="text-slate-500">Phone:</span> {viewingSupplier.phone || "-"}</p>
                            <p><span className="text-slate-500">Email:</span> {viewingSupplier.email || "-"}</p>
                            <p><span className="text-slate-500">Website:</span> {viewingSupplier.website || "-"}</p>
                        </div>
                    </section>

                        <section className="rounded-2xl border p-4">
                            <h3 className="font-bold">Purchasing Defaults</h3>
                            <div className="mt-3 space-y-2 text-sm">
                                <p>Terms: {viewingSupplier.payment_terms_days} {viewingSupplier.payment_terms_type}</p>
                                <p>Currency: {viewingSupplier.default_currency}</p>
                                <p>Tax: {viewingSupplier.default_tax_type || "-"}</p>
                                <p>Expense Account: {viewingSupplier.default_expense_account_code || "-"}</p>
                                <p>Lead Time: {viewingSupplier.delivery_lead_days ?? 0} days</p>
                            </div>
                        </section>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <section className="rounded-2xl border p-4">
                            <h3 className="font-bold">Contacts ({viewingSupplier.supplier_contacts?.length || 0})</h3>
                            <div className="mt-3 space-y-3">
                                {viewingSupplier.supplier_contacts?.length ? viewingSupplier.supplier_contacts.map((contact) =>
                                    <div key={contact.contact_id} className="rounded-xl bg-slate-50 p-3 text-sm">
                                        <p className="font-bold">{contact.contact_name}{contact.is_primary ? " · Primary" : ""}</p>
                                        <p className="text-slate-500">{contact.position || contact.contact_type}</p>
                                        <p>{contact.phone || contact.mobile || "-"}</p>
                                        <p>{contact.email || "-"}</p>
                                    </div>) : <p className="text-sm text-slate-500">
                                    No contacts recorded.</p>}
                            </div>
                        </section>
                        <section className="rounded-2xl border p-4">
                            <h3 className="font-bold">Addresses ({viewingSupplier.supplier_addresses?.length || 0})</h3>
                            <div className="mt-3 space-y-3">
                                {viewingSupplier.supplier_addresses?.length ? viewingSupplier.supplier_addresses.map((address) =>
                                    <div key={address.address_id} className="rounded-xl bg-slate-50 p-3 text-sm">
                                        <p className="font-bold">{address.address_type}{address.is_primary ? " · Primary" : ""}</p>
                                        <p>{[address.address_line1, address.address_line2, address.suburb, address.state, address.postcode, address.country].filter(Boolean).join(", ")}</p></div>) : <p className="text-sm text-slate-500">No addresses recorded.</p>}</div></section></div>
                    <section className="rounded-2xl border p-4"><h3 className="font-bold">Xero Mapping</h3><div className="mt-3 grid gap-2 text-sm md:grid-cols-2"><p>Status: {viewingSupplier.xero_status}</p><p>Contact ID: {viewingSupplier.xero_contact_id || "-"}</p><p>Contact Name: {viewingSupplier.xero_contact_name || "-"}</p><p>Contact Number: {viewingSupplier.xero_contact_number || "-"}</p></div>{viewingSupplier.xero_sync_error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{viewingSupplier.xero_sync_error}</p>}</section>
                </div>}</DialogContent>
            </Dialog>

            <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{formMode === "add" ? "Add Supplier" : "Edit Supplier"}</DialogTitle></DialogHeader><div className="space-y-6">
                    <section className="rounded-2xl border p-4"><h3 className="font-bold">Supplier Details</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><div><Label>Supplier Name *</Label><Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} /></div><div><Label>Legal Name</Label><Input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></div><div><Label>Supplier Type</Label><Input value={supplierType} onChange={(e) => setSupplierType(e.target.value)} /></div><div><Label>ABN</Label><Input value={abn} onChange={(e) => setAbn(e.target.value)} /></div><div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div><div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="md:col-span-2"><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div></div></section>
                    <section className="rounded-2xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-bold">Supplier Contacts</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Add purchasing, accounts and delivery contacts for this supplier.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addSupplierContact}
                                className="h-10 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Contact
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {supplierContacts.map((contact, index) => (
                                <div
                                    key={contact.contact_id ?? `new-contact-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                Contact {index + 1}
                                            </p>

                                            {contact.is_primary && (
                                                <p className="mt-1 text-xs font-semibold text-red-600">
                                                    Primary Contact
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {!contact.is_primary && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPrimarySupplierContact(index)}
                                                >
                                                    Set as Primary
                                                </Button>
                                            )}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSupplierContact(index)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Contact Name *</Label>
                                            <Input
                                                value={contact.contact_name}
                                                onChange={(event) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "contact_name",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Full name"
                                            />
                                        </div>

                                        <div>
                                            <Label>Contact Type</Label>
                                            <Select
                                                value={contact.contact_type}
                                                onValueChange={(value) =>
                                                    updateSupplierContact(index, "contact_type", value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="General">General</SelectItem>
                                                    <SelectItem value="Purchasing">Purchasing</SelectItem>
                                                    <SelectItem value="Accounts">Accounts</SelectItem>
                                                    <SelectItem value="Delivery">Delivery</SelectItem>
                                                    <SelectItem value="Sales">Sales</SelectItem>
                                                    <SelectItem value="Management">Management</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Position</Label>
                                            <Input
                                                value={contact.position}
                                                onChange={(event) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "position",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Position or job title"
                                            />
                                        </div>

                                        <div>
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={contact.email}
                                                onChange={(event) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "email",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="name@example.com"
                                            />
                                        </div>

                                        <div>
                                            <Label>Phone</Label>
                                            <Input
                                                value={contact.phone}
                                                onChange={(event) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "phone",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Office phone"
                                            />
                                        </div>

                                        <div>
                                            <Label>Mobile</Label>
                                            <Input
                                                value={contact.mobile}
                                                onChange={(event) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "mobile",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Mobile number"
                                            />
                                        </div>

                                        <div>
                                            <Label>Status</Label>
                                            <Select
                                                value={contact.is_active ? "active" : "inactive"}
                                                onValueChange={(value) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "is_active",
                                                        value === "active"
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label>Contact Notes</Label>
                                            <Textarea
                                                value={contact.notes}
                                                onChange={(event) =>
                                                    updateSupplierContact(
                                                        index,
                                                        "notes",
                                                        event.target.value
                                                    )
                                                }
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-bold">Supplier Addresses</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Add business, billing, warehouse or delivery addresses.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addSupplierAddress}
                                className="h-10 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Address
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {supplierAddresses.map((address, index) => (
                                <div
                                    key={address.address_id ?? `new-address-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                Address {index + 1}
                                            </p>

                                            {address.is_primary && (
                                                <p className="mt-1 text-xs font-semibold text-red-600">
                                                    Primary Address
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {!address.is_primary && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPrimarySupplierAddress(index)}
                                                >
                                                    Set as Primary
                                                </Button>
                                            )}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSupplierAddress(index)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Address Type</Label>
                                            <Select
                                                value={address.address_type}
                                                onValueChange={(value) =>
                                                    updateSupplierAddress(index, "address_type", value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="Business">Business</SelectItem>
                                                    <SelectItem value="Billing">Billing</SelectItem>
                                                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                                                    <SelectItem value="Delivery">Delivery</SelectItem>
                                                    <SelectItem value="Postal">Postal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Status</Label>
                                            <Select
                                                value={address.is_active ? "active" : "inactive"}
                                                onValueChange={(value) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "is_active",
                                                        value === "active"
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label>Address Line 1 *</Label>
                                            <Input
                                                value={address.address_line1}
                                                onChange={(event) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "address_line1",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label>Address Line 2</Label>
                                            <Input
                                                value={address.address_line2}
                                                onChange={(event) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "address_line2",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Suburb</Label>
                                            <Input
                                                value={address.suburb}
                                                onChange={(event) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "suburb",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>State</Label>
                                            <Select
                                                value={address.state || "not-set"}
                                                onValueChange={(value) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "state",
                                                        value === "not-set" ? "" : value
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select state" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="not-set">Not set</SelectItem>
                                                    <SelectItem value="NSW">NSW</SelectItem>
                                                    <SelectItem value="VIC">VIC</SelectItem>
                                                    <SelectItem value="QLD">QLD</SelectItem>
                                                    <SelectItem value="WA">WA</SelectItem>
                                                    <SelectItem value="SA">SA</SelectItem>
                                                    <SelectItem value="TAS">TAS</SelectItem>
                                                    <SelectItem value="ACT">ACT</SelectItem>
                                                    <SelectItem value="NT">NT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Postcode</Label>
                                            <Input
                                                value={address.postcode}
                                                onChange={(event) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "postcode",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Country</Label>
                                            <Input
                                                value={address.country}
                                                onChange={(event) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "country",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label>Address Notes</Label>
                                            <Textarea
                                                value={address.notes}
                                                onChange={(event) =>
                                                    updateSupplierAddress(
                                                        index,
                                                        "notes",
                                                        event.target.value
                                                    )
                                                }
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-2xl border p-4"><h3 className="font-bold">Purchasing Defaults</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><div><Label>Payment Terms Days</Label><Input type="number" min="0" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} /></div><div><Label>Payment Terms Type</Label><Input value={paymentTermsType} onChange={(e) => setPaymentTermsType(e.target.value)} /></div><div><Label>Currency</Label><Input value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())} /></div><div><Label>Default Tax Type</Label><Input value={defaultTaxType} onChange={(e) => setDefaultTaxType(e.target.value)} /></div><div><Label>Expense Account Code</Label><Input value={defaultExpenseAccountCode} onChange={(e) => setDefaultExpenseAccountCode(e.target.value)} /></div><div><Label>Delivery Lead Days</Label><Input type="number" min="0" value={deliveryLeadDays} onChange={(e) => setDeliveryLeadDays(e.target.value)} /></div><div><Label>Minimum Order Value</Label><Input type="number" min="0" step="0.01" value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)} /></div><div className="md:col-span-2"><Label>Freight Notes</Label><Input value={freightNotes} onChange={(e) => setFreightNotes(e.target.value)} /></div></div></section>
                    <section className="rounded-2xl border p-4"><h3 className="font-bold">Xero Mapping</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><div><Label>Xero Contact ID</Label><Input value={xeroContactId} onChange={(e) => setXeroContactId(e.target.value)} /></div><div><Label>Xero Contact Name</Label><Input value={xeroContactName} onChange={(e) => setXeroContactName(e.target.value)} /></div><div><Label>Xero Contact Number</Label><Input value={xeroContactNumber} onChange={(e) => setXeroContactNumber(e.target.value)} /></div><div><Label>Xero Status</Label><Input value={xeroStatus} onChange={(e) => setXeroStatus(e.target.value)} /></div></div></section>
                    <section className="rounded-2xl border p-4"><div className="grid gap-4 md:grid-cols-2"><div><Label>Status</Label><Select value={isActive ? "active" : "inactive"} onValueChange={(value) => setIsActive(value === "active")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div><div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div></div></section>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowFormDialog(false)}>Cancel</Button><Button onClick={() => saveSupplier.mutate()} disabled={saveSupplier.isPending} className="bg-red-600 font-bold text-white hover:bg-red-700">{saveSupplier.isPending ? "Saving..." : formMode === "add" ? "Create Supplier" : "Save Changes"}</Button></div>
                </div></DialogContent>
            </Dialog>
        </div>
    );
};

export default Suppliers;
