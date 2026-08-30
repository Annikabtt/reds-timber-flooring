export const REDS = "#9E4B4B";
export const REDS_ACTION = "#D92D2D";
export const INPUT_CLASS = "bg-[#F7F9FB] border-[#E5E7EB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";
export const PHOTO_BUCKET = "supplier-delivery-photos";
export const PHOTO_TYPES = {
  supplierDocument: "SupplierDocument",
  receiptEvidence: "ReceiptEvidence",
  damaged: "DamagedOnDelivery",
  rejected: "RejectedOnDelivery",
  short: "ShortMissingOnDelivery",
} as const;

export const DELIVERY_STATUSES = ["Pending", "Partial", "Received", "Rejected", "Cancelled"] as const;
