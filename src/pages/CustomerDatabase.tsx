import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  ChevronDown,
  CreditCard,
  FolderKanban,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Printer,
  Search,
  UserRound,
} from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { type AppRole, isAdmin, normalizeAppRole } from "@/lib/roles";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import { StandardActions } from "@/components/common/StandardActions";

type CustomerContact = {
  contact_id: string;
  contact_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
};

type CustomerAddress = {
  address_id: string;
  address_type: string;
  address_line1: string;
  address_line2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  is_primary: boolean;
};

type CustomerFinancialSettingRow =
  Database["public"]["Tables"]["customer_financial_settings"]["Row"];

type CustomerFinancialSettingInsert =
  Database["public"]["Tables"]["customer_financial_settings"]["Insert"];

type CustomerFinancialSettingUpdate =
  Database["public"]["Tables"]["customer_financial_settings"]["Update"];

type PaymentTermsType =
  | "Days After Bill"
  | "Days After Bill Month"
  | "Day of Current Month"
  | "Day of Following Month";

type LineAmountType = "Exclusive" | "Inclusive";

type CustomerFinancialSettingsForm = {
  defaultCurrency: string;
  defaultSalesAccountCode: string;
  defaultTaxType: string;
  discountPercent: string;
  paymentTermsType: PaymentTermsType;
  paymentTermsDays: string;
  invoiceDeliveryMethod: string;
  statementDeliveryMethod: string;
  lineAmountType: LineAmountType;
  creditLimit: string;
  isAccountOnHold: boolean;
  accountHoldReason: string;
  xeroContactId: string;
  xeroContactName: string;
  xeroContactNumber: string;
  xeroBrandingThemeId: string;
  xeroBrandingThemeName: string;
  xeroStatus: string;
  xeroLastSyncedAt: string;
  xeroSyncError: string;
};

const DEFAULT_CUSTOMER_FINANCIAL_SETTINGS_FORM: CustomerFinancialSettingsForm = {
  defaultCurrency: "AUD",
  defaultSalesAccountCode: "",
  defaultTaxType: "",
  discountPercent: "0",
  paymentTermsType: "Days After Bill",
  paymentTermsDays: "30",
  invoiceDeliveryMethod: "Email",
  statementDeliveryMethod: "Email",
  lineAmountType: "Exclusive",
  creditLimit: "",
  isAccountOnHold: false,
  accountHoldReason: "",
  xeroContactId: "",
  xeroContactName: "",
  xeroContactNumber: "",
  xeroBrandingThemeId: "",
  xeroBrandingThemeName: "",
  xeroStatus: "Not Connected",
  xeroLastSyncedAt: "",
  xeroSyncError: "",
};

const PAYMENT_TERMS_OPTIONS: PaymentTermsType[] = [
  "Days After Bill",
  "Days After Bill Month",
  "Day of Current Month",
  "Day of Following Month",
];

const LINE_AMOUNT_TYPE_OPTIONS: LineAmountType[] = ["Exclusive", "Inclusive"];

const DELIVERY_METHOD_OPTIONS = ["Email", "Paper", "Electronic"] as const;

const XERO_STATUS_OPTIONS = ["Not Connected", "Synced", "Error", "Pending"] as const;

const PAYMENT_TERM_PRESETS = [0, 7, 14, 21, 30, 45, 60, 90];

type CustomerFinancialFormState = {
  defaultCurrency: string;
  defaultSalesAccountCode: string;
  defaultTaxType: string;
  lineAmountType: "Exclusive" | "Inclusive";
  discountPercent: string;
  paymentTermsType: PaymentTermsType;
  paymentTermsDays: string;
  creditLimit: string;
  isAccountOnHold: boolean;
  accountHoldReason: string;
  invoiceDeliveryMethod: string;
  statementDeliveryMethod: string;
  xeroContactId: string;
  xeroContactName: string;
  xeroContactNumber: string;
  xeroStatus: string;
  xeroLastSyncedAt: string;
  xeroSyncError: string;
  xeroBrandingThemeId: string;
  xeroBrandingThemeName: string;
};

type CustomerFinancialValidationErrors = {
  defaultCurrency?: string;
  discountPercent?: string;
  creditLimit?: string;
  paymentTermsDays?: string;
  accountHoldReason?: string;
};

type PriceBook = {
  price_book_id: string;
  price_book_code: string;
  price_book_name?: string | null;
};

type Customer = {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  customer_type: string;
  price_book_id: string | null;
  phone: string | null;
  email: string | null;
  abn: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  customer_contacts?: CustomerContact[] | null;
  customer_addresses?: CustomerAddress[] | null;
};

type CustomerProject = {
  project_id: string;
  project_no: string;
  project_name: string;
  project_status: string;
  contract_value: number | null;
  created_at: string;
  start_date: string | null;
  estimated_completion_date: string | null;
};

type CustomerSite = {
  site_id: string;
  site_code: string;
  site_name: string;
  site_status: string;
  project_id: string;
  contract_value: number;
};

type CustomerInvoice = {
  customer_invoice_id: string;
  invoice_no: string;
  invoice_status: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  project_id: string | null;
};

type CustomerPayment = {
  customer_payment_id: string;
  payment_no: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  reference_no: string | null;
};

type CustomerPaymentAllocation = {
  customer_payment_id: string;
  customer_invoice_id: string;
  allocated_amount: number;
};

type CustomerQuotation = {
  quotation_id: string;
  quotation_no: string;
  quotation_status: string;
  total_amount: number;
  issue_date: string | null;
  accepted_at: string | null;
  project_site_id: string | null;
};

const AUSTRALIAN_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const;
const EMPTY_SELECT_VALUE = "__none__";
const customerInputClassName =
  "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B] md:text-sm";
const customerTextareaClassName =
  "min-h-28 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B] md:text-sm";

function CustomerFormSection({
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

export default function CustomerDatabase() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState("Residential");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("Customer");
  const [abn, setAbn] = useState("");
  const [priceBookId, setPriceBookId] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [suburb, setSuburb] = useState("");
  const [stateName, setStateName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("Australia");
  const [notes, setNotes] = useState("");
  const [customerFormSaving, setCustomerFormSaving] = useState(false);

  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [customerDetailTab, setCustomerDetailTab] = useState("overview");
  const [detailProjectSearch, setDetailProjectSearch] = useState("");
  const [detailProjectStatus, setDetailProjectStatus] = useState("All");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerType, setEditCustomerType] = useState("Residential");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactPosition, setEditContactPosition] = useState("");
  const [editAbn, setEditAbn] = useState("");
  const [editPriceBookId, setEditPriceBookId] = useState("");
  const [editAddressLine1, setEditAddressLine1] = useState("");
  const [editAddressLine2, setEditAddressLine2] = useState("");
  const [editSuburb, setEditSuburb] = useState("");
  const [editStateName, setEditStateName] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [editCountry, setEditCountry] = useState("Australia");
  const [editNotes, setEditNotes] = useState("");

  // Admin role detection
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Financial settings state
  const [showFinancialSettingsDialog, setShowFinancialSettingsDialog] = useState(false);
  const [financialFormSaving, setFinancialFormSaving] = useState(false);
  const [existingFinancialSettingId, setExistingFinancialSettingId] = useState<string | null>(null);

  const [financialForm, setFinancialForm] = useState<CustomerFinancialFormState>({
    defaultCurrency: "AUD",
    defaultSalesAccountCode: "",
    defaultTaxType: "",
    lineAmountType: "Exclusive",
    discountPercent: "0",
    paymentTermsType: "Days After Bill",
    paymentTermsDays: "30",
    creditLimit: "",
    isAccountOnHold: false,
    accountHoldReason: "",
    invoiceDeliveryMethod: "Email",
    statementDeliveryMethod: "Email",
    xeroContactId: "",
    xeroContactName: "",
    xeroContactNumber: "",
    xeroStatus: "Not Connected",
    xeroLastSyncedAt: "",
    xeroSyncError: "",
    xeroBrandingThemeId: "",
    xeroBrandingThemeName: "",
  });

  const [financialErrors, setFinancialErrors] = useState<CustomerFinancialValidationErrors>({});

  // Get current user's app role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase.rpc("current_app_role");
        if (error) throw error;
        const normalized = normalizeAppRole(data);
        setUserRole(normalized);
      } catch (err) {
        setUserRole("viewer");
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const isCurrentUserAdmin = !roleLoading && isAdmin(userRole ?? "viewer");

  const { data: priceBooks = [] } = useQuery({
    queryKey: ["price-books-for-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_books")
        .select("price_book_id, price_book_code, price_book_name")
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("price_book_code", { ascending: true });

      if (error) throw error;
      return data as PriceBook[];
    },
  });

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          customer_id,
          customer_code,
          customer_name,
          customer_type,
          price_book_id,
          phone,
          email,
          abn,
          notes,
          is_active,
          created_at,
                    customer_contacts (
            contact_id,
            contact_name,
            position,
            phone,
            email,
            is_primary
          ),
          customer_addresses (
            address_id,
            address_type,
            address_line1,
            address_line2,
            suburb,
            state,
            postcode,
            country,
            is_primary
          )
        `
        )
        .eq("is_deleted", false)
        .eq("customer_contacts.is_deleted", false)
        .eq("customer_contacts.is_active", true)
        .eq("customer_addresses.is_deleted", false)
        .eq("customer_addresses.is_active", true)
        .order("customer_name", { ascending: true });

      if (error) throw error;
      return data as Customer[];
    },
  });

  const selectedCustomerId = viewingCustomer?.customer_id ?? "";

  const {
    data: customerDetail,
    isLoading: customerDetailLoading,
    error: customerDetailError,
  } = useQuery({
    queryKey: ["customer-detail-foundation", selectedCustomerId],
    enabled: showViewDialog && Boolean(selectedCustomerId),
    queryFn: async () => {
      const [projectsResult, invoicesResult, paymentsResult, quotationsResult] =
        await Promise.all([
          supabase
            .from("projects")
            .select(
              "project_id, project_no, project_name, project_status, contract_value, created_at, start_date, estimated_completion_date"
            )
            .eq("customer_id", selectedCustomerId)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),
          supabase
            .from("customer_invoices")
            .select(
              "customer_invoice_id, invoice_no, invoice_status, invoice_date, due_date, total_amount, paid_amount, balance_amount, project_id"
            )
            .eq("customer_id", selectedCustomerId)
            .eq("is_deleted", false)
            .order("invoice_date", { ascending: false }),
          supabase
            .from("customer_payments")
            .select(
              "customer_payment_id, payment_no, payment_date, payment_method, amount, reference_no"
            )
            .eq("customer_id", selectedCustomerId)
            .eq("is_deleted", false)
            .order("payment_date", { ascending: false }),
          supabase
            .from("quotations")
            .select(
              "quotation_id, quotation_no, quotation_status, total_amount, issue_date, accepted_at, project_site_id"
            )
            .eq("customer_id", selectedCustomerId)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),
        ]);

      if (projectsResult.error) throw projectsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      if (quotationsResult.error) throw quotationsResult.error;

      const projects = (projectsResult.data ?? []) as CustomerProject[];
      const invoices = (invoicesResult.data ?? []) as CustomerInvoice[];
      const payments = (paymentsResult.data ?? []) as CustomerPayment[];
      const quotations = (quotationsResult.data ?? []) as CustomerQuotation[];
      const projectIds = projects.map((project) => project.project_id);
      const paymentIds = payments.map((payment) => payment.customer_payment_id);

      const [sitesResult, allocationsResult] = await Promise.all([
        projectIds.length
          ? supabase
            .from("project_sites")
            .select("site_id, site_code, site_name, site_status, project_id, contract_value")
            .in("project_id", projectIds)
            .eq("is_deleted", false)
            .order("site_code", { ascending: true })
          : Promise.resolve({ data: [] as CustomerSite[], error: null }),
        paymentIds.length
          ? supabase
            .from("customer_payment_allocations")
            .select("customer_payment_id, customer_invoice_id, allocated_amount")
            .in("customer_payment_id", paymentIds)
          : Promise.resolve({ data: [] as CustomerPaymentAllocation[], error: null }),
      ]);

      if (sitesResult.error) throw sitesResult.error;
      if (allocationsResult.error) throw allocationsResult.error;

      return {
        projects,
        sites: (sitesResult.data ?? []) as CustomerSite[],
        invoices,
        payments,
        allocations: (allocationsResult.data ?? []) as CustomerPaymentAllocation[],
        quotations,
      };
    },
  });

  // Financial settings query (admin-only)
  const {
    data: customerFinancialSettings,
    isLoading: financialSettingsLoading,
    error: financialSettingsError,
  } = useQuery({
    queryKey: ["customer-financial-settings", selectedCustomerId],
    enabled: isCurrentUserAdmin && Boolean(selectedCustomerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_financial_settings")
        .select("*")
        .eq("customer_id", selectedCustomerId)
        .maybeSingle();

      if (error) throw error;
      return data as CustomerFinancialSettingRow | null;
    },
  });

  // Reset and populate financial form when customer changes
  useEffect(() => {
    if (!isCurrentUserAdmin || !selectedCustomerId) {
      setFinancialForm({
        defaultCurrency: "AUD",
        defaultSalesAccountCode: "",
        defaultTaxType: "",
        lineAmountType: "Exclusive",
        discountPercent: "0",
        paymentTermsType: "Days After Bill",
        paymentTermsDays: "30",
        creditLimit: "",
        isAccountOnHold: false,
        accountHoldReason: "",
        invoiceDeliveryMethod: "Email",
        statementDeliveryMethod: "Email",
        xeroContactId: "",
        xeroContactName: "",
        xeroContactNumber: "",
        xeroStatus: "Not Connected",
        xeroLastSyncedAt: "",
        xeroSyncError: "",
        xeroBrandingThemeId: "",
        xeroBrandingThemeName: "",
      });
      setExistingFinancialSettingId(null);
      setFinancialErrors({});
      return;
    }

    if (customerFinancialSettings) {
      setExistingFinancialSettingId(customerFinancialSettings.customer_financial_setting_id);
      setFinancialForm({
        defaultCurrency: customerFinancialSettings.default_currency || "AUD",
        defaultSalesAccountCode: customerFinancialSettings.default_sales_account_code || "",
        defaultTaxType: customerFinancialSettings.default_tax_type || "",
        lineAmountType: (customerFinancialSettings.line_amount_type as "Exclusive" | "Inclusive") || "Exclusive",
        discountPercent: customerFinancialSettings.discount_percent?.toString() || "0",
        paymentTermsType: (customerFinancialSettings.payment_terms_type as PaymentTermsType) || "Days After Bill",
        paymentTermsDays: customerFinancialSettings.payment_terms_days?.toString() || "30",
        creditLimit: customerFinancialSettings.credit_limit?.toString() || "",
        isAccountOnHold: customerFinancialSettings.is_account_on_hold || false,
        accountHoldReason: customerFinancialSettings.account_hold_reason || "",
        invoiceDeliveryMethod: customerFinancialSettings.invoice_delivery_method || "Email",
        statementDeliveryMethod: customerFinancialSettings.statement_delivery_method || "Email",
        xeroContactId: customerFinancialSettings.xero_contact_id || "",
        xeroContactName: customerFinancialSettings.xero_contact_name || "",
        xeroContactNumber: customerFinancialSettings.xero_contact_number || "",
        xeroStatus: customerFinancialSettings.xero_status || "Not Connected",
        xeroLastSyncedAt: customerFinancialSettings.xero_last_synced_at || "",
        xeroSyncError: customerFinancialSettings.xero_sync_error || "",
        xeroBrandingThemeId: customerFinancialSettings.xero_branding_theme_id || "",
        xeroBrandingThemeName: customerFinancialSettings.xero_branding_theme_name || "",
      });
      setFinancialErrors({});
    } else if (!financialSettingsLoading) {
      // No existing record - use defaults
      setExistingFinancialSettingId(null);
      setFinancialForm({
        defaultCurrency: "AUD",
        defaultSalesAccountCode: "",
        defaultTaxType: "",
        lineAmountType: "Exclusive",
        discountPercent: "0",
        paymentTermsType: "Days After Bill",
        paymentTermsDays: "30",
        creditLimit: "",
        isAccountOnHold: false,
        accountHoldReason: "",
        invoiceDeliveryMethod: "Email",
        statementDeliveryMethod: "Email",
        xeroContactId: "",
        xeroContactName: "",
        xeroContactNumber: "",
        xeroStatus: "Not Connected",
        xeroLastSyncedAt: "",
        xeroSyncError: "",
        xeroBrandingThemeId: "",
        xeroBrandingThemeName: "",
      });
      setFinancialErrors({});
    }
  }, [selectedCustomerId, isCurrentUserAdmin, customerFinancialSettings, financialSettingsLoading]);

  const handleAddCustomer = async () => {
    const trimmedCustomerName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedContactName = contactName.trim() || trimmedCustomerName;
    const trimmedContactPosition =
      contactPosition.trim() || (customerType === "Commercial" ? "Primary Contact" : "Customer");
    const trimmedAbn = abn.trim();
    const trimmedAddressLine1 = addressLine1.trim();
    const trimmedAddressLine2 = addressLine2.trim();
    const trimmedSuburb = suburb.trim();
    const trimmedState = stateName.trim();
    const trimmedPostcode = postcode.trim();
    const trimmedCountry = country.trim() || "Australia";
    const trimmedNotes = notes.trim();

    if (!trimmedCustomerName) {
      alert("Customer Name is required");
      return;
    }

    if (!trimmedPhone && !trimmedEmail) {
      alert("Please enter at least phone or email.");
      return;
    }

    if (!trimmedAddressLine1) {
      alert("Address Line 1 is required.");
      return;
    }

    const customerCode = "CUS-" + Date.now().toString().slice(-6);

    setCustomerFormSaving(true);

    try {
      const { data: createdCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          customer_code: customerCode,
          customer_name: trimmedCustomerName,
          customer_type: customerType,
          phone: trimmedPhone || null,
          email: trimmedEmail || null,
          abn: customerType === "Commercial" ? trimmedAbn || null : null,
          price_book_id: priceBookId || null,
          notes: trimmedNotes || null,
          is_active: true,
          is_deleted: false,
        })
        .select("customer_id")
        .single();

      if (customerError) throw customerError;

      if (!createdCustomer?.customer_id) {
        throw new Error("Customer was created but customer ID was not returned.");
      }

      const { error: contactError } = await supabase
        .from("customer_contacts")
        .insert({
          customer_id: createdCustomer.customer_id,
          contact_name: trimmedContactName,
          position: trimmedContactPosition || null,
          phone: trimmedPhone || null,
          email: trimmedEmail || null,
          is_primary: true,
          is_active: true,
          is_deleted: false,
        });

      if (contactError) throw contactError;

      const { error: addressError } = await supabase
        .from("customer_addresses")
        .insert({
          customer_id: createdCustomer.customer_id,
          address_type: "Billing",
          address_line1: trimmedAddressLine1,
          address_line2: trimmedAddressLine2 || null,
          suburb: trimmedSuburb || null,
          state: trimmedState || null,
          postcode: trimmedPostcode || null,
          country: trimmedCountry,
          is_primary: true,
          is_active: true,
          is_deleted: false,
        });

      if (addressError) throw addressError;

      setCustomerName("");
      setCustomerType("Residential");
      setPhone("");
      setEmail("");
      setContactName("");
      setContactPosition("Customer");
      setAbn("");
      setPriceBookId("");
      setAddressLine1("");
      setAddressLine2("");
      setSuburb("");
      setStateName("");
      setPostcode("");
      setCountry("Australia");
      setNotes("");

      setShowAddDialog(false);

      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Customer could not be created.");
    } finally {
      setCustomerFormSaving(false);
    }
  };

  const getPrimaryContact = (customer: Customer) => {
    return (
      customer.customer_contacts?.find((contact) => contact.is_primary) ||
      customer.customer_contacts?.[0] ||
      null
    );
  };

  const getPreferredAddress = (customer: Customer) => {
    const addresses = customer.customer_addresses ?? [];

    return (
      addresses.find(
        (addressItem) =>
          addressItem.address_type === "Billing" && addressItem.is_primary
      ) ||
      addresses.find((addressItem) => addressItem.is_primary) ||
      addresses[0] ||
      null
    );
  };

  const getBillingAddress = (customer: Customer) => {
    const addresses = customer.customer_addresses ?? [];

    return (
      addresses.find(
        (addressItem) =>
          addressItem.address_type === "Billing" && addressItem.is_primary
      ) ||
      addresses.find((addressItem) => addressItem.address_type === "Billing") ||
      getPreferredAddress(customer)
    );
  };

  const getPrimaryAddress = (customer: Customer) => {
    return (
      customer.customer_addresses?.find((addressItem) => addressItem.is_primary) ||
      customer.customer_addresses?.[0] ||
      null
    );
  };

  const formatAddress = (addressItem: CustomerAddress | null) => {
    if (!addressItem) return "-";

    return [
      addressItem.address_line1,
      addressItem.address_line2,
      addressItem.suburb,
      addressItem.state,
      addressItem.postcode,
      addressItem.country,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const formatDetailAddress = (addressItem: CustomerAddress | null) => {
    const formattedAddress = formatAddress(addressItem);
    return formattedAddress === "-" ? "No address recorded" : formattedAddress;
  };

  const formatMoney = (value: number | null | undefined) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

  const formatShortDate = (value: string | null | undefined) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-AU");
  };

  const getCustomerInitials = (customerName: string) => {
    const words = customerName.trim().split(/\s+/).filter(Boolean);
    const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
    return initials || "C";
  };

  const getContactSummary = (customer: Customer) => {
    const contact = getPrimaryContact(customer);
    const name = contact?.contact_name || "";
    const phoneValue = contact?.phone || customer.phone || "";
    const emailValue = contact?.email || customer.email || "";

    return {
      contact,
      name: name || (phoneValue || emailValue ? "Primary contact" : "No primary contact recorded"),
      position: contact?.position || "",
      phone: phoneValue,
      email: emailValue,
    };
  };

  const getCustomerPriceBookCode = (customer: Customer) => {
    if (!customer.price_book_id) return "Not set";

    return (
      priceBooks.find(
        (priceBook) => priceBook.price_book_id === customer.price_book_id
      )?.price_book_code || "Not set"
    );
  };

  const getCustomerPriceBookLabel = (customer: Customer) => {
    if (!customer.price_book_id) return "Not set";
    const priceBook = priceBooks.find(
      (item) => item.price_book_id === customer.price_book_id
    );

    if (!priceBook) return "Not set";
    return priceBook.price_book_name
      ? `${priceBook.price_book_code} · ${priceBook.price_book_name}`
      : priceBook.price_book_code;
  };

  const openViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setCustomerDetailTab("overview");
    setDetailProjectSearch("");
    setDetailProjectStatus("All");
    setShowViewDialog(true);
  };


  const openEditCustomer = (customer: Customer) => {
    const primaryContact = getPrimaryContact(customer);
    const billingAddress = getBillingAddress(customer);

    setEditingCustomer(customer);
    setEditCustomerName(customer.customer_name || "");
    setEditCustomerType(customer.customer_type || "Residential");
    setEditContactName(primaryContact?.contact_name || customer.customer_name || "");
    setEditContactPosition(
      primaryContact?.position ||
        (customer.customer_type === "Commercial" ? "Primary Contact" : "Customer")
    );
    setEditPhone(primaryContact?.phone || customer.phone || "");
    setEditEmail(primaryContact?.email || customer.email || "");
    setEditAbn(customer.abn || "");
    setEditPriceBookId(customer.price_book_id || "");
    setEditAddressLine1(billingAddress?.address_line1 || "");
    setEditAddressLine2(billingAddress?.address_line2 || "");
    setEditSuburb(billingAddress?.suburb || "");
    setEditStateName(billingAddress?.state || "");
    setEditPostcode(billingAddress?.postcode || "");
    setEditCountry(billingAddress?.country || "Australia");
    setEditNotes(customer.notes || "");
    setShowEditDialog(true);
  };

  const handleSaveEditCustomer = async () => {
    if (!editingCustomer) {
      alert("No customer selected.");
      return;
    }

    const trimmedCustomerName = editCustomerName.trim();
    const trimmedPhone = editPhone.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedContactName = editContactName.trim() || trimmedCustomerName;
    const trimmedContactPosition =
      editContactPosition.trim() ||
      (editCustomerType === "Commercial" ? "Primary Contact" : "Customer");
    const trimmedAbn = editAbn.trim();
    const trimmedAddressLine1 = editAddressLine1.trim();
    const trimmedAddressLine2 = editAddressLine2.trim();
    const trimmedSuburb = editSuburb.trim();
    const trimmedState = editStateName.trim();
    const trimmedPostcode = editPostcode.trim();
    const trimmedCountry = editCountry.trim() || "Australia";
    const trimmedNotes = editNotes.trim();

    if (!trimmedCustomerName) {
      alert("Customer Name is required");
      return;
    }

    if (!trimmedPhone && !trimmedEmail) {
      alert("Please enter at least phone or email.");
      return;
    }

    if (!trimmedAddressLine1) {
      alert("Address Line 1 is required.");
      return;
    }

    const primaryContact = getPrimaryContact(editingCustomer);
    const billingAddress = getBillingAddress(editingCustomer);

    setCustomerFormSaving(true);

    try {
      const { error: customerError } = await supabase
        .from("customers")
        .update({
          customer_name: trimmedCustomerName,
          customer_type: editCustomerType,
          price_book_id: editPriceBookId || null,
          phone: trimmedPhone || null,
          email: trimmedEmail || null,
          abn: editCustomerType === "Commercial" ? trimmedAbn || null : null,
          notes: trimmedNotes || null,
        })
        .eq("customer_id", editingCustomer.customer_id);

      if (customerError) throw customerError;

      if (primaryContact?.contact_id) {
        const { error: contactError } = await supabase
          .from("customer_contacts")
          .update({
            contact_name: trimmedContactName,
            position: trimmedContactPosition || null,
            phone: trimmedPhone || null,
            email: trimmedEmail || null,
            is_primary: true,
            is_active: true,
          })
          .eq("contact_id", primaryContact.contact_id)
          .eq("customer_id", editingCustomer.customer_id);

        if (contactError) throw contactError;
      } else {
        const { error: contactInsertError } = await supabase
          .from("customer_contacts")
          .insert({
            customer_id: editingCustomer.customer_id,
            contact_name: trimmedContactName,
            position: trimmedContactPosition || null,
            phone: trimmedPhone || null,
            email: trimmedEmail || null,
            is_primary: true,
            is_active: true,
            is_deleted: false,
          });

        if (contactInsertError) throw contactInsertError;
      }

      if (billingAddress?.address_id) {
        const { error: addressError } = await supabase
          .from("customer_addresses")
          .update({
            address_type: "Billing",
            address_line1: trimmedAddressLine1,
            address_line2: trimmedAddressLine2 || null,
            suburb: trimmedSuburb || null,
            state: trimmedState || null,
            postcode: trimmedPostcode || null,
            country: trimmedCountry,
            is_primary: true,
            is_active: true,
          })
          .eq("address_id", billingAddress.address_id)
          .eq("customer_id", editingCustomer.customer_id);

        if (addressError) throw addressError;
      } else {
        const { error: addressInsertError } = await supabase
          .from("customer_addresses")
          .insert({
            customer_id: editingCustomer.customer_id,
            address_type: "Billing",
            address_line1: trimmedAddressLine1,
            address_line2: trimmedAddressLine2 || null,
            suburb: trimmedSuburb || null,
            state: trimmedState || null,
            postcode: trimmedPostcode || null,
            country: trimmedCountry,
            is_primary: true,
            is_active: true,
            is_deleted: false,
          });

        if (addressInsertError) throw addressInsertError;
      }

      setShowEditDialog(false);
      setEditingCustomer(null);

      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Customer could not be saved.");
    } finally {
      setCustomerFormSaving(false);
    }
  };

  const handleToggleCustomerActive = async (customer: Customer) => {
    const nextIsActive = !customer.is_active;

    const confirmMessage = nextIsActive
      ? `Reactivate customer: ${customer.customer_name}?`
      : `Set customer as inactive: ${customer.customer_name}?`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    const { error } = await supabase
      .from("customers")
      .update({
        is_active: nextIsActive,
      })
      .eq("customer_id", customer.customer_id);

    if (error) {
      alert(error.message);
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["customers"],
    });
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Delete customer: ${customer.customer_name}?\n\nThis will hide the customer from the active customer database.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("customers")
      .update({
        is_deleted: true,
        is_active: false,
      })
      .eq("customer_id", customer.customer_id);

    if (error) {
      alert(error.message);
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ["customers"],
    });
  };

  const validateFinancialForm = (): boolean => {
    const errors: CustomerFinancialValidationErrors = {};

    if (financialForm.defaultCurrency.trim().length !== 3 || !/^[A-Z]{3}$/.test(financialForm.defaultCurrency)) {
      errors.defaultCurrency = "Currency must be exactly 3 uppercase letters (e.g., AUD)";
    }

    const discountNum = parseFloat(financialForm.discountPercent);
    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      errors.discountPercent = "Discount percent must be between 0 and 100";
    }

    if (financialForm.creditLimit.trim()) {
      const creditNum = parseFloat(financialForm.creditLimit);
      if (isNaN(creditNum) || creditNum < 0) {
        errors.creditLimit = "Credit limit must be a positive number or blank";
      }
    }

    const daysNum = parseInt(financialForm.paymentTermsDays);
    if (isNaN(daysNum)) {
      errors.paymentTermsDays = "Payment terms days must be a valid number";
    } else if (
      financialForm.paymentTermsType === "Day of Current Month" ||
      financialForm.paymentTermsType === "Day of Following Month"
    ) {
      if (daysNum < 1 || daysNum > 31) {
        errors.paymentTermsDays = "Day of month must be between 1 and 31";
      }
    } else {
      if (daysNum < 0 || daysNum > 365) {
        errors.paymentTermsDays = "Days must be between 0 and 365";
      }
    }

    if (financialForm.isAccountOnHold && !financialForm.accountHoldReason.trim()) {
      errors.accountHoldReason = "Account hold reason is required when account is on hold";
    }

    setFinancialErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenFinancialSettings = () => {
    setShowFinancialSettingsDialog(true);
  };

  const handleSaveFinancialSettings = async () => {
    if (!viewingCustomer) {
      alert("No customer selected.");
      return;
    }

    if (!validateFinancialForm()) {
      alert("Please fix validation errors before saving.");
      return;
    }

    setFinancialFormSaving(true);

    try {
      const payload = {
        customer_id: viewingCustomer.customer_id,
        default_currency: financialForm.defaultCurrency.trim(),
        default_sales_account_code: financialForm.defaultSalesAccountCode.trim() || null,
        default_tax_type: financialForm.defaultTaxType.trim() || null,
        line_amount_type: financialForm.lineAmountType,
        discount_percent: parseFloat(financialForm.discountPercent) || 0,
        payment_terms_type: financialForm.paymentTermsType,
        payment_terms_days: parseInt(financialForm.paymentTermsDays) || 0,
        credit_limit: financialForm.creditLimit.trim() ? parseFloat(financialForm.creditLimit) : null,
        is_account_on_hold: financialForm.isAccountOnHold,
        account_hold_reason: financialForm.isAccountOnHold ? financialForm.accountHoldReason.trim() || null : null,
        invoice_delivery_method: financialForm.invoiceDeliveryMethod.trim() || null,
        statement_delivery_method: financialForm.statementDeliveryMethod.trim() || null,
        xero_contact_id: financialForm.xeroContactId.trim() || null,
        xero_contact_name: financialForm.xeroContactName.trim() || null,
        xero_contact_number: financialForm.xeroContactNumber.trim() || null,
        xero_status: financialForm.xeroStatus,
        xero_last_synced_at: financialForm.xeroLastSyncedAt || null,
        xero_sync_error: financialForm.xeroSyncError.trim() || null,
        xero_branding_theme_id: financialForm.xeroBrandingThemeId.trim() || null,
        xero_branding_theme_name: financialForm.xeroBrandingThemeName.trim() || null,
      };

      let result;

      if (existingFinancialSettingId) {
        // Update existing
        const { data, error } = await supabase
          .from("customer_financial_settings")
          .update(payload)
          .eq("customer_financial_setting_id", existingFinancialSettingId)
          .select("*")
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("customer_financial_settings")
          .insert(payload)
          .select("*")
          .single();

        if (error) throw error;
        result = data;
      }

      // Update local state with returned data
      if (result) {
        setExistingFinancialSettingId(result.customer_financial_setting_id);
        setFinancialForm({
          defaultCurrency: result.default_currency || "AUD",
          defaultSalesAccountCode: result.default_sales_account_code || "",
          defaultTaxType: result.default_tax_type || "",
          lineAmountType: (result.line_amount_type as "Exclusive" | "Inclusive") || "Exclusive",
          discountPercent: result.discount_percent?.toString() || "0",
          paymentTermsType: (result.payment_terms_type as PaymentTermsType) || "Days After Bill",
          paymentTermsDays: result.payment_terms_days?.toString() || "30",
          creditLimit: result.credit_limit?.toString() || "",
          isAccountOnHold: result.is_account_on_hold || false,
          accountHoldReason: result.account_hold_reason || "",
          invoiceDeliveryMethod: result.invoice_delivery_method || "Email",
          statementDeliveryMethod: result.statement_delivery_method || "Email",
          xeroContactId: result.xero_contact_id || "",
          xeroContactName: result.xero_contact_name || "",
          xeroContactNumber: result.xero_contact_number || "",
          xeroStatus: result.xero_status || "Not Connected",
          xeroLastSyncedAt: result.xero_last_synced_at || "",
          xeroSyncError: result.xero_sync_error || "",
          xeroBrandingThemeId: result.xero_branding_theme_id || "",
          xeroBrandingThemeName: result.xero_branding_theme_name || "",
        });
      }

      setShowFinancialSettingsDialog(false);
      queryClient.invalidateQueries({
        queryKey: ["customer-financial-settings", viewingCustomer.customer_id],
      });
    } catch (error) {
      alert(
        `Error saving financial settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setFinancialFormSaving(false);
    }
  };

  const handleCancelFinancialSettings = () => {
    setShowFinancialSettingsDialog(false);
    // Reset form to previous saved state or defaults
    if (customerFinancialSettings) {
      setFinancialForm({
        defaultCurrency: customerFinancialSettings.default_currency || "AUD",
        defaultSalesAccountCode: customerFinancialSettings.default_sales_account_code || "",
        defaultTaxType: customerFinancialSettings.default_tax_type || "",
        lineAmountType: (customerFinancialSettings.line_amount_type as "Exclusive" | "Inclusive") || "Exclusive",
        discountPercent: customerFinancialSettings.discount_percent?.toString() || "0",
        paymentTermsType: (customerFinancialSettings.payment_terms_type as PaymentTermsType) || "Days After Bill",
        paymentTermsDays: customerFinancialSettings.payment_terms_days?.toString() || "30",
        creditLimit: customerFinancialSettings.credit_limit?.toString() || "",
        isAccountOnHold: customerFinancialSettings.is_account_on_hold || false,
        accountHoldReason: customerFinancialSettings.account_hold_reason || "",
        invoiceDeliveryMethod: customerFinancialSettings.invoice_delivery_method || "Email",
        statementDeliveryMethod: customerFinancialSettings.statement_delivery_method || "Email",
        xeroContactId: customerFinancialSettings.xero_contact_id || "",
        xeroContactName: customerFinancialSettings.xero_contact_name || "",
        xeroContactNumber: customerFinancialSettings.xero_contact_number || "",
        xeroStatus: customerFinancialSettings.xero_status || "Not Connected",
        xeroLastSyncedAt: customerFinancialSettings.xero_last_synced_at || "",
        xeroSyncError: customerFinancialSettings.xero_sync_error || "",
        xeroBrandingThemeId: customerFinancialSettings.xero_branding_theme_id || "",
        xeroBrandingThemeName: customerFinancialSettings.xero_branding_theme_name || "",
      });
    }
    setFinancialErrors({});
  };

  const customerSummary = useMemo(() => {
    const allCount = customers.length;

    const commercialCount = customers.filter(
      (customer) => customer.customer_type === "Commercial"
    ).length;

    const residentialCount = customers.filter(
      (customer) => customer.customer_type === "Residential"
    ).length;

    const inactiveCount = customers.filter(
      (customer) => !customer.is_active
    ).length;

    const missingPriceBookCount = customers.filter(
      (customer) => !customer.price_book_id
    ).length;

    return {
      allCount,
      commercialCount,
      residentialCount,
      inactiveCount,
      missingPriceBookCount,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const typeMatchedCustomers =
      typeFilter === "All"
        ? customers
        : customers.filter((customer) => customer.customer_type === typeFilter);

    const statusMatchedCustomers =
      statusFilter === "All"
        ? typeMatchedCustomers
        : typeMatchedCustomers.filter((customer) =>
          statusFilter === "Active" ? customer.is_active : !customer.is_active
        );

    if (!keyword) return statusMatchedCustomers;

    return statusMatchedCustomers.filter((customer) => {
      const primaryContact = getPrimaryContact(customer);
      const primaryAddress = getPrimaryAddress(customer);
      const addressText = formatAddress(primaryAddress);

      return (
        customer.customer_code.toLowerCase().includes(keyword) ||
        customer.customer_name.toLowerCase().includes(keyword) ||
        customer.customer_type.toLowerCase().includes(keyword) ||
        (customer.email || "").toLowerCase().includes(keyword) ||
        (customer.phone || "").toLowerCase().includes(keyword) ||
        (customer.abn || "").toLowerCase().includes(keyword) ||
        getCustomerPriceBookCode(customer).toLowerCase().includes(keyword) ||
        (primaryContact?.contact_name || "").toLowerCase().includes(keyword) ||
        (primaryContact?.position || "").toLowerCase().includes(keyword) ||
        (primaryContact?.phone || "").toLowerCase().includes(keyword) ||
        (primaryContact?.email || "").toLowerCase().includes(keyword) ||
        addressText.toLowerCase().includes(keyword)
      );
    });
  }, [customers, priceBooks, searchTerm, typeFilter, statusFilter]);

  const selectedCustomerContext = useMemo(() => {
    if (!viewingCustomer) return null;

    const contactSummary = getContactSummary(viewingCustomer);
    const preferredAddress = getPreferredAddress(viewingCustomer);
    const projects = customerDetail?.projects ?? [];
    const sites = customerDetail?.sites ?? [];
    const invoices = customerDetail?.invoices ?? [];
    const payments = customerDetail?.payments ?? [];
    const allocations = customerDetail?.allocations ?? [];
    const quotations = customerDetail?.quotations ?? [];
    const today = new Date();

    const overdueInvoices = invoices.filter(
      (invoice) =>
        Number(invoice.balance_amount) > 0 &&
        invoice.due_date &&
        new Date(`${invoice.due_date}T00:00:00`) < today
    );

    const allocatedPaymentTotal = allocations.reduce(
      (sum, allocation) => sum + Number(allocation.allocated_amount || 0),
      0
    );
    const paymentTotal = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const warnings = [
      overdueInvoices.length
        ? `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? "" : "s"}`
        : "",
      !viewingCustomer.price_book_id ? "Missing price book" : "",
      !contactSummary.contact ? "Missing primary contact" : "",
      !preferredAddress || preferredAddress.address_type !== "Billing"
        ? "Missing billing address"
        : "",
      !viewingCustomer.is_active ? "Inactive customer" : "",
    ].filter(Boolean);

    const recentActivity = [
      ...projects.map((project) => ({
        id: `project-${project.project_id}`,
        label: `Project ${project.project_no}`,
        description: project.project_name,
        date: project.start_date || project.estimated_completion_date,
      })),
      ...quotations.map((quotation) => ({
        id: `quotation-${quotation.quotation_id}`,
        label: `Quotation ${quotation.quotation_no}`,
        description: quotation.quotation_status,
        date: quotation.accepted_at || quotation.issue_date,
      })),
      ...invoices.map((invoice) => ({
        id: `invoice-${invoice.customer_invoice_id}`,
        label: `Invoice ${invoice.invoice_no}`,
        description: `${formatMoney(invoice.balance_amount)} balance`,
        date: invoice.invoice_date,
      })),
      ...payments.map((payment) => ({
        id: `payment-${payment.customer_payment_id}`,
        label: `Payment ${payment.payment_no}`,
        description: formatMoney(payment.amount),
        date: payment.payment_date,
      })),
    ]
      .filter((item) => Boolean(item.date))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 6);

    return {
      contactSummary,
      preferredAddress,
      projects,
      sites,
      invoices,
      payments,
      quotations,
      warnings,
      recentActivity,
      outstanding: invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance_amount || 0),
        0
      ),
      overdue: overdueInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance_amount || 0),
        0
      ),
      unallocatedPayments: Math.max(paymentTotal - allocatedPaymentTotal, 0),
      invoiceValue: invoices.reduce(
        (sum, invoice) => sum + Number(invoice.total_amount || 0),
        0
      ),
      activeProjects: projects.filter(
        (project) => project.project_status === "In Progress"
      ).length,
      quotedProjects: projects.filter(
        (project) => project.project_status === "Quoted"
      ).length,
      completedProjects: projects.filter(
        (project) => project.project_status === "Completed"
      ).length,
      acceptedQuotations: quotations.filter(
        (quotation) => quotation.quotation_status === "Accepted"
      ).length,
    };
  }, [customerDetail, viewingCustomer, priceBooks]);

  const detailProjectStatuses = useMemo(() => {
    const statuses = new Set(
      (selectedCustomerContext?.projects ?? []).map((project) => project.project_status)
    );
    return ["All", ...Array.from(statuses).sort()];
  }, [selectedCustomerContext?.projects]);

  const filteredDetailProjects = useMemo(() => {
    const projects = selectedCustomerContext?.projects ?? [];
    const keyword = detailProjectSearch.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        detailProjectStatus === "All" || project.project_status === detailProjectStatus;
      const matchesSearch =
        !keyword ||
        project.project_no.toLowerCase().includes(keyword) ||
        project.project_name.toLowerCase().includes(keyword) ||
        project.project_status.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [detailProjectSearch, detailProjectStatus, selectedCustomerContext?.projects]);

  const getExportRows = () => {
    return filteredCustomers.map((customer) => {
      const primaryContact = getPrimaryContact(customer);
      const primaryAddress = getPrimaryAddress(customer);

      return {
        "Customer Code": customer.customer_code,
        "Customer Name": customer.customer_name,
        "Customer Type": customer.customer_type,
        "Primary Contact": primaryContact?.contact_name || "",
        Phone: primaryContact?.phone || customer.phone || "",
        Email: primaryContact?.email || customer.email || "",
        Address: formatAddress(primaryAddress),
        ABN: customer.abn || "",
        "Price Book": getCustomerPriceBookCode(customer),
        Status: customer.is_active ? "Active" : "Inactive",
      };
    });
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string) => {
    return `"${String(value || "").replace(/"/g, '""')}"`;
  };

  const escapeHtmlValue = (value: string) => {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const handleExportCsv = () => {
    const rows = getExportRows();

    if (rows.length === 0) {
      alert("No customers to export.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        headers
          .map((header) => escapeCsvValue(String(row[header as keyof typeof row] || "")))
          .join(",")
      ),
    ].join("\n");

    downloadFile(
      `\uFEFF${csvContent}`,
      `reds-customers-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  const handleExportExcel = () => {
    const rows = getExportRows();

    if (rows.length === 0) {
      alert("No customers to export.");
      return;
    }

    const headers = Object.keys(rows[0]);

    const tableHtml = `
      <table>
        <thead>
          <tr>
            ${headers.map((header) => `<th>${escapeHtmlValue(header)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
        .map(
          (row) => `
                <tr>
                  ${headers
              .map(
                (header) =>
                  `<td>${escapeHtmlValue(String(row[header as keyof typeof row] || ""))}</td>`
              )
              .join("")}
                </tr>
              `
        )
        .join("")}
        </tbody>
      </table>
    `;

    downloadFile(
      tableHtml,
      `reds-customers-${new Date().toISOString().slice(0, 10)}.xls`,
      "application/vnd.ms-excel;charset=utf-8;"
    );
  };

  const handlePrintCustomers = () => {
    const rows = getExportRows();

    if (rows.length === 0) {
      alert("No customers to print.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Print window was blocked by the browser.");
      return;
    }

    const logoUrl = "/Reds_Logo_PNG.png";

    const filterSummary = [
      `Search: ${searchTerm.trim() || "All"}`,
      `Type: ${typeFilter}`,
      `Status: ${statusFilter}`,
      `Records: ${rows.length}`,
    ].join(" | ");

    const tableRows = rows
      .map(
        (row) => `
          <tr>
            ${headers
            .map(
              (header) =>
                `<td>${escapeHtmlValue(String(row[header as keyof typeof row] || ""))}</td>`
            )
            .join("")}
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>REDS Customers</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              background: white;
            }

            .print-page {
              width: 100%;
            }

            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;
              border-bottom: 4px solid #c8102e;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 18px;
            }

            .logo {
              width: 220px;
              max-height: 70px;
              object-fit: contain;
            }

            .brand-text h1 {
              margin: 0;
              font-size: 24px;
              letter-spacing: 0.5px;
              color: #111827;
            }

            .brand-text p {
              margin: 4px 0 0;
              font-size: 12px;
              color: #64748b;
            }

            .meta {
              text-align: right;
              font-size: 11px;
              color: #475569;
              line-height: 1.6;
              min-width: 220px;
            }

            .report-title {
              margin: 18px 0 6px;
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }

            .filter-summary {
              margin: 0 0 16px;
              font-size: 11px;
              color: #64748b;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 10px;
            }

            th {
              background: #0f172a;
              color: white;
              text-align: left;
              padding: 8px 6px;
              border: 1px solid #334155;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            td {
              padding: 7px 6px;
              border: 1px solid #cbd5e1;
              vertical-align: top;
              word-wrap: break-word;
              overflow-wrap: anywhere;
              line-height: 1.35;
            }

            tr:nth-child(even) td {
              background: #f8fafc;
            }

            .footer {
              margin-top: 18px;
              padding-top: 10px;
              border-top: 1px solid #cbd5e1;
              font-size: 10px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .no-print {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-page">
            <div class="header">
              <div class="brand">
                <img class="logo" src="${logoUrl}" alt="REDS Timber Flooring Specialists" />
                <div class="brand-text">
                  <h1>Customer Master Report</h1>
                  <p>REDS Timber Flooring Specialists</p>
                </div>
              </div>

              <div class="meta">
                <div><strong>Report:</strong> Customers</div>
                <div><strong>Printed:</strong> ${new Date().toLocaleDateString("en-AU")}</div>
                <div><strong>Time:</strong> ${new Date().toLocaleTimeString("en-AU")}</div>
              </div>
            </div>

            <div class="report-title">Customers</div>
            <p class="filter-summary">${escapeHtmlValue(filterSummary)}</p>

            <table>
              <thead>
                <tr>
                  ${headers.map((header) => `<th>${escapeHtmlValue(header)}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div class="footer">
              <div>Generated from REDS Customer Database</div>
              <div>${rows.length} customer record${rows.length === 1 ? "" : "s"}</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="w-full space-y-5">
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <Building2 className="h-6 w-6 text-red-600" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                  Customers
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage residential and commercial customers.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 sm:w-auto sm:px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <Dialog
          open={showViewDialog}
          onOpenChange={(open) => {
            setShowViewDialog(open);

            if (!open) {
              setViewingCustomer(null);
            }
          }}
        >
          <DialogContent className="h-[100dvh] w-screen max-w-none overflow-hidden rounded-none border-0 bg-slate-100 p-0 sm:h-[96vh] sm:w-[96vw] sm:rounded-2xl sm:border">
            <DialogHeader className="sr-only">
              <DialogTitle>Customer Detail</DialogTitle>
            </DialogHeader>

            {viewingCustomer && selectedCustomerContext ? (
              <div className="flex h-full min-h-0 flex-col">
                <header className="shrink-0 border-b border-slate-200 bg-white">
                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between lg:p-6">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#9E4B4B] text-xl font-black text-white">
                        {getCustomerInitials(viewingCustomer.customer_name)}
                      </div>

                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words text-2xl font-black leading-tight text-slate-950 md:text-3xl">
                            {viewingCustomer.customer_name}
                          </h2>
                          <ActiveStatusBadge isActive={viewingCustomer.is_active} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span className="font-mono font-semibold text-slate-700">
                            {viewingCustomer.customer_code}
                          </span>
                          <span>·</span>
                          <span>{viewingCustomer.customer_type}</span>
                          <span>·</span>
                          <span>{getCustomerPriceBookLabel(viewingCustomer)}</span>
                        </div>

                        <div className="grid gap-2 text-sm text-slate-700 lg:grid-cols-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900">
                                {selectedCustomerContext.contactSummary.name}
                              </div>
                              {selectedCustomerContext.contactSummary.position ? (
                                <div className="text-slate-500">
                                  {selectedCustomerContext.contactSummary.position}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2">
                            {selectedCustomerContext.contactSummary.phone ? (
                              <a
                                className="inline-flex min-w-0 items-center gap-2 text-[#9E4B4B] hover:underline"
                                href={`tel:${selectedCustomerContext.contactSummary.phone}`}
                              >
                                <Phone className="h-4 w-4 shrink-0" />
                                <span className="break-all">
                                  {selectedCustomerContext.contactSummary.phone}
                                </span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-slate-500">
                                <Phone className="h-4 w-4" />
                                No phone recorded
                              </span>
                            )}

                            {selectedCustomerContext.contactSummary.email ? (
                              <a
                                className="inline-flex min-w-0 items-center gap-2 text-[#9E4B4B] hover:underline"
                                href={`mailto:${selectedCustomerContext.contactSummary.email}`}
                              >
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="break-all">
                                  {selectedCustomerContext.contactSummary.email}
                                </span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-slate-500">
                                <Mail className="h-4 w-4" />
                                No email recorded
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-slate-700">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{formatDetailAddress(selectedCustomerContext.preferredAddress)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        type="button"
                        className="rounded-xl bg-[#9E4B4B] hover:bg-[#873f3f]"
                        onClick={() => {
                          setShowViewDialog(false);
                          openEditCustomer(viewingCustomer);
                        }}
                      >
                        Edit Customer
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="rounded-xl">
                            New <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Customer actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled title="Available after module integration">
                            New Project
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled title="Available after module integration">
                            New Quotation
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled title="Available after module integration">
                            New Variation
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled title="Available after module integration">
                            New Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled title="Available after module integration">
                            Record Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-xl"
                            aria-label="More customer actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled title="Available after module integration">
                            More actions unavailable
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </header>

                <Tabs
                  value={customerDetailTab}
                  onValueChange={setCustomerDetailTab}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 lg:px-6">
                    <TabsList className="max-w-full justify-start overflow-x-auto bg-slate-100">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="projects">Projects</TabsTrigger>
                      <TabsTrigger value="financial">Financial</TabsTrigger>
                      <TabsTrigger value="contact">Contact Details</TabsTrigger>
                      <TabsTrigger value="files">Files</TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-4 p-4 lg:p-6">
                      {customerDetailLoading ? (
                        <DetailEmptyState title="Loading customer detail..." />
                      ) : customerDetailError ? (
                        <DetailEmptyState
                          title="Customer detail could not be loaded."
                          description={(customerDetailError as Error).message}
                        />
                      ) : (
                        <>
                          <TabsContent value="overview" className="mt-0 space-y-4">
                            <div className="grid gap-4 xl:grid-cols-4">
                              <DetailCard title="Accounts Receivable" icon={<CreditCard className="h-5 w-5" />}>
                                <MetricGrid
                                  metrics={[
                                    ["Outstanding", formatMoney(selectedCustomerContext.outstanding)],
                                    ["Overdue", formatMoney(selectedCustomerContext.overdue)],
                                    ["Unallocated Payments", formatMoney(selectedCustomerContext.unallocatedPayments)],
                                    ["Average Days to Pay", "Not available"],
                                  ]}
                                />
                              </DetailCard>

                              <DetailCard title="Project Summary" icon={<FolderKanban className="h-5 w-5" />}>
                                <MetricGrid
                                  metrics={[
                                    ["Active Projects", String(selectedCustomerContext.activeProjects)],
                                    ["Quoted Projects", String(selectedCustomerContext.quotedProjects)],
                                    ["Completed Projects", String(selectedCustomerContext.completedProjects)],
                                    ["Total Sites", String(selectedCustomerContext.sites.length)],
                                  ]}
                                />
                              </DetailCard>

                              <DetailCard title="Commercial Summary" icon={<FileText className="h-5 w-5" />}>
                                <MetricGrid
                                  metrics={[
                                    ["Accepted Quotations", String(selectedCustomerContext.acceptedQuotations)],
                                    ["Accepted Variations", "Not available"],
                                    ["Uninvoiced Value", "Not available"],
                                    ["Invoice Value", formatMoney(selectedCustomerContext.invoiceValue)],
                                  ]}
                                />
                              </DetailCard>

                              <DetailCard title="Attention" icon={<Filter className="h-5 w-5" />}>
                                {selectedCustomerContext.warnings.length ? (
                                  <div className="space-y-2">
                                    {selectedCustomerContext.warnings.map((warning) => (
                                      <div
                                        key={warning}
                                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
                                      >
                                        {warning}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <DetailEmptyState title="No customer warnings." compact />
                                )}
                              </DetailCard>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                              <DetailCard title="Recent Activity">
                                {selectedCustomerContext.recentActivity.length ? (
                                  <div className="divide-y divide-slate-100">
                                    {selectedCustomerContext.recentActivity.map((item) => (
                                      <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <div className="font-semibold text-slate-900">
                                              {item.label}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                              {item.description}
                                            </div>
                                          </div>
                                          <div className="text-sm text-slate-500">
                                            {formatShortDate(item.date)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <DetailEmptyState title="No recent customer activity." compact />
                                )}
                              </DetailCard>

                              <DetailCard title="Quick Actions">
                                <div className="grid gap-2">
                                  {["New Project", "New Quotation", "New Variation", "New Invoice", "Record Payment"].map((label) => (
                                    <Button
                                      key={label}
                                      type="button"
                                      variant="outline"
                                      disabled
                                      title="Available after module integration"
                                      className="justify-start rounded-xl"
                                    >
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              </DetailCard>
                            </div>
                          </TabsContent>

                          <TabsContent value="projects" className="mt-0 space-y-4">
                            <DetailCard title="Projects">
                              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
                                <Input
                                  value={detailProjectSearch}
                                  onChange={(event) => setDetailProjectSearch(event.target.value)}
                                  placeholder="Search projects..."
                                  className="h-11 rounded-xl bg-[#F7F9FB]"
                                />
                                <Select value={detailProjectStatus} onValueChange={setDetailProjectStatus}>
                                  <SelectTrigger className="h-11 rounded-xl bg-[#F7F9FB]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {detailProjectStatuses.map((projectStatus) => (
                                      <SelectItem key={projectStatus} value={projectStatus}>
                                        {projectStatus === "All" ? "All statuses" : projectStatus}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {filteredDetailProjects.length ? (
                                <DetailTable
                                  headers={["Project No.", "Project Name", "Status", "Sites", "Created", "Action"]}
                                  rows={filteredDetailProjects.map((project) => [
                                    project.project_no,
                                    project.project_name,
                                    project.project_status,
                                    String(selectedCustomerContext.sites.filter((site) => site.project_id === project.project_id).length),
                                    formatShortDate(project.created_at),
                                    "View in Projects",
                                  ])}
                                />
                              ) : (
                                <DetailEmptyState title="No projects found." />
                              )}
                            </DetailCard>
                          </TabsContent>

                          <TabsContent value="financial" className="mt-0 space-y-4">
                            {isCurrentUserAdmin && (
                              <>
                                <DetailCard
                                  title="Financial Settings"
                                  action={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleOpenFinancialSettings}
                                      className="h-8 text-xs font-bold"
                                    >
                                      Edit Settings
                                    </Button>
                                  }
                                >
                                  {financialSettingsLoading ? (
                                    <div className="text-center text-sm text-slate-500">Loading...</div>
                                  ) : financialSettingsError ? (
                                    <div className="text-center text-sm text-red-600">
                                      Error loading financial settings
                                    </div>
                                  ) : (
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                      <DetailField
                                        label="Default Currency"
                                        value={customerFinancialSettings?.default_currency || "Not configured"}
                                      />
                                      <DetailField
                                        label="Line Amount Type"
                                        value={customerFinancialSettings?.line_amount_type || "Not configured"}
                                      />
                                      <DetailField
                                        label="Discount %"
                                        value={
                                          customerFinancialSettings?.discount_percent != null
                                            ? `${customerFinancialSettings.discount_percent}%`
                                            : "Not configured"
                                        }
                                      />
                                      <DetailField
                                        label="Payment Terms"
                                        value={
                                          customerFinancialSettings?.payment_terms_type
                                            ? `${customerFinancialSettings.payment_terms_type} (${customerFinancialSettings.payment_terms_days} days)`
                                            : "Not configured"
                                        }
                                      />
                                      <DetailField
                                        label="Credit Limit"
                                        value={
                                          customerFinancialSettings?.credit_limit
                                            ? formatMoney(customerFinancialSettings.credit_limit)
                                            : "No limit configured"
                                        }
                                      />
                                      <DetailField
                                        label="Account Hold"
                                        value={
                                          customerFinancialSettings?.is_account_on_hold
                                            ? `On Hold: ${customerFinancialSettings.account_hold_reason || "No reason provided"}`
                                            : "Not on hold"
                                        }
                                      />
                                      <DetailField
                                        label="Invoice Delivery"
                                        value={customerFinancialSettings?.invoice_delivery_method || "Not configured"}
                                      />
                                      <DetailField
                                        label="Statement Delivery"
                                        value={customerFinancialSettings?.statement_delivery_method || "Not configured"}
                                      />
                                    </div>
                                  )}
                                </DetailCard>

                                <DetailCard title="Xero Settings">
                                  {financialSettingsLoading ? (
                                    <div className="text-center text-sm text-slate-500">Loading...</div>
                                  ) : (
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                      <DetailField
                                        label="Xero Status"
                                        value={customerFinancialSettings?.xero_status || "Not connected"}
                                      />
                                      <DetailField
                                        label="Xero Contact ID"
                                        value={customerFinancialSettings?.xero_contact_id || "Not connected"}
                                      />
                                      <DetailField
                                        label="Xero Contact Name"
                                        value={customerFinancialSettings?.xero_contact_name || "Not connected"}
                                      />
                                      <DetailField
                                        label="Last Synced"
                                        value={
                                          customerFinancialSettings?.xero_last_synced_at
                                            ? formatShortDate(customerFinancialSettings.xero_last_synced_at)
                                            : "Never synced"
                                        }
                                      />
                                      {customerFinancialSettings?.xero_sync_error && (
                                        <div className="md:col-span-2 xl:col-span-3">
                                          <DetailField
                                            label="Sync Error"
                                            value={customerFinancialSettings.xero_sync_error}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DetailCard>
                              </>
                            )}

                            <DetailCard title="Invoices">
                              {selectedCustomerContext.invoices.length ? (
                                <DetailTable
                                  headers={["Invoice No.", "Project", "Issue Date", "Due Date", "Total", "Paid", "Balance", "Status"]}
                                  rows={selectedCustomerContext.invoices.map((invoice) => [
                                    invoice.invoice_no,
                                    selectedCustomerContext.projects.find((project) => project.project_id === invoice.project_id)?.project_no || "-",
                                    formatShortDate(invoice.invoice_date),
                                    formatShortDate(invoice.due_date),
                                    formatMoney(invoice.total_amount),
                                    formatMoney(invoice.paid_amount),
                                    formatMoney(invoice.balance_amount),
                                    invoice.invoice_status,
                                  ])}
                                />
                              ) : (
                                <DetailEmptyState title="No invoices found." />
                              )}
                            </DetailCard>

                            <DetailCard title="Payments">
                              {selectedCustomerContext.payments.length ? (
                                <DetailTable
                                  headers={["Payment No.", "Date", "Invoice", "Method", "Reference", "Amount"]}
                                  rows={selectedCustomerContext.payments.map((payment) => {
                                    const allocation = customerDetail?.allocations.find(
                                      (item) => item.customer_payment_id === payment.customer_payment_id
                                    );
                                    const invoice = selectedCustomerContext.invoices.find(
                                      (item) => item.customer_invoice_id === allocation?.customer_invoice_id
                                    );
                                    return [
                                      payment.payment_no,
                                      formatShortDate(payment.payment_date),
                                      invoice?.invoice_no || "-",
                                      payment.payment_method,
                                      payment.reference_no || "-",
                                      formatMoney(payment.amount),
                                    ];
                                  })}
                                />
                              ) : (
                                <DetailEmptyState title="No payments found." />
                              )}
                            </DetailCard>

                            <DetailCard title="Quotations">
                              {selectedCustomerContext.quotations.length ? (
                                <DetailTable
                                  headers={["Quotation No.", "Project/Site", "Issue Date", "Total", "Status"]}
                                  rows={selectedCustomerContext.quotations.map((quotation) => {
                                    const site = selectedCustomerContext.sites.find(
                                      (item) => item.site_id === quotation.project_site_id
                                    );
                                    const project = selectedCustomerContext.projects.find(
                                      (item) => item.project_id === site?.project_id
                                    );
                                    return [
                                      quotation.quotation_no,
                                      site ? `${project?.project_no || "-"} / ${site.site_code}` : "-",
                                      formatShortDate(quotation.issue_date),
                                      formatMoney(quotation.total_amount),
                                      quotation.quotation_status,
                                    ];
                                  })}
                                />
                              ) : (
                                <DetailEmptyState title="No quotations found." />
                              )}
                            </DetailCard>

                            <DetailCard title="Variations">
                              <DetailEmptyState
                                title="Not available"
                                description="Variation records are not available in the generated Supabase types for this task."
                              />
                            </DetailCard>
                          </TabsContent>

                          <TabsContent value="contact" className="mt-0 space-y-4">
                            <DetailCard title="Customer / Company Information">
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <DetailField label="Customer Code" value={viewingCustomer.customer_code} />
                                <DetailField label="Customer Name" value={viewingCustomer.customer_name} />
                                <DetailField label="Customer Type" value={viewingCustomer.customer_type} />
                                <DetailField label="Phone" value={viewingCustomer.phone || "-"} />
                                <DetailField label="Email" value={viewingCustomer.email || "-"} />
                                <DetailField label="ABN" value={viewingCustomer.abn || "-"} />
                                <DetailField label="Price Book" value={getCustomerPriceBookLabel(viewingCustomer)} />
                                <DetailField label="Status" value={viewingCustomer.is_active ? "Active" : "Inactive"} />
                                <div className="md:col-span-2 xl:col-span-4">
                                  <DetailField label="Notes" value={viewingCustomer.notes || "No notes."} />
                                </div>
                              </div>
                            </DetailCard>

                            <DetailCard title="Contacts">
                              {viewingCustomer.customer_contacts?.length ? (
                                <DetailTable
                                  headers={["Contact Name", "Position", "Phone", "Email", "Primary"]}
                                  rows={viewingCustomer.customer_contacts.map((contact) => [
                                    contact.contact_name,
                                    contact.position || "-",
                                    contact.phone || "-",
                                    contact.email || "-",
                                    contact.is_primary ? "Primary" : "-",
                                  ])}
                                />
                              ) : (
                                <DetailEmptyState title="No contacts found." />
                              )}
                            </DetailCard>

                            <DetailCard title="Addresses">
                              {viewingCustomer.customer_addresses?.length ? (
                                <DetailTable
                                  headers={["Type", "Address Line 1", "Address Line 2", "Suburb", "State", "Postcode", "Country", "Primary"]}
                                  rows={viewingCustomer.customer_addresses.map((addressItem) => [
                                    addressItem.address_type,
                                    addressItem.address_line1,
                                    addressItem.address_line2 || "-",
                                    addressItem.suburb || "-",
                                    addressItem.state || "-",
                                    addressItem.postcode || "-",
                                    addressItem.country || "-",
                                    addressItem.is_primary ? "Primary" : "-",
                                  ])}
                                />
                              ) : (
                                <DetailEmptyState title="No addresses found." />
                              )}
                            </DetailCard>
                          </TabsContent>

                          <TabsContent value="files" className="mt-0">
                            <DetailCard title="Files">
                              <DetailEmptyState
                                title="Customer file storage is not configured yet."
                                description="Future document categories are shown for planning only."
                              />
                              <div className="mt-4 flex flex-wrap gap-2">
                                {[
                                  "Customer Agreement",
                                  "Credit Application",
                                  "Purchase Order",
                                  "Contract",
                                  "ABN Document",
                                  "Correspondence",
                                  "Other",
                                ].map((label) => (
                                  <span
                                    key={label}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </DetailCard>
                          </TabsContent>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </Tabs>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">
            <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Edit Customer
              </DialogTitle>
              <p className="text-sm text-slate-500">
                {editingCustomer?.customer_code || "Customer record"}
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
              <div className="space-y-5 text-sm">
                <CustomerFormSection
                  number="01"
                  title="Customer Profile"
                  description="Core customer details used across projects, quotations, invoices, and reporting."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Customer Type</Label>
                    <Select
                      value={editCustomerType}
                      onValueChange={(value) => {
                        setEditCustomerType(value);
                        if (value === "Residential") {
                          setEditAbn("");
                        }
                        const currentDefault =
                          editCustomerType === "Commercial" ? "Primary Contact" : "Customer";
                        if (!editContactPosition.trim() || editContactPosition === currentDefault) {
                          setEditContactPosition(
                            value === "Commercial" ? "Primary Contact" : "Customer"
                          );
                        }
                      }}
                    >
                      <SelectTrigger className={customerInputClassName}>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                      {editCustomerType === "Commercial"
                        ? "Business / Company Name"
                        : "Customer Name"}
                      </Label>
                    <Input
                      className={customerInputClassName}
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                    />
                    </div>

                  {editCustomerType === "Commercial" && (
                    <div className="space-y-2">
                      <Label>ABN</Label>
                      <Input
                        className={customerInputClassName}
                        value={editAbn}
                        onChange={(e) => setEditAbn(e.target.value)}
                        placeholder="Australian Business Number"
                      />
                    </div>
                  )}

                    <div className="space-y-2">
                    <Label>Price Book</Label>
                    <Select
                      value={editPriceBookId}
                      onValueChange={setEditPriceBookId}
                    >
                      <SelectTrigger className={customerInputClassName}>
                        <SelectValue placeholder="Select default price book" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceBooks.length === 0 ? (
                          <SelectItem value="no-price-book" disabled>
                            No active price books found
                          </SelectItem>
                        ) : (
                          priceBooks.map((priceBook) => (
                            <SelectItem
                              key={priceBook.price_book_id}
                              value={priceBook.price_book_id}
                            >
                              {priceBook.price_book_code}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="02"
                  title="Primary Contact"
                  description="Main person and communication details for this customer."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        className={customerInputClassName}
                        value={editContactName}
                        onChange={(e) => setEditContactName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        className={customerInputClassName}
                        value={editContactPosition}
                        onChange={(e) => setEditContactPosition(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                    <Input
                      className={customerInputClassName}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                    <Input
                      type="email"
                      className={customerInputClassName}
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="03"
                  title="Billing Address"
                  description="Structured Australian billing address saved into dedicated address fields."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address Line 1 / Street Address</Label>
                      <Input
                        className={customerInputClassName}
                        value={editAddressLine1}
                        onChange={(e) => setEditAddressLine1(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Address Line 2 / Unit, Level, Building</Label>
                      <Input
                        className={customerInputClassName}
                        value={editAddressLine2}
                        onChange={(e) => setEditAddressLine2(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Suburb</Label>
                      <Input
                        className={customerInputClassName}
                        value={editSuburb}
                        onChange={(e) => setEditSuburb(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={editStateName || EMPTY_SELECT_VALUE}
                        onValueChange={(value) =>
                          setEditStateName(value === EMPTY_SELECT_VALUE ? "" : value)
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_SELECT_VALUE}>Select state</SelectItem>
                          {AUSTRALIAN_STATES.map((stateCode) => (
                            <SelectItem key={stateCode} value={stateCode}>
                              {stateCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Postcode</Label>
                      <Input
                        className={customerInputClassName}
                        value={editPostcode}
                        onChange={(e) => setEditPostcode(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        className={customerInputClassName}
                        value={editCountry}
                        onChange={(e) => setEditCountry(e.target.value)}
                      />
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="04"
                  title="Notes"
                  description="Optional internal notes for sales, billing, access, or project context."
                >
                <Textarea
                  className={customerTextareaClassName}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
                </CustomerFormSection>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
              <Button
                type="button"
                onClick={handleSaveEditCustomer}
                disabled={customerFormSaving}
                className="h-11 w-full rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
              >
                {customerFormSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        >
          <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">
            <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Add Customer
              </DialogTitle>
              <p className="text-sm text-slate-500">
                Create a customer profile with primary contact and billing address.
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
              <div className="space-y-5 text-sm">
                <CustomerFormSection
                  number="01"
                  title="Customer Profile"
                  description="Core customer details used across projects, quotations, invoices, and reporting."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Customer Type</Label>
                    <Select
                      value={customerType}
                      onValueChange={(value) => {
                        setCustomerType(value);
                        if (value === "Residential") {
                          setAbn("");
                        }
                        const currentDefault =
                          customerType === "Commercial" ? "Primary Contact" : "Customer";
                        if (!contactPosition.trim() || contactPosition === currentDefault) {
                          setContactPosition(
                            value === "Commercial" ? "Primary Contact" : "Customer"
                          );
                        }
                      }}
                    >
                      <SelectTrigger className={customerInputClassName}>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                      {customerType === "Commercial"
                        ? "Business / Company Name"
                        : "Customer Name"}
                      </Label>
                    <Input
                      className={customerInputClassName}
                      value={customerName}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setCustomerName(nextValue);
                        if (!contactName.trim()) {
                          setContactName(nextValue);
                        }
                      }}
                      placeholder={
                        customerType === "Commercial"
                          ? "Business or company name"
                          : "Customer full name"
                      }
                    />
                    </div>

                    {customerType === "Commercial" && (
                      <div className="space-y-2">
                        <Label>ABN</Label>
                        <Input
                          className={customerInputClassName}
                          value={abn}
                          onChange={(e) => setAbn(e.target.value)}
                          placeholder="Australian Business Number"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Price Book</Label>
                    <Select value={priceBookId} onValueChange={setPriceBookId}>
                      <SelectTrigger className={customerInputClassName}>
                        <SelectValue placeholder="Select default price book" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceBooks.length === 0 ? (
                          <SelectItem value="no-price-book" disabled>
                            No active price books found
                          </SelectItem>
                        ) : (
                          priceBooks.map((priceBook) => (
                            <SelectItem
                              key={priceBook.price_book_id}
                              value={priceBook.price_book_id}
                            >
                              {priceBook.price_book_code}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <p className="mt-1 text-xs text-slate-500">
                      Used later for customer material selection, estimates, proposals, and invoices.
                    </p>
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="02"
                  title="Primary Contact"
                  description="Main person and communication details saved as the primary customer contact."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        className={customerInputClassName}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={
                          customerType === "Commercial" ? "Primary contact name" : "Customer full name"
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        className={customerInputClassName}
                        value={contactPosition}
                        onChange={(e) => setContactPosition(e.target.value)}
                        placeholder={
                          customerType === "Commercial" ? "Primary Contact" : "Customer"
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                    <Input
                      className={customerInputClassName}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={
                        customerType === "Commercial"
                          ? "Office or business phone"
                          : "Customer phone"
                      }
                    />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                    <Input
                      type="email"
                      className={customerInputClassName}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        customerType === "Commercial"
                          ? "Accounts or office email"
                          : "Customer email"
                      }
                    />
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="03"
                  title="Billing Address"
                  description="Structured Australian billing address saved into dedicated address fields."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address Line 1 / Street Address</Label>
                      <Input
                        className={customerInputClassName}
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Street number and street name"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Address Line 2 / Unit, Level, Building</Label>
                      <Input
                        className={customerInputClassName}
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Unit, level, building, or suite"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Suburb</Label>
                      <Input
                        className={customerInputClassName}
                        value={suburb}
                        onChange={(e) => setSuburb(e.target.value)}
                        placeholder="Suburb"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={stateName || EMPTY_SELECT_VALUE}
                        onValueChange={(value) =>
                          setStateName(value === EMPTY_SELECT_VALUE ? "" : value)
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_SELECT_VALUE}>Select state</SelectItem>
                          {AUSTRALIAN_STATES.map((stateCode) => (
                            <SelectItem key={stateCode} value={stateCode}>
                              {stateCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Postcode</Label>
                      <Input
                        className={customerInputClassName}
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        placeholder="Postcode"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        className={customerInputClassName}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="04"
                  title="Notes"
                  description="Optional internal notes for sales, billing, access, or project context."
                >
                <Textarea
                  className={customerTextareaClassName}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    customerType === "Commercial"
                      ? "Contact person, billing notes, site notes"
                      : "Access notes, job notes, customer notes"
                  }
                />
                </CustomerFormSection>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
              <Button
                type="button"
                onClick={handleAddCustomer}
                disabled={customerFormSaving}
                className="h-11 w-full rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
              >
                {customerFormSaving ? "Saving..." : "Create Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showFinancialSettingsDialog} onOpenChange={setShowFinancialSettingsDialog}>
          <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-3xl flex-col overflow-hidden rounded-2xl p-0">
            <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Financial Settings
              </DialogTitle>
              <p className="text-sm text-slate-500">
                {viewingCustomer?.customer_code || "Customer"} · Configure payment terms, Xero integration, and account settings
              </p>
            </DialogHeader>

            {financialSettingsError && (
              <div className="border-b border-red-200 bg-red-50 px-5 py-3 sm:px-6">
                <p className="text-sm text-red-600">
                  Error loading financial settings: {(financialSettingsError as Error).message}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
              <div className="space-y-5 text-sm">
                <CustomerFormSection
                  number="01"
                  title="Currency & Tax"
                  description="Default currency and tax configuration for invoicing."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Default Currency</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.defaultCurrency}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            defaultCurrency: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="AUD"
                        maxLength={3}
                      />
                      {financialErrors.defaultCurrency && (
                        <p className="text-xs text-red-600">{financialErrors.defaultCurrency}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Default Tax Type</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.defaultTaxType}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            defaultTaxType: e.target.value,
                          })
                        }
                        placeholder="e.g., Tax on Sales"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default Sales Account Code</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.defaultSalesAccountCode}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            defaultSalesAccountCode: e.target.value,
                          })
                        }
                        placeholder="e.g., 4000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Line Amount Type</Label>
                      <Select
                        value={financialForm.lineAmountType}
                        onValueChange={(value) =>
                          setFinancialForm({
                            ...financialForm,
                            lineAmountType: value as "Exclusive" | "Inclusive",
                          })
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select line amount type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LINE_AMOUNT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="02"
                  title="Payment Terms"
                  description="Payment term settings for customer invoices."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Payment Terms Type</Label>
                      <Select
                        value={financialForm.paymentTermsType}
                        onValueChange={(value) =>
                          setFinancialForm({
                            ...financialForm,
                            paymentTermsType: value as PaymentTermsType,
                          })
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select payment terms type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TERMS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {financialForm.paymentTermsType === "Day of Current Month" ||
                        financialForm.paymentTermsType === "Day of Following Month"
                          ? "Day of Month (1-31)"
                          : "Days (0-365)"}
                      </Label>
                      <Input
                        className={customerInputClassName}
                        type="number"
                        value={financialForm.paymentTermsDays}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            paymentTermsDays: e.target.value,
                          })
                        }
                      />
                      {financialErrors.paymentTermsDays && (
                        <p className="text-xs text-red-600">{financialErrors.paymentTermsDays}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {PAYMENT_TERM_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setFinancialForm({
                                ...financialForm,
                                paymentTermsDays: preset.toString(),
                              })
                            }
                            className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Discount %</Label>
                      <Input
                        className={customerInputClassName}
                        type="number"
                        step="0.01"
                        value={financialForm.discountPercent}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            discountPercent: e.target.value,
                          })
                        }
                      />
                      {financialErrors.discountPercent && (
                        <p className="text-xs text-red-600">{financialErrors.discountPercent}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Credit Limit (Optional)</Label>
                      <Input
                        className={customerInputClassName}
                        type="number"
                        step="0.01"
                        value={financialForm.creditLimit}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            creditLimit: e.target.value,
                          })
                        }
                        placeholder="Leave blank for no limit"
                      />
                      {financialErrors.creditLimit && (
                        <p className="text-xs text-red-600">{financialErrors.creditLimit}</p>
                      )}
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="03"
                  title="Account Hold"
                  description="Temporarily hold or suspend account activity."
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isAccountOnHold"
                        checked={financialForm.isAccountOnHold}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            isAccountOnHold: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <Label htmlFor="isAccountOnHold" className="cursor-pointer">
                        Place account on hold
                      </Label>
                    </div>

                    {financialForm.isAccountOnHold && (
                      <div className="space-y-2">
                        <Label>Hold Reason</Label>
                        <Textarea
                          className={customerTextareaClassName}
                          value={financialForm.accountHoldReason}
                          onChange={(e) =>
                            setFinancialForm({
                              ...financialForm,
                              accountHoldReason: e.target.value,
                            })
                          }
                          placeholder="e.g., Awaiting payment / Credit limit exceeded"
                        />
                        {financialErrors.accountHoldReason && (
                          <p className="text-xs text-red-600">{financialErrors.accountHoldReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="04"
                  title="Delivery Methods"
                  description="How invoices and statements are delivered to this customer."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Invoice Delivery</Label>
                      <Select
                        value={financialForm.invoiceDeliveryMethod}
                        onValueChange={(value) =>
                          setFinancialForm({
                            ...financialForm,
                            invoiceDeliveryMethod: value,
                          })
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(DELIVERY_METHOD_OPTIONS).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Statement Delivery</Label>
                      <Select
                        value={financialForm.statementDeliveryMethod}
                        onValueChange={(value) =>
                          setFinancialForm({
                            ...financialForm,
                            statementDeliveryMethod: value,
                          })
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(DELIVERY_METHOD_OPTIONS).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CustomerFormSection>

                <CustomerFormSection
                  number="05"
                  title="Xero Integration"
                  description="Xero synchronization and contact mapping settings."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Xero Status</Label>
                      <Select
                        value={financialForm.xeroStatus}
                        onValueChange={(value) =>
                          setFinancialForm({
                            ...financialForm,
                            xeroStatus: value,
                          })
                        }
                      >
                        <SelectTrigger className={customerInputClassName}>
                          <SelectValue placeholder="Select Xero status" />
                        </SelectTrigger>
                        <SelectContent>
                          {XERO_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Xero Contact ID</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.xeroContactId}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            xeroContactId: e.target.value,
                          })
                        }
                        placeholder="Xero contact UUID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Xero Contact Name</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.xeroContactName}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            xeroContactName: e.target.value,
                          })
                        }
                        placeholder="Synced from Xero"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Xero Contact Number</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.xeroContactNumber}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            xeroContactNumber: e.target.value,
                          })
                        }
                        placeholder="Xero contact reference"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Xero Branding Theme ID</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.xeroBrandingThemeId}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            xeroBrandingThemeId: e.target.value,
                          })
                        }
                        placeholder="Xero branding theme UUID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Xero Branding Theme Name</Label>
                      <Input
                        className={customerInputClassName}
                        value={financialForm.xeroBrandingThemeName}
                        onChange={(e) =>
                          setFinancialForm({
                            ...financialForm,
                            xeroBrandingThemeName: e.target.value,
                          })
                        }
                        placeholder="Synced from Xero"
                      />
                    </div>

                    {financialForm.xeroLastSyncedAt && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Last Synced</Label>
                        <p className="text-sm text-slate-600">
                          {formatShortDate(financialForm.xeroLastSyncedAt)}
                        </p>
                      </div>
                    )}

                    {financialForm.xeroSyncError && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Sync Error</Label>
                        <p className="text-sm text-red-600">{financialForm.xeroSyncError}</p>
                      </div>
                    )}
                  </div>
                </CustomerFormSection>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelFinancialSettings}
                className="flex-1 h-11 rounded-xl text-sm font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveFinancialSettings}
                disabled={financialFormSaving}
                className="flex-1 h-11 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
              >
                {financialFormSaving ? "Saving..." : "Save Financial Settings"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              All Customers
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {customerSummary.allCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total customer records
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Commercial
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {customerSummary.commercialCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Business / builder customers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Residential
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {customerSummary.residentialCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Home owner customers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Inactive
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {customerSummary.inactiveCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Hidden from new work
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Missing Price Book
            </p>
            <p className="mt-2 text-2xl font-black text-amber-900">
              {customerSummary.missingPriceBookCount}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Needs sales default
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto] xl:items-center">
            <div className="relative min-w-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Search by code, name, contact, address, phone, email, ABN, or price book..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Customer type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintCustomers}
                className="h-10 gap-2 rounded-xl text-xs font-bold"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handlePrintCustomers}
                className="h-10 gap-2 rounded-xl text-xs font-bold"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleExportCsv}
                className="h-10 gap-2 rounded-xl text-xs font-bold"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleExportExcel}
                className="h-10 gap-2 rounded-xl text-xs font-bold"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              Loading customers...
            </div>

          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <div className="font-bold">Failed to load customers.</div>
              <div className="mt-2 text-xs text-red-500">
                Please refresh the page or contact an administrator if the problem continues.
              </div>
            </div>

          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No customers found.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 p-3 md:hidden">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.customer_id}
                    className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900 break-words">
                          {customer.customer_name}
                        </p>
                        <p className="mt-1 text-xs font-mono text-slate-400">
                          {customer.customer_code}
                        </p>
                      </div>

                      <ActiveStatusBadge
                        isActive={customer.is_active}
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {customer.customer_type}
                      </span>

                      {customer.abn && (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                          ABN: {customer.abn}
                        </span>
                      )}

                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                          Price Book: {getCustomerPriceBookCode(customer)}
                        </span>
                      </span>

                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="font-semibold text-slate-800">
                        {getPrimaryContact(customer)?.contact_name || "No primary contact"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {getPrimaryContact(customer)?.position || "Contact"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={14} className="shrink-0 text-slate-400" />
                        <span className="break-all">
                          {getPrimaryContact(customer)?.phone || customer.phone || "-"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail size={14} className="shrink-0 text-slate-400" />
                        <span className="break-all">
                          {getPrimaryContact(customer)?.email || customer.email || "-"}
                        </span>
                      </div>

                      <div className="text-xs leading-relaxed text-slate-500">
                        Address: {formatAddress(getPrimaryAddress(customer))}
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <StandardActions
                          isActive={customer.is_active}
                          onView={() => openViewCustomer(customer)}
                          onEdit={() => openEditCustomer(customer)}
                          onToggleActive={() =>
                            handleToggleCustomerActive(customer)
                          }
                          onDelete={() => handleDeleteCustomer(customer)}
                          size="mobile"
                          align="end"
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              < div className="hidden overflow-x-auto md:block" >
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        ABN
                      </th>
                      <th className="w-[210px] px-6 py-4 text-right font-bold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => {
                      const primaryContact = getPrimaryContact(customer);
                      const primaryAddress = getPrimaryAddress(customer);

                      return (
                        <tr
                          key={customer.customer_id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-base">
                                {customer.customer_name}
                              </span>
                              <span className="text-slate-400 text-xs font-mono mt-1">
                                {customer.customer_code}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200">
                              {customer.customer_type}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 text-slate-600 text-xs">
                              <div className="font-bold text-slate-800">
                                {primaryContact?.contact_name || "-"}
                              </div>

                              <div className="text-slate-500">
                                {primaryContact?.position || "Contact"}
                              </div>

                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                {primaryContact?.phone || customer.phone || "-"}
                              </div>

                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                {primaryContact?.email || customer.email || "-"}
                              </div>
                            </div>
                          </td>

                          <td className="max-w-xs px-6 py-4 text-slate-600">
                            <div className="whitespace-normal text-xs leading-relaxed">
                              {formatAddress(primaryAddress)}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {customer.abn || "-"}
                          </td>

                          <td className="w-[210px] px-6 py-4">
                            <StandardActions
                              isActive={customer.is_active}
                              onView={() => openViewCustomer(customer)}
                              onEdit={() => openEditCustomer(customer)}
                              onToggleActive={() =>
                                handleToggleCustomerActive(customer)
                              }
                              onDelete={() =>
                                handleDeleteCustomer(customer)
                              }
                              size="desktop"
                              align="end"
                            />
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div >
  );
}

function DetailCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-[#9E4B4B]">{icon}</span> : null}
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">
            {title}
          </h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: [string, string][] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-1 break-words text-base font-black text-slate-900">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function DetailTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-white">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`} className="bg-white hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${headers[cellIndex]}-${cellIndex}`}
                    className="px-4 py-3 align-top text-slate-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <div key={`${row[0]}-mobile-${rowIndex}`} className="rounded-xl border border-slate-200 bg-white p-4">
            {row.map((cell, cellIndex) => (
              <div key={`${headers[cellIndex]}-${cellIndex}`} className="grid grid-cols-[120px_1fr] gap-3 py-1 text-sm">
                <span className="font-semibold text-slate-500">{headers[cellIndex]}</span>
                <span className="min-w-0 break-words font-medium text-slate-900">{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailEmptyState({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center",
        compact ? "p-4" : "p-8",
      ].join(" ")}
    >
      <div className="font-bold text-slate-800">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-slate-500">{description}</div>
      ) : null}
    </div>
  );
}
