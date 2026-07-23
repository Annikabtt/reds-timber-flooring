import { useMemo, useState, type ReactNode } from "react";
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
    MapPin,
    Truck,
    CreditCard,
    PackageSearch,
    Link2,
    Filter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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


const supplierInputClassName =
    "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30 md:text-sm";

const supplierTextareaClassName =
    "min-h-24 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30 md:text-sm";

const supplierSelectTriggerClassName =
    "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus:ring-[#9E4B4B]/30";

function SupplierFormSection({
    number,
    title,
    description,
    children,
}: {
    number: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-xs font-black text-white">
                    {number}
                </span>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

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

    const { data: suppliers = [], isLoading, error: suppliersError } = useQuery({
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
        <div className="w-full space-y-5 px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#9E4B4B]/10 p-2 text-[#9E4B4B]">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                Suppliers
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Supplier master data, contacts, purchasing defaults and Xero mapping.
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={openAddSupplier}
                    className="h-11 gap-2 rounded-xl bg-[#9E4B4B] px-5 font-bold text-white hover:bg-[#873f3f]"
                >
                    <Plus className="h-4 w-4" />
                    Add Supplier
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                    {
                        label: "Total Suppliers",
                        value: summary.total,
                        note: `${filteredSuppliers.length} in current results`,
                        icon: Building2,
                    },
                    {
                        label: "Active",
                        value: summary.active,
                        note: "Available for purchasing",
                        icon: Truck,
                    },
                    {
                        label: "Inactive",
                        value: summary.inactive,
                        note: "Retained for history",
                        icon: Filter,
                    },
                    {
                        label: "Xero Synced",
                        value: summary.xeroSynced,
                        note: "Connected supplier contacts",
                        icon: Link2,
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    {card.label}
                                </p>
                                <p className="mt-2 text-2xl font-black text-slate-900">
                                    {card.value}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">{card.note}</p>
                            </div>
                            <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_170px_180px_auto]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search supplier, code, ABN, contact or Xero..."
                            className={`${supplierInputClassName} pl-9`}
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className={supplierSelectTriggerClassName}>
                            <SelectValue placeholder="Supplier type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {supplierTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusFilter}
                        onValueChange={(value) =>
                            setStatusFilter(value as StatusFilter)
                        }
                    >
                        <SelectTrigger className={supplierSelectTriggerClassName}>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="inactive">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={xeroFilter}
                        onValueChange={(value) =>
                            setXeroFilter(value as XeroFilter)
                        }
                    >
                        <SelectTrigger className={supplierSelectTriggerClassName}>
                            <SelectValue placeholder="Xero status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Xero Statuses</SelectItem>
                            <SelectItem value="synced">Synced</SelectItem>
                            <SelectItem value="not-synced">Not Synced</SelectItem>
                            <SelectItem value="error">Sync Error</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handlePrint("print")}
                            className="h-11 gap-2 rounded-xl"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handlePrint("pdf")}
                            className="h-11 gap-2 rounded-xl"
                        >
                            <FileText className="h-4 w-4" />
                            PDF
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleExportCsv}
                            className="h-11 gap-2 rounded-xl"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleExportExcel}
                            className="h-11 gap-2 rounded-xl"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                        </Button>
                    </div>
                </div>
            </div>

            {suppliersError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    Supplier data could not be loaded:{" "}
                    {suppliersError instanceof Error
                        ? suppliersError.message
                        : "Unknown error"}
                </div>
            ) : null}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="grid grid-cols-12 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <div className="col-span-3">Supplier</div>
                    <div className="col-span-2">Primary Contact</div>
                    <div className="col-span-2">Purchasing</div>
                    <div className="col-span-2">Xero</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading suppliers...
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Building2 className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-semibold text-slate-700">
                            No suppliers found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Adjust the filters or create a new supplier.
                        </p>
                    </div>
                ) : (
                    filteredSuppliers.map((supplier) => {
                        const contact = getPrimaryContact(supplier);

                        return (
                            <div
                                key={supplier.supplier_id}
                                className="grid grid-cols-12 border-b px-4 py-4 last:border-0 hover:bg-slate-50"
                            >
                                <div className="col-span-3">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-[#9E4B4B]/10 p-2 text-[#9E4B4B]">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setViewingSupplier(supplier);
                                                    setShowViewDialog(true);
                                                }}
                                                className="block truncate text-left font-bold text-slate-900 hover:text-[#9E4B4B]"
                                            >
                                                {supplier.supplier_name}
                                            </button>
                                            <p className="text-xs text-slate-500">
                                                {supplier.supplier_code} · {supplier.supplier_type}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                ABN: {supplier.abn || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 min-w-0 text-sm">
                                    <p className="truncate font-medium text-slate-800">
                                        {contact?.contact_name || "Not configured"}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                        <Phone className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            {contact?.phone ||
                                                contact?.mobile ||
                                                supplier.phone ||
                                                "—"}
                                        </span>
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                        <Mail className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            {contact?.email || supplier.email || "—"}
                                        </span>
                                    </p>
                                </div>

                                <div className="col-span-2 text-sm">
                                    <p className="font-medium text-slate-800">
                                        {supplier.payment_terms_days}{" "}
                                        {supplier.payment_terms_type}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {supplier.default_currency} · Lead{" "}
                                        {supplier.delivery_lead_days ?? "—"} days
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Min. order{" "}
                                        {supplier.minimum_order_value === null
                                            ? "—"
                                            : supplier.minimum_order_value.toLocaleString(
                                                  "en-AU",
                                                  {
                                                      style: "currency",
                                                      currency:
                                                          supplier.default_currency,
                                                  }
                                              )}
                                    </p>
                                </div>

                                <div className="col-span-2 min-w-0 text-sm">
                                    <p className="font-medium text-slate-800">
                                        {supplier.xero_status}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        {supplier.xero_contact_name || "Not mapped"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {supplier.xero_last_synced_at
                                            ? new Date(
                                                  supplier.xero_last_synced_at
                                              ).toLocaleString("en-AU")
                                            : "Never synced"}
                                    </p>
                                </div>

                                <div className="col-span-1">
                                    <ActiveStatusBadge isActive={supplier.is_active} />
                                </div>

                                <div className="col-span-2">
                                    <StandardActions
                                        isActive={supplier.is_active}
                                        onView={() => {
                                            setViewingSupplier(supplier);
                                            setShowViewDialog(true);
                                        }}
                                        onEdit={() => openEditSupplier(supplier)}
                                        onToggleActive={() =>
                                            toggleSupplierActive.mutate({
                                                supplierId: supplier.supplier_id,
                                                nextActive: !supplier.is_active,
                                            })
                                        }
                                        onDelete={() => {
                                            if (
                                                window.confirm(
                                                    `Delete supplier: ${supplier.supplier_name}?`
                                                )
                                            ) {
                                                deleteSupplier.mutate(
                                                    supplier.supplier_id
                                                );
                                            }
                                        }}
                                        isStatusPending={
                                            toggleSupplierActive.isPending
                                        }
                                        isDeletePending={deleteSupplier.isPending}
                                        size="desktop"
                                        align="end"
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="space-y-3 lg:hidden">
                {isLoading ? (
                    <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
                        Loading suppliers...
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
                        No suppliers found.
                    </div>
                ) : (
                    filteredSuppliers.map((supplier) => {
                        const contact = getPrimaryContact(supplier);
                        const primaryAddress =
                            supplier.supplier_addresses?.find(
                                (address) => address.is_primary
                            ) || supplier.supplier_addresses?.[0];

                        return (
                            <div
                                key={supplier.supplier_id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-[#9E4B4B]">
                                            {supplier.supplier_code}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setViewingSupplier(supplier);
                                                setShowViewDialog(true);
                                            }}
                                            className="mt-1 block truncate text-left text-base font-bold text-slate-900"
                                        >
                                            {supplier.supplier_name}
                                        </button>
                                        <p className="text-xs text-slate-500">
                                            {supplier.supplier_type}
                                        </p>
                                    </div>
                                    <ActiveStatusBadge isActive={supplier.is_active} />
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Primary Contact
                                        </p>
                                        <p className="font-medium">
                                            {contact?.contact_name || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Xero</p>
                                        <p className="font-medium">
                                            {supplier.xero_status}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <p>
                                            {contact?.phone ||
                                                contact?.mobile ||
                                                supplier.phone ||
                                                "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Payment Terms
                                        </p>
                                        <p>{supplier.payment_terms_days} days</p>
                                    </div>
                                </div>

                                {primaryAddress && (
                                    <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            {[
                                                primaryAddress.address_line1,
                                                primaryAddress.suburb,
                                                primaryAddress.state,
                                                primaryAddress.postcode,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </span>
                                    </p>
                                )}

                                <div className="mt-4 border-t pt-4">
                                    <StandardActions
                                        isActive={supplier.is_active}
                                        onView={() => {
                                            setViewingSupplier(supplier);
                                            setShowViewDialog(true);
                                        }}
                                        onEdit={() => openEditSupplier(supplier)}
                                        onToggleActive={() =>
                                            toggleSupplierActive.mutate({
                                                supplierId: supplier.supplier_id,
                                                nextActive: !supplier.is_active,
                                            })
                                        }
                                        onDelete={() => {
                                            if (
                                                window.confirm(
                                                    `Delete supplier: ${supplier.supplier_name}?`
                                                )
                                            ) {
                                                deleteSupplier.mutate(
                                                    supplier.supplier_id
                                                );
                                            }
                                        }}
                                        isStatusPending={
                                            toggleSupplierActive.isPending
                                        }
                                        isDeletePending={deleteSupplier.isPending}
                                        size="mobile"
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-h-[94dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto rounded-2xl p-0 sm:w-auto sm:max-w-6xl">
                    {viewingSupplier && (
                        <div>
                            <div className="min-w-0 border-b bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                                <DialogHeader>
                                    <DialogTitle className="sr-only">
                                        Supplier Details
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="min-w-0 space-y-3 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
                                    <div className="flex min-w-0 items-start gap-3 pr-7 sm:pr-0">
                                        <div className="rounded-2xl bg-[#9E4B4B]/10 p-3 text-[#9E4B4B]">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-wide text-[#9E4B4B]">
                                                {viewingSupplier.supplier_code}
                                            </p>
                                            <h2 className="mt-1 break-words text-xl font-black leading-tight text-slate-900 sm:text-2xl">
                                                {viewingSupplier.supplier_name}
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {viewingSupplier.legal_name ||
                                                    viewingSupplier.supplier_type}
                                            </p>
                                        </div>
                                    </div>
                                    <ActiveStatusBadge
                                        isActive={viewingSupplier.is_active}
                                    />
                                </div>
                            </div>

                            <Tabs defaultValue="overview" className="min-w-0 p-3 sm:p-6">
                                <TabsList className="grid h-auto w-full min-w-0 grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-4">
                                    <TabsTrigger
                                        value="overview"
                                        className="min-h-11 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
                                    >
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="contacts"
                                        className="min-h-11 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
                                    >
                                        Contacts & Addresses
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="purchasing"
                                        className="min-h-11 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
                                    >
                                        Purchasing
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="xero"
                                        className="min-h-11 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
                                    >
                                        Xero
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-4 min-w-0 space-y-4 sm:mt-5 sm:space-y-5">
                                    <div className="grid gap-4 lg:grid-cols-3">
                                        <div className="rounded-2xl border bg-white p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Supplier Type
                                            </p>
                                            <p className="mt-2 font-semibold text-slate-900">
                                                {viewingSupplier.supplier_type}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border bg-white p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                ABN
                                            </p>
                                            <p className="mt-2 font-semibold text-slate-900">
                                                {viewingSupplier.abn || "Not configured"}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border bg-white p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Website
                                            </p>
                                            <p className="mt-2 break-all font-semibold text-slate-900">
                                                {viewingSupplier.website ||
                                                    "Not configured"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <section className="rounded-2xl border bg-white p-5">
                                            <h3 className="font-black text-slate-900">
                                                Company Contact
                                            </h3>
                                            <div className="mt-4 space-y-3 text-sm">
                                                <p className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {viewingSupplier.phone || "—"}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-slate-400" />
                                                    {viewingSupplier.email || "—"}
                                                </p>
                                            </div>
                                        </section>

                                        <section className="rounded-2xl border bg-white p-5">
                                            <h3 className="font-black text-slate-900">
                                                Notes
                                            </h3>
                                            <p className="mt-4 break-words whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                {viewingSupplier.notes ||
                                                    "No supplier notes recorded."}
                                            </p>
                                        </section>
                                    </div>
                                </TabsContent>

                                <TabsContent value="contacts" className="mt-4 min-w-0 space-y-4 sm:mt-5 sm:space-y-5">
                                    <section className="rounded-2xl border bg-white p-5">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-5 w-5 text-[#9E4B4B]" />
                                            <h3 className="font-black text-slate-900">
                                                Contact People
                                            </h3>
                                        </div>
                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            {(viewingSupplier.supplier_contacts || [])
                                                .filter((contact) => !contact.is_deleted)
                                                .map((contact) => (
                                                    <div
                                                        key={contact.contact_id}
                                                        className="rounded-xl border bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-bold text-slate-900">
                                                                    {contact.contact_name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {contact.position ||
                                                                        contact.contact_type}
                                                                </p>
                                                            </div>
                                                            {contact.is_primary && (
                                                                <span className="rounded-full bg-[#9E4B4B]/10 px-2 py-1 text-xs font-bold text-[#9E4B4B]">
                                                                    Primary
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                                                            <p>
                                                                {contact.phone ||
                                                                    contact.mobile ||
                                                                    "No phone"}
                                                            </p>
                                                            <p>
                                                                {contact.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border bg-white p-5">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-[#9E4B4B]" />
                                            <h3 className="font-black text-slate-900">
                                                Addresses
                                            </h3>
                                        </div>
                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            {(viewingSupplier.supplier_addresses || [])
                                                .filter((address) => !address.is_deleted)
                                                .map((address) => (
                                                    <div
                                                        key={address.address_id}
                                                        className="rounded-xl border bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="font-bold text-slate-900">
                                                                {address.address_type}
                                                            </p>
                                                            {address.is_primary && (
                                                                <span className="rounded-full bg-[#9E4B4B]/10 px-2 py-1 text-xs font-bold text-[#9E4B4B]">
                                                                    Primary
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                                            {[
                                                                address.address_line1,
                                                                address.address_line2,
                                                                address.suburb,
                                                                address.state,
                                                                address.postcode,
                                                                address.country,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(", ")}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="purchasing" className="mt-4 min-w-0 space-y-4 sm:mt-5 sm:space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border bg-white p-4">
                                            <CreditCard className="h-5 w-5 text-[#9E4B4B]" />
                                            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Payment Terms
                                            </p>
                                            <p className="mt-1 font-bold text-slate-900">
                                                {viewingSupplier.payment_terms_days}{" "}
                                                {viewingSupplier.payment_terms_type}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border bg-white p-4">
                                            <Truck className="h-5 w-5 text-[#9E4B4B]" />
                                            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Lead Time
                                            </p>
                                            <p className="mt-1 font-bold text-slate-900">
                                                {viewingSupplier.delivery_lead_days ??
                                                    "—"}{" "}
                                                days
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border bg-white p-4">
                                            <PackageSearch className="h-5 w-5 text-[#9E4B4B]" />
                                            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Minimum Order
                                            </p>
                                            <p className="mt-1 font-bold text-slate-900">
                                                {viewingSupplier.minimum_order_value ===
                                                null
                                                    ? "—"
                                                    : viewingSupplier.minimum_order_value.toLocaleString(
                                                          "en-AU",
                                                          {
                                                              style: "currency",
                                                              currency:
                                                                  viewingSupplier.default_currency,
                                                          }
                                                      )}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border bg-white p-4">
                                            <CreditCard className="h-5 w-5 text-[#9E4B4B]" />
                                            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Currency
                                            </p>
                                            <p className="mt-1 font-bold text-slate-900">
                                                {viewingSupplier.default_currency}
                                            </p>
                                        </div>
                                    </div>

                                    <section className="rounded-2xl border bg-white p-5">
                                        <h3 className="font-black text-slate-900">
                                            Accounting Defaults
                                        </h3>
                                        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    Default Tax Type
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-800">
                                                    {viewingSupplier.default_tax_type ||
                                                        "Not configured"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    Expense Account Code
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-800">
                                                    {viewingSupplier.default_expense_account_code ||
                                                        "Not configured"}
                                                </dd>
                                            </div>
                                        </dl>
                                    </section>

                                    <section className="rounded-2xl border bg-white p-5">
                                        <h3 className="font-black text-slate-900">
                                            Freight Notes
                                        </h3>
                                        <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                            {viewingSupplier.freight_notes ||
                                                "No freight notes recorded."}
                                        </p>
                                    </section>
                                </TabsContent>

                                <TabsContent value="xero" className="mt-4 min-w-0 space-y-4 sm:mt-5 sm:space-y-5">
                                    <section className="rounded-2xl border bg-white p-5">
                                        <div className="flex items-center gap-2">
                                            <Link2 className="h-5 w-5 text-[#9E4B4B]" />
                                            <h3 className="font-black text-slate-900">
                                                Xero Mapping
                                            </h3>
                                        </div>
                                        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    Status
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-800">
                                                    {viewingSupplier.xero_status}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    Last Synced
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-800">
                                                    {viewingSupplier.xero_last_synced_at
                                                        ? new Date(
                                                              viewingSupplier.xero_last_synced_at
                                                          ).toLocaleString("en-AU")
                                                        : "Never"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    Contact ID
                                                </dt>
                                                <dd className="mt-1 break-all text-sm text-slate-800">
                                                    {viewingSupplier.xero_contact_id ||
                                                        "Not mapped"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                    Contact Number
                                                </dt>
                                                <dd className="mt-1 text-sm text-slate-800">
                                                    {viewingSupplier.xero_contact_number ||
                                                        "Not mapped"}
                                                </dd>
                                            </div>
                                        </dl>

                                        {viewingSupplier.xero_sync_error && (
                                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                                {viewingSupplier.xero_sync_error}
                                            </div>
                                        )}
                                    </section>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
                <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto bg-slate-50 p-0">
                    <div className="border-b bg-white px-5 py-5 sm:px-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900">
                                {formMode === "add"
                                    ? "Add Supplier"
                                    : "Edit Supplier"}
                            </DialogTitle>
                        </DialogHeader>
                        <p className="mt-1 text-sm text-slate-500">
                            Complete supplier identity, contacts, addresses and purchasing defaults.
                        </p>
                    </div>

                    <div className="space-y-5 p-4 sm:p-6">
                        <SupplierFormSection
                            number="01"
                            title="Supplier Details"
                            description="Core company identity and general contact information."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Supplier Name *</Label>
                                    <Input
                                        value={supplierName}
                                        onChange={(event) =>
                                            setSupplierName(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Legal Name</Label>
                                    <Input
                                        value={legalName}
                                        onChange={(event) =>
                                            setLegalName(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Supplier Type</Label>
                                    <Input
                                        value={supplierType}
                                        onChange={(event) =>
                                            setSupplierType(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>ABN</Label>
                                    <Input
                                        value={abn}
                                        onChange={(event) =>
                                            setAbn(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={phone}
                                        onChange={(event) =>
                                            setPhone(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Website</Label>
                                    <Input
                                        value={website}
                                        onChange={(event) =>
                                            setWebsite(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                            </div>
                        </SupplierFormSection>

                        <SupplierFormSection
                            number="02"
                            title="Contact People"
                            description="Purchasing, accounts, delivery and management contacts."
                        >
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addSupplierContact}
                                    className="h-10 gap-2 rounded-xl"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Contact
                                </Button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {supplierContacts.map((contact, index) => (
                                    <div
                                        key={
                                            contact.contact_id ??
                                            `new-contact-${index}`
                                        }
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    Contact {index + 1}
                                                </p>
                                                {contact.is_primary && (
                                                    <p className="mt-1 text-xs font-bold text-[#9E4B4B]">
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
                                                        onClick={() =>
                                                            setPrimarySupplierContact(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Set as Primary
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeSupplierContact(index)
                                                    }
                                                    className="text-[#9E4B4B]"
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
                                                    className={
                                                        supplierInputClassName
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Contact Type</Label>
                                                <Select
                                                    value={contact.contact_type}
                                                    onValueChange={(value) =>
                                                        updateSupplierContact(
                                                            index,
                                                            "contact_type",
                                                            value
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            supplierSelectTriggerClassName
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            "General",
                                                            "Purchasing",
                                                            "Accounts",
                                                            "Delivery",
                                                            "Sales",
                                                            "Management",
                                                        ].map((value) => (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {value}
                                                            </SelectItem>
                                                        ))}
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
                                                    className={
                                                        supplierInputClassName
                                                    }
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
                                                    className={
                                                        supplierInputClassName
                                                    }
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
                                                    className={
                                                        supplierInputClassName
                                                    }
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
                                                    className={
                                                        supplierInputClassName
                                                    }
                                                />
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
                                                    className={
                                                        supplierTextareaClassName
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SupplierFormSection>

                        <SupplierFormSection
                            number="03"
                            title="Addresses"
                            description="Business, billing, warehouse and delivery addresses."
                        >
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addSupplierAddress}
                                    className="h-10 gap-2 rounded-xl"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Address
                                </Button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {supplierAddresses.map((address, index) => (
                                    <div
                                        key={
                                            address.address_id ??
                                            `new-address-${index}`
                                        }
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    Address {index + 1}
                                                </p>
                                                {address.is_primary && (
                                                    <p className="mt-1 text-xs font-bold text-[#9E4B4B]">
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
                                                        onClick={() =>
                                                            setPrimarySupplierAddress(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Set as Primary
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeSupplierAddress(index)
                                                    }
                                                    className="text-[#9E4B4B]"
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
                                                        updateSupplierAddress(
                                                            index,
                                                            "address_type",
                                                            value
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            supplierSelectTriggerClassName
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            "Business",
                                                            "Billing",
                                                            "Warehouse",
                                                            "Delivery",
                                                        ].map((value) => (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {value}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Address Line 1</Label>
                                                <Input
                                                    value={address.address_line1}
                                                    onChange={(event) =>
                                                        updateSupplierAddress(
                                                            index,
                                                            "address_line1",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        supplierInputClassName
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
                                                    className={
                                                        supplierInputClassName
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
                                                    className={
                                                        supplierInputClassName
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>State</Label>
                                                <Select
                                                    value={
                                                        address.state || "not-set"
                                                    }
                                                    onValueChange={(value) =>
                                                        updateSupplierAddress(
                                                            index,
                                                            "state",
                                                            value === "not-set"
                                                                ? ""
                                                                : value
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            supplierSelectTriggerClassName
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="not-set">
                                                            Not set
                                                        </SelectItem>
                                                        {[
                                                            "NSW",
                                                            "VIC",
                                                            "QLD",
                                                            "WA",
                                                            "SA",
                                                            "TAS",
                                                            "ACT",
                                                            "NT",
                                                        ].map((value) => (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {value}
                                                            </SelectItem>
                                                        ))}
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
                                                    className={
                                                        supplierInputClassName
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
                                                    className={
                                                        supplierInputClassName
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
                                                    className={
                                                        supplierTextareaClassName
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SupplierFormSection>

                        <SupplierFormSection
                            number="04"
                            title="Purchasing Defaults"
                            description="Terms, currency, tax, lead time and minimum ordering settings."
                        >
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label>Payment Terms Days</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={paymentTermsDays}
                                        onChange={(event) =>
                                            setPaymentTermsDays(
                                                event.target.value
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Payment Terms Type</Label>
                                    <Input
                                        value={paymentTermsType}
                                        onChange={(event) =>
                                            setPaymentTermsType(
                                                event.target.value
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Currency</Label>
                                    <Input
                                        value={defaultCurrency}
                                        onChange={(event) =>
                                            setDefaultCurrency(
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Default Tax Type</Label>
                                    <Input
                                        value={defaultTaxType}
                                        onChange={(event) =>
                                            setDefaultTaxType(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Expense Account Code</Label>
                                    <Input
                                        value={defaultExpenseAccountCode}
                                        onChange={(event) =>
                                            setDefaultExpenseAccountCode(
                                                event.target.value
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Delivery Lead Days</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={deliveryLeadDays}
                                        onChange={(event) =>
                                            setDeliveryLeadDays(
                                                event.target.value
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Minimum Order Value</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={minimumOrderValue}
                                        onChange={(event) =>
                                            setMinimumOrderValue(
                                                event.target.value
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Freight Notes</Label>
                                    <Input
                                        value={freightNotes}
                                        onChange={(event) =>
                                            setFreightNotes(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                            </div>
                        </SupplierFormSection>

                        <SupplierFormSection
                            number="05"
                            title="Xero Mapping"
                            description="Supplier contact mapping for accounting export and future synchronisation."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Xero Contact ID</Label>
                                    <Input
                                        value={xeroContactId}
                                        onChange={(event) =>
                                            setXeroContactId(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Xero Contact Name</Label>
                                    <Input
                                        value={xeroContactName}
                                        onChange={(event) =>
                                            setXeroContactName(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Xero Contact Number</Label>
                                    <Input
                                        value={xeroContactNumber}
                                        onChange={(event) =>
                                            setXeroContactNumber(
                                                event.target.value
                                            )
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                                <div>
                                    <Label>Xero Status</Label>
                                    <Input
                                        value={xeroStatus}
                                        onChange={(event) =>
                                            setXeroStatus(event.target.value)
                                        }
                                        className={supplierInputClassName}
                                    />
                                </div>
                            </div>
                        </SupplierFormSection>

                        <SupplierFormSection
                            number="06"
                            title="Status & Notes"
                            description="Operational availability and internal supplier notes."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={isActive ? "active" : "inactive"}
                                        onValueChange={(value) =>
                                            setIsActive(value === "active")
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                supplierSelectTriggerClassName
                                            }
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(event) =>
                                            setNotes(event.target.value)
                                        }
                                        className={supplierTextareaClassName}
                                    />
                                </div>
                            </div>
                        </SupplierFormSection>

                        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-slate-50/95 py-4 backdrop-blur">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowFormDialog(false)}
                                className="h-11 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => saveSupplier.mutate()}
                                disabled={saveSupplier.isPending}
                                className="h-11 rounded-xl bg-[#9E4B4B] px-5 font-bold text-white hover:bg-[#873f3f]"
                            >
                                {saveSupplier.isPending
                                    ? "Saving..."
                                    : formMode === "add"
                                      ? "Create Supplier"
                                      : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Suppliers;