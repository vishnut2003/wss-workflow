export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Display-only status. Stored status is what's in the DB; "overdue" and "partial" are computed. */
export type InvoiceDisplayStatus = InvoiceStatus | "overdue" | "partial";

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return (
    typeof value === "string" &&
    (INVOICE_STATUSES as readonly string[]).includes(value)
  );
}

export const INVOICE_CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
] as const;

export type InvoiceCurrencyCode = (typeof INVOICE_CURRENCIES)[number]["code"];

export function isInvoiceCurrency(value: unknown): value is InvoiceCurrencyCode {
  if (typeof value !== "string") return false;
  return INVOICE_CURRENCIES.some((c) => c.code === value);
}

export function findCurrency(code: string) {
  return INVOICE_CURRENCIES.find((c) => c.code === code);
}

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  rate: number;
  /** Computed: quantity * rate, persisted for stability. */
  amount: number;
};

export type InvoiceListItem = {
  id: string;
  clientId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: InvoiceCurrencyCode;
  items: InvoiceLineItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  /** Sum of all payments recorded against this invoice. Always >= 0 and <= total. */
  paidAmount: number;
  /** Convenience: max(0, total - paidAmount). */
  outstanding: number;
  status: InvoiceStatus;
  /**
   * Derived for the UI:
   * - "paid" / "cancelled" / "draft" mirror the stored status
   * - "partial" if status === "sent" and 0 < paidAmount < total
   * - "overdue" if status === "sent", paidAmount === 0, dueDate is past
   * - otherwise "sent"
   */
  displayStatus: InvoiceDisplayStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceSummary = {
  /** Sum of totals for all non-cancelled invoices. */
  total: number;
  /** Sum of paidAmount across all non-cancelled invoices. */
  paid: number;
  /** Sum of outstanding (total - paidAmount) for sent invoices. */
  outstanding: number;
  /** Outstanding portion of overdue invoices. */
  overdue: number;
  draftCount: number;
  sentCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount: number;
  cancelledCount: number;
  currency: InvoiceCurrencyCode | null;
};
