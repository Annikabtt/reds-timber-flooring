import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Camera,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Loader2,
  Printer,
  Search,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import redsLogo from "@/assets/reds-logo.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const database = supabase as any;

type VariationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Cancelled";

type VariationLine = {
  variation_line_id: string;
  variation_id: string;
  line_no: number;
  product_id: string | null;
  project_area_id: string | null;
  description: string;
  sales_uom_code: string | null;
  unit_of_measure: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  notes: string | null;
  is_optional: boolean;
  products?: {
    product_code: string | null;
    product_name: string | null;
    is_service_item: boolean;
  } | null;
  project_areas?: {
    area_code: string | null;
    area_name: string | null;
  } | null;
};

type VariationRecord = {
  variation_id: string;
  variation_no: string;
  quotation_id: string;
  customer_id: string;
  project_id: string;
  project_site_id: string;
  variation_status: VariationStatus;
  variation_reason: string;
  issue_date: string;
  valid_until: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  sent_at: string | null;
  sent_by: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  customers?: {
    customer_code: string | null;
    customer_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  projects?: {
    project_no: string | null;
    project_name: string | null;
  } | null;
  project_sites?: {
    site_code: string | null;
    site_name: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    suburb: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
  } | null;
  quotations?: {
    quotation_no: string | null;
  } | null;
  variation_lines?: VariationLine[];
};

type RelatedPhoto = {
  photo_id: string;
  photo_url: string;
  signed_url: string;
  caption: string | null;
  taken_at: string | null;
  approval_status: string;
  report_id: string;
  report_date: string;
  area_id: string | null;
  work_order_id: string | null;
  area_name: string;
  work_order_no: string;
  work_order_title: string;
};

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-AU");
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const escapeCsv = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    return [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter(Boolean)
      .map(String)
      .join(" — ") || "Unknown error";
  }
  return String(error || "Unknown error");
};

const statusClass = (status: string) => {
  const styles: Record<string, string> = {
    Draft: "border-slate-200 bg-slate-100 text-slate-700",
    Sent: "border-blue-200 bg-blue-100 text-blue-800",
    Accepted: "border-emerald-200 bg-emerald-100 text-emerald-800",
    Rejected: "border-rose-200 bg-rose-100 text-rose-800",
    Cancelled: "border-zinc-300 bg-zinc-200 text-zinc-700",
  };
  return styles[status] ?? styles.Draft;
};

const getAreaLabel = (line: VariationLine) => {
  const area = line.project_areas;
  if (!area) return "General / No area";
  return [area.area_code, area.area_name].filter(Boolean).join(" — ");
};

const openPrintWindow = (html: string) => {
  const printWindow = window.open("about:blank", "_blank");

  if (!printWindow) {
    toast.error("The browser blocked the report window. Please allow pop-ups.");
    return;
  }

  try {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const startPrint = async () => {
      const images = Array.from(printWindow.document.images);

      await Promise.all(
        images.map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }

              const finish = () => resolve();
              image.addEventListener("load", finish, { once: true });
              image.addEventListener("error", finish, { once: true });
            }),
        ),
      );

      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    };

    if (printWindow.document.readyState === "complete") {
      void startPrint();
    } else {
      printWindow.addEventListener(
        "load",
        () => {
          void startPrint();
        },
        { once: true },
      );

      window.setTimeout(() => {
        if (!printWindow.closed) {
          void startPrint();
        }
      }, 1000);
    }
  } catch (error) {
    printWindow.close();
    toast.error(
      error instanceof Error
        ? `Unable to open the print report: ${error.message}`
        : "Unable to open the print report.",
    );
  }
};

const reportStyles = `
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    background: #e5e7eb;
    padding: 12mm 0;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 8mm;
    background: #fff;
    box-shadow: 0 0 0 1px #d1d5db, 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }

  @media print {
    html,
    body {
      width: 210mm;
      height: 297mm;
      background: #fff;
      padding: 0;
    }

    .page {
      width: auto;
      min-height: auto;
      margin: 0;
      padding: 0;
      box-shadow: none;
      overflow: visible;
    }
  }
  .report-header {
    display: grid;
    grid-template-columns: 42mm 1fr 34mm;
    align-items: center;
    min-height: 18mm;
    background: #9E4B4B;
    color: #fff;
    padding: 3mm 4mm;
  }
  .report-header .logo-wrap {
    width: 36mm;
    height: 13mm;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5mm 2.5mm;
    background: #fff;
    border: 0.3mm solid rgba(255, 255, 255, 0.85);
  }

  .report-header img {
    display: block;
    width: 100%;
    max-width: 31mm;
    max-height: 9mm;
    object-fit: contain;
    object-position: center;
    background: #fff;
  }
  .report-title {
    text-align: center;
  }
  .report-title h1 {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20px;
    letter-spacing: .4px;
    text-transform: uppercase;
  }
  .report-title p {
    margin: 2px 0 0;
    font-size: 8px;
  }
  .report-meta {
    line-height: 1.5;
    font-size: 9px;
  }
  .report-meta strong {
    display: inline-block;
    min-width: 34px;
  }
  .block {
    margin-top: 10px;
    border: 1px solid #B98A8A;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .info-cell {
    min-height: 38px;
    padding: 6px 7px;
    background: #FBF1F1;
    border-right: 1px solid #B98A8A;
    border-bottom: 1px solid #B98A8A;
  }
  .info-cell:nth-child(4n) { border-right: 0; }
  .info-cell.no-bottom { border-bottom: 0; }
  .field-label {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 8px;
  }
  .field-value {
    margin-top: 4px;
    min-height: 11px;
    font-size: 9px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .check-row {
    margin-top: 10px;
    min-height: 24px;
    padding: 6px 7px;
    border: 1px solid #B98A8A;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 11px;
  }
  .check { white-space: nowrap; }
  .section {
    margin-top: 14px;
  }
  .section-title {
    padding: 5px 7px;
    background: #F5DEDE;
    color: #9E4B4B;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 10px;
  }
  .description-box {
    min-height: 75px;
    border-bottom: 1px solid #B98A8A;
    background:
      repeating-linear-gradient(
        to bottom,
        #fff 0,
        #fff 20px,
        #B98A8A 21px,
        #fff 22px
      );
    padding: 7px;
    white-space: pre-wrap;
    line-height: 21px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  thead { display: table-header-group; }
  th {
    padding: 5px 6px;
    background: #9E4B4B;
    color: #fff;
    border: 1px solid #B98A8A;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 8px;
    text-align: center;
  }
  td {
    min-height: 22px;
    padding: 5px 6px;
    border: 1px solid #B98A8A;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  tr { page-break-inside: avoid; }
  .num { text-align: right; }
  .blank-row td { height: 23px; }
  .attachments {
    margin-top: 14px;
    padding: 6px 7px;
    border: 1px solid #B98A8A;
  }
  .signatures {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .signature-title {
    padding: 5px 7px;
    background: #F5DEDE;
    color: #9E4B4B;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
  }
  .signature-line {
    min-height: 21px;
    padding: 6px 0 2px;
    border-bottom: 1px solid #B98A8A;
  }
  .financial-note {
    margin-top: 8px;
    text-align: right;
    font-size: 8px;
  }
  .footer-note {
    margin-top: 8px;
    color: #555;
    font-size: 7px;
  }
  .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .photo-card { border: 1px solid #B98A8A; page-break-inside: avoid; }
  .photo-card img { width: 100%; height: 210px; object-fit: contain; background: #f8f8f8; display: block; }
  .photo-meta { padding: 7px; background: #FBF1F1; line-height: 1.45; }
`;

const buildVariationReportHtml = (record: VariationRecord) => {
  const lines = record.variation_lines ?? [];
  const materialLines = lines.filter(
    (line) => !line.products?.is_service_item,
  );
  const labourLines = lines.filter(
    (line) => line.products?.is_service_item,
  );
  const logoUrl = new URL(redsLogo, window.location.origin).href;

  const materialRows = materialLines
    .map(
      (line) => `
        <tr>
          <td style="width:60%">
            <strong>${escapeHtml(line.description)}</strong>
            ${
              line.products?.product_code
                ? `<br>${escapeHtml(line.products.product_code)}`
                : ""
            }
            <br><span>${escapeHtml(getAreaLabel(line))}</span>
          </td>
          <td class="num" style="width:20%">${escapeHtml(
            Number(line.quantity).toLocaleString("en-AU"),
          )}</td>
          <td style="width:20%; text-align:center">${escapeHtml(
            line.sales_uom_code ?? line.unit_of_measure ?? "",
          )}</td>
        </tr>
      `,
    )
    .join("");

  const labourRows = labourLines
    .map(
      (line) => `
        <tr>
          <td style="width:50%">
            <strong>${escapeHtml(line.description)}</strong>
            ${
              line.products?.product_name
                ? `<br>${escapeHtml(line.products.product_name)}`
                : ""
            }
          </td>
          <td class="num" style="width:25%"></td>
          <td class="num" style="width:25%">${escapeHtml(
            Number(line.quantity).toLocaleString("en-AU"),
          )} ${escapeHtml(
            line.sales_uom_code ?? line.unit_of_measure ?? "",
          )}</td>
        </tr>
      `,
    )
    .join("");

  const materialBlankRows = Math.max(0, 5 - materialLines.length);
  const labourBlankRows = Math.max(0, 4 - labourLines.length);

  const description = [
    record.variation_reason,
    ...lines.map((line) => line.description),
    record.notes,
  ]
    .filter(Boolean)
    .join("\n");

  const projectLabel = [
    record.projects?.project_no,
    record.projects?.project_name,
  ]
    .filter(Boolean)
    .join(" — ");

  const siteLabel = [
    record.project_sites?.site_code,
    record.project_sites?.site_name,
  ]
    .filter(Boolean)
    .join(" — ");

  const unitLocation = Array.from(
    new Set(lines.map(getAreaLabel).filter(Boolean)),
  ).join(", ");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(record.variation_no)} — Variation Record</title>
      <style>${reportStyles}</style>
    </head>
    <body>
      <div class="page">
        <div class="report-header">
          <div class="logo-wrap">
            <img src="${logoUrl}" alt="REDS Timber Flooring" />
          </div>
          <div class="report-title">
            <h1>Variation Record</h1>
            <p>Site Instruction &amp; Cost Tracking Sheet</p>
          </div>
          <div class="report-meta">
            <div><strong>VR #:</strong> ${escapeHtml(record.variation_no)}</div>
            <div><strong>Date:</strong> ${escapeHtml(
              formatDate(record.issue_date),
            )}</div>
          </div>
        </div>

        <div class="block info-grid">
          <div class="info-cell">
            <div class="field-label">Builder:</div>
            <div class="field-value">${escapeHtml(
              record.customers?.customer_name,
            )}</div>
          </div>
          <div class="info-cell">
            <div class="field-label">Project:</div>
            <div class="field-value">${escapeHtml(projectLabel)}</div>
          </div>
          <div class="info-cell">
            <div class="field-label">Unit / Location:</div>
            <div class="field-value">${escapeHtml(
              unitLocation || siteLabel,
            )}</div>
          </div>
          <div class="info-cell">
            <div class="field-label">Trade / Contractor:</div>
            <div class="field-value">REDS Timber Flooring</div>
          </div>

          <div class="info-cell no-bottom">
            <div class="field-label">Site Representative:</div>
            <div class="field-value"></div>
          </div>
          <div class="info-cell no-bottom">
            <div class="field-label">SI / Ref:</div>
            <div class="field-value">${escapeHtml(
              record.quotations?.quotation_no,
            )}</div>
          </div>
          <div class="info-cell no-bottom" style="grid-column: span 2; border-right:0">
            <div class="field-label">Priority:</div>
            <div class="field-value">☑ Standard &nbsp;&nbsp; ☐ Urgent</div>
          </div>
        </div>

        <div class="check-row">
          <span class="check">☑ Additional Work</span>
          <span class="check">☐ Omission</span>
          <span class="check">☐ Design Change</span>
          <span class="check">☐ Rework / Defect</span>
          <span class="check">☐ Other: __________________</span>
        </div>

        <div class="check-row">
          <span><strong>Reason:</strong></span>
          <span class="check">☐ Client Request</span>
          <span class="check">☐ Design / Doc Error</span>
          <span class="check">☐ Site Condition</span>
          <span class="check">☐ RFI Response</span>
          <span class="check">☐ Defect Rework</span>
          <span class="check">☑ Other: ${escapeHtml(
            record.variation_reason,
          )}</span>
        </div>

        <div class="section">
          <div class="section-title">Description of Variation Works</div>
          <div class="description-box">${escapeHtml(description)}</div>
        </div>

        <div class="section">
          <div class="section-title">Materials</div>
          <table>
            <thead>
              <tr>
                <th style="width:60%">Item / Description</th>
                <th style="width:20%">Qty</th>
                <th style="width:20%">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${materialRows}
              ${Array.from(
                { length: materialBlankRows },
                () => `<tr class="blank-row"><td></td><td></td><td></td></tr>`,
              ).join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Labour</div>
          <table>
            <thead>
              <tr>
                <th style="width:50%">Trade / Role</th>
                <th style="width:25%">No. Workers</th>
                <th style="width:25%">Hours</th>
              </tr>
            </thead>
            <tbody>
              ${labourRows}
              ${Array.from(
                { length: labourBlankRows },
                () => `<tr class="blank-row"><td></td><td></td><td></td></tr>`,
              ).join("")}
            </tbody>
          </table>
        </div>

        <div class="financial-note">
          Subtotal: ${escapeHtml(formatMoney(record.subtotal))}
          &nbsp;&nbsp; Discount: ${escapeHtml(
            formatMoney(record.discount_amount),
          )}
          &nbsp;&nbsp; Tax: ${escapeHtml(formatMoney(record.tax_amount))}
          &nbsp;&nbsp; <strong>Total: ${escapeHtml(
            formatMoney(record.total_amount),
          )}</strong>
        </div>

        <div class="attachments">
          <strong>Attachments:</strong>
          &nbsp; ☐ Photos
          &nbsp; ☐ Sketch / Marked-up Drawing
          &nbsp; ☐ Site Instruction
          &nbsp; ☐ Supplier Quote
          &nbsp; ☑ None attached directly
        </div>

        <div class="signatures">
          <div>
            <div class="signature-title">Submitted by (REDS / Contractor)</div>
            <div class="signature-line"><strong>Name:</strong> ${escapeHtml(
              record.sent_by || "",
            )}</div>
            <div class="signature-line"><strong>Signed:</strong></div>
            <div class="signature-line"><strong>Date:</strong> ${escapeHtml(
              formatDateTime(record.sent_at),
            )}</div>
          </div>
          <div>
            <div class="signature-title">Approved by (Site Representative)</div>
            <div class="signature-line"><strong>Name:</strong> ${escapeHtml(
              record.accepted_by || "",
            )}</div>
            <div class="signature-line"><strong>Signed:</strong></div>
            <div class="signature-line"><strong>Date:</strong> ${escapeHtml(
              formatDateTime(record.accepted_at),
            )}</div>
          </div>
        </div>

        <div class="footer-note">
          Status: ${escapeHtml(record.variation_status)}.
          Related project photos, when available, are printed separately from the Variation Record.
        </div>
      </div>
    </body>
  </html>`;
};

const buildPhotoReportHtml = (
  record: VariationRecord,
  photos: RelatedPhoto[]
) => {
  const logoUrl = new URL(redsLogo, window.location.origin).href;
  const cards = photos
    .map(
      (photo, index) => `
        <div class="photo-card">
          <img src="${escapeHtml(photo.signed_url)}" alt="Related project photo ${
            index + 1
          }" />
          <div class="photo-meta">
            <strong>Photo ${index + 1}</strong><br>
            Report date: ${escapeHtml(formatDate(photo.report_date))}<br>
            Area: ${escapeHtml(photo.area_name)}<br>
            Work order: ${escapeHtml(
              [photo.work_order_no, photo.work_order_title]
                .filter(Boolean)
                .join(" — ") || "Not specified"
            )}<br>
            Taken: ${escapeHtml(formatDateTime(photo.taken_at))}<br>
            Approval: ${escapeHtml(photo.approval_status)}<br>
            Caption: ${escapeHtml(photo.caption || "—")}
          </div>
        </div>
      `
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(record.variation_no)} — Related Project Photos</title>
      <style>${reportStyles}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <img class="logo" src="${logoUrl}" alt="REDS Timber Flooring" />
          <div class="doc-title">
            <h1>Related Project Photos</h1>
            <p>Variation context: <strong>${escapeHtml(
              record.variation_no
            )}</strong></p>
            <p>These photos are linked through Daily Reports, not attached directly to the Variation.</p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info wide"><div class="label">Customer</div><div class="value">${escapeHtml(
            record.customers?.customer_name
          )}</div></div>
          <div class="info wide"><div class="label">Project</div><div class="value">${escapeHtml(
            record.projects?.project_name
          )}</div></div>
          <div class="info wide"><div class="label">Site</div><div class="value">${escapeHtml(
            record.project_sites?.site_name
          )}</div></div>
          <div class="info wide"><div class="label">Variation Areas</div><div class="value">${escapeHtml(
            Array.from(
              new Set((record.variation_lines ?? []).map(getAreaLabel))
            ).join(", ")
          )}</div></div>
        </div>
        <div class="section-title">Photos (${photos.length})</div>
        <div class="photo-grid">${
          cards || "<div>No related project photos found.</div>"
        }</div>
        <div class="footer">
          <span>Source: Daily Reports / daily_report_photos</span>
          <span>Printed ${escapeHtml(new Date().toLocaleString("en-AU"))}</span>
        </div>
      </div>
    </body>
  </html>`;
};

const VariationRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewingRecord, setViewingRecord] = useState<VariationRecord | null>(
    null
  );
  const [photoRecord, setPhotoRecord] = useState<VariationRecord | null>(null);

  const recordsQuery = useQuery({
    queryKey: ["variation-records-read-only"],
    staleTime: 0,
    refetchOnMount: "always",
    retry: 2,
    queryFn: async (): Promise<VariationRecord[]> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        throw new Error(
          "Your authenticated session is not ready. Please wait a moment and refresh the page.",
        );
      }

      const permissionCodes = [
        "variations.view",
        "variations.view_internal",
        "variations.view_cost",
        "variations.view_margin",
      ] as const;

      const permissionResults = await Promise.all(
        permissionCodes.map(async (permissionCode) => {
          const { data, error } = await database.rpc("has_permission", {
            p_permission_code: permissionCode,
          });

          if (error) {
            throw error;
          }

          return {
            permissionCode,
            allowed: Boolean(data),
          };
        }),
      );

      const missingPermissions = permissionResults
        .filter((result) => !result.allowed)
        .map((result) => result.permissionCode);

      if (missingPermissions.length > 0) {
        throw new Error(
          `Variation Record access requires: ${missingPermissions.join(", ")}`,
        );
      }

      const variationResult = await database
        .from("variations")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (variationResult.error) throw variationResult.error;

      const baseRecords = (variationResult.data ?? []) as VariationRecord[];
      if (baseRecords.length === 0) return [];

      const variationIds = baseRecords.map((record) => record.variation_id);
      const customerIds = Array.from(new Set(baseRecords.map((record) => record.customer_id).filter(Boolean)));
      const projectIds = Array.from(new Set(baseRecords.map((record) => record.project_id).filter(Boolean)));
      const siteIds = Array.from(new Set(baseRecords.map((record) => record.project_site_id).filter(Boolean)));
      const quotationIds = Array.from(new Set(baseRecords.map((record) => record.quotation_id).filter(Boolean)));

      const [lineResult, customerResult, projectResult, siteResult, quotationResult] = await Promise.all([
        database.from("variation_lines").select("*").in("variation_id", variationIds).eq("is_deleted", false).order("line_no"),
        database.from("customers").select("customer_id,customer_code,customer_name,phone,email").in("customer_id", customerIds).eq("is_deleted", false),
        database.from("projects").select("project_id,project_no,project_name").in("project_id", projectIds).eq("is_deleted", false),
        database
          .from("project_sites")
          .select(
            "site_id,site_code,site_name,address_line_1,address_line_2,suburb,state,postcode,country",
          )
          .in("site_id", siteIds)
          .eq("is_deleted", false),
        database.from("quotations").select("quotation_id,quotation_no").in("quotation_id", quotationIds).eq("is_deleted", false),
      ]);

      const firstError = [lineResult.error, customerResult.error, projectResult.error, siteResult.error, quotationResult.error].find(Boolean);
      if (firstError) throw firstError;

      const lines = (lineResult.data ?? []) as VariationLine[];
      const productIds = Array.from(new Set(lines.map((line) => line.product_id).filter(Boolean)));
      const areaIds = Array.from(new Set(lines.map((line) => line.project_area_id).filter(Boolean)));

      const [productResult, areaResult] = await Promise.all([
        productIds.length
          ? database.from("products").select("product_id,product_code,product_name,is_service_item").in("product_id", productIds)
          : Promise.resolve({ data: [], error: null }),
        areaIds.length
          ? database.from("project_areas").select("area_id,area_code,area_name").in("area_id", areaIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (productResult.error) throw productResult.error;
      if (areaResult.error) throw areaResult.error;

      type CustomerLookup = NonNullable<VariationRecord["customers"]>;
      type ProjectLookup = NonNullable<VariationRecord["projects"]>;
      type SiteLookup = NonNullable<VariationRecord["project_sites"]>;
      type QuotationLookup = NonNullable<VariationRecord["quotations"]>;
      type ProductLookup = NonNullable<VariationLine["products"]>;
      type AreaLookup = NonNullable<VariationLine["project_areas"]>;

      const customerMap = new Map<string, CustomerLookup>(
        (customerResult.data ?? []).map((item: any) => [
          String(item.customer_id),
          {
            customer_code: item.customer_code ?? null,
            customer_name: item.customer_name ?? null,
            phone: item.phone ?? null,
            email: item.email ?? null,
          },
        ]),
      );

      const projectMap = new Map<string, ProjectLookup>(
        (projectResult.data ?? []).map((item: any) => [
          String(item.project_id),
          {
            project_no: item.project_no ?? null,
            project_name: item.project_name ?? null,
          },
        ]),
      );

      const siteMap = new Map<string, SiteLookup>(
        (siteResult.data ?? []).map((item: any) => [
          String(item.site_id),
          {
            site_code: item.site_code ?? null,
            site_name: item.site_name ?? null,
            address_line_1: item.address_line_1 ?? null,
            address_line_2: item.address_line_2 ?? null,
            suburb: item.suburb ?? null,
            state: item.state ?? null,
            postcode: item.postcode ?? null,
            country: item.country ?? null,
          },
        ]),
      );

      const quotationMap = new Map<string, QuotationLookup>(
        (quotationResult.data ?? []).map((item: any) => [
          String(item.quotation_id),
          {
            quotation_no: item.quotation_no ?? null,
          },
        ]),
      );

      const productMap = new Map<string, ProductLookup>(
        (productResult.data ?? []).map((item: any) => [
          String(item.product_id),
          {
            product_code: item.product_code ?? null,
            product_name: item.product_name ?? null,
            is_service_item: Boolean(item.is_service_item),
          },
        ]),
      );

      const areaMap = new Map<string, AreaLookup>(
        (areaResult.data ?? []).map((item: any) => [
          String(item.area_id),
          {
            area_code: item.area_code ?? null,
            area_name: item.area_name ?? null,
          },
        ]),
      );

      const linesByVariation = new Map<string, VariationLine[]>();
      lines.forEach((line) => {
        const enrichedLine: VariationLine = {
          ...line,
          products: line.product_id ? productMap.get(line.product_id) ?? null : null,
          project_areas: line.project_area_id ? areaMap.get(line.project_area_id) ?? null : null,
        };
        const current = linesByVariation.get(line.variation_id) ?? [];
        current.push(enrichedLine);
        linesByVariation.set(line.variation_id, current);
      });

      return baseRecords.map(
        (record): VariationRecord => ({
          ...record,
          customers: customerMap.get(record.customer_id) ?? null,
          projects: projectMap.get(record.project_id) ?? null,
          project_sites: siteMap.get(record.project_site_id) ?? null,
          quotations: quotationMap.get(record.quotation_id) ?? null,
          variation_lines: linesByVariation.get(record.variation_id) ?? [],
        }),
      );
    },
  });

  const relatedPhotosQuery = useQuery({
    queryKey: ["variation-related-photos", photoRecord?.variation_id],
    enabled: Boolean(photoRecord),
    queryFn: async (): Promise<RelatedPhoto[]> => {
      if (!photoRecord) return [];

      const areaIds = Array.from(
        new Set(
          (photoRecord.variation_lines ?? [])
            .map((line) => line.project_area_id)
            .filter((value): value is string => Boolean(value))
        )
      );

      let reportsRequest = database
        .from("daily_reports")
        .select(`
          report_id,
          report_date,
          area_id,
          work_order_id,
          project_areas (
            area_name
          ),
          work_orders (
            work_order_no,
            title
          ),
          daily_report_photos (
            photo_id,
            photo_url,
            caption,
            taken_at,
            approval_status,
            is_deleted,
            sort_order
          )
        `)
        .eq("project_id", photoRecord.project_id)
        .eq("site_id", photoRecord.project_site_id)
        .eq("is_deleted", false)
        .eq("daily_report_photos.is_deleted", false)
        .order("report_date", { ascending: false });

      if (areaIds.length > 0) {
        reportsRequest = reportsRequest.in("area_id", areaIds);
      }

      const { data, error } = await reportsRequest;
      if (error) throw error;

      const flattened: Array<Omit<RelatedPhoto, "signed_url">> = [];

      for (const report of data ?? []) {
        for (const photo of report.daily_report_photos ?? []) {
          flattened.push({
            photo_id: photo.photo_id,
            photo_url: photo.photo_url,
            caption: photo.caption,
            taken_at: photo.taken_at,
            approval_status: photo.approval_status,
            report_id: report.report_id,
            report_date: report.report_date,
            area_id: report.area_id,
            work_order_id: report.work_order_id,
            area_name: report.project_areas?.area_name ?? "General / No area",
            work_order_no: report.work_orders?.work_order_no ?? "",
            work_order_title: report.work_orders?.title ?? "",
          });
        }
      }

      const signed = await Promise.all(
        flattened.map(async (photo) => {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("daily-report-photos")
              .createSignedUrl(photo.photo_url, 60 * 60);

          return {
            ...photo,
            signed_url: signedError ? "" : signedData?.signedUrl ?? "",
          };
        })
      );

      return signed.filter((photo) => Boolean(photo.signed_url));
    },
  });

  const records = recordsQuery.data ?? [];

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => {
      map.set(record.customer_id, record.customers?.customer_name ?? "Unknown");
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [records]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    records
      .filter(
        (record) =>
          customerFilter === "all" || record.customer_id === customerFilter
      )
      .forEach((record) => {
        map.set(record.project_id, record.projects?.project_name ?? "Unknown");
      });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [records, customerFilter]);

  const sites = useMemo(() => {
    const map = new Map<string, string>();
    records
      .filter(
        (record) =>
          (customerFilter === "all" ||
            record.customer_id === customerFilter) &&
          (projectFilter === "all" || record.project_id === projectFilter)
      )
      .forEach((record) => {
        map.set(
          record.project_site_id,
          record.project_sites?.site_name ?? "Unknown"
        );
      });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [records, customerFilter, projectFilter]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = [
        record.variation_no,
        record.variation_reason,
        record.customers?.customer_name,
        record.projects?.project_no,
        record.projects?.project_name,
        record.project_sites?.site_code,
        record.project_sites?.site_name,
        record.quotations?.quotation_no,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!search || searchable.includes(search)) &&
        (statusFilter === "all" ||
          record.variation_status === statusFilter) &&
        (customerFilter === "all" ||
          record.customer_id === customerFilter) &&
        (projectFilter === "all" || record.project_id === projectFilter) &&
        (siteFilter === "all" ||
          record.project_site_id === siteFilter) &&
        (!dateFrom || record.issue_date >= dateFrom) &&
        (!dateTo || record.issue_date <= dateTo)
      );
    });
  }, [
    records,
    searchTerm,
    statusFilter,
    customerFilter,
    projectFilter,
    siteFilter,
    dateFrom,
    dateTo,
  ]);

  const summary = useMemo(
    () => ({
      allRecords: records.length,
      filteredRecords: filteredRecords.length,
      accepted: filteredRecords.filter(
        (record) => record.variation_status === "Accepted"
      ).length,
      pending: filteredRecords.filter((record) =>
        ["Draft", "Sent"].includes(record.variation_status)
      ).length,
      totalValue: filteredRecords.reduce(
        (sum, record) => sum + Number(record.total_amount || 0),
        0
      ),
    }),
    [filteredRecords]
  );

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCustomerFilter("all");
    setProjectFilter("all");
    setSiteFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const exportCsv = () => {
    const headers = [
      "Variation No",
      "Status",
      "Issue Date",
      "Customer",
      "Project",
      "Site",
      "Quotation",
      "Reason",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
    ];

    const rows = filteredRecords.map((record) => [
      record.variation_no,
      record.variation_status,
      record.issue_date,
      record.customers?.customer_name ?? "",
      record.projects?.project_name ?? "",
      record.project_sites?.site_name ?? "",
      record.quotations?.quotation_no ?? "",
      record.variation_reason,
      record.subtotal,
      record.discount_amount,
      record.tax_amount,
      record.total_amount,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `variation-records-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printRecord = (record: VariationRecord) =>
    openPrintWindow(buildVariationReportHtml(record));

  const relatedPhotos = relatedPhotosQuery.data ?? [];

  return (
    <div className="w-full space-y-5 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex lg:items-start lg:justify-between lg:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5DEDE]">
            <FileText className="h-6 w-6 text-[#9E4B4B]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
              Variation Record
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Read-only reporting from existing Variation and Daily Report data.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 lg:mt-0 lg:justify-end">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filteredRecords.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="All Records" value={String(summary.allRecords)} />
        <SummaryCard
          label="Filtered Records"
          value={String(summary.filteredRecords)}
        />
        <SummaryCard label="Accepted" value={String(summary.accepted)} />
        <SummaryCard
          label="Filtered Value"
          value={formatMoney(summary.totalValue)}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search variation, customer, project, site or quotation"
              className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10 hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="All statuses"
            items={[
              ["all", "All statuses"],
              ["Draft", "Draft"],
              ["Sent", "Sent"],
              ["Accepted", "Accepted"],
              ["Rejected", "Rejected"],
              ["Cancelled", "Cancelled"],
            ]}
          />

          <FilterSelect
            value={customerFilter}
            onValueChange={(value) => {
              setCustomerFilter(value);
              setProjectFilter("all");
              setSiteFilter("all");
            }}
            placeholder="All customers"
            items={[["all", "All customers"], ...customers]}
          />

          <FilterSelect
            value={projectFilter}
            onValueChange={(value) => {
              setProjectFilter(value);
              setSiteFilter("all");
            }}
            placeholder="All projects"
            items={[["all", "All projects"], ...projects]}
          />

          <FilterSelect
            value={siteFilter}
            onValueChange={setSiteFilter}
            placeholder="All sites"
            items={[["all", "All sites"], ...sites]}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="variation-issue-date-from"
              className="text-xs font-bold uppercase tracking-wide text-slate-600"
            >
              Issue Date From
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="variation-issue-date-from"
                type="date"
                lang="en-AU"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10 hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                aria-label="Issue Date From"
                title="Select the start date (DD/MM/YYYY)"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="variation-issue-date-to"
              className="text-xs font-bold uppercase tracking-wide text-slate-600"
            >
              Issue Date To
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="variation-issue-date-to"
                type="date"
                lang="en-AU"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10 hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30"
                aria-label="Issue Date To"
                title="Select the end date (DD/MM/YYYY)"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {recordsQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Variation Records...
          </div>
        ) : recordsQuery.isError ? (
          <div className="p-8 text-center text-rose-700">
            Unable to load Variation Records:{" "}
            {getErrorMessage(recordsQuery.error)}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 font-bold text-slate-900">
              {records.length === 0
                ? "No Variation records are available"
                : "No records match the current filters"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {records.length === 0
                ? "No readable Variation records were returned. Refresh after your signed-in permissions have loaded, or verify Variation report access."
                : "Clear or adjust Customer, Project, Site, Status and Issue Date filters."}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {records.length === 0 ? (
                <Button
                  variant="outline"
                  onClick={() => recordsQuery.refetch()}
                  disabled={recordsQuery.isFetching}
                >
                  {recordsQuery.isFetching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4 rotate-180" />
                  )}
                  Refresh Records
                </Button>
              ) : (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#9E4B4B] text-left text-xs uppercase tracking-wide text-white">
                    <th className="px-4 py-3">Variation</th>
                    <th className="px-4 py-3">Customer / Project</th>
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.variation_id}
                      className="border-b border-[#B98A8A]/45 align-top last:border-b-0 hover:bg-[#FBF1F1]/60"
                    >
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900">
                          {record.variation_no}
                        </div>
                        <div className="mt-1 max-w-xs text-xs text-slate-500">
                          {record.variation_reason}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {record.customers?.customer_name ?? "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {[record.projects?.project_no, record.projects?.project_name]
                            .filter(Boolean)
                            .join(" — ") || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {[record.project_sites?.site_code, record.project_sites?.site_name]
                          .filter(Boolean)
                          .join(" — ") || "—"}
                      </td>
                      <td className="px-4 py-4">{formatDate(record.issue_date)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                            record.variation_status
                          )}`}
                        >
                          {record.variation_status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold">
                        {formatMoney(record.total_amount)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            label="View"
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => setViewingRecord(record)}
                          />
                          <ActionButton
                            label="Related Photos"
                            icon={<Camera className="h-4 w-4" />}
                            onClick={() => setPhotoRecord(record)}
                          />
                          <ActionButton
                            label="Print"
                            icon={<Printer className="h-4 w-4" />}
                            onClick={() => printRecord(record)}
                          />
                          <ActionButton
                            label="Export PDF"
                            icon={<FileDown className="h-4 w-4" />}
                            onClick={() => printRecord(record)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#B98A8A]/45 lg:hidden">
              {filteredRecords.map((record) => (
                <article key={record.variation_id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black text-slate-900">
                        {record.variation_no}
                      </h2>
                      <p className="mt-1 text-sm font-semibold">
                        {record.customers?.customer_name ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                        record.variation_status
                      )}`}
                    >
                      {record.variation_status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#FBF1F1] p-3 text-sm">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">
                        Project
                      </div>
                      <div className="mt-1">
                        {record.projects?.project_name ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">
                        Site
                      </div>
                      <div className="mt-1">
                        {record.project_sites?.site_name ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">
                        Issue date
                      </div>
                      <div className="mt-1">{formatDate(record.issue_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">
                        Total
                      </div>
                      <div className="mt-1 font-bold">
                        {formatMoney(record.total_amount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRecord(record)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotoRecord(record)}
                    >
                      <Camera className="mr-1 h-4 w-4" />
                      Photos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printRecord(record)}
                    >
                      <Printer className="mr-1 h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printRecord(record)}
                    >
                      <FileDown className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <Dialog
        open={Boolean(viewingRecord)}
        onOpenChange={(open) => !open && setViewingRecord(null)}
      >
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto p-0">
          {viewingRecord && (
            <>
              <DialogHeader className="border-b border-slate-200 px-5 py-4">
                <DialogTitle className="flex flex-wrap items-center justify-between gap-3 pr-8">
                  <span>
                    Variation Record — {viewingRecord.variation_no}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs ${statusClass(
                      viewingRecord.variation_status
                    )}`}
                  >
                    {viewingRecord.variation_status}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 p-5">
                <div className="grid gap-px overflow-hidden rounded-xl border border-[#B98A8A] bg-[#B98A8A] sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCell
                    label="Customer"
                    value={viewingRecord.customers?.customer_name}
                    wide
                  />
                  <InfoCell
                    label="Quotation"
                    value={viewingRecord.quotations?.quotation_no}
                  />
                  <InfoCell
                    label="Issue Date"
                    value={formatDate(viewingRecord.issue_date)}
                  />
                  <InfoCell
                    label="Project"
                    value={[
                      viewingRecord.projects?.project_no,
                      viewingRecord.projects?.project_name,
                    ]
                      .filter(Boolean)
                      .join(" — ")}
                    wide
                  />
                  <InfoCell
                    label="Site"
                    value={[
                      viewingRecord.project_sites?.site_code,
                      viewingRecord.project_sites?.site_name,
                    ]
                      .filter(Boolean)
                      .join(" — ")}
                    wide
                  />
                  <InfoCell
                    label="Reason"
                    value={viewingRecord.variation_reason}
                    wide
                  />
                  <InfoCell
                    label="Valid Until"
                    value={formatDate(viewingRecord.valid_until)}
                  />
                </div>

                <section>
                  <div className="rounded-t-xl border border-[#B98A8A] bg-[#F5DEDE] px-4 py-2 font-black text-slate-900">
                    Variation Lines
                  </div>
                  <div className="overflow-x-auto rounded-b-xl border-x border-b border-[#B98A8A]">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-[#9E4B4B] text-white">
                        <tr>
                          <th className="px-3 py-2 text-left">No.</th>
                          <th className="px-3 py-2 text-left">Product</th>
                          <th className="px-3 py-2 text-left">Description / Area</th>
                          <th className="px-3 py-2 text-left">UOM</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Unit Price</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingRecord.variation_lines ?? []).map((line) => (
                          <tr
                            key={line.variation_line_id}
                            className="border-b border-[#B98A8A]/50 last:border-b-0"
                          >
                            <td className="px-3 py-3">{line.line_no}</td>
                            <td className="px-3 py-3">
                              <div className="font-semibold">
                                {line.products?.product_code ?? "—"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {line.products?.product_name ?? ""}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-semibold">{line.description}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {getAreaLabel(line)}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {line.sales_uom_code ?? line.unit_of_measure ?? "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {Number(line.quantity).toLocaleString("en-AU")}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {formatMoney(line.unit_price)}
                            </td>
                            <td className="px-3 py-3 text-right font-bold">
                              {formatMoney(line.line_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                  <section>
                    <div className="rounded-t-xl border border-[#B98A8A] bg-[#F5DEDE] px-4 py-2 font-black">
                      Notes
                    </div>
                    <div className="min-h-28 rounded-b-xl border-x border-b border-[#B98A8A] p-4 whitespace-pre-wrap">
                      {viewingRecord.notes || "No notes recorded."}
                    </div>
                  </section>
                  <section className="overflow-hidden rounded-xl border border-[#B98A8A]">
                    <SummaryRow
                      label="Subtotal"
                      value={formatMoney(viewingRecord.subtotal)}
                    />
                    <SummaryRow
                      label="Discount"
                      value={formatMoney(viewingRecord.discount_amount)}
                    />
                    <SummaryRow
                      label="Tax"
                      value={formatMoney(viewingRecord.tax_amount)}
                    />
                    <SummaryRow
                      label="Total"
                      value={formatMoney(viewingRecord.total_amount)}
                      strong
                    />
                  </section>
                </div>

                <section>
                  <div className="rounded-t-xl border border-[#B98A8A] bg-[#F5DEDE] px-4 py-2 font-black">
                    Workflow Audit
                  </div>
                  <div className="grid gap-3 rounded-b-xl border-x border-b border-[#B98A8A] p-4 sm:grid-cols-2">
                    <AuditCell
                      label="Sent"
                      at={viewingRecord.sent_at}
                      by={viewingRecord.sent_by}
                    />
                    <AuditCell
                      label="Accepted"
                      at={viewingRecord.accepted_at}
                      by={viewingRecord.accepted_by}
                    />
                    <AuditCell
                      label="Rejected"
                      at={viewingRecord.rejected_at}
                      by={viewingRecord.rejected_by}
                      reason={viewingRecord.rejection_reason}
                    />
                    <AuditCell
                      label="Cancelled"
                      at={viewingRecord.cancelled_at}
                      by={viewingRecord.cancelled_by}
                      reason={viewingRecord.cancellation_reason}
                    />
                  </div>
                </section>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPhotoRecord(viewingRecord)}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Related Photos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => printRecord(viewingRecord)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    className="bg-[#9E4B4B] text-white hover:bg-[#843D3D]"
                    onClick={() => printRecord(viewingRecord)}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(photoRecord)}
        onOpenChange={(open) => !open && setPhotoRecord(null)}
      >
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Related Project Photos — {photoRecord?.variation_no}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            These images are related through matching Daily Report Project, Site
            and Variation line Area. They are not directly attached to the
            Variation record.
          </div>

          {relatedPhotosQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading related photos...
            </div>
          ) : relatedPhotosQuery.isError ? (
            <div className="p-8 text-center text-rose-700">
              Unable to load related photos:{" "}
              {getErrorMessage(relatedPhotosQuery.error)}
            </div>
          ) : relatedPhotos.length === 0 ? (
            <div className="p-10 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 font-bold">No related photos found</h3>
              <p className="mt-1 text-sm text-slate-500">
                No active Daily Report photos match this Variation’s Project,
                Site and Area context.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {relatedPhotos.map((photo) => (
                  <figure
                    key={photo.photo_id}
                    className="overflow-hidden rounded-xl border border-[#B98A8A] bg-white"
                  >
                    <a
                      href={photo.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-slate-100"
                    >
                      <img
                        src={photo.signed_url}
                        alt={photo.caption || "Related project photo"}
                        className="h-60 w-full object-contain"
                      />
                    </a>
                    <figcaption className="space-y-1 bg-[#FBF1F1] p-3 text-sm">
                      <div className="font-bold">
                        {photo.caption || "No caption"}
                      </div>
                      <div>Report: {formatDate(photo.report_date)}</div>
                      <div>Area: {photo.area_name}</div>
                      <div>
                        Work Order:{" "}
                        {[photo.work_order_no, photo.work_order_title]
                          .filter(Boolean)
                          .join(" — ") || "Not specified"}
                      </div>
                      <div>Status: {photo.approval_status}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#9E4B4B] text-white hover:bg-[#843D3D]"
                  onClick={() =>
                    photoRecord &&
                    openPrintWindow(
                      buildPhotoReportHtml(photoRecord, relatedPhotos)
                    )
                  }
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Photo Report
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-2 text-2xl font-black text-[#9E4B4B]">{value}</div>
  </div>
);

const FilterSelect = ({
  value,
  onValueChange,
  placeholder,
  items,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: Array<[string, string]>;
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus:ring-[#9E4B4B]/30">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {items.map(([itemValue, label]) => (
        <SelectItem key={itemValue} value={itemValue}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ActionButton = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) => (
  <Button
    type="button"
    size="icon"
    variant="ghost"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="hover:bg-[#F5DEDE] hover:text-[#9E4B4B]"
  >
    {icon}
  </Button>
);

const InfoCell = ({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) => (
  <div className={`bg-[#FBF1F1] p-4 ${wide ? "sm:col-span-2" : ""}`}>
    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-1 font-semibold text-slate-900">{value || "—"}</div>
  </div>
);

const SummaryRow = ({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div
    className={`flex items-center justify-between border-b border-[#B98A8A] px-4 py-3 last:border-b-0 ${
      strong ? "bg-[#F5DEDE] text-lg font-black" : "bg-[#FBF1F1]"
    }`}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const AuditCell = ({
  label,
  at,
  by,
  reason,
}: {
  label: string;
  at?: string | null;
  by?: string | null;
  reason?: string | null;
}) => (
  <div className="rounded-xl bg-[#FBF1F1] p-3">
    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-1 font-semibold">{formatDateTime(at)}</div>
    <div className="mt-1 text-xs text-slate-500">
      {at ? `By: ${by || "Recorded user"}` : "Not recorded"}
    </div>
    {reason && <div className="mt-2 text-sm">Reason: {reason}</div>}
  </div>
);

export default VariationRecords;